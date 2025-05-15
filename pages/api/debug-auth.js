import { connectToDatabase } from '../../lib/db';
import { getTokenCookie, verifyToken } from '../../utils/auth';

// This endpoint will help debug authentication issues
export default async function handler(req, res) {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Get token from cookies (if any)
    const token = getTokenCookie(req);
    let tokenInfo = { exists: false };
    
    if (token) {
      tokenInfo = {
        exists: true,
        decoded: verifyToken(token) || 'Invalid token'
      };
    }
    
    // Get admin user
    const adminUser = await db.collection('users').findOne({ 
      email: 'vicsicard@gmail.com' 
    });
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    
    // Get project count
    const projectCount = await db.collection('projects').countDocuments();
    
    // Return diagnostic information
    return res.status(200).json({
      auth: {
        tokenInfo,
        cookiesReceived: req.headers.cookie ? true : false
      },
      database: {
        adminExists: !!adminUser,
        adminInfo: adminUser ? {
          id: adminUser._id.toString(),
          email: adminUser.email,
          role: adminUser.role
        } : null,
        userCount: users.length,
        users: users.map(u => ({ 
          id: u._id.toString(), 
          email: u.email, 
          role: u.role 
        })),
        projectCount
      }
    });
  } catch (error) {
    console.error('Error in debug-auth:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
