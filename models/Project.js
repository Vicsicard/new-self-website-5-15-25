// Project model - represents a client's website project

// Note: We're using MongoDB directly rather than Mongoose
// This is a schema definition for reference

/*
Project Schema:
{
  _id: ObjectId,
  projectId: string, // used for URL + lookup
  name: string,
  createdAt: Date,
  updatedAt: Date,
  content: [
    { key: string, value: string }
  ]
}
*/

export default class Project {
  static async findByProjectId(db, projectId) {
    return await db.collection('projects').findOne({ projectId });
  }
  
  static async findById(db, id) {
    return await db.collection('projects').findOne({ _id: id });
  }
  
  static async listAll(db) {
    return await db.collection('projects').find({}).sort({ updatedAt: -1 }).toArray();
  }
  
  static async create(db, { projectId, name, content = [] }) {
    const now = new Date();
    
    const result = await db.collection('projects').insertOne({
      projectId,
      name,
      content,
      createdAt: now,
      updatedAt: now
    });
    
    return result.insertedId;
  }
  
  static async update(db, projectId, { name, content }) {
    const updateData = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (content) updateData.content = content;
    
    return await db.collection('projects').updateOne(
      { projectId },
      { $set: updateData }
    );
  }
  
  static async updateContent(db, projectId, content) {
    return await db.collection('projects').updateOne(
      { projectId },
      { 
        $set: { 
          content, 
          updatedAt: new Date() 
        } 
      }
    );
  }
  
  static async listAll(db) {
    return await db.collection('projects').find({}).toArray();
  }
}
