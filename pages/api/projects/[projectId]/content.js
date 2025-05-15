import { connectToDatabase } from '../../../../lib/db';
import Project from '../../../../models/Project';
import withAuth from '../../../../middleware/withAuth';

async function handler(req, res) {
  const { method } = req;
  const { projectId } = req.query;
  const { db } = await connectToDatabase();

  // Check if user is authorized to access this project
  if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
    return res.status(403).json({ message: 'Not authorized to access this project' });
  }

  // GET /api/projects/[projectId]/content - Get project content
  if (method === 'GET') {
    try {
      const project = await Project.findByProjectId(db, projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      return res.status(200).json({ content: project.content });
    } catch (error) {
      console.error('Error getting project content:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // PUT /api/projects/[projectId]/content - Update project content
  if (method === 'PUT') {
    try {
      const { content } = req.body;
      
      // Validate inputs
      if (!content || !Array.isArray(content)) {
        return res.status(400).json({ message: 'Content must be an array' });
      }
      
      // Update project content
      const result = await Project.updateContent(db, projectId, content);
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      return res.status(200).json({ message: 'Content updated successfully' });
    } catch (error) {
      console.error('Error updating project content:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);
