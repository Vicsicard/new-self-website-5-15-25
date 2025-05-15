import { connectToDatabase } from '../../../../lib/db';
import Project from '../../../../models/Project';
import withAuth from '../../../../middleware/withAuth';

async function handler(req, res) {
  const { method } = req;
  const { projectId } = req.query;
  const { db } = await connectToDatabase();

  // Check if user has access to this project
  // Admin can access any project, client can only access their own
  if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
    return res.status(403).json({ message: 'Not authorized to access this project' });
  }

  // GET /api/projects/[projectId] - Get specific project
  if (method === 'GET') {
    try {
      const project = await Project.findByProjectId(db, projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      return res.status(200).json({ project });
    } catch (error) {
      console.error('Error getting project:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // PUT /api/projects/[projectId] - Update project details (admin only)
  if (method === 'PUT') {
    try {
      // Only admin can update project details
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update project details' });
      }
      
      const { name } = req.body;
      
      // Update project
      const result = await Project.update(db, projectId, { name });
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      return res.status(200).json({ message: 'Project updated successfully' });
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);
