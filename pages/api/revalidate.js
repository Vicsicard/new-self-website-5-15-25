import withAuth from '../../middleware/withAuth';

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
      
      // Force a full revalidation of the page
      await res.revalidate(path);
      
      // Additional step: Manually fetch the page to ensure fresh content
      if (process.env.NODE_ENV === 'production') {
        try {
          const fetchOptions = { 
            method: 'GET',
            headers: { 
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            } 
          };
          
          console.log(`[Revalidation] Making additional fetch to: ${fullUrl}`);
          await fetch(fullUrl, fetchOptions);
          console.log('[Revalidation] Additional fetch completed');
        } catch (fetchErr) {
          console.log('[Revalidation] Additional fetch error (non-blocking):', fetchErr.message);
          // Continue even if this fails - it's just an extra precaution
        }
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
