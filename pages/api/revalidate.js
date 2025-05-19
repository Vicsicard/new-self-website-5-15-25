import withAuth from '../../middleware/withAuth';
import { connectToDatabase } from '../../lib/db';
import Project from '../../models/Project';

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the path and content fingerprint from request body
    const { path, contentFingerprint, timestamp } = req.body;

    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    // Log detailed request information for debugging
    console.log('[Revalidation] Received revalidation request:', req.url);
    console.log('[Revalidation] Request method:', req.method);
    console.log('[Revalidation] Content fingerprint:', contentFingerprint);

    // Only allow admin users or users trying to revalidate their own project
    if (req.user.role !== 'admin' && !path.includes(req.user.projectId)) {
      return res.status(403).json({ message: 'Not authorized to revalidate this page' });
    }

    // Extract projectId from path
    const projectId = path.replace(/^\//, ''); // Remove leading slash if present
    console.log(`[Revalidation] Processing revalidation for project: ${projectId}`);

    try {
      // Connect to database
      const { db } = await connectToDatabase();
      
      // Get current project to check last fingerprint and revalidation time
      const project = await db.collection('projects').findOne({ projectId });
      
      if (!project) {
        console.log(`[Revalidation] Project ${projectId} not found in database`);
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if we already revalidated this exact content version
      if (project.contentFingerprint === contentFingerprint) {
        console.log(`[Revalidation] Skipping - content hasn't changed since last revalidation`);
        return res.status(200).json({
          skipped: true,
          message: 'Content has not changed since last revalidation',
          lastRevalidationTime: project.lastRevalidationTime
        });
      }
      
      // Check if there was a recent revalidation (within 10 seconds) to prevent duplicates
      const now = new Date();
      const minimumInterval = 10000; // 10 seconds
      
      if (project.lastRevalidationTime) {
        const lastRevalTime = new Date(project.lastRevalidationTime);
        const timeSinceLastReval = now - lastRevalTime;
        
        if (timeSinceLastReval < minimumInterval) {
          console.log(`[Revalidation] Throttled - too soon (${Math.floor(timeSinceLastReval/1000)}s since last revalidation)`);
          return res.status(200).json({
            skipped: true,
            message: `Revalidation throttled (${Math.floor(timeSinceLastReval/1000)}s since last revalidation)`,
            lastRevalidationTime: project.lastRevalidationTime,
            nextAllowedTime: new Date(lastRevalTime.getTime() + minimumInterval)
          });
        }
      }
      
      // Update the project with new fingerprint and revalidation time
      const updateResult = await db.collection('projects').updateOne(
        { projectId },
        { 
          $set: { 
            contentFingerprint,
            lastRevalidationTime: now.toISOString(),
            touchedAt: now
          } 
        }
      );
      
      console.log(`[Revalidation] Updated project ${projectId} with new fingerprint:`, 
        updateResult.matchedCount ? 'Found and updated' : 'Not found');
      
      // Force a full revalidation of the page with stronger invalidation
      try {
        console.log('[Revalidation] Calling Next.js revalidate function');
        // Add enhanced logging
        console.log(`[Revalidation] Path to revalidate: ${path}`);
        console.log(`[Revalidation] Base URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`);
        
        // Call the Next.js revalidation function
        await res.revalidate(path);
        console.log('[Revalidation] Next.js revalidate function completed successfully');
      } catch (revalidateError) {
        console.error('[Revalidation] Error during Next.js revalidate call:', revalidateError);
        console.error('[Revalidation] Error name:', revalidateError.name);
        console.error('[Revalidation] Error message:', revalidateError.message);
        // Don't re-throw - try our manual approach anyway
      }
      
      // Sometimes we need a hard refresh - especially in production with CDNs
      // Attempt manual fetch to multiple cache-busting URLs for the same path
      const fetchPromises = [];
      
      // Construct the full URL from the base URL and path
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://new-self-website-5-15-25.onrender.com';
      const fullUrl = `${baseUrl}${path}`;
      console.log(`[Revalidation] Base URL: ${baseUrl}, Full URL: ${fullUrl}`);
      
      // Enhanced cache-busting strategy with more variations and retries
      for (let i = 0; i < 5; i++) { // Increased from 3 to 5 attempts
        // Use a more complex and unique cache buster with timestamp and random component
        const cacheBuster = `${fullUrl}?nocache=${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${i}`;
        console.log(`[Revalidation] Fetching with cache buster (${i}):`, cacheBuster);
        
        const fetchPromise = fetch(cacheBuster, {
          method: 'GET',
          headers: {
            // Stronger cache control directives
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '-1',
            'X-Revalidation-Force': 'true',
            'X-Revalidation-Attempt': `${i+1}`,
            'X-Cloudflare-No-Cache': '1', // Specific to Cloudflare
            'X-Unique-Id': `${Date.now()}-${Math.random().toString(36).substring(2, 15)}` // Ensure unique request
          },
        }).catch(err => {
          console.error(`[Revalidation] Fetch error for attempt ${i+1}:`, err.message || err);
          // Return a resolved promise so Promise.allSettled doesn't fail early
          return { error: err.message, attempt: i+1 };
        });
        
        fetchPromises.push(fetchPromise);
        
        // Short delay between requests to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Wait for at least some of our fetch attempts to complete
      try {
        await Promise.allSettled(fetchPromises);
        console.log('[Revalidation] All fetch attempts completed or settled');
      } catch (allErr) {
        console.error('[Revalidation] Error waiting for fetch attempts:', allErr);
      }
      
      console.log('[Revalidation] Successfully processed revalidation request');
    } catch (revalidateErr) {
      console.error('[Revalidation] Error during revalidation:', revalidateErr);
      throw revalidateErr; // Re-throw to be caught by the outer try/catch
    }

    return res.status(200).json({
      revalidated: true,
      message: 'Website updated successfully!',
      contentFingerprint,
      path,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error revalidating:', err);
    
    // If there was an error, return a 500 and the error message
    return res.status(500).json({
      message: 'Error updating website',
      error: err.message
    });
  }
}

export default withAuth(handler);
