import { connectToDatabase } from '../../../lib/db';
import User from '../../../models/User';
import { verifyPassword, generateToken, setTokenCookie } from '../../../utils/auth';

export default async function handler(req, res) {
  // Only allow POST method for login
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find user by email
    const user = await User.findByEmail(db, email);
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
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
