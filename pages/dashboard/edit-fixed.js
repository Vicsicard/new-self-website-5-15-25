import { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/dashboard/Layout';
import { AuthContext } from '../_app';

export default function EditContent() {
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch project data
  useEffect(() => {
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
        
        // Fetch the specific project by ID
        const res = await fetch(`/api/projects/${projectId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const data = await res.json();
        console.log('Project data received:', data.project);
        setProject(data.project);
        
        // Convert content array to form data object for easier editing
        const initialFormData = {};
        if (data.project.content && Array.isArray(data.project.content)) {
          data.project.content.forEach(item => {
            if (item && item.key) {
              initialFormData[item.key] = item.value || '';
            }
          });
        }
        
        console.log('Initial form data:', initialFormData);
        setFormData(initialFormData);
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
  }, [user, router.query.id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      // Get project ID from URL query, current project, or user's assigned project
      const projectId = router.query.id || project?.projectId || user?.projectId;
      
      if (!projectId) {
        throw new Error('No project ID available');
      }
      
      console.log('Saving project with ID:', projectId);
      console.log('Form data to save:', formData);
      
      // Convert form data back to content array
      const content = Object.entries(formData)
        .filter(([key, value]) => key && key.trim() !== '') // Filter out empty keys
        .map(([key, value]) => ({ 
          key, 
          value: value || '' // Ensure value is never undefined
        }));
      
      console.log('Content array to save:', content);
      
      // Send update to API
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(`Failed to update project: ${errorData.message || res.statusText}`);
      }

      const responseData = await res.json();
      console.log('Save response:', responseData);
      
      setSaveSuccess(true);
      
      // Add a small delay to show success message
      setTimeout(() => {
        // If admin user, redirect back to dashboard after save
        if (user?.role === 'admin') {
          router.push('/dashboard');
        }
      }, 2000);
    } catch (err) {
      console.error('Error updating project:', err);
      setError(`Failed to save changes: ${err.message}`);
    } finally {
      setSaving(false);
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
    const sections = organizeFields();
    
    return Object.entries(sections).map(([sectionName, fields]) => (
      <div key={sectionName} className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{sectionName}</h3>
        <div className="grid grid-cols-1 gap-4">
          {fields.map(field => {
            // Format field label by converting snake_case to Title Case
            const formattedLabel = field
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            // Determine input type based on field name
            const isImageUrl = field.includes('image') || field.includes('url') || field.includes('banner');
            const isColor = field.includes('color');
            const isContentField = field.includes('content') || field.includes('post') || field.includes('bio') || field.includes('html');
            const isEmail = field.includes('email');
            const isPhone = field.includes('phone');
            
            // Skip empty fields or fields with no value
            if (!formData[field] && !isContentField && !isImageUrl && !isColor) {
              return null;
            }
            
            if (isContentField) {
              // Text area for content fields
              return (
                <div key={field} className="mb-4">
                  <label className="block font-medium text-gray-700 mb-1" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <textarea
                    id={field}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={field.includes('bio') || field.includes('post') ? 8 : 5}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {field.includes('html') ? 'HTML formatting is supported' : 'Plain text content'}
                  </p>
                </div>
              );
            } else if (isColor) {
              // Color picker for color fields
              return (
                <div key={field} className="mb-4">
                  <label className="block font-medium text-gray-700 mb-1" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      id={field}
                      name={field}
                      value={formData[field] || '#ffffff'}
                      onChange={handleChange}
                      className="h-8 w-8 rounded-md border border-gray-300 shadow-sm"
                    />
                    <input
                      type="text"
                      value={formData[field] || ''}
                      onChange={handleChange}
                      name={field}
                      className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#RRGGBB"
                    />
                  </div>
                </div>
              );
            } else if (isImageUrl) {
              // URL input for image fields with preview
              return (
                <div key={field} className="mb-4">
                  <label className="block font-medium text-gray-700 mb-1" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <input
                    type="text"
                    id={field}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData[field] && (
                    <div className="mt-2">
                      <img
                        src={formData[field]}
                        alt={`Preview for ${formattedLabel}`}
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
              );
            } else if (isEmail) {
              // Email input field
              return (
                <div key={field} className="mb-4">
                  <label className="block font-medium text-gray-700 mb-1" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <input
                    type="email"
                    id={field}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              );
            } else if (isPhone) {
              // Phone input field
              return (
                <div key={field} className="mb-4">
                  <label className="block font-medium text-gray-700 mb-1" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <input
                    type="tel"
                    id={field}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                    placeholder="(123) 456-7890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              );
            } else {
              // Default text input for other fields
              return (
                <div key={field} className="mb-4">
                  <label className="block font-medium text-gray-700 mb-1" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <input
                    type="text"
                    id={field}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              );
            }
          })}
        </div>
      </div>
    ));
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

  return (
    <DashboardLayout>
      <Head>
        <title>Edit Content | Self Cast Studios</title>
      </Head>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Edit Your Site Content</h1>
        
        {project ? (
          <form onSubmit={handleSubmit}>
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
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
