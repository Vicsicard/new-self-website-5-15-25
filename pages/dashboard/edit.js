import { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/dashboard/Layout';
import { AuthContext } from '../_app';
import { FaLightbulb, FaCheck, FaInfoCircle } from 'react-icons/fa';

// Simple content fingerprinting function
function generateContentFingerprint(formData) {
  // Filter to just content fields that affect the public site
  const publicFields = Object.keys(formData).filter(key => {
    // Ignore internal fields and metadata
    return !key.startsWith('_') && 
           key !== 'name' &&
           key !== 'settings' &&
           key !== 'projectId';
  }).sort(); // Sort for consistent order
  
  // Create a simplified object with just the public fields
  const publicContent = publicFields.reduce((obj, key) => {
    obj[key] = formData[key];
    return obj;
  }, {});
  
  // Create a simple hash by converting to string and taking a hash
  // Note: In production, you might want a more robust hashing algorithm
  const contentStr = JSON.stringify(publicContent);
  let hash = 0;
  for (let i = 0; i < contentStr.length; i++) {
    const char = contentStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Return absolute value and add timestamp prefix for uniqueness
  return Math.abs(hash).toString();
}

export default function EditContent() {
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [creatingWebsite, setCreatingWebsite] = useState(false);
  const [websiteCreated, setWebsiteCreated] = useState(false);
  const [error, setError] = useState('');
  const [showColorSuggestions, setShowColorSuggestions] = useState(false);
  const [colorPalettes, setColorPalettes] = useState([]);
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(null);
  const [colorSaved, setColorSaved] = useState(false);
  const [lastSavedColor, setLastSavedColor] = useState('');
  const [uploadStatus, setUploadStatus] = useState({});
  // New state variables for content fingerprinting
  const [originalContentFingerprint, setOriginalContentFingerprint] = useState('');
  const [lastRevalidatedFingerprint, setLastRevalidatedFingerprint] = useState('');
  const [contentChanged, setContentChanged] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch project data and content
  useEffect(() => {
    // Skip fetching if we're still loading auth state
    if (authLoading) return;
    
    async function fetchProject() {
      try {
        // Get project ID from URL query or from user's assigned project
        const projectId = router.query.id || user?.projectId;
        
        if (!projectId) {
          setError('No project ID specified');
          setLoading(false);
          return;
        }
        
        console.log('Fetching project with ID:', projectId);
        
        // First, fetch project metadata
        const projectRes = await fetch(`/api/projects/${projectId}`);
        if (!projectRes.ok) {
          throw new Error('Failed to fetch project metadata');
        }
        
        // Then fetch project content
        const contentRes = await fetch(`/api/projects/${projectId}/content`);
        if (!contentRes.ok) {
          throw new Error('Failed to fetch project content');
        }
        
        const projectData = await projectRes.json();
        const contentData = await contentRes.json();
        
        // Combine the data
        const combinedData = {
          ...projectData.project, // Project metadata
          content: contentData.content || []
        };
        
        console.log('Project data received:', combinedData);
        setProject(combinedData);
        
        // Convert content array to form data object for easier editing
        const initialFormData = {};
        if (contentData.content && Array.isArray(contentData.content)) {
          contentData.content.forEach(item => {
            if (item && item.key) {
              initialFormData[item.key] = item.value || '';
            }
          });
        }
        
        // Add any metadata fields to the form data
        if (projectData.project) {
          Object.entries(projectData.project).forEach(([key, value]) => {
            if (value !== null && value !== undefined && key !== 'content') {
              initialFormData[key] = value;
            }
          });
        }
        
        console.log('Initial form data:', initialFormData);
        setFormData(initialFormData);
        
        // Generate and store the initial content fingerprint
        const initialFingerprint = generateContentFingerprint(initialFormData);
        console.log('[Fingerprint] Initial content fingerprint:', initialFingerprint);
        setOriginalContentFingerprint(initialFingerprint);
        setLastRevalidatedFingerprint(initialFingerprint);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProject();
    }
  }, [user, router.query.id, authLoading]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Check if this is a color field change and save it immediately 
    if (name.includes('color')) {
      saveColorChange(name, value);
    }
  };
  
  // Handle file uploads
  const handleFileUpload = async (e, targetField) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file before uploading
    const validTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/pjpeg',
      'image/jfif',
      'image/png', 
      'image/gif', 
      'image/webp'
    ];
    
    // Special handling for files with .jpg/.jpeg extension
    let fileType = file.type;
    if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      // Allow files with jpg/jpeg extension even if MIME type doesn't match
      console.log(`File has .jpg/.jpeg extension but type is ${file.type}`);
      fileType = 'image/jpeg';
    }
    
    if (!validTypes.includes(fileType)) {
      console.log(`Rejected file upload: ${file.name} (${file.type})`);
      setUploadStatus(prev => ({
        ...prev,
        [targetField]: `Error: Only JPG, PNG, GIF and WebP images are allowed. Got: ${file.type}`
      }));
      return;
    }
    
    // File size validation (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadStatus(prev => ({
        ...prev,
        [targetField]: 'Error: File size exceeds 5MB limit'
      }));
      return;
    }
    
    // Update upload status
    setUploadStatus(prev => ({
      ...prev,
      [targetField]: `Uploading ${file.name}...`
    }));
    
    try {
      // Create form data with field name expected by the backend
      // The field name must be 'image' to match backend expectations
      const formData = new FormData();
      formData.append('image', file);
      
      console.log(`Uploading ${file.name} (${file.size} bytes) for field ${targetField}`);
      
      // Upload the file with proper error handling
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          // Try to get error details from response
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If can't parse JSON, use status text
          errorMessage = `Upload failed: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      const data = await response.json();
      console.log('Upload successful:', data);
      
      if (!data.url) {
        throw new Error('Server response missing image URL');
      }
      
      // Update the form data with the new image URL - using absoluteUrl for better browser compatibility
      setFormData(prev => ({
        ...prev,
        [targetField]: data.absoluteUrl || data.url // Fall back to relative URL if absolute isn't available
      }));
      
      // Update upload status with success message
      setUploadStatus(prev => ({
        ...prev,
        [targetField]: `Upload complete! (${(file.size / 1024).toFixed(1)}KB)`
      }));
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setUploadStatus(prev => ({
          ...prev,
          [targetField]: ''
        }));
      }, 3000);
      
    } catch (error) {
      console.error(`Error uploading file for ${targetField}:`, error);
      setUploadStatus(prev => ({
        ...prev,
        [targetField]: `Upload failed: ${error.message}`
      }));
      
      // Keep error showing longer
      setTimeout(() => {
        setUploadStatus(prev => ({
          ...prev,
          [targetField]: ''
        }));
      }, 5000);
    }
  };
  
  // Special function to save color changes directly to ensure they're properly saved
  const saveColorChange = async (colorKey, colorValue) => {
    try {
      // Get project ID from URL query, current project, or user's assigned project
      const projectId = router.query.id || project?.projectId || user?.projectId;
      
      if (!projectId) {
        console.error('No project ID available for color save');
        return;
      }
      
      console.log(`Saving color change: ${colorKey} = ${colorValue}`);
      
      // Use the specialized endpoint for color saves
      const res = await fetch(`/api/projects/${projectId}/save-colors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colors: { [colorKey]: colorValue }
        }),
        credentials: 'include' // Include cookies for authentication
      });
      
      if (!res.ok) {
        const responseText = await res.text();
        console.error(`Failed to save color: ${responseText}`);
        return;
      }
      
      const responseData = await res.json();
      console.log('Color save response:', responseData);
      
      // Update the project object with the new color value
      if (project && project.content && Array.isArray(project.content)) {
        // Find and update the color in the project content array
        const updatedContent = project.content.map(item => {
          if (item.key === colorKey) {
            return { ...item, value: colorValue };
          }
          return item;
        });
        
        // If the color wasn't found in the content array, add it
        if (!updatedContent.some(item => item.key === colorKey)) {
          updatedContent.push({ key: colorKey, value: colorValue });
        }
        
        // Update the project object with the new content
        setProject({
          ...project,
          content: updatedContent
        });
        
        console.log(`Updated local project state with color ${colorKey}=${colorValue}`);
      }
      
      // Ensure formData is updated with the new color value
      setFormData(prev => ({
        ...prev,
        [colorKey]: colorValue
      }));
      
      // Show the color saved indicator
      setColorSaved(true);
      setLastSavedColor(colorKey);
      
      // Hide the indicator after 3 seconds
      setTimeout(() => {
        setColorSaved(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error saving color:', err);
    }
  };

  // Handle website creation (revalidation)
  const handleCreateWebsite = async () => {
    setCreatingWebsite(true);
    setWebsiteCreated(false);
    setError('');

    try {
      // Get project ID from URL query, current project, or user's assigned project
      const projectId = router.query.id || project?.projectId || user?.projectId;
      
      if (!projectId) {
        throw new Error('No project ID available');
      }
      
      console.log('Creating website for project:', projectId);
      
      // Before revalidating, ensure all color values are properly saved
      // by using our specialized endpoint to save any unsaved color values
      const colorFields = [
        'primary_color',
        'secondary_color',
        'accent_color',
        'text_color',
        'heading_color',
        'title_color',
        'background_color'
      ];
      
      // Save all current color values to ensure they're up to date
      const colorValues = {};
      colorFields.forEach(field => {
        if (formData[field]) {
          colorValues[field] = formData[field];
        }
      });
      
      if (Object.keys(colorValues).length > 0) {
        console.log('Saving all color values before revalidation:', colorValues);
        
        try {
          const colorSaveRes = await fetch(`/api/projects/${projectId}/save-colors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              colors: colorValues
            }),
            credentials: 'include'
          });
          
          if (!colorSaveRes.ok) {
            console.warn('Could not save colors before revalidation');
          } else {
            console.log('Colors successfully saved before revalidation');
          }
        } catch (colorErr) {
          console.warn('Error saving colors before revalidation:', colorErr);
        }
      }
      
      // Call the revalidate API to regenerate the static page
      const res = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: `/${projectId}` }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error(`Failed to create website: ${errorText}`);
      }

      let responseData;
      try {
        responseData = await res.json();
        console.log('Website creation response:', responseData);
      } catch (jsonErr) {
        console.warn('Could not parse revalidation response as JSON:', jsonErr);
      }
      
      setWebsiteCreated(true);
      
      // Open the website in a new tab using the public URL with custom domain
      window.open(`${process.env.NEXT_PUBLIC_CLIENT_DOMAIN || 'https://clients.selfcaststudios.com'}/${projectId}`, '_blank');
    } catch (err) {
      console.error('Error creating website:', err);
      setError(`Failed to create website: ${err.message}`);
    } finally {
      setCreatingWebsite(false);
    }
  };


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setWebsiteCreated(false);
    setError('');
    
    try {
      const projectId = router.query.id || project?.projectId || user?.projectId;
      if (!projectId) {
        throw new Error('No project ID available');
      }
      
      console.log('[Save] Starting save process for project:', projectId);
      
      // Generate new content fingerprint to compare with original
      const currentFingerprint = generateContentFingerprint(formData);
      console.log('[Fingerprint] Current content fingerprint:', currentFingerprint);
      console.log('[Fingerprint] Original content fingerprint:', originalContentFingerprint);
      
      // Check if content has actually changed
      const hasContentChanged = currentFingerprint !== originalContentFingerprint;
      setContentChanged(hasContentChanged);
      
      // Separate metadata from content
      const metadataFields = ['name', 'settings'];
      const contentFields = Object.keys(formData).filter(key => !metadataFields.includes(key));
      
      // 1. Save metadata if needed
      await saveMetadata(projectId, formData, metadataFields);
      
      // 2. Save content if there are content fields
      if (contentFields.length > 0) {
        await saveContent(projectId, formData, contentFields);
      } else {
        console.log('[Save] No content to save');
      }
      
      // 3. Update local state and show success
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // 4. Trigger revalidation ONLY if content has changed
      if (hasContentChanged) {
        console.log('[Fingerprint] Content changed, triggering revalidation');
        try {
          await triggerRevalidation(projectId, currentFingerprint);
          // Update the last revalidated fingerprint after successful revalidation
          setLastRevalidatedFingerprint(currentFingerprint);
          // Update the original fingerprint to match current
          setOriginalContentFingerprint(currentFingerprint);
        } catch (err) {
          console.error('[Fingerprint] Background revalidation failed:', err);
        }
      } else {
        console.log('[Fingerprint] No content changes detected, skipping revalidation');
      }
      
    } catch (err) {
      console.error('Error saving project:', err);
      setError(`Failed to save changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Save metadata to the project
  const saveMetadata = async (projectId, formData, metadataFields) => {
    const metadataToUpdate = {};
    metadataFields.forEach(field => {
      if (formData[field] !== undefined) {
        metadataToUpdate[field] = formData[field];
      }
    });
    
    if (Object.keys(metadataToUpdate).length === 0) return;
    
    console.log('[Save] Updating metadata:', metadataToUpdate);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadataToUpdate),
      credentials: 'include'
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update metadata: ${errorText}`);
    }
    
    console.log('[Save] Metadata updated successfully');
  };
  
  // Save content to the project
  const saveContent = async (projectId, formData, contentFields) => {
    const content = contentFields
      .filter(key => key && key.trim() !== '')
      .map(key => ({
        key,
        value: String(formData[key] || '')
      }));
    
    if (content.length === 0) return;
    
    console.log(`[Save] Saving ${content.length} content items`);
    const res = await fetch(`/api/projects/${projectId}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      credentials: 'include'
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update content: ${errorText}`);
    }
    
    console.log('[Save] Content updated successfully');
  };
  
  // Trigger revalidation in the background with content fingerprint
  const triggerRevalidation = async (projectId, contentFingerprint) => {
    try {
      console.log(`[Revalidation] Triggering revalidation for /${projectId} with fingerprint ${contentFingerprint}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const res = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/${projectId}`,
          contentFingerprint: contentFingerprint,
          timestamp: Date.now()
        }),
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.revalidated) {
          console.log('[Revalidation] Successfully triggered revalidation');
        } else if (data.skipped) {
          console.log('[Revalidation] Revalidation skipped:', data.message);
        }
      } else {
        console.warn('[Revalidation] Failed to trigger revalidation:', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('[Revalidation] Error during revalidation:', err);
      throw err; // Re-throw so caller can handle
    }
  };

  // Organize fields into categories and remove duplicates
  const organizeFields = () => {
    // Get all available keys from the form data
    const availableKeys = Object.keys(formData);
    
    // Create sections for different types of content
    const sections = {
      'Basic Site Content': [],
      'Design Elements': [],
      'Social Media Content': [],
      'Blog Content': [],
      'Contact Information': [],
      'Other Content': []
    };
    
    // Track fields we've already processed to avoid duplicates
    const processedFields = new Set();
    
    // Helper function to categorize keys
    const categorizeKey = (key) => {
      const k = key.toLowerCase();
      
      if (k.includes('blog') || k.includes('post')) {
        return 'Blog Content';
      } else if (k.includes('color') || k.includes('font') || k.includes('banner') || 
                k.includes('background') || k.includes('image') || k.includes('style')) {
        return 'Design Elements';
      } else if (k.includes('facebook') || k.includes('instagram') || 
                k.includes('twitter') || k.includes('linkedin') || k.includes('social')) {
        return 'Social Media Content';
      } else if (k.includes('contact') || k.includes('email') || k.includes('phone') || 
                k.includes('address')) {
        return 'Contact Information';
      } else if (k.includes('title') || k.includes('subtitle') || k.includes('bio') || 
                k.includes('name') || k.includes('slogan') || k.includes('profile') || 
                k.includes('footer') || k.includes('copyright')) {
        return 'Basic Site Content';
      } else {
        return 'Other Content';
      }
    };
    
    // Helper function to normalize keys for duplicate detection
    const normalizeKey = (key) => {
      return key
        .replace(/[0-9]+/g, '') // Remove numbers
        .replace(/_+/g, '_')     // Replace multiple underscores with single
        .replace(/_$/g, '')      // Remove trailing underscore
        .toLowerCase();          // Convert to lowercase
    };
    
    // Group similar fields to detect duplicates
    const fieldGroups = {};
    availableKeys.forEach(key => {
      const normalized = normalizeKey(key);
      if (!fieldGroups[normalized]) {
        fieldGroups[normalized] = [];
      }
      fieldGroups[normalized].push(key);
    });
    
    // Process each field, skipping duplicates
    availableKeys.forEach(key => {
      // Skip if we've already processed this field or a similar one
      const normalized = normalizeKey(key);
      if (processedFields.has(normalized)) {
        return;
      }
      
      // Mark this field as processed
      processedFields.add(normalized);
      
      // Add to appropriate section
      const section = categorizeKey(key);
      sections[section].push(key);
    });
    
    // Sort keys within each section
    Object.keys(sections).forEach(section => {
      sections[section].sort();
    });
    
    // Filter out empty sections
    return Object.fromEntries(
      Object.entries(sections).filter(([_, keys]) => keys.length > 0)
    );
  };

  // Render form fields by section
  const renderFields = () => {
    return (
      <>
        {/* Basic Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-3 rounded">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Site Title */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="rendered_title">
                Site Title
              </label>
              <input
                type="text"
                id="rendered_title"
                name="rendered_title"
                value={formData.rendered_title || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Subtitle */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="rendered_subtitle">
                Subtitle
              </label>
              <input
                type="text"
                id="rendered_subtitle"
                name="rendered_subtitle"
                value={formData.rendered_subtitle || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Profile Image Upload/URL */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="profile_image_url">
                Profile Image
              </label>
              
              {/* File Upload */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'profile_image_url')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {uploadStatus.profile_image_url && (
                  <p className="mt-1 text-xs text-gray-500">{uploadStatus.profile_image_url}</p>
                )}
              </div>
              
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Enter Image URL
                </label>
                <input
                  type="text"
                  id="profile_image_url"
                  name="profile_image_url"
                  value={formData.profile_image_url || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Image Preview */}
              {formData.profile_image_url && (
                <div className="mt-3">
                  <img
                    src={formData.profile_image_url}
                    alt="Profile Image Preview"
                    className="mt-2 h-32 w-auto rounded-md object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.png'; // Local fallback image
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">Image preview</p>
                </div>
              )}
            </div>
            
            {/* Banner Image 1 Upload/URL */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="banner_1_image_url">
                Banner Image 1
              </label>
              
              {/* File Upload */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner_1_image_url')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {uploadStatus.banner_1_image_url && (
                  <p className="mt-1 text-xs text-gray-500">{uploadStatus.banner_1_image_url}</p>
                )}
              </div>
              
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Enter Image URL
                </label>
                <input
                  type="text"
                  id="banner_1_image_url"
                  name="banner_1_image_url"
                  value={formData.banner_1_image_url || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/banner1.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Image Preview */}
              {formData.banner_1_image_url && (
                <div className="mt-3">
                  <img
                    src={formData.banner_1_image_url}
                    alt="Banner Image 1 Preview"
                    className="mt-2 h-32 w-auto rounded-md object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.png'; // Local fallback image
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">Image preview</p>
                </div>
              )}
            </div>
            
            {/* Banner Image 2 Upload/URL */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="banner_2_image_url">
                Banner Image 2
              </label>
              
              {/* File Upload */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner_2_image_url')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {uploadStatus.banner_2_image_url && (
                  <p className="mt-1 text-xs text-gray-500">{uploadStatus.banner_2_image_url}</p>
                )}
              </div>
              
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Enter Image URL
                </label>
                <input
                  type="text"
                  id="banner_2_image_url"
                  name="banner_2_image_url"
                  value={formData.banner_2_image_url || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/banner2.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Image Preview */}
              {formData.banner_2_image_url && (
                <div className="mt-3">
                  <img
                    src={formData.banner_2_image_url}
                    alt="Banner Image 2 Preview"
                    className="mt-2 h-32 w-auto rounded-md object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.png'; // Local fallback image
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">Image preview</p>
                </div>
              )}
            </div>
            
            {/* Banner Image 3 Upload/URL */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="banner_3_image_url">
                Banner Image 3
              </label>
              
              {/* File Upload */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner_3_image_url')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {uploadStatus.banner_3_image_url && (
                  <p className="mt-1 text-xs text-gray-500">{uploadStatus.banner_3_image_url}</p>
                )}
              </div>
              
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Enter Image URL
                </label>
                <input
                  type="text"
                  id="banner_3_image_url"
                  name="banner_3_image_url"
                  value={formData.banner_3_image_url || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/banner3.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Image Preview */}
              {formData.banner_3_image_url && (
                <div className="mt-3">
                  <img
                    src={formData.banner_3_image_url}
                    alt="Banner Image 3 Preview"
                    className="mt-2 h-32 w-auto rounded-md object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.png'; // Local fallback image
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">Image preview</p>
                </div>
              )}
            </div>
            
            {/* Bio Content */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="rendered_bio_html">
                About Me/Bio Content (HTML)
              </label>
              <textarea
                id="rendered_bio_html"
                name="rendered_bio_html"
                value={formData.rendered_bio_html || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={8}
              />
              <p className="mt-1 text-xs text-gray-500">
                HTML formatting is supported
              </p>
            </div>
            
            {/* Bio Card 1 */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="bio_card_1">
                Bio Card 1
              </label>
              <textarea
                id="bio_card_1"
                name="bio_card_1"
                value={formData.bio_card_1 || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            
            {/* Bio Card 2 */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="bio_card_2">
                Bio Card 2
              </label>
              <textarea
                id="bio_card_2"
                name="bio_card_2"
                value={formData.bio_card_2 || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            
            {/* Bio Card 3 */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="bio_card_3">
                Bio Card 3
              </label>
              <textarea
                id="bio_card_3"
                name="bio_card_3"
                value={formData.bio_card_3 || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
          </div>
        </div>


        
        {/* Color settings section */}
        <div className={`mt-8 form-section ${activeSection === 'colors' ? 'block' : 'hidden'}`}>
          <h2 className="text-xl font-semibold mb-4">Colors</h2>
          
          {/* Color save indicator */}
          {colorSaved && (
            <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-md flex items-center">
              <FaCheck className="mr-2" />
              <span>Color {lastSavedColor.replace('_', ' ')} saved successfully!</span>
            </div>
          )}
        </div>
        
        {/* Blog Posts Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-3 rounded">Blog Posts</h3>
          
          {/* Blog Post 1 */}
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-3">Blog Post 1</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_1_title">
                  Title
                </label>
                <input
                  type="text"
                  id="blog_1_title"
                  name="blog_1_title"
                  value={formData.blog_1_title || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_1_excerpt">
                  Excerpt
                </label>
                <textarea
                  id="blog_1_excerpt"
                  name="blog_1_excerpt"
                  value={formData.blog_1_excerpt || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_1">
                  Content
                </label>
                <textarea
                  id="blog_1"
                  name="blog_1"
                  value={formData.blog_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={8}
                />
              </div>
            </div>
          </div>
          
          {/* Blog Post 2 */}
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-3">Blog Post 2</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_2_title">
                  Title
                </label>
                <input
                  type="text"
                  id="blog_2_title"
                  name="blog_2_title"
                  value={formData.blog_2_title || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_2_excerpt">
                  Excerpt
                </label>
                <textarea
                  id="blog_2_excerpt"
                  name="blog_2_excerpt"
                  value={formData.blog_2_excerpt || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_2">
                  Content
                </label>
                <textarea
                  id="blog_2"
                  name="blog_2"
                  value={formData.blog_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={8}
                />
              </div>
            </div>
          </div>
          
          {/* Blog Post 3 */}
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-3">Blog Post 3</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_3_title">
                  Title
                </label>
                <input
                  type="text"
                  id="blog_3_title"
                  name="blog_3_title"
                  value={formData.blog_3_title || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_3_excerpt">
                  Excerpt
                </label>
                <textarea
                  id="blog_3_excerpt"
                  name="blog_3_excerpt"
                  value={formData.blog_3_excerpt || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_3">
                  Content
                </label>
                <textarea
                  id="blog_3"
                  name="blog_3"
                  value={formData.blog_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={8}
                />
              </div>
            </div>
          </div>
          
          {/* Blog Post 4 */}
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-3">Blog Post 4</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_4_title">
                  Title
                </label>
                <input
                  type="text"
                  id="blog_4_title"
                  name="blog_4_title"
                  value={formData.blog_4_title || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_4_excerpt">
                  Excerpt
                </label>
                <textarea
                  id="blog_4_excerpt"
                  name="blog_4_excerpt"
                  value={formData.blog_4_excerpt || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="blog_4">
                  Content
                </label>
                <textarea
                  id="blog_4"
                  name="blog_4"
                  value={formData.blog_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={8}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Social Media Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-3 rounded">Social Media</h3>
          
          {/* Facebook Section */}
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-3">Facebook</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_url">
                  Facebook Profile URL
                </label>
                <input
                  type="text"
                  id="facebook_url"
                  name="facebook_url"
                  value={formData.facebook_url || ''}
                  onChange={handleChange}
                  placeholder="https://facebook.com/username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Facebook Post 1 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_title_1">
                  Facebook Post 1 Title
                </label>
                <input
                  type="text"
                  id="facebook_title_1"
                  name="facebook_title_1"
                  value={formData.facebook_title_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_excerpt_1">
                  Facebook Post 1 Excerpt
                </label>
                <textarea
                  id="facebook_excerpt_1"
                  name="facebook_excerpt_1"
                  value={formData.facebook_excerpt_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_post_1">
                  Facebook Post 1 Content
                </label>
                <textarea
                  id="facebook_post_1"
                  name="facebook_post_1"
                  value={formData.facebook_post_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* Facebook Post 2 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_title_2">
                  Facebook Post 2 Title
                </label>
                <input
                  type="text"
                  id="facebook_title_2"
                  name="facebook_title_2"
                  value={formData.facebook_title_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_excerpt_2">
                  Facebook Post 2 Excerpt
                </label>
                <textarea
                  id="facebook_excerpt_2"
                  name="facebook_excerpt_2"
                  value={formData.facebook_excerpt_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_post_2">
                  Facebook Post 2 Content
                </label>
                <textarea
                  id="facebook_post_2"
                  name="facebook_post_2"
                  value={formData.facebook_post_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* Facebook Post 3 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_title_3">
                  Facebook Post 3 Title
                </label>
                <input
                  type="text"
                  id="facebook_title_3"
                  name="facebook_title_3"
                  value={formData.facebook_title_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_excerpt_3">
                  Facebook Post 3 Excerpt
                </label>
                <textarea
                  id="facebook_excerpt_3"
                  name="facebook_excerpt_3"
                  value={formData.facebook_excerpt_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_post_3">
                  Facebook Post 3 Content
                </label>
                <textarea
                  id="facebook_post_3"
                  name="facebook_post_3"
                  value={formData.facebook_post_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* Facebook Post 4 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_title_4">
                  Facebook Post 4 Title
                </label>
                <input
                  type="text"
                  id="facebook_title_4"
                  name="facebook_title_4"
                  value={formData.facebook_title_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_excerpt_4">
                  Facebook Post 4 Excerpt
                </label>
                <textarea
                  id="facebook_excerpt_4"
                  name="facebook_excerpt_4"
                  value={formData.facebook_excerpt_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="facebook_post_4">
                  Facebook Post 4 Content
                </label>
                <textarea
                  id="facebook_post_4"
                  name="facebook_post_4"
                  value={formData.facebook_post_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>
          </div>


          
          {/* Twitter Section */}
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-3">Twitter</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="twitter_url">
                  Twitter Profile URL
                </label>
                <input
                  type="text"
                  id="twitter_url"
                  name="twitter_url"
                  value={formData.twitter_url || ''}
                  onChange={handleChange}
                  placeholder="https://twitter.com/username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Twitter Posts - similar structure to Facebook posts */}
              {/* Twitter Post 1 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="twitter_title_1">
                  Twitter Post 1 Title
                </label>
                <input
                  type="text"
                  id="twitter_title_1"
                  name="twitter_title_1"
                  value={formData.twitter_title_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="twitter_excerpt_1">
                  Twitter Post 1 Excerpt
                </label>
                <textarea
                  id="twitter_excerpt_1"
                  name="twitter_excerpt_1"
                  value={formData.twitter_excerpt_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="twitter_post_1">
                  Twitter Post 1 Content
                </label>
                <textarea
                  id="twitter_post_1"
                  name="twitter_post_1"
                  value={formData.twitter_post_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* Twitter Post 2 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="twitter_title_2">
                  Twitter Post 2 Title
                </label>
                <input
                  type="text"
                  id="twitter_title_2"
                  name="twitter_title_2"
                  value={formData.twitter_title_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="twitter_excerpt_2">
                  Twitter Post 2 Excerpt
                </label>
                <textarea
                  id="twitter_excerpt_2"
                  name="twitter_excerpt_2"
                  value={formData.twitter_excerpt_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="twitter_post_2">
                  Twitter Post 2 Content
                </label>
                <textarea
                  id="twitter_post_2"
                  name="twitter_post_2"
                  value={formData.twitter_post_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>
          </div>
          
          {/* Instagram Section */}
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-3">Instagram</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_url">
                  Instagram Profile URL
                </label>
                <input
                  type="text"
                  id="instagram_url"
                  name="instagram_url"
                  value={formData.instagram_url || ''}
                  onChange={handleChange}
                  placeholder="https://instagram.com/username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Instagram Post 1 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_title_1">
                  Instagram Post 1 Title
                </label>
                <input
                  type="text"
                  id="instagram_title_1"
                  name="instagram_title_1"
                  value={formData.instagram_title_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_excerpt_1">
                  Instagram Post 1 Excerpt
                </label>
                <textarea
                  id="instagram_excerpt_1"
                  name="instagram_excerpt_1"
                  value={formData.instagram_excerpt_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_post_1">
                  Instagram Post 1 Content
                </label>
                <textarea
                  id="instagram_post_1"
                  name="instagram_post_1"
                  value={formData.instagram_post_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* Instagram Post 2 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_title_2">
                  Instagram Post 2 Title
                </label>
                <input
                  type="text"
                  id="instagram_title_2"
                  name="instagram_title_2"
                  value={formData.instagram_title_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_excerpt_2">
                  Instagram Post 2 Excerpt
                </label>
                <textarea
                  id="instagram_excerpt_2"
                  name="instagram_excerpt_2"
                  value={formData.instagram_excerpt_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_post_2">
                  Instagram Post 2 Content
                </label>
                <textarea
                  id="instagram_post_2"
                  name="instagram_post_2"
                  value={formData.instagram_post_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* Instagram Post 3 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_title_3">
                  Instagram Post 3 Title
                </label>
                <input
                  type="text"
                  id="instagram_title_3"
                  name="instagram_title_3"
                  value={formData.instagram_title_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_excerpt_3">
                  Instagram Post 3 Excerpt
                </label>
                <textarea
                  id="instagram_excerpt_3"
                  name="instagram_excerpt_3"
                  value={formData.instagram_excerpt_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_post_3">
                  Instagram Post 3 Content
                </label>
                <textarea
                  id="instagram_post_3"
                  name="instagram_post_3"
                  value={formData.instagram_post_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* Instagram Post 4 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_title_4">
                  Instagram Post 4 Title
                </label>
                <input
                  type="text"
                  id="instagram_title_4"
                  name="instagram_title_4"
                  value={formData.instagram_title_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_excerpt_4">
                  Instagram Post 4 Excerpt
                </label>
                <textarea
                  id="instagram_excerpt_4"
                  name="instagram_excerpt_4"
                  value={formData.instagram_excerpt_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="instagram_post_4">
                  Instagram Post 4 Content
                </label>
                <textarea
                  id="instagram_post_4"
                  name="instagram_post_4"
                  value={formData.instagram_post_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>
          </div>


          
          {/* LinkedIn Section */}
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-3">LinkedIn</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_url">
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  id="linkedin_url"
                  name="linkedin_url"
                  value={formData.linkedin_url || ''}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* LinkedIn Post 1 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_title_1">
                  LinkedIn Post 1 Title
                </label>
                <input
                  type="text"
                  id="linkedin_title_1"
                  name="linkedin_title_1"
                  value={formData.linkedin_title_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_excerpt_1">
                  LinkedIn Post 1 Excerpt
                </label>
                <textarea
                  id="linkedin_excerpt_1"
                  name="linkedin_excerpt_1"
                  value={formData.linkedin_excerpt_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_post_1">
                  LinkedIn Post 1 Content
                </label>
                <textarea
                  id="linkedin_post_1"
                  name="linkedin_post_1"
                  value={formData.linkedin_post_1 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* LinkedIn Post 2 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_title_2">
                  LinkedIn Post 2 Title
                </label>
                <input
                  type="text"
                  id="linkedin_title_2"
                  name="linkedin_title_2"
                  value={formData.linkedin_title_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_excerpt_2">
                  LinkedIn Post 2 Excerpt
                </label>
                <textarea
                  id="linkedin_excerpt_2"
                  name="linkedin_excerpt_2"
                  value={formData.linkedin_excerpt_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_post_2">
                  LinkedIn Post 2 Content
                </label>
                <textarea
                  id="linkedin_post_2"
                  name="linkedin_post_2"
                  value={formData.linkedin_post_2 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* LinkedIn Post 3 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_title_3">
                  LinkedIn Post 3 Title
                </label>
                <input
                  type="text"
                  id="linkedin_title_3"
                  name="linkedin_title_3"
                  value={formData.linkedin_title_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_excerpt_3">
                  LinkedIn Post 3 Excerpt
                </label>
                <textarea
                  id="linkedin_excerpt_3"
                  name="linkedin_excerpt_3"
                  value={formData.linkedin_excerpt_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_post_3">
                  LinkedIn Post 3 Content
                </label>
                <textarea
                  id="linkedin_post_3"
                  name="linkedin_post_3"
                  value={formData.linkedin_post_3 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              {/* LinkedIn Post 4 */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_title_4">
                  LinkedIn Post 4 Title
                </label>
                <input
                  type="text"
                  id="linkedin_title_4"
                  name="linkedin_title_4"
                  value={formData.linkedin_title_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_excerpt_4">
                  LinkedIn Post 4 Excerpt
                </label>
                <textarea
                  id="linkedin_excerpt_4"
                  name="linkedin_excerpt_4"
                  value={formData.linkedin_excerpt_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief excerpt for post preview"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1" htmlFor="linkedin_post_4">
                  LinkedIn Post 4 Content
                </label>
                <textarea
                  id="linkedin_post_4"
                  name="linkedin_post_4"
                  value={formData.linkedin_post_4 || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Quotes Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-3 rounded">Quotes</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Quote 1 */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="quote_1">
                Quote 1
              </label>
              <textarea
                id="quote_1"
                name="quote_1"
                value={formData.quote_1 || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            {/* Quote 2 */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="quote_2">
                Quote 2
              </label>
              <textarea
                id="quote_2"
                name="quote_2"
                value={formData.quote_2 || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            {/* Quote 3 */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="quote_3">
                Quote 3
              </label>
              <textarea
                id="quote_3"
                name="quote_3"
                value={formData.quote_3 || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        {/* Footer Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-3 rounded">Footer</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Footer Message */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="footer_message">
                Footer Message
              </label>
              <textarea
                id="footer_message"
                name="footer_message"
                value={formData.footer_message || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            {/* Footer Email */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="footer_email">
                Footer Email
              </label>
              <input
                type="email"
                id="footer_email"
                name="footer_email"
                value={formData.footer_email || ''}
                onChange={handleChange}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Styling Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-3 rounded">Styling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Color */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="primary_color">
                Primary Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="primary_color"
                  name="primary_color"
                  value={formData.primary_color || '#3498db'}
                  onChange={handleChange}
                  className="h-8 w-8 rounded-md border border-gray-300 shadow-sm"
                />
                <input
                  type="text"
                  value={formData.primary_color || '#3498db'}
                  onChange={handleChange}
                  name="primary_color"
                  className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#RRGGBB"
                />
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    generateColorPalettes();
                    setShowColorSuggestions(!showColorSuggestions);
                  }}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-white transition-all duration-200 ease-in-out"
                  style={{
                    background: `linear-gradient(to right, ${formData.primary_color || '#3498db'}, ${lightenDarkenColor(formData.primary_color || '#3498db', 40)})`
                  }}
                >
                  <FaLightbulb className="mr-2" />
                  {showColorSuggestions ? 'Hide Color Suggestions' : 'Get Color Suggestions'}
                </button>
              </div>

              {/* Add CSS Animation for palette selection */}
              <style jsx>{`
                @keyframes palette-applied-flash {
                  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                  50% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
                .palette-applied-flash {
                  animation: palette-applied-flash 0.5s ease-out;
                }
              `}</style>
              
              {/* Color Suggestions Panel */}
              {showColorSuggestions && colorPalettes.length > 0 && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white shadow-md animate-fadeIn">
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-800">Color Psychology</h4>
                    <p className="text-sm text-gray-600">{getColorPsychology(formData.primary_color || '#3498db')}</p>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-2">Suggested Palettes</h4>
                  <div className="space-y-4">
                    {colorPalettes.map((palette, index) => (
                      <div 
                        id={`palette-card-${index}`}
                        key={index} 
                        className={`border ${selectedPaletteIndex === index ? 'border-2 border-green-500 bg-green-50' : 'border-gray-200'} rounded-md p-3 hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-700">{palette.name}</h5>
                          <button
                            type="button"
                            onClick={() => applyPalette(palette, index)}
                            className={`flex items-center px-2 py-1 text-xs font-medium rounded-md text-white ${selectedPaletteIndex === index ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} transition-all duration-200`}
                          >
                            <FaCheck className="mr-1" /> {selectedPaletteIndex === index ? 'Applied' : 'Apply'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{palette.description}</p>
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <div 
                              className="h-12 w-1/3 rounded-md shadow-sm" 
                              style={{ backgroundColor: palette.primary }}
                              title="Primary"
                            />
                            <div 
                              className="h-12 w-1/3 rounded-md shadow-sm" 
                              style={{ backgroundColor: palette.secondary }}
                              title="Secondary"
                            />
                            <div 
                              className="h-12 w-1/3 rounded-md shadow-sm" 
                              style={{ backgroundColor: palette.accent }}
                              title="Accent"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <div className="flex-1 h-8 flex items-center justify-center rounded" style={{ backgroundColor: '#f8f9fa', color: palette.text_color }}>
                              <span style={{ color: palette.text_color }} className="text-xs">Text</span>
                            </div>
                            <div className="flex-1 h-8 flex items-center justify-center rounded" style={{ backgroundColor: '#f8f9fa', color: palette.heading_color }}>
                              <span style={{ color: palette.heading_color }} className="text-xs font-bold">Heading</span>
                            </div>
                            <div className="flex-1 h-8 flex items-center justify-center rounded" style={{ backgroundColor: '#f8f9fa', color: palette.title_color }}>
                              <span style={{ color: palette.title_color }} className="text-xs font-bold">Subtitle</span>
                            </div>
                          </div>
                          <div className="flex">
                            <div className="flex-1 h-8 flex items-center justify-center rounded-md" style={{ backgroundColor: '#2c3e50', color: palette.footer_text_color }}>
                              <span style={{ color: palette.footer_text_color }} className="text-xs">Footer Text (matches Subtitle)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Secondary Color */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="secondary_color">
                Secondary Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="secondary_color"
                  name="secondary_color"
                  value={formData.secondary_color || '#2c3e50'}
                  onChange={handleChange}
                  className="h-8 w-8 rounded-md border border-gray-300 shadow-sm"
                />
                <input
                  type="text"
                  value={formData.secondary_color || '#2c3e50'}
                  onChange={handleChange}
                  name="secondary_color"
                  className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            
            {/* Accent Color */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="accent_color">
                Accent Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="accent_color"
                  name="accent_color"
                  value={formData.accent_color || '#e74c3c'}
                  onChange={handleChange}
                  className="h-8 w-8 rounded-md border border-gray-300 shadow-sm"
                />
                <input
                  type="text"
                  value={formData.accent_color || '#e74c3c'}
                  onChange={handleChange}
                  name="accent_color"
                  className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            
            {/* Body Text Color */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="text_color">
                Body Text Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="text_color"
                  name="text_color"
                  value={formData.text_color || '#333333'}
                  onChange={handleChange}
                  className="h-8 w-8 rounded-md border border-gray-300 shadow-sm"
                />
                <input
                  type="text"
                  value={formData.text_color || '#333333'}
                  onChange={handleChange}
                  name="text_color"
                  className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            
            {/* Heading Text Color */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="heading_color">
                Heading Text Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="heading_color"
                  name="heading_color"
                  value={formData.heading_color || '#222222'}
                  onChange={handleChange}
                  className="h-8 w-8 rounded-md border border-gray-300 shadow-sm"
                />
                <input
                  type="text"
                  value={formData.heading_color || '#222222'}
                  onChange={handleChange}
                  name="heading_color"
                  className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            
            {/* Title Text Color */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="title_color">
                Title Text Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="title_color"
                  name="title_color"
                  value={formData.title_color || formData.primary_color || '#3498db'}
                  onChange={handleChange}
                  className="h-8 w-8 rounded-md border border-gray-300 shadow-sm"
                />
                <input
                  type="text"
                  value={formData.title_color || formData.primary_color || '#3498db'}
                  onChange={handleChange}
                  name="title_color"
                  className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            
            {/* Color Preview */}
            <div className="mb-4 col-span-1 md:col-span-2">
              <label className="block font-medium text-gray-700 mb-2">Color Preview</label>
              <div className="flex flex-wrap gap-3">
                <div 
                  className="h-16 w-16 rounded-md shadow-md flex items-center justify-center" 
                  style={{ backgroundColor: formData.primary_color || '#3498db' }}
                >
                  <span className="text-white text-xs font-bold">Primary</span>
                </div>
                <div 
                  className="h-16 w-16 rounded-md shadow-md flex items-center justify-center" 
                  style={{ backgroundColor: formData.secondary_color || '#2c3e50' }}
                >
                  <span className="text-white text-xs font-bold">Secondary</span>
                </div>
                <div 
                  className="h-16 w-16 rounded-md shadow-md flex items-center justify-center" 
                  style={{ backgroundColor: formData.accent_color || '#e74c3c' }}
                >
                  <span className="text-white text-xs font-bold">Accent</span>
                </div>
                <div 
                  className="h-16 w-16 rounded-md shadow-md flex items-center justify-center border border-gray-200" 
                  style={{ backgroundColor: '#ffffff', color: formData.text_color || '#333333' }}
                >
                  <span className="text-xs font-bold">Body</span>
                </div>
                <div 
                  className="h-16 w-16 rounded-md shadow-md flex items-center justify-center border border-gray-200" 
                  style={{ backgroundColor: '#ffffff', color: formData.heading_color || '#222222' }}
                >
                  <span className="text-xs font-bold">Heading</span>
                </div>
                <div 
                  className="h-16 w-16 rounded-md shadow-md flex items-center justify-center border border-gray-200" 
                  style={{ backgroundColor: '#ffffff', color: formData.title_color || formData.primary_color || '#3498db' }}
                >
                  <span className="text-xs font-bold">Title</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error && !project) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  // Convert hex to HSL for easier color manipulation
  const hexToHSL = (hex) => {
    // Remove the # if present
    hex = hex.replace(/#/g, '');
    
    // Convert hex to RGB
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Find greatest and smallest channel values
    let cmin = Math.min(r, g, b);
    let cmax = Math.max(r, g, b);
    let delta = cmax - cmin;
    let h = 0;
    let s = 0;
    let l = 0;

    // Calculate hue
    if (delta === 0) {
      h = 0;
    } else if (cmax === r) {
      h = ((g - b) / delta) % 6;
    } else if (cmax === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    
    // Convert to percentages
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
  };

  // Convert HSL to hex
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    
    // Convert to hex
    r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    b = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  };

  // Simple function to lighten or darken a color
  const lightenDarkenColor = (hex, amount) => {
    const { h, s, l } = hexToHSL(hex);
    // Adjust lightness but keep within 0-100 range
    const newL = Math.min(Math.max(l + amount, 0), 100);
    return hslToHex(h, s, newL);
  };

  // Get color category and psychological description
  const getColorPsychology = (hex) => {
    const { h, s, l } = hexToHSL(hex);
    
    // Determine color category based on hue
    if (h >= 0 && h < 20 || h >= 330 && h <= 360) {
      return "Your selected red conveys energy and passion. It creates excitement and can evoke strong emotions. Ideal for call-to-action elements and energetic brands.";
    } else if (h >= 20 && h < 50) {
      return "Your selected orange blends the energy of red with the cheerfulness of yellow. It represents enthusiasm, creativity, and determination. Great for brands wanting to appear friendly and confident.";
    } else if (h >= 50 && h < 70) {
      return "Your selected yellow radiates positivity and optimism. It suggests clarity of thought and intellectual energy. Perfect for brands focused on communication and innovation.";
    } else if (h >= 70 && h < 150) {
      return "Your selected green represents growth and harmony. It suggests balance, health, and a connection to nature. Ideal for brands emphasizing wellness, sustainability, or financial stability.";
    } else if (h >= 150 && h < 210) {
      return "Your selected blue conveys trust and professionalism. It's calming, reliable, and suggests depth and stability. Perfect for corporate sites or brands emphasizing dependability.";
    } else if (h >= 210 && h < 270) {
      return "Your selected purple suggests creativity and wisdom. It combines the stability of blue with the energy of red, often associated with luxury, mystery, and sophistication.";
    } else if (h >= 270 && h < 330) {
      return "Your selected pink/magenta conveys nurturing energy, often associated with compassion, understanding, and support. Ideal for brands wanting to appear approachable and caring.";
    } else {
      return "This color has a balanced psychological impact, blending multiple emotional responses. Consider how it makes you feel and what you want your visitors to experience.";
    }
  };

  // Function to calculate contrast ratio between two colors
  const getContrastRatio = (color1, color2) => {
    // Convert colors to RGB format
    const getRGB = (hex) => {
      hex = hex.replace(/#/g, '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return [r, g, b];
    };

    // Calculate relative luminance
    const getLuminance = (rgb) => {
      const [r, g, b] = rgb.map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const rgb1 = getRGB(color1);
    const rgb2 = getRGB(color2);
    const l1 = getLuminance(rgb1);
    const l2 = getLuminance(rgb2);

    // Calculate contrast ratio
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio;
  };

  // Ensure text colors have sufficient contrast with backgrounds
  const ensureReadableTextColor = (backgroundColor, preferredTextColor = '#333333') => {
    const minContrast = 4.5; // WCAG AA standard for normal text
    const contrast = getContrastRatio(backgroundColor, preferredTextColor);
    
    if (contrast >= minContrast) {
      return preferredTextColor;
    }
    
    // If contrast is insufficient, return either black or white based on background brightness
    const { l } = hexToHSL(backgroundColor);
    return l > 50 ? '#333333' : '#FFFFFF';
  };

  // Helper function to ensure readable text against a background, preserving original color's hue if possible
  const ensureReadableTextColorPreservingHue = (bgColor, textColor) => {
    const minContrast = 4.5; // WCAG AA standard for normal text
    const originalContrast = getContrastRatio(bgColor, textColor);
    
    if (originalContrast >= minContrast) {
      return textColor; // Original color has sufficient contrast
    }
    
    // Try to preserve the hue but adjust lightness to improve contrast
    const { h, s } = hexToHSL(textColor);
    const bgHSL = hexToHSL(bgColor);
    
    // If background is dark, try a lighter version of the text color
    if (bgHSL.l < 50) {
      // Try increasing lightness while keeping the same hue
      for (let l = 70; l <= 95; l += 5) {
        const adjustedColor = hslToHex(h, s, l);
        if (getContrastRatio(bgColor, adjustedColor) >= minContrast) {
          return adjustedColor;
        }
      }
    } else {
      // If background is light, try a darker version of the text color
      for (let l = 30; l >= 5; l -= 5) {
        const adjustedColor = hslToHex(h, s, l);
        if (getContrastRatio(bgColor, adjustedColor) >= minContrast) {
          return adjustedColor;
        }
      }
    }
    
    // If we couldn't achieve good contrast by adjusting lightness, fall back to black or white
    return bgHSL.l > 50 ? '#333333' : '#FFFFFF';
  };

  // Generate color palette suggestions based on the selected primary color
  const generateColorPalettes = () => {
    const primaryColor = formData.primary_color || '#3498db';
    const { h, s, l } = hexToHSL(primaryColor);
    
    const palettes = [];
    
    // Footer background color - we use a dark color for the footer background
    // This is based on the website template which has a dark footer background
    const footerBgColor = '#2c3e50'; // This is the default dark footer background
    
    // Complementary palette (opposite on the color wheel)
    const complementarySecondary = hslToHex((h + 180) % 360, Math.max(s - 20, 0), Math.min(l + 10, 100));
    const complementaryAccent = hslToHex((h + 180) % 360, Math.min(s + 20, 100), Math.max(l - 15, 0));
    const compTitleColor = primaryColor;
    palettes.push({
      name: "Professional & Balanced",
      description: "Creates visual interest and balanced contrast. Good for professional sites needing clear call-to-action elements.",
      primary: primaryColor,
      secondary: complementarySecondary,
      accent: complementaryAccent,
      text_color: ensureReadableTextColor(complementarySecondary, '#333333'),
      heading_color: ensureReadableTextColor(primaryColor, '#222222'),
      title_color: compTitleColor,
      footer_text_color: ensureReadableTextColorPreservingHue(footerBgColor, compTitleColor)
    });
    
    // Analogous palette (adjacent on the color wheel)
    const analogousSecondary = hslToHex((h + 30) % 360, Math.max(s - 5, 0), Math.max(l - 10, 0));
    const analogousAccent = hslToHex((h - 30 + 360) % 360, Math.min(s + 10, 100), Math.min(l + 5, 100));
    const analogTitleColor = primaryColor;
    palettes.push({
      name: "Harmonious & Cohesive",
      description: "Creates a natural, harmonious feel with colors that sit next to each other on the color wheel.",
      primary: primaryColor,
      secondary: analogousSecondary,
      accent: analogousAccent,
      text_color: ensureReadableTextColor(analogousSecondary, '#333333'),
      heading_color: analogousSecondary,
      title_color: analogTitleColor,
      footer_text_color: ensureReadableTextColorPreservingHue(footerBgColor, analogTitleColor)
    });
    
    // Triadic palette (evenly spaced around the color wheel)
    const triadicSecondary = hslToHex((h + 120) % 360, s, l);
    const triadicAccent = hslToHex((h + 240) % 360, s, l);
    const triadicTitleColor = triadicAccent;
    palettes.push({
      name: "Dynamic & Vibrant",
      description: "Creates visual vibrance and energy with three colors evenly spaced around the color wheel.",
      primary: primaryColor,
      secondary: triadicSecondary,
      accent: triadicAccent,
      text_color: ensureReadableTextColor(triadicSecondary, '#333333'),
      heading_color: '#333333',
      title_color: triadicTitleColor,
      footer_text_color: ensureReadableTextColorPreservingHue(footerBgColor, triadicTitleColor)
    });
    
    // Monochromatic palette (variations of the same color)
    const monoSecondary = lightenDarkenColor(primaryColor, 25);
    const monoAccent = lightenDarkenColor(primaryColor, -20);
    const monoTitleColor = primaryColor;
    palettes.push({
      name: "Elegant & Focused",
      description: "Creates a clean, cohesive look using different shades and tints of your primary color.",
      primary: primaryColor,
      secondary: monoSecondary,
      accent: monoAccent,
      text_color: ensureReadableTextColor(monoSecondary, '#333333'),
      heading_color: monoAccent,
      title_color: monoTitleColor,
      footer_text_color: ensureReadableTextColorPreservingHue(footerBgColor, monoTitleColor)
    });
    
    // Modern Neutral palette
    const neutralGray = hslToHex(h, Math.max(s - 60, 0), Math.min(l + 5, 100));
    const minimalTitleColor = primaryColor;
    palettes.push({
      name: "Modern & Minimalist",
      description: "Creates a clean, contemporary design with neutral tones complemented by your primary color as an accent.",
      primary: primaryColor,
      secondary: neutralGray,
      accent: hslToHex(h, Math.min(s + 10, 100), Math.max(l - 20, 0)),
      text_color: '#333333',
      heading_color: '#222222',
      title_color: minimalTitleColor,
      footer_text_color: ensureReadableTextColorPreservingHue(footerBgColor, minimalTitleColor)
    });
    
    setColorPalettes(palettes);
  };

  // Apply a selected palette to the form data
  const applyPalette = (palette, index) => {
    setFormData(prev => ({
      ...prev,
      primary_color: palette.primary,
      secondary_color: palette.secondary,
      accent_color: palette.accent,
      text_color: palette.text_color,
      heading_color: palette.heading_color,
      title_color: palette.title_color,
      footer_text_color: palette.footer_text_color
    }));
    
    // Update the selected palette index
    setSelectedPaletteIndex(index);
    
    // Flash notification - add a class to show a brief animation
    const paletteCard = document.querySelector(`#palette-card-${index}`);
    if (paletteCard) {
      paletteCard.classList.add('palette-applied-flash');
      setTimeout(() => {
        paletteCard.classList.remove('palette-applied-flash');
      }, 500);
    }
  };

  return (
    <DashboardLayout onSave={handleSubmit}>
      <Head>
        <title>Edit Content | Self Cast Studios</title>
      </Head>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Edit Your Site Content</h1>
        
        {project ? (
          <form onSubmit={handleSubmit}>
            {/* Important note about saving changes */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800">Important Note:</h3>
                <p className="text-blue-700">
                  Changes made here will not appear on your website until you click the <strong>Save Changes</strong> button. 
                  After saving, you can view your updated site using the <strong>View Site</strong> button.
                </p>
              </div>
            </div>
            {/* Success message */}
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                Changes saved successfully!
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            {/* Project info */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Project Information</h2>
              <p className="text-gray-700">
                <span className="font-medium">Name:</span> {project.name || project.projectId}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">ID:</span> {project.projectId}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Last Updated:</span> {new Date(project.updatedAt).toLocaleString()}
              </p>
            </div>
            
            {/* Content editor fields */}
            <div className="mb-6">
              {renderFields()}
            </div>
            
            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 mr-4"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCreateWebsite}
                disabled={creatingWebsite}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {creatingWebsite ? 'Creating...' : 'Update & View Site'}
              </button>
            </div>
            
            {/* Website creation success message */}
            {websiteCreated && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <p>Website updated successfully! The site will open in a new tab.</p>
              </div>
            )}
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No project selected or project not found.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
