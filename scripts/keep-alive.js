const https = require('https');
const http = require('http');
require('dotenv').config();

// URL of your deployed application
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://new-self-website-5-15-25.onrender.com';
const HEALTH_ENDPOINT = '/api/health';
const URL = `${BASE_URL}${HEALTH_ENDPOINT}`;

// Time interval in milliseconds (30 seconds = 30000ms)
const INTERVAL = 30000;

console.log(`Keep-alive service started for ${URL}`);
console.log(`Pinging every ${INTERVAL / 1000} seconds`);

// Function to ping the application
function pingApplication() {
  const timestamp = new Date().toISOString();
  console.log(`Pinging ${URL} at ${timestamp}`);
  
  // Determine if we should use http or https
  const requester = BASE_URL.startsWith('https') ? https : http;
  
  const req = requester.get(URL, (res) => {
    const { statusCode } = res;
    
    if (statusCode === 200) {
      console.log(`Ping successful: Status code ${statusCode} at ${timestamp}`);
      
      // Collect response data
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          console.log(`Server uptime: ${responseData.uptime} seconds`);
        } catch (e) {
          console.error('Error parsing response data:', e.message);
        }
      });
    } else {
      console.log(`Ping received non-200 response: ${statusCode} at ${timestamp}`);
    }
  });
  
  req.on('error', (error) => {
    console.error(`Error pinging application at ${timestamp}: ${error.message}`);
    
    // If connection refused or network error, try again after a short delay
    setTimeout(() => {
      console.log('Retrying ping after error...');
      pingApplication();
    }, 5000); // Retry after 5 seconds
  });
  
  req.setTimeout(10000, () => {
    console.error(`Request timed out at ${timestamp}`);
    req.abort();
  });
  
  req.end();
}

// Initial ping
pingApplication();

// Set up interval for regular pings
setInterval(pingApplication, INTERVAL);

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down keep-alive service');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down keep-alive service');
  process.exit(0);
});
