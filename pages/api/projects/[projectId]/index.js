// DISABLED: This route conflicts with /api/projects/[projectId].js
// Using a redirecting handler to avoid Next.js route conflicts

import withAuth from '../../../../middleware/withAuth';

// This handler is disabled to avoid route conflicts
async function handler(req, res) {
  // Return a redirect or gone status for all requests to this route
  console.log('[API] Disabled route accessed:', req.url);

  // This route is disabled because it conflicts with /api/projects/[projectId].js
  // All requests should be directed to the parent route

  // Return a 410 Gone status to indicate this endpoint is no longer available
  return res.status(410).json({
    error: 'Route Conflict',
    message: 'This endpoint has been consolidated with /api/projects/[projectId]',
    redirectTo: `/api/projects/${req.query.projectId}`
  });
}
// Add CORS headers to prevent cache issues and allow cross-domain requests
async function handlerWithCORS(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle other methods
  return handler(req, res);
}

export default withAuth(handlerWithCORS);
