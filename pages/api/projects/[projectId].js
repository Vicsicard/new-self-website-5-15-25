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
      console.log(`Updating project ${projectId}`, JSON.stringify(req.body, null, 2));
      console.log('User:', req.user); // Log authenticated user info
      
      // Find project by ID
      const project = await Project.findByProjectId(db, projectId);
      
      if (!project) {
        console.error(`Project not found with ID: ${projectId}`);
        return res.status(404).json({ message: 'Project not found' });
      }
      
      console.log('Found project:', JSON.stringify(project, null, 2));
      
      // Check if user has access to this project
      // Allow users to edit their own project, identified by projectId
      if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
        console.error(`User ${req.user._id} not authorized to update project ${projectId}`);
        console.error(`User projectId: ${req.user.projectId}, requested projectId: ${projectId}`);
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      console.log('Authorization passed: User has permission to edit this project');
      
      const { name, content } = req.body;
      
      // Validate content array
      if (!content) {
        console.error('No content provided in request body');
        return res.status(400).json({ message: 'Content is required' });
      }
      
      if (!Array.isArray(content)) {
        console.error('Content is not an array:', typeof content);
        return res.status(400).json({ message: 'Content must be an array' });
      }
      
      console.log(`Content array length: ${content.length}`);
      if (content.length === 0) {
        console.error('Content array is empty');
        return res.status(400).json({ message: 'Content array cannot be empty' });
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
        
        console.log(`Valid content items: ${validContent.length} out of ${content.length}`);
        
        if (validContent.length === 0) {
          console.error('No valid content items found');
          return res.status(400).json({ message: 'No valid content items provided' });
        }
        
        // Merge with existing content to preserve fields not in the update
        const existingContentMap = {};
        if (project.content && Array.isArray(project.content)) {
          project.content.forEach(item => {
            if (item && item.key) {
              existingContentMap[item.key] = item.value;
            }
          });
        }
        
        console.log(`Existing content map has ${Object.keys(existingContentMap).length} keys`);
        
        // Update existing values with new ones
        validContent.forEach(item => {
          existingContentMap[item.key] = item.value;
        });
        
        // Convert back to array format
        updateData.content = Object.entries(existingContentMap).map(([key, value]) => ({
          key,
          value: value || ''
        }));
        
        console.log(`Final content array has ${updateData.content.length} items`);
      }
      
      console.log('Final update data (sample):', JSON.stringify(updateData.content?.slice(0, 3), null, 2));
      
      // Extra verification step - check if content exists before update
      console.log(`Verifying update for project ${projectId}`);
      console.log(`Content array length: ${updateData.content?.length}`);
      
      if (!updateData.content || !Array.isArray(updateData.content) || updateData.content.length === 0) {
        console.error('Content array is invalid before update');
        return res.status(400).json({
          message: 'Cannot update with empty content array',
          details: {
            contentExists: !!updateData.content,
            isArray: Array.isArray(updateData.content),
            length: updateData.content?.length || 0
          }
        });
      }
      
      // Perform the actual update
      try {
        const updateResult = await Project.update(db, projectId, updateData);
        console.log('MongoDB update result:', updateResult);
        
        if (updateResult.matchedCount === 0) {
          console.error(`Project not found during update: ${projectId}`);
          return res.status(404).json({ message: 'Project not found during update' });
        }
        
        // Get the updated project to verify the update worked
        const updatedProject = await Project.findByProjectId(db, projectId);
        
        if (!updatedProject) {
          console.error('Failed to retrieve updated project');
          return res.status(500).json({ message: 'Failed to retrieve updated project' });
        }
        
        if (!updatedProject.content || !Array.isArray(updatedProject.content)) {
          console.error('Updated project has invalid content structure');
          return res.status(500).json({ message: 'Project updated but content is invalid' });
        }
        
        console.log(`Project updated successfully. New content length: ${updatedProject.content.length}`);
        
        // Return success with the updated project
        return res.status(200).json({ 
          message: 'Project updated successfully',
          project: updatedProject
        });
      } catch (updateError) {
        console.error('Error during project update:', updateError);
        return res.status(500).json({ message: `Update failed: ${updateError.message}` });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);
