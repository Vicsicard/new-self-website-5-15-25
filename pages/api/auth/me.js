import { connectToDatabase } from '../../../lib/db';
import User from '../../../models/User';
import { getTokenCookie, verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  // Only allow GET method for getting current user
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    
    // Return user info (excluding password)
    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        projectId: user.projectId
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
