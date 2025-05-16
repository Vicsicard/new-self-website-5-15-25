import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { connectToDatabase } from '../lib/db';
import Project from '../models/Project';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaQuoteLeft } from 'react-icons/fa';

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
    :root {
      --primary-color: ${primaryColor};
      --secondary-color: ${getContentValue('secondary_color', '#4b5563')};
      --accent-color: ${accentColor};
      --text-color: ${textColor};
      --background-color: ${backgroundColor};
      --card-bg: #ffffff;
      --transition-speed: 0.3s;
    }
    body {
      font-family: ${fontFamily};
      color: var(--text-color);
      background-color: var(--background-color);
      margin: 0;
      padding: 0;
      line-height: 1.6;
      overflow-x: hidden;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      width: 100%;
      box-sizing: border-box;
    }
    section {
      padding: 4rem 0;
      position: relative;
      overflow: hidden;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0;
      line-height: 1.2;
      color: var(--primary-color);
      font-weight: 700;
    }
    h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      margin-bottom: 1rem;
    }
    h2 {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      margin-bottom: 2rem;
      text-align: center;
      position: relative;
      padding-bottom: 1rem;
    }
    h2:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 3px;
      background-color: var(--accent-color);
    }
    h3 {
      font-size: clamp(1.25rem, 3vw, 1.75rem);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    h4 {
      font-size: clamp(1rem, 2vw, 1.25rem);
      margin-bottom: 0.75rem;
    }
    p {
      margin-bottom: 1.5rem;
      font-size: clamp(1rem, 1.5vw, 1.125rem);
    }
    a {
      color: var(--accent-color);
      text-decoration: none;
      transition: all var(--transition-speed) ease;
    }
    a:hover {
      color: var(--primary-color);
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    /* Header Styles */
    .site-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: 0;
      position: relative;
      overflow: hidden;
    }
    .header-content {
      padding: 6rem 0;
      position: relative;
      z-index: 2;
    }
    .header-bg-pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.1;
      background-image: radial-gradient(circle at 25px 25px, white 2%, transparent 0%), 
                       radial-gradient(circle at 75px 75px, white 2%, transparent 0%);
      background-size: 100px 100px;
      z-index: 1;
    }
    .profile-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 3;
    }
    .profile-image-container {
      width: 180px;
      height: 180px;
      position: relative;
      margin-bottom: 2rem;
      border-radius: 50%;
      padding: 5px;
      background: linear-gradient(45deg, var(--accent-color), white);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
      animation: pulse 3s infinite;
    }
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(var(--accent-color), 0.7);
      }
      70% {
        box-shadow: 0 0 0 15px rgba(var(--accent-color), 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(var(--accent-color), 0);
      }
    }
    .profile-image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid white;
    }
    .header-title {
      margin-bottom: 0.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .header-subtitle {
      font-size: clamp(1.1rem, 2vw, 1.5rem);
      opacity: 0.9;
      max-width: 800px;
      margin: 0 auto 2rem;
    }
    
    /* Section Styles */
    .section-title {
      text-align: center;
      margin-bottom: 3rem;
    }
    .section-subtitle {
      text-align: center;
      color: var(--secondary-color);
      max-width: 700px;
      margin: -2rem auto 3rem;
      font-size: 1.1rem;
    }
    
    /* Bio Section */
    .bio-section {
      background-color: var(--background-color);
      padding: 5rem 0;
    }
    .bio-content {
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.8;
    }
    
    /* Blog Section */
    .blog-section {
      background-color: var(--secondary-color)10;
      position: relative;
    }
    .blog-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, auto);
      gap: 2rem;
    }
    .blog-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      transition: transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
    }
    .blog-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .blog-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .blog-content {
      padding: 1.5rem;
    }
    .blog-excerpt {
      color: var(--secondary-color);
      margin-bottom: 1rem;
      font-size: 0.95rem;
      line-height: 1.7;
    }
    .blog-link {
      display: inline-block;
      margin-top: 0.5rem;
      font-weight: 600;
      color: var(--accent-color);
    }
    .blog-link:hover {
      color: var(--primary-color);
    }
    
    /* Quote Section */
    .quotes-section {
      background: linear-gradient(135deg, var(--primary-color)05, var(--accent-color)08);
      padding: 5rem 0;
    }
    .quotes-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: auto;
      gap: 2rem;
    }
    
    /* Bio Cards Section */
    .bio-cards-section {
      background-color: var(--secondary-color)05;
      padding: 3rem 0;
    }
    .bio-cards-row {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      gap: 1.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    .bio-card {
      flex: 1;
      min-width: 250px;
      background: var(--card-bg);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      transition: transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .bio-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .bio-card-text {
      font-size: 1.1rem;
      line-height: 1.7;
      margin: 0;
      text-align: center;
    }
    .quote-card {
      background: var(--card-bg);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      position: relative;
      transition: transform var(--transition-speed) ease;
    }
    .quote-card:hover {
      transform: translateY(-5px);
    }
    .quote-icon {
      color: var(--accent-color)15;
      font-size: 3rem;
      position: absolute;
      top: 1rem;
      left: 1rem;
      opacity: 0.7;
    }
    .quote-text {
      position: relative;
      z-index: 1;
      font-style: italic;
      line-height: 1.8;
      margin-bottom: 1rem;
    }
    .quote-author {
      text-align: right;
      font-weight: 600;
      color: var(--primary-color);
    }
    
    /* Social Media Section */
    .social-media-section {
      padding: 4rem 0;
      background-color: var(--background-color);
    }
    .platform-container {
      margin-bottom: 4rem;
    }
    .platform-header {
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
    }
    .platform-icon {
      font-size: 1.5rem;
      margin-right: 0.5rem;
      color: var(--primary-color);
    }
    .platform-title {
      margin: 0;
    }
    .platform-url {
      margin-left: auto;
      font-size: 0.9rem;
    }
    .social-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, auto);
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    .social-post {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      transition: transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
    }
    .social-post:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .social-post-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .social-post-content {
      padding: 1.5rem;
    }
    .social-post-title {
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--primary-color);
    }
    .social-post-text {
      color: var(--text-color);
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .social-platform {
      margin-bottom: 4rem;
    }
    .platform-link {
      display: inline-flex;
      align-items: center;
      color: var(--accent-color);
      font-weight: 500;
      transition: all var(--transition-speed) ease;
    }
    .platform-link:hover {
      color: var(--primary-color);
      transform: translateX(5px);
    }
    /* Footer Styles */
    footer {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: 4rem 0 2rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .footer-content {
      position: relative;
      z-index: 2;
    }
    .footer-message {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }
    .footer-email {
      display: inline-block;
      margin-bottom: 2rem;
      padding: 0.75rem 1.5rem;
      background-color: rgba(255,255,255,0.2);
      border-radius: 50px;
      color: white;
      text-decoration: none;
      transition: all var(--transition-speed) ease;
    }
    .footer-email:hover {
      background-color: rgba(255,255,255,0.3);
      transform: translateY(-3px);
      color: white;
    }
    .footer-copyright {
      opacity: 0.8;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
    .powered-by {
      font-size: 0.85rem;
      opacity: 0.7;
      margin-top: 1rem;
    }
    
    /* Loading animations */
    .lazy-load {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .lazy-load.loaded {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }
      .header-content {
        padding: 4rem 0;
      }
      .profile-image-container {
        width: 150px;
        height: 150px;
      }
      .blog-grid, .quotes-grid, .social-grid {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
      }
      .bio-cards-row {
        flex-direction: column;
        align-items: center;
      }
      .bio-card {
        width: 100%;
        margin-bottom: 1rem;
      }
      .platform-container {
        margin-bottom: 3rem;
      }
      .platform-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .platform-url {
        margin-left: 0;
        margin-top: 0.5rem;
      }
    }
  `;

  // Load JS for lazy loading images
  useEffect(() => {
    const lazyLoadElements = document.querySelectorAll('.lazy-load');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('loaded');
          observer.unobserve(entry.target);
        }
      });
    });
    
    lazyLoadElements.forEach(el => {
      observer.observe(el);
    });
    
    return () => {
      lazyLoadElements.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <>
      <Head>
        <title>{getContentValue('rendered_title', 'Personal Brand Site')}</title>
        <meta name="description" content={getContentValue('rendered_subtitle', 'Welcome to my site')} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </Head>

      <div className="site-wrapper">
          {/* Header Section - Enhanced modern design */}
          <header className="site-header">
            <div className="header-bg-pattern" aria-hidden="true"></div>
            <div className="container">
              <div className="header-content">
                <div className="profile-section lazy-load">
                  <div className="profile-image-container">
                    <img 
                      src={getContentValue('profile_image_url', 'https://via.placeholder.com/150')} 
                      alt={getContentValue('client_name', 'Profile')} 
                      className="profile-image" 
                      loading="lazy"
                    />
                  </div>
                  <h1 className="header-title">{getContentValue('rendered_title', 'Personal Brand Site')}</h1>
                  <p className="header-subtitle">{getContentValue('rendered_subtitle', 'Welcome to my site')}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Bio Section - Enhanced with modern styling */}
          <section className="bio-section" id="about">
            <div className="container">
              <h2 className="section-title">About Me</h2>
              <div className="bio-content lazy-load" dangerouslySetInnerHTML={{ 
                __html: getContentValue('rendered_bio_html', '<p>Bio content will appear here</p>') 
              }} aria-label="Biography content"></div>
            </div>
          </section>

          {/* Bio Cards Section - New section for the 3 bio cards */}
          <section className="bio-cards-section" id="bio-cards">
            <div className="container">
              <div className="bio-cards-row">
                {/* Bio Card 1 */}
                {getContentValue('bio_card_1') && (
                  <div className="quote-card bio-card lazy-load">
                    <div className="bio-card-content">
                      <p className="bio-card-text">{getContentValue('bio_card_1', 'Your first bio card will appear here.')}</p>
                    </div>
                  </div>
                )}
                
                {/* Bio Card 2 */}
                {getContentValue('bio_card_2') && (
                  <div className="quote-card bio-card lazy-load">
                    <div className="bio-card-content">
                      <p className="bio-card-text">{getContentValue('bio_card_2', 'Your second bio card will appear here.')}</p>
                    </div>
                  </div>
                )}
                
                {/* Bio Card 3 */}
                {getContentValue('bio_card_3') && (
                  <div className="quote-card bio-card lazy-load">
                    <div className="bio-card-content">
                      <p className="bio-card-text">{getContentValue('bio_card_3', 'Your third bio card will appear here.')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          
          {/* Blog Posts Section - New section for all 4 blog posts */}
          <section className="blog-section" id="blog">
            <div className="container">
              <h2 className="section-title">Blog Posts</h2>
              <div className="blog-grid">
                {/* Blog Post 1 */}
                {getContentValue('blog_1_title') && (
                  <article className="blog-card lazy-load">
                    <img 
                      src={getContentValue('blog_1_image_url', 'https://via.placeholder.com/600x400?text=Blog+Post+1')} 
                      alt={getContentValue('blog_1_title', 'Blog Post')} 
                      className="blog-image" 
                      loading="lazy"
                    />
                    <div className="blog-content">
                      <h3>{getContentValue('blog_1_title', 'Blog Post Title')}</h3>
                      <p className="blog-excerpt">{getContentValue('blog_1_excerpt', 'A short excerpt of this blog post...')}</p>
                      <div dangerouslySetInnerHTML={{ 
                        __html: getContentValue('blog_1', '<p>Blog content will appear here</p>').substring(0, 150) + '...' 
                      }}></div>
                      <a href="#" className="blog-link" aria-label={`Read more about ${getContentValue('blog_1_title', 'Blog Post')}`}>Read More</a>
                    </div>
                  </article>
                )}
                
                {/* Blog Post 2 */}
                {getContentValue('blog_2_title') && (
                  <article className="blog-card lazy-load">
                    <img 
                      src={getContentValue('blog_2_image_url', 'https://via.placeholder.com/600x400?text=Blog+Post+2')} 
                      alt={getContentValue('blog_2_title', 'Blog Post')} 
                      className="blog-image" 
                      loading="lazy"
                    />
                    <div className="blog-content">
                      <h3>{getContentValue('blog_2_title', 'Blog Post Title')}</h3>
                      <p className="blog-excerpt">{getContentValue('blog_2_excerpt', 'A short excerpt of this blog post...')}</p>
                      <div dangerouslySetInnerHTML={{ 
                        __html: getContentValue('blog_2', '<p>Blog content will appear here</p>').substring(0, 150) + '...' 
                      }}></div>
                      <a href="#" className="blog-link" aria-label={`Read more about ${getContentValue('blog_2_title', 'Blog Post')}`}>Read More</a>
                    </div>
                  </article>
                )}
                
                {/* Blog Post 3 */}
                {getContentValue('blog_3_title') && (
                  <article className="blog-card lazy-load">
                    <img 
                      src={getContentValue('blog_3_image_url', 'https://via.placeholder.com/600x400?text=Blog+Post+3')} 
                      alt={getContentValue('blog_3_title', 'Blog Post')} 
                      className="blog-image" 
                      loading="lazy"
                    />
                    <div className="blog-content">
                      <h3>{getContentValue('blog_3_title', 'Blog Post Title')}</h3>
                      <p className="blog-excerpt">{getContentValue('blog_3_excerpt', 'A short excerpt of this blog post...')}</p>
                      <div dangerouslySetInnerHTML={{ 
                        __html: getContentValue('blog_3', '<p>Blog content will appear here</p>').substring(0, 150) + '...' 
                      }}></div>
                      <a href="#" className="blog-link" aria-label={`Read more about ${getContentValue('blog_3_title', 'Blog Post')}`}>Read More</a>
                    </div>
                  </article>
                )}
                
                {/* Blog Post 4 */}
                {getContentValue('blog_4_title') && (
                  <article className="blog-card lazy-load">
                    <img 
                      src={getContentValue('blog_4_image_url', 'https://via.placeholder.com/600x400?text=Blog+Post+4')} 
                      alt={getContentValue('blog_4_title', 'Blog Post')} 
                      className="blog-image" 
                      loading="lazy"
                    />
                    <div className="blog-content">
                      <h3>{getContentValue('blog_4_title', 'Blog Post Title')}</h3>
                      <p className="blog-excerpt">{getContentValue('blog_4_excerpt', 'A short excerpt of this blog post...')}</p>
                      <div dangerouslySetInnerHTML={{ 
                        __html: getContentValue('blog_4', '<p>Blog content will appear here</p>').substring(0, 150) + '...' 
                      }}></div>
                      <a href="#" className="blog-link" aria-label={`Read more about ${getContentValue('blog_4_title', 'Blog Post')}`}>Read More</a>
                    </div>
                  </article>
                )}
              </div>
            </div>
          </section>
          
          {/* Quote 1 Section */}
          <section className="quotes-section" id="quotes">
            <div className="container">
              <h2 className="section-title">Inspiring Quote</h2>
              <div className="quotes-grid">
                {/* Quote 1 */}
                {getContentValue('quote_1') && (
                  <div className="quote-card lazy-load">
                    <FaQuoteLeft className="quote-icon" aria-hidden="true" />
                    <p className="quote-text">{getContentValue('quote_1', 'Your first inspirational quote will appear here.')}</p>
                    <p className="quote-author">{getContentValue('quote_1_author', 'Author')}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Social Media Section - Enhanced with all 4 posts per platform */}
          <section className="social-media-section" id="social">
            <div className="container">
              <h2 className="section-title">Social Media</h2>
              
              {/* Facebook Posts */}
              <div className="platform-container">
                <div className="platform-header">
                  <FaFacebook className="platform-icon" aria-hidden="true" />
                  <h3 className="platform-title">Facebook</h3>
                  {getContentValue('facebook_profile_url') && (
                    <a
                      href={getContentValue('facebook_profile_url')}
                      className="platform-url"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Visit Facebook profile"
                    >
                      Visit Profile
                    </a>
                  )}
                </div>
                
                <div className="social-grid">
                  {/* Facebook Post 1 */}
                  {getContentValue('facebook_title_1') && (
                    <div className="social-post facebook-post lazy-load">
                      <img 
                        src={getContentValue('facebook_image_1_url', 'https://via.placeholder.com/600x400?text=Facebook+Post+1')} 
                        alt="Facebook post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('facebook_title_1', 'Facebook Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('facebook_content_1', 'Facebook post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Facebook Post 2 */}
                  {getContentValue('facebook_title_2') && (
                    <div className="social-post facebook-post lazy-load">
                      <img 
                        src={getContentValue('facebook_image_2_url', 'https://via.placeholder.com/600x400?text=Facebook+Post+2')} 
                        alt="Facebook post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('facebook_title_2', 'Facebook Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('facebook_content_2', 'Facebook post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Facebook Post 3 */}
                  {getContentValue('facebook_title_3') && (
                    <div className="social-post facebook-post lazy-load">
                      <img 
                        src={getContentValue('facebook_image_3_url', 'https://via.placeholder.com/600x400?text=Facebook+Post+3')} 
                        alt="Facebook post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('facebook_title_3', 'Facebook Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('facebook_content_3', 'Facebook post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Facebook Post 4 */}
                  {getContentValue('facebook_title_4') && (
                    <div className="social-post facebook-post lazy-load">
                      <img 
                        src={getContentValue('facebook_image_4_url', 'https://via.placeholder.com/600x400?text=Facebook+Post+4')} 
                        alt="Facebook post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('facebook_title_4', 'Facebook Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('facebook_content_4', 'Facebook post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Twitter Posts */}
              <div className="platform-container">
                <div className="platform-header">
                  <FaTwitter className="platform-icon" aria-hidden="true" />
                  <h3 className="platform-title">Twitter</h3>
                  {getContentValue('twitter_profile_url') && (
                    <a
                      href={getContentValue('twitter_profile_url')}
                      className="platform-url"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Visit Twitter profile"
                    >
                      Visit Profile
                    </a>
                  )}
                </div>
                
                <div className="social-grid">
                  {/* Twitter Post 1 */}
                  {getContentValue('twitter_title_1') && (
                    <div className="social-post twitter-post lazy-load">
                      <img 
                        src={getContentValue('twitter_image_1_url', 'https://via.placeholder.com/600x400?text=Twitter+Post+1')} 
                        alt="Twitter post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('twitter_title_1', 'Twitter Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('twitter_content_1', 'Twitter post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Twitter Post 2 */}
                  {getContentValue('twitter_title_2') && (
                    <div className="social-post twitter-post lazy-load">
                      <img 
                        src={getContentValue('twitter_image_2_url', 'https://via.placeholder.com/600x400?text=Twitter+Post+2')} 
                        alt="Twitter post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('twitter_title_2', 'Twitter Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('twitter_content_2', 'Twitter post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Twitter Post 3 */}
                  {getContentValue('twitter_title_3') && (
                    <div className="social-post twitter-post lazy-load">
                      <img 
                        src={getContentValue('twitter_image_3_url', 'https://via.placeholder.com/600x400?text=Twitter+Post+3')} 
                        alt="Twitter post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('twitter_title_3', 'Twitter Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('twitter_content_3', 'Twitter post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Twitter Post 4 */}
                  {getContentValue('twitter_title_4') && (
                    <div className="social-post twitter-post lazy-load">
                      <img 
                        src={getContentValue('twitter_image_4_url', 'https://via.placeholder.com/600x400?text=Twitter+Post+4')} 
                        alt="Twitter post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('twitter_title_4', 'Twitter Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('twitter_content_4', 'Twitter post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quote 2 Section */}
              <div className="quote-section quote-2-section">
                {getContentValue('quote_2') && (
                  <div className="quote-card lazy-load">
                    <FaQuoteLeft className="quote-icon" aria-hidden="true" />
                    <p className="quote-text">{getContentValue('quote_2', 'Your second inspirational quote will appear here.')}</p>
                    <p className="quote-author">{getContentValue('quote_2_author', 'Author')}</p>
                  </div>
                )}
              </div>
              
              {/* Instagram Posts */}
              <div className="platform-container">
                <div className="platform-header">
                  <FaInstagram className="platform-icon" aria-hidden="true" />
                  <h3 className="platform-title">Instagram</h3>
                  {getContentValue('instagram_profile_url') && (
                    <a
                      href={getContentValue('instagram_profile_url')}
                      className="platform-url"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Visit Instagram profile"
                    >
                      Visit Profile
                    </a>
                  )}
                </div>
                
                <div className="social-grid">
                  {/* Instagram Post 1 */}
                  {getContentValue('instagram_title_1') && (
                    <div className="social-post instagram-post lazy-load">
                      <img 
                        src={getContentValue('instagram_image_1_url', 'https://via.placeholder.com/600x400?text=Instagram+Post+1')} 
                        alt="Instagram post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('instagram_title_1', 'Instagram Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('instagram_content_1', 'Instagram post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Instagram Post 2 */}
                  {getContentValue('instagram_title_2') && (
                    <div className="social-post instagram-post lazy-load">
                      <img 
                        src={getContentValue('instagram_image_2_url', 'https://via.placeholder.com/600x400?text=Instagram+Post+2')} 
                        alt="Instagram post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('instagram_title_2', 'Instagram Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('instagram_content_2', 'Instagram post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Instagram Post 3 */}
                  {getContentValue('instagram_title_3') && (
                    <div className="social-post instagram-post lazy-load">
                      <img 
                        src={getContentValue('instagram_image_3_url', 'https://via.placeholder.com/600x400?text=Instagram+Post+3')} 
                        alt="Instagram post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('instagram_title_3', 'Instagram Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('instagram_content_3', 'Instagram post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Instagram Post 4 */}
                  {getContentValue('instagram_title_4') && (
                    <div className="social-post instagram-post lazy-load">
                      <img 
                        src={getContentValue('instagram_image_4_url', 'https://via.placeholder.com/600x400?text=Instagram+Post+4')} 
                        alt="Instagram post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('instagram_title_4', 'Instagram Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('instagram_content_4', 'Instagram post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* LinkedIn Posts */}
              <div className="platform-container">
                <div className="platform-header">
                  <FaLinkedin className="platform-icon" aria-hidden="true" />
                  <h3 className="platform-title">LinkedIn</h3>
                  {getContentValue('linkedin_profile_url') && (
                    <a
                      href={getContentValue('linkedin_profile_url')}
                      className="platform-url"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Visit LinkedIn profile"
                    >
                      Visit Profile
                    </a>
                  )}
                </div>
                
                <div className="social-grid">
                  {/* LinkedIn Post 1 */}
                  {getContentValue('linkedin_title_1') && (
                    <div className="social-post linkedin-post lazy-load">
                      <img 
                        src={getContentValue('linkedin_image_1_url', 'https://via.placeholder.com/600x400?text=LinkedIn+Post+1')} 
                        alt="LinkedIn post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('linkedin_title_1', 'LinkedIn Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('linkedin_content_1', 'LinkedIn post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn Post 2 */}
                  {getContentValue('linkedin_title_2') && (
                    <div className="social-post linkedin-post lazy-load">
                      <img 
                        src={getContentValue('linkedin_image_2_url', 'https://via.placeholder.com/600x400?text=LinkedIn+Post+2')} 
                        alt="LinkedIn post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('linkedin_title_2', 'LinkedIn Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('linkedin_content_2', 'LinkedIn post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn Post 3 */}
                  {getContentValue('linkedin_title_3') && (
                    <div className="social-post linkedin-post lazy-load">
                      <img 
                        src={getContentValue('linkedin_image_3_url', 'https://via.placeholder.com/600x400?text=LinkedIn+Post+3')} 
                        alt="LinkedIn post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('linkedin_title_3', 'LinkedIn Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('linkedin_content_3', 'LinkedIn post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn Post 4 */}
                  {getContentValue('linkedin_title_4') && (
                    <div className="social-post linkedin-post lazy-load">
                      <img 
                        src={getContentValue('linkedin_image_4_url', 'https://via.placeholder.com/600x400?text=LinkedIn+Post+4')} 
                        alt="LinkedIn post" 
                        className="social-post-image"
                        loading="lazy"
                      />
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('linkedin_title_4', 'LinkedIn Post Title')}</h4>
                        <p className="social-post-text">{getContentValue('linkedin_content_4', 'LinkedIn post content will appear here.')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
          
          {/* Quote 3 Section */}
          <section className="quotes-section quote-3-section" id="quote-3">
            <div className="container">
              <div className="quotes-grid">
                {/* Quote 3 */}
                {getContentValue('quote_3') && (
                  <div className="quote-card lazy-load">
                    <FaQuoteLeft className="quote-icon" aria-hidden="true" />
                    <p className="quote-text">{getContentValue('quote_3', 'Your third inspirational quote will appear here.')}</p>
                    <p className="quote-author">{getContentValue('quote_3_author', 'Author')}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
          
          {/* Footer Section - Enhanced with modern styling */}
          <footer>
            <div className="container">
              <div className="footer-content">
                {getContentValue('footer_message') && (
                  <p className="footer-message">{getContentValue('footer_message', 'Thanks for visiting my site!')}</p>
                )}
                
                {getContentValue('footer_email') && (
                  <a 
                    href={`mailto:${getContentValue('footer_email')}`}
                    className="footer-email"
                    aria-label="Contact me via email"
                  >
                    {getContentValue('footer_email')}
                  </a>
                )}
                
                <p className="footer-copyright">© {currentYear} {getContentValue('rendered_title', 'Personal Brand Site')}</p>
                
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
                      aria-label="Visit my website"
                    >
                      {getContentValue('client_website')}
                    </a>
                  </p>
                )}
                
                <p className="powered-by">Powered by Self Cast Studios</p>
              </div>
            </div>
          </footer>
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
