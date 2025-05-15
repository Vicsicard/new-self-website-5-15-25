import { connectToDatabase } from '../../../lib/db';
import User from '../../../models/User';
import { generateToken, setTokenCookie } from '../../../utils/auth';

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
    const user = await User.findByEmail(db, email);
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Email not found. Please contact the administrator.' });
    }
    
    // Skip password verification - email-only authentication
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set token cookie
    setTokenCookie(res, token);
    
    // Return user info (excluding password)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
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
