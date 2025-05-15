import { connectToDatabase } from '../../lib/db';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

// This endpoint provides a direct login for the admin user
export default async function handler(req, res) {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find admin user
    const adminUser = await db.collection('users').findOne({ 
      email: 'vicsicard@gmail.com',
      role: 'admin'
    });
    
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    // Generate JWT token with all necessary information
    const token = jwt.sign(
      { 
        userId: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role
      },
      process.env.JWT_SECRET || 'selfcast-secure-jwt-secret',
      { expiresIn: '7d' } // Token expires in 7 days for longer testing
    );
    
    // Set token cookie with proper settings
    res.setHeader('Set-Cookie', cookie.serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax', // Changed from strict to lax for better compatibility
      maxAge: 604800, // 7 days in seconds
      path: '/',
    }));
    
    // Return success with redirect instruction
    return res.status(200).json({ 
      success: true, 
      message: 'Admin login successful. You can now go to /dashboard',
      user: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Direct login error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}
