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

    // Only allow admin users or users trying to revalidate their own project
    if (req.user.role !== 'admin' && !path.includes(req.user.projectId)) {
      return res.status(403).json({ message: 'Not authorized to revalidate this page' });
    }

    console.log(`Revalidating path: ${path}`);

    // This will trigger the regeneration of the page
    await res.revalidate(path);

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
