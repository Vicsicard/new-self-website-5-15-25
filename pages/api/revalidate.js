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
        const projectId = path.replace(/^\//g, ''); // Remove leading slash if present
        const { db } = await connectToDatabase();
        
        // Touch the project to update its timestamp
        const touchResult = await db.collection('projects').updateOne(
          { projectId: projectId },
          { $set: { touchedAt: new Date() } }
        );
        
        console.log(`[Revalidation] Touched project ${projectId} in database:`, 
          touchResult.matchedCount ? 'Found and updated' : 'Not found');
      } catch (dbError) {
        console.error('[Revalidation] DB touch error:', dbError);
        // Continue even if this fails - it's just an extra step
      }
      
      // Force a full revalidation of the page with stronger invalidation
      try {
        console.log('[Revalidation] Calling Next.js revalidate function');
        await res.revalidate(path);
      } catch (revalidateError) {
        console.error('[Revalidation] Error during Next.js revalidate call:', revalidateError);
        // Don't re-throw - try our manual approach anyway
      }
      
      // Sometimes we need a hard refresh - especially in production with CDNs
      // Attempt manual fetch to multiple cache-busting URLs for the same path
      const fetchPromises = [];
      
      for (let i = 0; i < 3; i++) { // Try multiple variations of cache busters
        const cacheBuster = `${fullUrl}?nocache=${Date.now()}-${i}`;
        console.log(`[Revalidation] Fetching with cache buster (${i}):`, cacheBuster);
        
        const fetchPromise = fetch(cacheBuster, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Revalidation-Force': 'true',
            'X-Revalidation-Attempt': `${i+1}`
          },
        }).catch(err => console.error(`[Revalidation] Fetch error for attempt ${i+1}:`, err));
        
        fetchPromises.push(fetchPromise);
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
