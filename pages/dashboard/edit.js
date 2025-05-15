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
      if (!user?.projectId) return;
      
      try {
        const res = await fetch('/api/projects');
        
        if (!res.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const data = await res.json();
        setProject(data.project);
        
        // Convert content array to form data object for easier editing
        const initialFormData = {};
        data.project.content.forEach(item => {
          initialFormData[item.key] = item.value;
        });
        
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
  }, [user]);

  // Handle input changes
  const handleInputChange = (e) => {
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
      // Convert form data back to content array
      const contentArray = Object.keys(formData).map(key => ({
        key,
        value: formData[key]
      }));

      // Send update to API
      const res = await fetch(`/api/projects/${user.projectId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: contentArray }),
      });

      if (!res.ok) {
        throw new Error('Failed to save content');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Group content fields by section
  const renderContentFields = () => {
    // Define content sections based on PRD
    const sections = {
      'Basic Site Content': [
        'rendered_title', 'rendered_subtitle', 'rendered_bio_html', 
        'client_name', 'client_website', 'rendered_footer_slogan', 'profile_image_url'
      ],
      'Design Elements': [
        'primary_color', 'accent_color', 'text_color', 'background_color', 
        'font_family', 'banner_image_1_url'
      ],
      'Social Media Content': [
        // Facebook posts
        'facebook_title_1', 'facebook_content_1', 'facebook_image_1_url',
        'facebook_title_2', 'facebook_content_2', 'facebook_image_2_url',
        // Instagram posts
        'instagram_title_1', 'instagram_content_1', 'instagram_image_1_url',
        'instagram_title_2', 'instagram_content_2', 'instagram_image_2_url',
        // Twitter posts
        'twitter_title_1', 'twitter_content_1', 'twitter_image_1_url',
        'twitter_title_2', 'twitter_content_2', 'twitter_image_2_url',
        // LinkedIn posts
        'linkedin_title_1', 'linkedin_content_1', 'linkedin_image_1_url',
        'linkedin_title_2', 'linkedin_content_2', 'linkedin_image_2_url'
      ]
    };

    // Generate input fields for each section
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
            const isImageUrl = field.includes('image_url');
            const isColor = field.includes('color');
            const isContentField = field.includes('content_');
            
            if (isContentField) {
              // Text area for content fields
              return (
                <div key={field} className="mb-4">
                  <label className="form-label" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <textarea
                    id={field}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="form-input"
                  />
                </div>
              );
            } else if (isColor) {
              // Color picker for color fields
              return (
                <div key={field} className="mb-4">
                  <label className="form-label" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <div className="flex items-center">
                    <input
                      id={field}
                      name={field}
                      type="color"
                      value={formData[field] || '#000000'}
                      onChange={handleInputChange}
                      className="h-10 w-10 mr-2"
                    />
                    <input
                      type="text"
                      value={formData[field] || ''}
                      onChange={handleInputChange}
                      name={field}
                      className="form-input"
                    />
                  </div>
                </div>
              );
            } else {
              // Regular text input for other fields
              return (
                <div key={field} className="mb-4">
                  <label className="form-label" htmlFor={field}>
                    {formattedLabel}
                  </label>
                  <input
                    id={field}
                    name={field}
                    type="text"
                    value={formData[field] || ''}
                    onChange={handleInputChange}
                    className="form-input"
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
            
            {/* Content editor fields */}
            {renderContentFields()}
            
            {/* Save button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className={`btn btn-primary ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            No project has been assigned to your account yet. Please contact support.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
