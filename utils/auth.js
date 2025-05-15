import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import bcrypt from 'bcryptjs';

// JWT Secret should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'selfcast-secure-jwt-secret';

export function generateToken(user) {
  // Create a JWT token with user info
  const token = jwt.sign(
    { 
      userId: user._id.toString(),
      role: user.role,
      projectId: user.projectId
    },
    JWT_SECRET,
    { expiresIn: '1d' } // Token expires in 1 day
  );
  
  return token;
}

export function setTokenCookie(res, token) {
  // Set JWT as HttpOnly cookie
  res.setHeader('Set-Cookie', cookie.serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Secure in production
    sameSite: 'strict',
    maxAge: 86400, // 1 day in seconds
    path: '/',
  }));
}

export function getTokenCookie(req) {
  // Get the token from cookies
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies.token || null;
}

export function verifyToken(token) {
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  // Hash password for secure storage
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export async function verifyPassword(password, hashedPassword) {
  // Compare password with stored hash
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
}
