import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy & Ethics',
  description: 'How Sushasan handles data, protects privacy, and maintains transparency.',
}

export default function EthicsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 px-6 py-4">
        <Link href="/dashboard" className="font-serif text-lg font-bold">
          Sushasan<span className="text-saffron">।</span>
        </Link>
      </header>

      <article className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold mb-2">Privacy & Ethics</h1>
          <p className="text-ink-3">
            How we handle data, protect citizens, and maintain transparency.
          </p>
        </div>

        <Section title="What we collect">
          <p>
            Sushasan listens to <strong>public</strong> social media posts, Google Maps reviews,
            Reddit threads, and local news — content that has already been published publicly
            by its authors.
          </p>
          <p>
            We do <strong>not</strong> access private messages, closed groups, or any
            content that requires authentication to view.
          </p>
        </Section>

        <Section title="How we protect identity">
          <p>
            Usernames are never stored. Before a post enters our database, each author
            identifier is replaced with a one-way cryptographic hash (SHA-256 with a
            monthly rotating salt). The original username cannot be recovered.
          </p>
          <p>
            Phone numbers, vehicle plates, personal names, and private addresses are
            stripped from post text before storage using automated PII detection.
          </p>
        </Section>

        <Section title="What the AI reads">
          <p>
            Our AI models receive only the anonymized, PII-stripped text of public posts.
            They are used to classify issues (traffic, water, etc.) and generate civic
            action plans for government officials. No personal profiles are built.
          </p>
        </Section>

        <Section title="Who sees what">
          <p>
            The public map and dashboard show aggregated issue clusters — never
            individual post content or any user-identifiable information.
          </p>
          <p>
            The corporator dashboard is accessible only to authorised government
            officials via a secure access token. It shows the same aggregated data
            as the public view, plus detailed action plans.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            Raw scraped data is retained for 90 days, after which only the anonymized,
            classified summaries are kept. Embeddings are stored indefinitely to enable
            trend analysis, but cannot be reverse-engineered to reveal post content.
          </p>
        </Section>

        <Section title="Robots.txt compliance">
          <p>
            We respect{' '}
            <code className="text-saffron text-sm">robots.txt</code>{' '}
            directives on all scraped domains. We do not scrape sources that
            disallow automated access.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or concerns about data handling?{' '}
            <a
              href="mailto:privacy@sushasan.in"
              className="text-saffron hover:underline"
            >
              privacy@sushasan.in
            </a>
          </p>
        </Section>

        <div className="pt-4 border-t border-ink/10 text-xs text-ink-4">
          Last updated: April 2026
        </div>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
      <div className="space-y-2 text-ink-2 leading-relaxed text-sm [&_strong]:text-ink">
        {children}
      </div>
    </section>
  )
}
