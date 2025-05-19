import { connectToDatabase } from '../../../lib/db';
import Project from '../../../models/Project';
import withAuth from '../../../middleware/withAuth';

async function handler(req, res) {
  const { method } = req;
  const { projectId } = req.query;
  
  try {
    const { db } = await connectToDatabase();

    // Check if user has access to this project
    if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    // GET /api/projects/[projectId] - Get project metadata
    if (method === 'GET') {
      try {
        const project = await Project.findByProjectId(db, projectId);
        
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }
        
        // Remove content from response to force using /content endpoint
        const { content, ...projectWithoutContent } = project;
        return res.status(200).json({ project: projectWithoutContent });
      } catch (error) {
        console.error('Error getting project:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
    
    // PUT /api/projects/[projectId] - Update project metadata
    if (method === 'PUT') {
      try {
        const { name, settings } = req.body;
        
        // Only update allowed fields
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (settings !== undefined) updateData.settings = settings;
        
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        const result = await db.collection('projects').updateOne(
          { projectId },
          { $set: { ...updateData, updatedAt: new Date() } }
        );
        
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Project not found' });
        }
        
        return res.status(200).json({ message: 'Project updated successfully' });
      } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
    
    // DELETE /api/projects/[projectId] - Delete a project
    if (method === 'DELETE') {
      try {
        // Only admins can delete projects
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Not authorized to delete projects' });
        }
        
        const result = await db.collection('projects').deleteOne({ projectId });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Project not found' });
        }
        
        return res.status(200).json({ message: 'Project deleted successfully' });
      } catch (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
    
    // Method not allowed
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${method} not allowed` });
    
  } catch (error) {
    console.error('Error in project API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default withAuth(handler);
