// Script to initialize the admin user in the application database
// NOTE: This creates an APPLICATION USER, not a MongoDB Atlas database user
// MongoDB Atlas database users (for connection) are created in the Atlas dashboard
// and have username restrictions (no @ symbols allowed)
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function initializeAdmin() {
  // Connect to MongoDB
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB);
    
    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({ 
      email: 'vicsicard@gmail.com' 
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      
      // Update role to ensure it's admin
      await db.collection('users').updateOne(
        { email: 'vicsicard@gmail.com' },
        { $set: { role: 'admin' } }
      );
      console.log('Admin role confirmed');
    } else {
      // Create admin user
      const result = await db.collection('users').insertOne({
        email: 'vicsicard@gmail.com',
        role: 'admin',
        createdAt: new Date()
      });
      
      console.log('Admin user created successfully');
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the initialization
initializeAdmin().catch(console.error);
