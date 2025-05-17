const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Keep-alive configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://new-self-website-5-15-25.onrender.com';
const HEALTH_ENDPOINT = '/api/health';
const KEEP_ALIVE_URL = `${BASE_URL}${HEALTH_ENDPOINT}`;
const KEEP_ALIVE_INTERVAL = 30000; // 30 seconds

// Function to ping the application
function pingApplication() {
  const timestamp = new Date().toISOString();
  console.log(`[Keep-Alive] Pinging ${KEEP_ALIVE_URL} at ${timestamp}`);
  
  // Determine if we should use http or https
  const requester = BASE_URL.startsWith('https') ? https : http;
  
  const req = requester.get(KEEP_ALIVE_URL, (res) => {
    const { statusCode } = res;
    
    if (statusCode === 200) {
      console.log(`[Keep-Alive] Ping successful: Status code ${statusCode} at ${timestamp}`);
      
      // Collect response data
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          console.log(`[Keep-Alive] Server uptime: ${responseData.uptime} seconds`);
        } catch (e) {
          console.error('[Keep-Alive] Error parsing response data:', e.message);
        }
      });
    } else {
      console.log(`[Keep-Alive] Ping received non-200 response: ${statusCode} at ${timestamp}`);
    }
  });
  
  req.on('error', (error) => {
    console.error(`[Keep-Alive] Error pinging application at ${timestamp}: ${error.message}`);
  });
  
  req.setTimeout(10000, () => {
    console.error(`[Keep-Alive] Request timed out at ${timestamp}`);
    req.abort();
  });
  
  req.end();
}

// Start the Next.js application
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    
    // Start the keep-alive process after server is running
    console.log(`[Keep-Alive] Service started for ${KEEP_ALIVE_URL}`);
    console.log(`[Keep-Alive] Pinging every ${KEEP_ALIVE_INTERVAL / 1000} seconds`);
    
    // Initial ping after a short delay to ensure server is fully ready
    setTimeout(() => {
      pingApplication();
      
      // Set up interval for regular pings
      setInterval(pingApplication, KEEP_ALIVE_INTERVAL);
    }, 5000);
  });
});
