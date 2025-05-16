/**
 * Keep-alive utility for preventing Render from spinning down the application
 * after 50 seconds of inactivity.
 */

// Keep-alive interval in milliseconds (45 seconds)
const KEEP_ALIVE_INTERVAL = 45000;

/**
 * Starts the keep-alive mechanism that pings the health endpoint
 * at regular intervals to keep the application running.
 * @returns {Function} A cleanup function to stop the keep-alive mechanism
 */
export function startKeepAlive() {
  // Skip in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Keep-alive mechanism disabled in development mode');
    return () => {};
  }

  // Function to ping our health check endpoint
  const pingHealthCheck = async () => {
    try {
      const timestamp = new Date().toISOString();
      const res = await fetch('/api/health');
      if (res.ok) {
        console.log(`[${timestamp}] Keep-alive ping successful`);
      }
    } catch (error) {
      console.error(`Keep-alive ping failed:`, error);
    }
  };
  
  // Initial ping
  pingHealthCheck();
  
  // Set up interval for regular pings
  const interval = setInterval(pingHealthCheck, KEEP_ALIVE_INTERVAL);
  
  // Return cleanup function
  return () => {
    console.log('Stopping keep-alive mechanism');
    clearInterval(interval);
  };
}
