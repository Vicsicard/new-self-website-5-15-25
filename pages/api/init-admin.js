import { connectToDatabase } from '../../lib/db';

// This is a temporary endpoint to initialize the admin user
// It should be removed or secured after initial setup
export default async function handler(req, res) {
  // Only allow GET method for simplicity
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({ 
      email: 'vicsicard@gmail.com' 
    });
    
    if (existingAdmin) {
      // Update role to ensure it's admin
      await db.collection('users').updateOne(
        { email: 'vicsicard@gmail.com' },
        { $set: { role: 'admin' } }
      );
      
      return res.status(200).json({ 
        success: true, 
        message: 'Admin user already exists. Role confirmed as admin.',
        user: {
          email: existingAdmin.email,
          role: 'admin'
        }
      });
    } else {
      // Create admin user
      const result = await db.collection('users').insertOne({
        email: 'vicsicard@gmail.com',
        role: 'admin',
        createdAt: new Date()
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Admin user created successfully',
        user: {
          email: 'vicsicard@gmail.com',
          role: 'admin'
        }
      });
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize admin user',
      error: error.message
    });
  }
}
