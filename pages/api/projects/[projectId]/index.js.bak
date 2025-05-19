// This route now redirects to the parent route to avoid conflicts
// Instead of returning a 410 Gone, we redirect to the parent route

import withAuth from '../../../../middleware/withAuth';

// This handler redirects requests to the parent route
async function handler(req, res) {
  // Log redirection for debugging
  console.log('[API] Redirecting legacy route:', req.url);

  // Set redirect headers
  res.setHeader('Location', `/api/projects/${req.query.projectId}`);
  
  // Return a 307 Temporary Redirect 
  return res.status(307).json({
    message: 'This endpoint has moved to /api/projects/[projectId]',
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
