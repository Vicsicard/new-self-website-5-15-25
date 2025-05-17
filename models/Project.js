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
    try {
      console.log(`[DB] Updating project ${projectId}`, { contentLength: content?.length });
      
      // Build update data
      const updateData = {
        updatedAt: new Date()
      };
      
      if (name) updateData.name = name;
      if (content) {
        console.log(`[DB] Setting content with ${content.length} items`);
        updateData.content = content;
      } else {
        console.log('[DB] Warning: No content provided for update');
      }
      
      // Log update operation
      console.log(`[DB] Performing update operation on project: ${projectId}`);
      console.log(`[DB] Update data has ${Object.keys(updateData).length} fields`);
      
      // Perform the update
      const result = await db.collection('projects').updateOne(
        { projectId },
        { $set: updateData }
      );
      
      // Log update results
      console.log(`[DB] Update result: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
      
      if (result.matchedCount === 0) {
        console.error(`[DB] Error: No project found with projectId ${projectId}`);
      }
      
      if (result.matchedCount > 0 && result.modifiedCount === 0) {
        console.warn(`[DB] Warning: Project found but no modifications made`);
      }
      
      return result;
    } catch (error) {
      console.error('[DB] Error in Project.update:', error);
      throw error; // Rethrow to handle at API level
    }
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
