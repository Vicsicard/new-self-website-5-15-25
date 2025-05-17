import { connectToDatabase } from '../../../../lib/db';
import Project from '../../../../models/Project';
import withAuth from '../../../../middleware/withAuth';

// This is a specialized endpoint for saving color settings
// It uses a simplified approach to ensure colors are properly saved
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { projectId } = req.query;
  const { colors } = req.body;

  console.log('Save colors request received for project:', projectId);
  console.log('Color values:', colors);

  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find project by ID
    const project = await Project.findByProjectId(db, projectId);
    
    if (!project) {
      console.error(`Project not found with ID: ${projectId}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
      console.error(`User ${req.user.id} not authorized to update project ${projectId}`);
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    if (!colors || typeof colors !== 'object' || Object.keys(colors).length === 0) {
      console.error('No valid color data provided');
      return res.status(400).json({ message: 'No valid color data provided' });
    }
    
    // Create a map of the existing content
    const contentMap = {};
    if (project.content && Array.isArray(project.content)) {
      project.content.forEach(item => {
        if (item && item.key) {
          contentMap[item.key] = item.value;
        }
      });
    }
    
    // Update the color values
    Object.keys(colors).forEach(colorKey => {
      contentMap[colorKey] = colors[colorKey];
    });
    
    // Convert back to array format
    const updatedContent = Object.entries(contentMap).map(([key, value]) => ({
      key,
      value: value || ''
    }));
    
    // Update the project with the new content array
    const result = await Project.update(db, projectId, { 
      content: updatedContent
    });
    
    console.log('Color update result:', result);
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Project not found during update' });
    }
    
    // Return success
    return res.status(200).json({ 
      success: true,
      message: 'Colors updated successfully',
      updatedColors: colors
    });
  } catch (error) {
    console.error('Error updating colors:', error);
    return res.status(500).json({ message: `Failed to update colors: ${error.message}` });
  }
}

export default withAuth(handler);
