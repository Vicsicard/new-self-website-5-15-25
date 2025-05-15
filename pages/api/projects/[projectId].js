import { connectToDatabase } from '../../../lib/db';
import Project from '../../../models/Project';
import withAuth from '../../../middleware/withAuth';

async function handler(req, res) {
  const { method } = req;
  const { projectId } = req.query;
  const { db } = await connectToDatabase();

  // GET /api/projects/[projectId] - Get a specific project
  if (method === 'GET') {
    try {
      // Find project by ID
      const project = await Project.findByProjectId(db, projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user has access to this project
      if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
        return res.status(403).json({ message: 'Not authorized to access this project' });
      }
      
      return res.status(200).json({ project });
    } catch (error) {
      console.error('Error getting project:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // PUT /api/projects/[projectId] - Update a project
  if (method === 'PUT') {
    try {
      // Find project by ID
      const project = await Project.findByProjectId(db, projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user has access to this project
      if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      const { name, content } = req.body;
      
      // Update the project
      await Project.update(db, projectId, { name, content });
      
      // Get the updated project
      const updatedProject = await Project.findByProjectId(db, projectId);
      
      return res.status(200).json({ 
        message: 'Project updated successfully',
        project: updatedProject
      });
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);
