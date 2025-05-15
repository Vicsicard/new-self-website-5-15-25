import { connectToDatabase } from '../../../lib/db';
import Project from '../../../models/Project';
import withAuth from '../../../middleware/withAuth';

async function handler(req, res) {
  const { method } = req;
  const { db } = await connectToDatabase();

  // GET /api/projects - Get all projects (admin only) or user's project
  if (method === 'GET') {
    try {
      // Check if user is admin or client
      if (req.user.role === 'admin') {
        // Admin can see all projects
        const projects = await Project.listAll(db);
        return res.status(200).json({ projects });
      } else {
        // Client can only see their project
        const projectId = req.user.projectId;
        if (!projectId) {
          return res.status(404).json({ message: 'No project assigned' });
        }
        
        const project = await Project.findByProjectId(db, projectId);
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }
        
        return res.status(200).json({ project });
      }
    } catch (error) {
      console.error('Error getting projects:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // POST /api/projects - Create a new project (admin only)
  if (method === 'POST') {
    try {
      // Only admin can create projects
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { projectId, name, content } = req.body;
      
      // Validate inputs
      if (!projectId || !name) {
        return res.status(400).json({ message: 'Project ID and name are required' });
      }
      
      // Check if project ID already exists
      const existingProject = await Project.findByProjectId(db, projectId);
      if (existingProject) {
        return res.status(400).json({ message: 'Project ID already exists' });
      }
      
      // Create new project
      const newProjectId = await Project.create(db, {
        projectId,
        name,
        content: content || [],
      });
      
      res.status(201).json({
        message: 'Project created successfully',
        projectId: newProjectId,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);
