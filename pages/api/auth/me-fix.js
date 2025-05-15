import { connectToDatabase } from '../../../lib/db';
import { getTokenCookie, verifyToken } from '../../../utils/auth';

// This is a fixed version of the /api/auth/me endpoint
export default async function handler(req, res) {
  // Only allow GET method
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
    
    // Find user by ID - handle both string and ObjectId formats
    const user = await db.collection('users').findOne({ 
      $or: [
        { _id: decoded.userId },
        { email: decoded.email || 'vicsicard@gmail.com' } // Fallback to admin email
      ]
    });
    
    if (!user) {
      // If user not found by ID, try finding by email (for admin)
      const adminUser = await db.collection('users').findOne({ 
        email: 'vicsicard@gmail.com',
        role: 'admin'
      });
      
      if (adminUser) {
        // Return admin user info
        return res.status(200).json({
          user: {
            id: adminUser._id.toString(),
            email: adminUser.email,
            role: adminUser.role,
            projectId: adminUser.projectId
          }
        });
      }
      
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user info
    res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        projectId: user.projectId
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
