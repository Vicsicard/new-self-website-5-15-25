/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable on-demand ISR for production
  experimental: {
    // This ensures revalidation API works properly
    isrMemoryCacheSize: 50, // Default is 50 MB
  },
  
  // Set longer cache timeout for static pages
  onDemandEntries: {
    // Keep in memory for 5 minutes (300 seconds)
    maxInactiveAge: 300 * 1000,
    // Number of pages to keep in memory
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig
