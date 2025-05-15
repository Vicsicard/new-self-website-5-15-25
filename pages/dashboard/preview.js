import { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/dashboard/Layout';
import { AuthContext } from '../_app';

export default function PreviewSite() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Convert content array to object for easier template rendering
  const getContentValue = (key) => {
    if (!project || !project.content) return '';
    
    const contentItem = project.content.find(item => item.key === key);
    return contentItem ? contentItem.value : '';
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
  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  // If no project is found
  if (!project) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No project has been assigned to your account yet. Please contact support.
        </div>
      </DashboardLayout>
    );
  }

  // Calculate current year for footer
  const currentYear = new Date().getFullYear();

  // Get content values or use defaults
  const title = getContentValue('rendered_title') || 'Personal Brand Site';
  const subtitle = getContentValue('rendered_subtitle') || 'Welcome to my site';
  const bioHtml = getContentValue('rendered_bio_html') || '<p>Bio content will appear here</p>';
  const clientName = getContentValue('client_name') || 'Client Name';
  const clientWebsite = getContentValue('client_website') || '#';
  const footerSlogan = getContentValue('rendered_footer_slogan') || 'Thanks for visiting';
  const profileImageUrl = getContentValue('profile_image_url') || 'https://via.placeholder.com/150';
  
  // Get design values with defaults
  const primaryColor = getContentValue('primary_color') || '#3b82f6';
  const accentColor = getContentValue('accent_color') || '#10b981';
  const textColor = getContentValue('text_color') || '#1f2937';
  const backgroundColor = getContentValue('background_color') || '#ffffff';
  const fontFamily = getContentValue('font_family') || 'Arial, sans-serif';
  const bannerImageUrl = getContentValue('banner_image_1_url') || 'https://via.placeholder.com/1200x300';

  return (
    <DashboardLayout>
      <Head>
        <title>Preview Site | Self Cast Studios</title>
      </Head>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Preview Your Website</h1>
        <p className="mb-4 text-gray-600">
          This is how your website will look when published. Any changes you make in the editor will be reflected here after saving.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/dashboard/edit')}
            className="btn btn-primary"
          >
            Edit Content
          </button>
          <a
            href={`https://selfcaststudios.com/${project.projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            View Live Site
          </a>
        </div>
      </div>

      {/* Site Preview Frame */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-2 flex items-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-4 bg-white rounded px-3 py-1 text-sm text-gray-700 flex-grow text-center">
            selfcaststudios.com/{project.projectId}
          </div>
        </div>
                {/* Preview Content with exact HTML structure from PRD */}
        <div className="preview-container" style={{
          fontFamily,
          color: textColor,
          backgroundColor,
          minHeight: '500px',
          overflowY: 'auto',
          maxHeight: '800px'
        }}>
          <style jsx>{`
            .site-header {
              background-color: ${primaryColor};
              color: white;
              padding: 2rem 0;
            }
            .profile-section {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
            .profile-image {
              width: 150px;
              height: 150px;
              border-radius: 50%;
              object-fit: cover;
              border: 4px solid white;
            }
            .bio-section {
              padding: 2rem 0;
            }
            .social-media-section {
              padding: 2rem 0;
              background-color: ${accentColor}10;
            }
            .social-platform {
              margin-bottom: 2rem;
            }
            .social-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 1rem;
              margin-top: 1rem;
            }
            .social-post {
              background: white;
              border: 1px solid #eee;
              border-radius: 0.5rem;
              padding: 1rem;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .social-post-image {
              width: 100%;
              height: auto;
              border-radius: 0.25rem;
              margin-bottom: 0.5rem;
            }
            footer {
              background-color: ${primaryColor};
              color: white;
              padding: 2rem 0;
              text-align: center;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 1rem;
            }
            h2 {
              color: ${primaryColor};
              border-bottom: 2px solid ${accentColor};
              padding-bottom: 0.5rem;
              margin-bottom: 1.5rem;
            }
            h3 {
              color: ${primaryColor};
              margin: 1.5rem 0 1rem;
            }
          `}</style>

          <body>
            {/* Header Section */}
            <header className="site-header">
              <div className="container">
                <div className="profile-section">
                  <img src={profileImageUrl} alt={clientName} className="profile-image" />
                  <h1>{title}</h1>
                  <p>{subtitle}</p>
                </div>
              </div>
            </header>

            {/* Bio Section */}
            <section className="bio-section">
              <div className="container">
                <h2>About Me</h2>
                <div dangerouslySetInnerHTML={{ __html: bioHtml }}></div>
              </div>
            </section>

            {/* Social Media Section */}
            <section className="social-media-section">
              <div className="container">
                <h2>Social Media</h2>
                
                {/* Facebook Posts */}
                <div className="social-platform facebook-section">
                  <h3>Facebook</h3>
                  <div className="social-grid">
                    {/* Facebook Post 1 */}
                    <div className="social-post facebook-post">
                      <img 
                        src={getContentValue('facebook_image_1_url') || 'https://via.placeholder.com/300x200'} 
                        alt="Facebook post" 
                        className="social-post-image"
                      />
                      <h4>{getContentValue('facebook_title_1') || 'Facebook Post Title'}</h4>
                      <p>{getContentValue('facebook_content_1') || 'Facebook post content will appear here.'}</p>
                    </div>
                    {/* Facebook Post 2 */}
                    <div className="social-post facebook-post">
                      <img 
                        src={getContentValue('facebook_image_2_url') || 'https://via.placeholder.com/300x200'} 
                        alt="Facebook post" 
                        className="social-post-image"
                      />
                      <h4>{getContentValue('facebook_title_2') || 'Facebook Post Title'}</h4>
                      <p>{getContentValue('facebook_content_2') || 'Facebook post content will appear here.'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Twitter Posts */}
                <div className="social-platform twitter-section">
                  <h3>Twitter</h3>
                  <div className="social-grid">
                    {/* Twitter Post 1 */}
                    <div className="social-post twitter-post">
                      <img 
                        src={getContentValue('twitter_image_1_url') || 'https://via.placeholder.com/300x200'} 
                        alt="Twitter post" 
                        className="social-post-image"
                      />
                      <h4>{getContentValue('twitter_title_1') || 'Twitter Post Title'}</h4>
                      <p>{getContentValue('twitter_content_1') || 'Twitter post content will appear here.'}</p>
                    </div>
                    {/* Twitter Post 2 */}
                    <div className="social-post twitter-post">
                      <img 
                        src={getContentValue('twitter_image_2_url') || 'https://via.placeholder.com/300x200'} 
                        alt="Twitter post" 
                        className="social-post-image"
                      />
                      <h4>{getContentValue('twitter_title_2') || 'Twitter Post Title'}</h4>
                      <p>{getContentValue('twitter_content_2') || 'Twitter post content will appear here.'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Instagram Posts */}
                <div className="social-platform instagram-section">
                  <h3>Instagram</h3>
                  <div className="social-grid">
                    {/* Instagram Post 1 */}
                    <div className="social-post instagram-post">
                      <img 
                        src={getContentValue('instagram_image_1_url') || 'https://via.placeholder.com/300x200'} 
                        alt="Instagram post" 
                        className="social-post-image"
                      />
                      <h4>{getContentValue('instagram_title_1') || 'Instagram Post Title'}</h4>
                      <p>{getContentValue('instagram_content_1') || 'Instagram post content will appear here.'}</p>
                    </div>
                    {/* Instagram Post 2 */}
                    <div className="social-post instagram-post">
                      <img 
                        src={getContentValue('instagram_image_2_url') || 'https://via.placeholder.com/300x200'} 
                        alt="Instagram post" 
                        className="social-post-image"
                      />
                      <h4>{getContentValue('instagram_title_2') || 'Instagram Post Title'}</h4>
                      <p>{getContentValue('instagram_content_2') || 'Instagram post content will appear here.'}</p>
                    </div>
                  </div>
                </div>
                
                {/* LinkedIn Posts */}
                <div className="social-platform linkedin-section">
                  <h3>LinkedIn</h3>
                  <div className="social-grid">
                    {/* LinkedIn Post 1 */}
                    <div className="social-post linkedin-post">
                      <img 
                        src={getContentValue('linkedin_image_1_url') || 'https://via.placeholder.com/300x200'} 
                        alt="LinkedIn post" 
                        className="social-post-image"
                      />
                      <h4>{getContentValue('linkedin_title_1') || 'LinkedIn Post Title'}</h4>
                      <p>{getContentValue('linkedin_content_1') || 'LinkedIn post content will appear here.'}</p>
                    </div>
                    {/* LinkedIn Post 2 */}
                    <div className="social-post linkedin-post">
                      <img 
                        src={getContentValue('linkedin_image_2_url') || 'https://via.placeholder.com/300x200'} 
                        alt="LinkedIn post" 
                        className="social-post-image"
                      />
                      <h4>{getContentValue('linkedin_title_2') || 'LinkedIn Post Title'}</h4>
                      <p>{getContentValue('linkedin_content_2') || 'LinkedIn post content will appear here.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Section */}
            <footer>
              <div className="container">
                <p>{footerSlogan}</p>
                <p>© {currentYear} {clientName}</p>
                {clientWebsite && (
                  <p>
                    <a 
                      href={clientWebsite.startsWith('http') ? clientWebsite : `https://${clientWebsite}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white"
                    >
                      {clientWebsite}
                    </a>
                  </p>
                )}
                <p>Powered by Self Cast Studios</p>
              </div>
            </footer>
          </body>
        </div>
      </div>
    </DashboardLayout>
  );
}
