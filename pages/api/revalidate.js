import withAuth from '../../middleware/withAuth';
import { connectToDatabase } from '../../lib/db';
import Project from '../../models/Project';

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the path to revalidate from the request body
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    // Log detailed request information for debugging
    console.log('[Revalidation] Received revalidation request:', req.url);
    console.log('[Revalidation] Request method:', req.method);
    console.log('[Revalidation] Request headers:', JSON.stringify(req.headers, null, 2));

    // Only allow admin users or users trying to revalidate their own project
    if (req.user.role !== 'admin' && !path.includes(req.user.projectId)) {
      return res.status(403).json({ message: 'Not authorized to revalidate this page' });
    }

    console.log(`Revalidating path: ${path}`);

    try {
      // Add additional headers to force a bypass of the cache
      const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${path}`;
      console.log(`[Revalidation] Attempting to regenerate: ${fullUrl}`);
      
      // Force a DB touch to ensure we have the most recent data
      // This updates the updatedAt timestamp without changing data
      try {
        const projectId = path.replace(/^//g, ''); // Remove leading slash if present
        const { db } = await connectToDatabase();
        
        // Add a unique timestamp to force database to recognize this as a change
        const now = new Date();
        const uniqueTimestamp = `${now.toISOString()}-${Math.random().toString(36).substring(2, 15)}`;
        
        // Touch the project to update its timestamp with more unique data
        const touchResult = await db.collection('projects').updateOne(
          { projectId: projectId },
          { 
            $set: { 
              touchedAt: now,
              lastRevalidation: uniqueTimestamp,
              revalidationSource: req.headers['x-revalidation-source'] || 'api-call'
            } 
          }
        );
        
        console.log(`[Revalidation] Touched project ${projectId} in database:`, 
          touchResult.matchedCount ? 'Found and updated' : 'Not found');
        console.log(`[Revalidation] Updated with unique timestamp: ${uniqueTimestamp}`);
      } catch (dbError) {
        console.error('[Revalidation] DB touch error:', dbError);
        // Continue even if this fails - it's just an extra step
      }
      
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
      message: 'Website updated successfully!'
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
