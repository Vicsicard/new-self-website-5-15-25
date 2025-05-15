import { connectToDatabase } from '../../lib/db';
import User from '../../models/User';

// This is a temporary endpoint to fix authentication issues
export default async function handler(req, res) {
  // Only allow GET method for simplicity
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Get the admin user
    const adminUser = await db.collection('users').findOne({ 
      email: 'vicsicard@gmail.com' 
    });
    
    if (!adminUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin user not found. Please run the init-admin endpoint first.' 
      });
    }
    
    // Get all projects
    const projects = await db.collection('projects').find({}).toArray();
    
    // Link projects to admin user if needed
    const updates = [];
    for (const project of projects) {
      if (!project.userId) {
        updates.push({
          updateOne: {
            filter: { _id: project._id },
            update: { $set: { userId: adminUser._id } }
          }
        });
      }
    }
    
    let updateResult = { modifiedCount: 0 };
    if (updates.length > 0) {
      updateResult = await db.collection('projects').bulkWrite(updates);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Authentication fixed. Linked ${updateResult.modifiedCount} projects to admin user.`,
      adminUser: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role
      },
      projectsCount: projects.length
    });
  } catch (error) {
    console.error('Error fixing authentication:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fix authentication',
      error: error.message
    });
  }
}
