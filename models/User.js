// User model - represents a user account in the system

// Note: We're using MongoDB directly rather than Mongoose
// This is a schema definition for reference

/*
User Schema:
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  role: 'client' | 'admin',
  projectId: string // foreign key to projects.projectId
}
*/

export default class User {
  static async findByEmail(db, email) {
    return await db.collection('users').findOne({ email });
  }

  static async findById(db, id) {
    return await db.collection('users').findOne({ _id: id });
  }

  static async create(db, { email, passwordHash, role = 'client', projectId }) {
    const result = await db.collection('users').insertOne({
      email,
      passwordHash,
      role,
      projectId,
      createdAt: new Date(),
    });
    
    return result.insertedId;
  }

  static async updateProjectId(db, userId, projectId) {
    return await db.collection('users').updateOne(
      { _id: userId },
      { $set: { projectId } }
    );
  }
  
  static async listAll(db) {
    return await db.collection('users').find({}).toArray();
  }
}
