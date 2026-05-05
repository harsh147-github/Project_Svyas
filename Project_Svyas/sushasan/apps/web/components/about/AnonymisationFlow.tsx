'use client'

/**
 * Visual: how a raw post becomes a safe-to-store record.
 * Three columns — raw → anonymise → store — with arrows and tags.
 */

export function AnonymisationFlow() {
  return (
    <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-ink/8">
        <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-india-green">
          From public post to safe record
        </div>
        <h3 className="font-serif text-xl font-semibold text-ink mt-0.5">
          One-way hashing · PII stripping · No reverse path
        </h3>
      </div>

      <div className="p-4 sm:p-6 bg-[#FAF6EE]">
        <svg viewBox="0 0 760 280" className="w-full h-auto block" role="img"
             aria-label="Three-stage anonymisation flow diagram">
          <defs>
            <pattern id="ethGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E8DFCD" strokeWidth="0.5"/>
            </pattern>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#9B6A30" />
            </marker>
          </defs>
          <rect width="760" height="280" fill="url(#ethGrid)" />

          {/* Stage 1 — Raw post */}
          <g>
            <rect x="20" y="40" width="220" height="200" rx="14" fill="#fff"
                  stroke="#EF4444" strokeWidth="1.5" />
            <rect x="20" y="40" width="220" height="32" rx="14" fill="#EF4444" opacity="0.92" />
            <text x="38" y="61" fontSize="11" fontWeight="700" letterSpacing="2" fill="#fff">PUBLIC POST</text>
            <text x="220" y="61" fontSize="10" fill="#fff" textAnchor="end">@kondhwa_resident</text>

            <text x="38" y="102" fontSize="11" fill="#3a3a36" fontStyle="italic">
              &quot;13 accidents in NIBM
            </text>
            <text x="38" y="120" fontSize="11" fill="#3a3a36" fontStyle="italic">
              since 2022, my number is
            </text>
            <text x="38" y="138" fontSize="11" fill="#EF4444" fontStyle="italic" fontWeight="700">
              98XX-XX-1234
            </text>
            <text x="38" y="156" fontSize="11" fill="#3a3a36" fontStyle="italic">
              if you want to talk.&quot;
            </text>

            <line x1="38" y1="180" x2="222" y2="180" stroke="#EF4444" strokeWidth="0.5"
                  opacity="0.4" strokeDasharray="3 3" />
            <text x="38" y="200" fontSize="9" fill="#EF4444" fontWeight="700">FLAGGED FOR STRIPPING:</text>
            <text x="38" y="216" fontSize="9" fill="#7a766d">· username</text>
            <text x="120" y="216" fontSize="9" fill="#7a766d">· phone number</text>
          </g>

          {/* Arrow 1 */}
          <line x1="245" y1="140" x2="285" y2="140" stroke="#9B6A30" strokeWidth="2"
                markerEnd="url(#arrow)" />
          <text x="265" y="130" textAnchor="middle" fontSize="9" fontWeight="700"
                letterSpacing="1.5" fill="#9B6A30">SHA-256</text>

          {/* Stage 2 — Anonymisation engine */}
          <g>
            <rect x="295" y="40" width="180" height="200" rx="14" fill="#fff"
                  stroke="#FF9933" strokeWidth="1.5" />
            <rect x="295" y="40" width="180" height="32" rx="14" fill="#FF9933" opacity="0.92" />
            <text x="313" y="61" fontSize="11" fontWeight="700" letterSpacing="2" fill="#fff">ENGINE</text>

            <text x="385" y="100" textAnchor="middle" fontSize="10" fontWeight="700"
                  fill="#3a3a36">SHA-256(user + salt)</text>
            <text x="385" y="115" textAnchor="middle" fontSize="9" fill="#7a766d">
              salt rotates monthly
            </text>

            <line x1="320" y1="135" x2="450" y2="135" stroke="#FF9933" strokeWidth="0.6" opacity="0.5" />

            <text x="385" y="158" textAnchor="middle" fontSize="10" fontWeight="700"
                  fill="#3a3a36">PII regex strip</text>
            <text x="385" y="173" textAnchor="middle" fontSize="9" fill="#7a766d">
              phone · plate · address · name
            </text>

            <line x1="320" y1="193" x2="450" y2="193" stroke="#FF9933" strokeWidth="0.6" opacity="0.5" />

            <text x="385" y="215" textAnchor="middle" fontSize="10" fontWeight="700"
                  fill="#138808">No reverse path possible</text>
          </g>

          {/* Arrow 2 */}
          <line x1="480" y1="140" x2="520" y2="140" stroke="#9B6A30" strokeWidth="2"
                markerEnd="url(#arrow)" />

          {/* Stage 3 — Stored record */}
          <g>
            <rect x="530" y="40" width="220" height="200" rx="14" fill="#fff"
                  stroke="#138808" strokeWidth="1.5" />
            <rect x="530" y="40" width="220" height="32" rx="14" fill="#138808" opacity="0.92" />
            <text x="548" y="61" fontSize="11" fontWeight="700" letterSpacing="2" fill="#fff">STORED RECORD</text>
            <text x="730" y="61" fontSize="10" fill="#fff" textAnchor="end">a3f8…b91c</text>

            <text x="548" y="102" fontSize="11" fill="#3a3a36">
              &quot;13 accidents in NIBM
            </text>
            <text x="548" y="120" fontSize="11" fill="#3a3a36">
              since 2022, my number is
            </text>
            <text x="548" y="138" fontSize="11" fill="#7a766d" fontWeight="700">
              [REDACTED]
            </text>
            <text x="548" y="156" fontSize="11" fill="#3a3a36">
              if you want to talk.&quot;
            </text>

            <line x1="548" y1="180" x2="732" y2="180" stroke="#138808" strokeWidth="0.5"
                  opacity="0.4" strokeDasharray="3 3" />
            <text x="548" y="200" fontSize="9" fill="#138808" fontWeight="700">SAFE TO STORE · SAFE FOR AI:</text>
            <text x="548" y="216" fontSize="9" fill="#7a766d">· hashed author</text>
            <text x="660" y="216" fontSize="9" fill="#7a766d">· clean text</text>
          </g>
        </svg>
      </div>

      <div className="px-6 py-3 border-t border-ink/8 text-[10px] text-ink-3">
        Original usernames are never stored. Phone numbers, vehicle plates, addresses, and
        personal names are removed before any text reaches our database or AI models.
      </div>
    </div>
  )
}
