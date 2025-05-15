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
    
    // Find user by ID using our updated User model
    // This will handle string IDs, ObjectIds, and fallback to admin if needed
    let user = await User.findById(db, decoded.userId);
    
    // If user not found by ID, try direct collection access as a backup
    if (!user) {
      console.log('User not found by ID, trying direct collection access');
      // Try to find admin user directly
      user = await db.collection('users').findOne({ email: 'vicsicard@gmail.com', role: 'admin' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user info (excluding password)
    res.status(200).json({
      user: {
        id: user._id.toString(), // Ensure ID is a string
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
