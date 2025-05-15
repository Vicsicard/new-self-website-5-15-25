import Head from 'next/head';

// Layout component for the public-facing sites
export default function PublicSiteLayout({ children, title, metadata }) {
  return (
    <div>
      <Head>
        <title>{title || 'Personal Brand Site'}</title>
        <meta name="description" content={metadata?.description || 'Personal brand site powered by Self Cast Studios'} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph metadata for social sharing */}
        <meta property="og:title" content={title || 'Personal Brand Site'} />
        <meta property="og:description" content={metadata?.description || 'Personal brand site powered by Self Cast Studios'} />
        {metadata?.imageUrl && <meta property="og:image" content={metadata.imageUrl} />}
        
        {/* Add custom styles if provided */}
        {metadata?.customStyles && (
          <style dangerouslySetInnerHTML={{ __html: metadata.customStyles }} />
        )}
      </Head>

      {children}
    </div>
  );
}
