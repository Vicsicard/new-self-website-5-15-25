const https = require('https');
const http = require('http');

// URL of your deployed application
const URL = process.env.APP_URL || 'https://your-app-url.onrender.com';

// Time interval in milliseconds (30 seconds = 30000ms)
const INTERVAL = 30000;

console.log(`Keep-alive service started for ${URL}`);
console.log(`Pinging every ${INTERVAL / 1000} seconds`);

// Function to ping the application
function pingApplication() {
  console.log(`Pinging ${URL} at ${new Date().toISOString()}`);
  
  // Determine if we should use http or https
  const requester = URL.startsWith('https') ? https : http;
  
  const req = requester.get(URL, (res) => {
    const { statusCode } = res;
    
    if (statusCode === 200) {
      console.log(`Ping successful: Status code ${statusCode}`);
    } else {
      console.log(`Ping received non-200 response: ${statusCode}`);
    }
    
    // Consume response data to free up memory
    res.resume();
  });
  
  req.on('error', (error) => {
    console.error(`Error pinging application: ${error.message}`);
  });
  
  req.end();
}

// Initial ping
pingApplication();

// Set up interval for regular pings
setInterval(pingApplication, INTERVAL);
