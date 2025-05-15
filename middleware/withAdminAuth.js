import withAuth from './withAuth';

export default function withAdminAuth(handler) {
  return withAuth((req, res) => {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    // User is an admin, proceed with the handler
    return handler(req, res);
  });
}
