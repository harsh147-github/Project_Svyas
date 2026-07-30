/**
 * Sarvam document digitization (Vision, 3B VLM) — supporting-document capture.
 *
 * Civic complaints get taken seriously when they carry paper. A resident
 * disputing a water bill, showing a PMC work order that was never executed, or
 * attaching a society resolution about a broken drain is holding evidence that
 * is currently invisible to Sushaasan — it arrives as a photo of a page and
 * dies there.
 *
 * This module turns that page into text the pipeline can actually use: the
 * grievance synthesiser can cite it, the officer's brief can quote it, and the
 * ward file has something more than a citizen's recollection.
 *
 * IMPORTANT — what this is and is not. This *extracts* what a document says.
 * It does not authenticate it. Nothing here proves a document is genuine, and
 * no downstream surface should imply otherwise; a extracted PMC work-order
 * number is a claim to be checked against PMC records by a human, not a
 * verified fact. Sushaasan is advisory, and this is evidence capture.
 *
 * Flow (async job API, max 10 pages/doc):
 *   1. create job          POST /doc-digitization/job/v1
 *   2. request upload URLs POST /doc-digitization/job/v1/upload-files
 *   3. PUT the file to the returned presigned URL
 *   4. start               POST /doc-digitization/job/v1/{job_id}/start
 *   5. poll                GET  /doc-digitization/job/v1/{job_id}/status
 *   6. output arrives as a ZIP at the URL the status response carries
 */

import { sarvamRequest, SARVAM_BASE_URL } from './client'

export type DocOutputFormat = 'md' | 'html' | 'json'

export type CreateJobInput = {
  /** BCP-47 code of the document's language. */
  language?: string
  outputFormat?: DocOutputFormat
  /** Optional webhook so we don't have to poll from a serverless function. */
  callbackUrl?: string
  callbackAuthToken?: string
}

export type DocJob = {
  jobId: string
  state: string
  outputFormat: DocOutputFormat
}

type CreateJobResponse = {
  job_id?: string
  job_state?: string
  storage_container_type?: string
}

/** Step 1 — create the digitization job. */
export async function createDocJob(input: CreateJobInput = {}): Promise<DocJob> {
  const outputFormat = input.outputFormat ?? 'md'

  const data = await sarvamRequest<CreateJobResponse>({
    path: '/doc-digitization/job/v1',
    body: {
      job_parameters: {
        language: input.language ?? 'en-IN',
        output_format: outputFormat,
      },
      ...(input.callbackUrl
        ? { callback: { url: input.callbackUrl, auth_token: input.callbackAuthToken ?? '' } }
        : {}),
    },
  })

  const jobId = data.job_id
  if (!jobId) throw new Error('Sarvam doc-digitization: no job_id in response')
  return { jobId, state: data.job_state ?? 'Accepted', outputFormat }
}

type UploadUrlResponse = {
  // The API has used both shapes across versions; accept either rather than
  // breaking on a field rename.
  upload_urls?: { file_name?: string; url?: string }[]
  files?: { file_name?: string; upload_url?: string }[]
}

export type UploadTarget = { fileName: string; url: string }

/** Step 2 — ask for presigned upload URLs for the given file names. */
export async function requestUploadUrls(jobId: string, fileNames: string[]): Promise<UploadTarget[]> {
  const data = await sarvamRequest<UploadUrlResponse>({
    path: '/doc-digitization/job/v1/upload-files',
    body: { job_id: jobId, file_names: fileNames },
  })

  const targets: UploadTarget[] = []
  for (const u of data.upload_urls ?? []) {
    if (u.url) targets.push({ fileName: u.file_name ?? fileNames[targets.length] ?? 'file', url: u.url })
  }
  for (const f of data.files ?? []) {
    if (f.upload_url) targets.push({ fileName: f.file_name ?? fileNames[targets.length] ?? 'file', url: f.upload_url })
  }

  if (targets.length === 0) throw new Error('Sarvam doc-digitization: no upload URLs returned')
  return targets
}

/**
 * Step 3 — PUT the bytes to the presigned URL.
 * This does not go through sarvamRequest: the presigned URL is object storage,
 * carries its own auth in the query string, and must NOT receive our API key.
 */
export async function uploadToPresignedUrl(url: string, file: Blob, contentType?: string): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: contentType ? { 'Content-Type': contentType } : undefined,
    body: file,
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) {
    throw new Error(`Sarvam doc upload failed (${res.status}): ${await res.text().catch(() => '')}`)
  }
}

/** Step 4 — start processing once every file is uploaded. */
export async function startDocJob(jobId: string): Promise<void> {
  await sarvamRequest<unknown>({
    path: `/doc-digitization/job/v1/${encodeURIComponent(jobId)}/start`,
    body: {},
  })
}

export type DocJobStatus = {
  jobId: string
  state: string
  /** True once the job reached a terminal state, successful or not. */
  done: boolean
  succeeded: boolean
  /** ZIP of extracted output, present on success. */
  outputUrl: string | null
  error: string | null
}

type StatusResponse = {
  job_id?: string
  job_state?: string
  output_file_url?: string
  output_url?: string
  error_message?: string
}

const TERMINAL_OK = new Set(['completed', 'succeeded', 'success', 'finished'])
const TERMINAL_FAIL = new Set(['failed', 'error', 'cancelled', 'canceled'])

/** Step 5 — poll job status. */
export async function getDocJobStatus(jobId: string): Promise<DocJobStatus> {
  const res = await fetch(
    `${SARVAM_BASE_URL}/doc-digitization/job/v1/${encodeURIComponent(jobId)}/status`,
    {
      method: 'GET',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY ?? '' },
      signal: AbortSignal.timeout(30_000),
    },
  )
  if (!res.ok) {
    throw new Error(`Sarvam doc status failed (${res.status}): ${await res.text().catch(() => '')}`)
  }

  const data = (await res.json()) as StatusResponse
  const state = (data.job_state ?? 'unknown').toLowerCase()
  const succeeded = TERMINAL_OK.has(state)
  const failed = TERMINAL_FAIL.has(state)

  return {
    jobId: data.job_id ?? jobId,
    state: data.job_state ?? 'unknown',
    done: succeeded || failed,
    succeeded,
    outputUrl: data.output_file_url ?? data.output_url ?? null,
    error: data.error_message ?? (failed ? `Job ended in state "${state}"` : null),
  }
}

/**
 * Steps 1–4 in one call: create, upload, start. Returns the job id to poll.
 *
 * Deliberately does NOT wait for completion — digitization takes longer than a
 * serverless request should live. The caller stores the job id and polls from
 * the client, or supplies a callback URL.
 */
export async function submitDocument(
  file: Blob,
  fileName: string,
  opts: CreateJobInput = {},
): Promise<DocJob> {
  const job = await createDocJob(opts)
  const [target] = await requestUploadUrls(job.jobId, [fileName])
  await uploadToPresignedUrl(target.url, file, file.type || undefined)
  await startDocJob(job.jobId)
  return job
}
