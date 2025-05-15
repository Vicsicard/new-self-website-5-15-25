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
      console.log(`Updating project ${projectId}`, req.body);
      
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
      
      // Validate content array
      if (content && !Array.isArray(content)) {
        return res.status(400).json({ message: 'Content must be an array' });
      }
      
      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      
      // Only update content if it's provided and valid
      if (content && Array.isArray(content)) {
        // Filter out invalid content items
        const validContent = content.filter(item => 
          item && typeof item === 'object' && item.key && item.key.trim() !== ''
        );
        
        // Merge with existing content to preserve fields not in the update
        const existingContentMap = {};
        if (project.content && Array.isArray(project.content)) {
          project.content.forEach(item => {
            if (item && item.key) {
              existingContentMap[item.key] = item.value;
            }
          });
        }
        
        // Update existing values with new ones
        validContent.forEach(item => {
          existingContentMap[item.key] = item.value;
        });
        
        // Convert back to array format
        updateData.content = Object.entries(existingContentMap).map(([key, value]) => ({
          key,
          value: value || ''
        }));
      }
      
      console.log('Final update data:', updateData);
      
      // Update the project
      await Project.update(db, projectId, updateData);
      
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
