import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .map((part) => part.replace(/-/g, ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');

  return { title: `${title} | JP` };
}

export default async function LocalPlaceholderPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else if (typeof value === 'string') {
      search.append(key, value);
    }
  }

  const searchString = search.toString();
  const path = `/${slug.join('/')}${searchString ? `?${searchString}` : ''}`;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '48px 24px',
        background: '#f6f4f0',
        color: '#171717',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: '#8a8378',
          }}
        >
          JP
        </p>

        <h1
          style={{
            margin: '22px 0 0',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(30px, 5vw, 44px)',
            fontWeight: 400,
            lineHeight: 1.15,
          }}
        >
          This page is local, but not built yet.
        </h1>

        <p
          style={{
            margin: '18px auto 0',
            maxWidth: 430,
            fontSize: 15,
            lineHeight: 1.7,
            color: '#5c5a55',
          }}
        >
          You are viewing the local Next.js app, so no link leaves to the live
          site. This route is a placeholder ready to be customized.
        </p>

        <code
          style={{
            display: 'inline-block',
            marginTop: 28,
            padding: '10px 16px',
            border: '1px solid #ddd7cd',
            borderRadius: 999,
            background: '#fff',
            fontSize: 13,
            color: '#3d3a35',
          }}
        >
          {path}
        </code>

        <div style={{ marginTop: 32 }}>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '13px 26px',
              border: '1px solid #171717',
              borderRadius: 999,
              color: '#171717',
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
