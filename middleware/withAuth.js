import { getTokenCookie, verifyToken } from '../utils/auth';
import { connectToDatabase } from '../lib/db';
import User from '../models/User';

export default function withAuth(handler) {
  return async (req, res) => {
    try {
      // Get token from cookies
      const token = getTokenCookie(req);
      
      if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Verify token
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Connect to the database
      const { db } = await connectToDatabase();
      
      // Find user by ID
      const user = await User.findById(db, decoded.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Add user to request
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        projectId: user.projectId
      };
      
      // Call the handler with the authenticated request
      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}
