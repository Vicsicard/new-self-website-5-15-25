# Keep-Alive Mechanism for Render Deployment

This document describes the keep-alive mechanism implemented to prevent Render from spinning down the application after 50 seconds of inactivity.

## Overview

Free-tier deployments on Render will automatically spin down after 50 seconds of inactivity. This can cause an undesirable delay when a user visits the site after a period of inactivity, as Render needs to spin up the service again.

To prevent this, we've implemented a keep-alive mechanism that regularly pings a health check endpoint to keep the service active.

## Implementation Details

### Components

1. **Health Check API Endpoint (`/api/health.js`):**
   - Simple endpoint that returns a 200 OK response
   - Also provides basic application status information

2. **Keep-Alive Utility (`/utils/keepAlive.js`):**
   - Contains the logic for periodically pinging the health endpoint
   - Automatically disabled in development mode
   - Configurable interval (default: 45 seconds)

3. **Integration in App Component (`_app.js`):**
   - Initializes the keep-alive mechanism when the application loads
   - Properly cleans up on component unmount

### How It Works

1. When the application starts (in production mode), it initializes the keep-alive mechanism
2. Every 45 seconds, the application makes a request to its own `/api/health` endpoint
3. These regular requests prevent Render from considering the application inactive
4. The application continues to run without spinning down

## Configuration

The keep-alive interval is set to 45 seconds by default, which is just below Render's 50-second inactivity threshold. This value can be adjusted in `utils/keepAlive.js` if needed.

## Disabling Keep-Alive

The keep-alive mechanism is automatically disabled in development mode. If you need to disable it in production for any reason, you can comment out the `startKeepAlive()` call in `_app.js`.

## Monitoring

The keep-alive mechanism logs each successful ping to the console, which can be viewed in your browser's developer tools or in your application logs on Render.

## Potential Improvements

- Add error handling with retry mechanism
- Implement a more sophisticated health check that monitors critical services
- Add metrics to track uptime and response times
