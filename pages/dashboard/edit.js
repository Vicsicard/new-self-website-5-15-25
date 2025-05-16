import { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/dashboard/Layout';
import { AuthContext } from '../_app';

export default function EditContent() {
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState('basic');
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
  }, [user, router.query.id, authLoading]);

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
            
            {/* Profile Image URL */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="profile_image_url">
                Profile Image URL
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
              {formData.profile_image_url && (
                <div className="mt-2">
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
            
            {/* Text Color */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1" htmlFor="text_color">
                Text Color
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
                  <span className="text-xs font-bold">Text</span>
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
