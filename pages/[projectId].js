import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { connectToDatabase } from '../lib/db';
import Project from '../models/Project';

export default function ClientSite({ projectData, notFound }) {
  const router = useRouter();
  
  // Handle case where project is not found
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <Head>
          <title>Site Not Found | Self Cast Studios</title>
        </Head>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Site Not Found</h1>
          <p className="text-xl text-gray-600 mb-6">
            The site you're looking for doesn't exist or may have been moved.
          </p>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // If the page is still loading
  if (router.isFallback) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Convert content array to object for easier template access
  const content = {};
  projectData.content.forEach(item => {
    content[item.key] = item.value;
  });

  // Get content values or use defaults
  const getContentValue = (key, defaultValue = '') => {
    return content[key] || defaultValue;
  };

  // Calculate current year for footer
  const currentYear = new Date().getFullYear();

  // Get style values or use defaults
  const primaryColor = getContentValue('primary_color', '#3b82f6');
  const accentColor = getContentValue('accent_color', '#10b981');
  const textColor = getContentValue('text_color', '#1f2937');
  const backgroundColor = getContentValue('background_color', '#ffffff');
  const fontFamily = getContentValue('font_family', 'Arial, sans-serif');

  // Generate CSS styles
  const styles = `
    body {
      font-family: ${fontFamily};
      color: ${textColor};
      background-color: ${backgroundColor};
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
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
    .social-media-section {
      padding: 2rem 0;
      background-color: ${accentColor}10;
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
    .social-platform {
      margin-bottom: 2rem;
    }
    footer {
      background-color: ${primaryColor};
      color: white;
      padding: 2rem 0;
      text-align: center;
    }
  `;

  // Generating the exact HTML structure from the PRD
  return (
    <>
      <Head>
        <title>{getContentValue('rendered_title', 'Personal Brand Site')}</title>
        <meta name="description" content={getContentValue('rendered_subtitle', 'Welcome to my site')} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </Head>

      <div>
        {/* Following the exact HTML structure from the PRD */}
        <body>
          {/* Header Section */}
          <header className="site-header">
            <div className="container">
              <div className="profile-section">
                <img 
                  src={getContentValue('profile_image_url', 'https://via.placeholder.com/150')} 
                  alt={getContentValue('client_name', 'Profile')} 
                  className="profile-image" 
                />
                <h1>{getContentValue('rendered_title', 'Personal Brand Site')}</h1>
                <p>{getContentValue('rendered_subtitle', 'Welcome to my site')}</p>
              </div>
            </div>
          </header>

          {/* Bio Section */}
          <section className="bio-section">
            <div className="container">
              <h2>About Me</h2>
              <div dangerouslySetInnerHTML={{ 
                __html: getContentValue('rendered_bio_html', '<p>Bio content will appear here</p>') 
              }}></div>
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
                      src={getContentValue('facebook_image_1_url', 'https://via.placeholder.com/300x200')} 
                      alt="Facebook post" 
                      className="social-post-image"
                    />
                    <h4>{getContentValue('facebook_title_1', 'Facebook Post Title')}</h4>
                    <p>{getContentValue('facebook_content_1', 'Facebook post content will appear here.')}</p>
                  </div>
                  {/* Facebook Post 2 */}
                  <div className="social-post facebook-post">
                    <img 
                      src={getContentValue('facebook_image_2_url', 'https://via.placeholder.com/300x200')} 
                      alt="Facebook post" 
                      className="social-post-image"
                    />
                    <h4>{getContentValue('facebook_title_2', 'Facebook Post Title')}</h4>
                    <p>{getContentValue('facebook_content_2', 'Facebook post content will appear here.')}</p>
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
                      src={getContentValue('twitter_image_1_url', 'https://via.placeholder.com/300x200')} 
                      alt="Twitter post" 
                      className="social-post-image"
                    />
                    <h4>{getContentValue('twitter_title_1', 'Twitter Post Title')}</h4>
                    <p>{getContentValue('twitter_content_1', 'Twitter post content will appear here.')}</p>
                  </div>
                  {/* Twitter Post 2 */}
                  <div className="social-post twitter-post">
                    <img 
                      src={getContentValue('twitter_image_2_url', 'https://via.placeholder.com/300x200')} 
                      alt="Twitter post" 
                      className="social-post-image"
                    />
                    <h4>{getContentValue('twitter_title_2', 'Twitter Post Title')}</h4>
                    <p>{getContentValue('twitter_content_2', 'Twitter post content will appear here.')}</p>
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
                      src={getContentValue('instagram_image_1_url', 'https://via.placeholder.com/300x200')} 
                      alt="Instagram post" 
                      className="social-post-image"
                    />
                    <h4>{getContentValue('instagram_title_1', 'Instagram Post Title')}</h4>
                    <p>{getContentValue('instagram_content_1', 'Instagram post content will appear here.')}</p>
                  </div>
                  {/* Instagram Post 2 */}
                  <div className="social-post instagram-post">
                    <img 
                      src={getContentValue('instagram_image_2_url', 'https://via.placeholder.com/300x200')} 
                      alt="Instagram post" 
                      className="social-post-image"
                    />
                    <h4>{getContentValue('instagram_title_2', 'Instagram Post Title')}</h4>
                    <p>{getContentValue('instagram_content_2', 'Instagram post content will appear here.')}</p>
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
                      src={getContentValue('linkedin_image_1_url', 'https://via.placeholder.com/300x200')} 
                      alt="LinkedIn post" 
                      className="social-post-image"
                    />
                    <h4>{getContentValue('linkedin_title_1', 'LinkedIn Post Title')}</h4>
                    <p>{getContentValue('linkedin_content_1', 'LinkedIn post content will appear here.')}</p>
                  </div>
                  {/* LinkedIn Post 2 */}
                  <div className="social-post linkedin-post">
                    <img 
                      src={getContentValue('linkedin_image_2_url', 'https://via.placeholder.com/300x200')} 
                      alt="LinkedIn post" 
                      className="social-post-image"
                    />
                    <h4>{getContentValue('linkedin_title_2', 'LinkedIn Post Title')}</h4>
                    <p>{getContentValue('linkedin_content_2', 'LinkedIn post content will appear here.')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Footer Section */}
          <footer>
            <div className="container">
              <p>{getContentValue('rendered_footer_slogan', 'Thanks for visiting')}</p>
              <p>© {currentYear} {getContentValue('client_name', 'Client Name')}</p>
              {getContentValue('client_website') && (
                <p>
                  <a 
                    href={getContentValue('client_website').startsWith('http')
                      ? getContentValue('client_website')
                      : `https://${getContentValue('client_website')}`
                    }
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white"
                  >
                    {getContentValue('client_website')}
                  </a>
                </p>
              )}
              <p>Powered by Self Cast Studios</p>
            </div>
          </footer>
        </body>
      </div>
    </>
  );
}

// This gets called at build time to pre-render the page
export async function getStaticProps({ params }) {
  const { projectId } = params;
  
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find project data
    const project = await Project.findByProjectId(db, projectId);
    
    // If project doesn't exist, return 404
    if (!project) {
      return {
        props: {
          notFound: true
        },
        revalidate: 60, // In seconds
      };
    }
    
    // Return the project data
    return {
      props: {
        projectData: JSON.parse(JSON.stringify(project)), // Serialize project
        notFound: false
      },
      revalidate: 60, // In seconds - revalidate every minute
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return {
      props: {
        notFound: true
      },
      revalidate: 60,
    };
  }
}

// This function gets called at build time
export async function getStaticPaths() {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Get all projects
    const projects = await Project.listAll(db);
    
    // Get the paths we want to pre-render based on projects
    const paths = projects.map((project) => ({
      params: { projectId: project.projectId },
    }));
    
    // We'll pre-render only these paths at build time.
    // { fallback: true } means other routes will be rendered at runtime
    return { paths, fallback: true };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return { paths: [], fallback: true };
  }
}
