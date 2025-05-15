import { connectToDatabase } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

// This is a fixed version of the login endpoint that works with email-only authentication
export default async function handler(req, res) {
  // Only allow POST method for login
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find user by email
    const user = await db.collection('users').findOne({ email });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Email not found. Please contact the administrator.' });
    }
    
    // Generate JWT token with proper user ID format
    const token = jwt.sign(
      { 
        userId: user._id.toString(), // Ensure ID is a string
        role: user.role,
        projectId: user.projectId,
        email: user.email
      },
      process.env.JWT_SECRET || 'selfcast-secure-jwt-secret',
      { expiresIn: '1d' } // Token expires in 1 day
    );
    
    // Set token cookie
    res.setHeader('Set-Cookie', cookie.serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // Secure in production
      sameSite: 'strict',
      maxAge: 86400, // 1 day in seconds
      path: '/',
    }));
    
    // Return user info (excluding password)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        projectId: user.projectId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
