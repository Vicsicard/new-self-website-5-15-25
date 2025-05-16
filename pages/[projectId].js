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
    /* Banner Section Styles */
    .banner-section {
      margin: 3rem 0;
      width: 100%;
      overflow: hidden;
      position: relative;
    }
    .banner-image-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transition: transform var(--transition-speed) ease;
    }
    .banner-image-container:hover {
      transform: translateY(-5px);
    }
    .banner-image {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      display: block;
    }
    .banner-default {
      min-height: 120px;
      height: 180px;
      width: 100%;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    }
    .banner-content {
      padding: 2rem;
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .banner-graphic {
      width: 100%;
      height: 100%;
      opacity: 0.2;
      background-image: radial-gradient(circle at 25px 25px, white 2%, transparent 0%), 
                     radial-gradient(circle at 75px 75px, white 2%, transparent 0%);
      background-size: 100px 100px;
      position: absolute;
      top: 0;
      left: 0;
    }
    /* All banners have consistent margins */
    .banner-section {
      margin: 3rem 0;
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
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 3;
    }
    .profile-text {
      text-align: left;
      max-width: 60%;
    }
    .profile-image-container {
      width: 250px;
      height: 250px;
      position: relative;
      border-radius: 50%;
      padding: 6px;
      background: linear-gradient(45deg, var(--accent-color), white);
      box-shadow: 0 15px 30px rgba(0,0,0,0.15);
      animation: pulse 3s infinite;
      margin-left: 2rem;
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
      font-size: clamp(3rem, 6vw, 5rem);
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      line-height: 1.1;
    }
    .header-subtitle {
      font-size: clamp(1.3rem, 2.5vw, 1.8rem);
      opacity: 0.9;
      max-width: 600px;
      margin: 0 0 2rem 0;
      line-height: 1.4;
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
      position: relative;
    }
    .bio-section h2 {
      font-size: clamp(2.2rem, 5vw, 3.2rem);
      margin-bottom: 2.5rem;
      text-align: center;
      position: relative;
      padding-bottom: 1.5rem;
    }
    .bio-section h2:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
      border-radius: 2px;
    }
    .bio-content {
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.9;
      font-size: clamp(1.1rem, 1.8vw, 1.25rem);
      position: relative;
      padding: 2rem;
      border-radius: 12px;
      background-color: rgba(255, 255, 255, 0.8);
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }
    .bio-content p:first-of-type {
      font-size: 1.3em;
      color: var(--primary-color);
      font-weight: 500;
      margin-bottom: 1.5rem;
    }
    .bio-content p:last-of-type {
      margin-bottom: 0;
    }
    .bio-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: radial-gradient(var(--accent-color)10 1px, transparent 1px);
      background-size: 30px 30px;
      opacity: 0.3;
      z-index: 0;
    }
    
    /* Blog Section */
    .blog-section {
      background: linear-gradient(to bottom, var(--background-color), var(--secondary-color)15);
      position: relative;
      padding: 5rem 0;
      overflow: hidden;
    }
    .blog-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
      z-index: 0;
    }
    .blog-section h2 {
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      margin-bottom: 2rem;
      text-align: center;
      position: relative;
      padding-bottom: 1.5rem;
      color: var(--primary-color);
      text-shadow: 0px 2px 4px rgba(0,0,0,0.1);
    }
    .blog-section h2::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 5px;
      background: linear-gradient(90deg, var(--accent-color), var(--primary-color), var(--accent-color));
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .blog-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, auto);
      gap: 2rem;
      position: relative;
      z-index: 1;
    }
    .blog-card {
      background: var(--card-bg);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      transition: all var(--transition-speed) ease;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      border: 1px solid rgba(255,255,255,0.8);
    }
    .blog-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 35px rgba(0,0,0,0.1);
    }
    .blog-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .blog-content {
      padding: 1.5rem;
    }
    .blog-content h3 {
      font-size: 1.75rem;
      line-height: 1.3;
      margin-bottom: 1rem;
      color: var(--primary-color);
      font-weight: 700;
    }
    .blog-excerpt {
      color: #666;
      font-size: 0.95rem;
      margin-bottom: 1rem;
    }
    .read-more-btn {
      display: inline-block;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 50px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-speed) ease;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      margin-top: 0.5rem;
    }
    .read-more-btn:hover {
      background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(0,0,0,0.15);
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    .modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }
    .content-modal {
      background-color: white;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s ease;
    }
    .content-modal.active {
      transform: translateY(0);
      opacity: 1;
    }
    .modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.5rem;
      font-weight: 700;
      color: #555;
      transition: all 0.2s ease;
    }
    .modal-close:hover {
      background: rgba(0,0,0,0.2);
      color: #000;
    }
    .modal-content {
      padding: 3rem;
    }
    .modal-title {
      font-size: 2.5rem;
      color: #000;
      margin-bottom: 2rem;
      text-align: center;
      position: relative;
      padding-bottom: 1rem;
      line-height: 1.3;
    }
    .modal-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 3px;
      background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
      border-radius: 3px;
    }
    .modal-body {
      color: #000;
      font-size: 1.1rem;
      line-height: 1.8;
    }
    .modal-body p {
      margin-bottom: 1.5rem;
    }
    .modal-body p:first-of-type {
      font-size: 1.2rem;
      font-weight: 500;
    }
    .modal-body p:last-of-type {
      margin-bottom: 0;
    }
    .modal-body h3 {
      font-size: 1.8rem;
      color: #000;
      margin: 2rem 0 1rem;
    }
    .modal-body h4 {
      font-size: 1.4rem;
      color: #000;
      margin: 1.5rem 0 1rem;
    }
    .modal-body ul, .modal-body ol {
      margin: 1.5rem 0;
      padding-left: 2rem;
    }
    .modal-body li {
      margin-bottom: 0.5rem;
    }
    .modal-body img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.5rem 0;
    }
    .modal-body blockquote {
      border-left: 5px solid var(--accent-color);
      padding-left: 1.5rem;
      margin-left: 0;
      font-style: italic;
      color: #555;
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
      background: linear-gradient(to bottom, var(--background-color), var(--secondary-color)08);
      padding: 4rem 0;
      position: relative;
      overflow: hidden;
    }
    .bio-cards-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: linear-gradient(45deg, var(--primary-color)05 25%, transparent 25%, transparent 75%, var(--primary-color)05 75%, var(--primary-color)05),
                      linear-gradient(45deg, var(--primary-color)05 25%, transparent 25%, transparent 75%, var(--primary-color)05 75%, var(--primary-color)05);
      background-size: 60px 60px;
      background-position: 0 0, 30px 30px;
      opacity: 0.4;
      z-index: 0;
    }
    .bio-cards-row {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      gap: 2rem;
      margin-top: 2rem;
      flex-wrap: wrap;
      position: relative;
      z-index: 1;
    }
    .bio-card {
      flex: 1;
      min-width: 250px;
      background: var(--card-bg);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -20px rgba(var(--primary-color), 0.15);
      transition: all var(--transition-speed) ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      border: 1px solid rgba(255,255,255,0.8);
      overflow: hidden;
    }
    .bio-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
    }
    .bio-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0,0,0,0.2), 0 15px 20px -10px rgba(var(--accent-color), 0.3);
    }
    .bio-card-text {
      font-size: 1.15rem;
      line-height: 1.8;
      margin: 0;
      text-align: center;
      position: relative;
      z-index: 1;
      color: var(--text-color);
    }
    .bio-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 80px;
      height: 80px;
      background: radial-gradient(circle at bottom right, var(--accent-color)15, transparent 70%);
      border-radius: 0 0 16px 0;
      opacity: 0.6;
      transition: all var(--transition-speed) ease;
    }
    .bio-card:hover::after {
      width: 120px;
      height: 120px;
      opacity: 0.8;
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
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      border-top: 4px solid;
    }
    .social-post.facebook-post {
      border-color: #1877F2;
    }
    .social-post.twitter-post {
      border-color: #1DA1F2;
    }
    .social-post.instagram-post {
      border-color: #C13584;
    }
    .social-post.linkedin-post {
      border-color: #0A66C2;
    }
    .social-post:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .post-platform-icon {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem 0;
      font-size: 2rem;
      background-color: rgba(240, 240, 240, 0.5);
    }
    .facebook-post .post-platform-icon {
      color: #1877F2;
    }
    .twitter-post .post-platform-icon {
      color: #1DA1F2;
    }
    .instagram-post .post-platform-icon {
      color: #C13584;
    }
    .linkedin-post .post-platform-icon {
      color: #0A66C2;
    }
    .social-post-content {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .social-post-title {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }
    .social-post-excerpt {
      color: #666;
      font-size: 0.95rem;
      margin-bottom: 1rem;
      line-height: 1.6;
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
      .profile-section {
        flex-direction: column-reverse;
        text-align: center;
      }
      .profile-text {
        text-align: center;
        max-width: 100%;
        margin-top: 2rem;
      }
      .profile-image-container {
        width: 180px;
        height: 180px;
        margin-left: 0;
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

  // Load JS for lazy loading images and modal functionality
  useEffect(() => {
    // Lazy loading functionality
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
    
    // Modal functionality for blog and social media posts
    const modalOverlay = document.getElementById('content-modal-overlay');
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');
    const readMoreButtons = document.querySelectorAll('.read-more-btn');
    
    // Function to open modal with post content
    const openModal = (postId, platform = 'blog') => {
      if (!modalOverlay || !modal) return;
      
      // Get content based on platform and ID
      let title, content;
      
      switch (platform) {
        case 'facebook':
          title = getContentValue(`facebook_title_${postId}`, '');
          content = getContentValue(`facebook_post_${postId}`, '');
          break;
        case 'twitter':
          title = getContentValue(`twitter_title_${postId}`, '');
          content = getContentValue(`twitter_post_${postId}`, '');
          break;
        case 'instagram':
          title = getContentValue(`instagram_title_${postId}`, '');
          content = getContentValue(`instagram_post_${postId}`, '');
          break;
        case 'linkedin':
          title = getContentValue(`linkedin_title_${postId}`, '');
          content = getContentValue(`linkedin_post_${postId}`, '');
          break;
        case 'blog':
        default:
          title = getContentValue(`blog_${postId}_title`, '');
          content = getContentValue(`blog_${postId}`, '');
          break;
      }
      
      // Set modal content
      if (modalTitle) modalTitle.textContent = title;
      
      // Format content for the modal body
      if (modalBody) {
        // Create formatted paragraphs from content
        const formattedContent = content
          .split('\n\n')
          .map(paragraph => `<p>${paragraph}</p>`)
          .join('');
        
        modalBody.innerHTML = formattedContent || '<p>No content available</p>';
      }
      
      // Show modal with animation
      modalOverlay.classList.add('active');
      setTimeout(() => {
        modal.classList.add('active');
      }, 10);
      
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    };
    
    // Function to close modal
    const closeModal = () => {
      if (!modal || !modalOverlay) return;
      
      // Hide modal with animation
      modal.classList.remove('active');
      
      setTimeout(() => {
        modalOverlay.classList.remove('active');
        // Clear modal content
        if (modalBody) modalBody.innerHTML = '';
        // Re-enable body scrolling
        document.body.style.overflow = '';
      }, 300);
    };
    
    // Add click event to Read More buttons
    if (readMoreButtons) {
      readMoreButtons.forEach(button => {
        button.addEventListener('click', () => {
          const platform = button.getAttribute('data-platform') || 'blog';
          const postId = button.getAttribute('data-post-id') || button.getAttribute('data-blog-id');
          if (postId) openModal(postId, platform);
        });
      });
    }
    
    // Add click events to close modal
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal();
      });
    }
    
    // Add keyboard event to close modal with Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
    
    return () => {
      // Clean up event listeners
      lazyLoadElements.forEach(el => {
        observer.unobserve(el);
      });
      
      if (readMoreButtons) {
        readMoreButtons.forEach(button => {
          button.removeEventListener('click', () => {});
        });
      }
      
      if (modalClose) {
        modalClose.removeEventListener('click', closeModal);
      }
      
      if (modalOverlay) {
        modalOverlay.removeEventListener('click', () => {});
      }
      
      document.removeEventListener('keydown', () => {});
    };
  }, [getContentValue]);

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
                  <div className="profile-text">
                    <h1 className="header-title">{getContentValue('rendered_title', 'Personal Brand Site')}</h1>
                    <p className="header-subtitle">{getContentValue('rendered_subtitle', 'Welcome to my site')}</p>
                  </div>
                  <div className="profile-image-container">
                    <img 
                      src={getContentValue('profile_image_url', 'https://via.placeholder.com/250')} 
                      alt={getContentValue('client_name', 'Profile')} 
                      className="profile-image" 
                      loading="lazy"
                    />
                  </div>
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

          {/* Banner 1 Section - Between Bio Cards and Blog Posts */}
          <section className="banner-section banner-1" id="banner-1">
            <div className="container">
              {getContentValue('banner_1_image_url') ? (
                <div className="banner-image-container lazy-load">
                  <img 
                    src={getContentValue('banner_1_image_url')} 
                    alt="Banner 1" 
                    className="banner-image"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="banner-default lazy-load">
                  <div className="banner-content">
                    <div className="banner-graphic"></div>
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* Blog Posts Section */}
          {getContentValue('blog_1_title') && (
            <section className="blog-section" id="blog">
              <div className="container">
                <h2>Blog Posts</h2>
                <div className="blog-grid">
                  {/* Blog Post 1 */}
                  {getContentValue('blog_1_title') && (
                    <div className="blog-card lazy-load" data-blog-id="1">
                      {getContentValue('blog_1_image_url') && (
                        <img
                          src={getContentValue('blog_1_image_url')}
                          alt={getContentValue('blog_1_title')}
                          className="blog-image"
                          loading="lazy"
                        />
                      )}
                      <div className="blog-content">
                        <h3>{getContentValue('blog_1_title')}</h3>
                        <p className="blog-excerpt">
                          {getContentValue('blog_1_excerpt') || getContentValue('blog_1').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-blog-id="1">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Blog Post 2 */}
                  {getContentValue('blog_2_title') && (
                    <div className="blog-card lazy-load" data-blog-id="2">
                      {getContentValue('blog_2_image_url') && (
                        <img
                          src={getContentValue('blog_2_image_url')}
                          alt={getContentValue('blog_2_title')}
                          className="blog-image"
                          loading="lazy"
                        />
                      )}
                      <div className="blog-content">
                        <h3>{getContentValue('blog_2_title')}</h3>
                        <p className="blog-excerpt">
                          {getContentValue('blog_2_excerpt') || getContentValue('blog_2').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-blog-id="2">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Blog Post 3 */}
                  {getContentValue('blog_3_title') && (
                    <div className="blog-card lazy-load" data-blog-id="3">
                      {getContentValue('blog_3_image_url') && (
                        <img
                          src={getContentValue('blog_3_image_url')}
                          alt={getContentValue('blog_3_title')}
                          className="blog-image"
                          loading="lazy"
                        />
                      )}
                      <div className="blog-content">
                        <h3>{getContentValue('blog_3_title')}</h3>
                        <p className="blog-excerpt">
                          {getContentValue('blog_3_excerpt') || getContentValue('blog_3').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-blog-id="3">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Blog Post 4 */}
                  {getContentValue('blog_4_title') && (
                    <div className="blog-card lazy-load" data-blog-id="4">
                      {getContentValue('blog_4_image_url') && (
                        <img
                          src={getContentValue('blog_4_image_url')}
                          alt={getContentValue('blog_4_title')}
                          className="blog-image"
                          loading="lazy"
                        />
                      )}
                      <div className="blog-content">
                        <h3>{getContentValue('blog_4_title')}</h3>
                        <p className="blog-excerpt">
                          {getContentValue('blog_4_excerpt') || getContentValue('blog_4').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-blog-id="4">Read More</button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content Modals - For Blog and Social Media Posts */}
                <div className="modal-overlay" id="content-modal-overlay">
                  <div className="content-modal" id="content-modal">
                    <div className="modal-close" id="modal-close">×</div>
                    <div className="modal-content">
                      <h2 className="modal-title" id="modal-title"></h2>
                      <div className="modal-body" id="modal-body"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
          
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
                      <div className="post-platform-icon">
                        <FaFacebook aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('facebook_title_1', 'Facebook Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('facebook_excerpt_1') || getContentValue('facebook_post_1').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="facebook" data-post-id="1">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Facebook Post 2 */}
                  {getContentValue('facebook_title_2') && (
                    <div className="social-post facebook-post lazy-load">
                      <div className="post-platform-icon">
                        <FaFacebook aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('facebook_title_2', 'Facebook Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('facebook_excerpt_2') || getContentValue('facebook_post_2').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="facebook" data-post-id="2">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Facebook Post 3 */}
                  {getContentValue('facebook_title_3') && (
                    <div className="social-post facebook-post lazy-load">
                      <div className="post-platform-icon">
                        <FaFacebook aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('facebook_title_3', 'Facebook Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('facebook_excerpt_3') || getContentValue('facebook_post_3').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="facebook" data-post-id="3">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Facebook Post 4 */}
                  {getContentValue('facebook_title_4') && (
                    <div className="social-post facebook-post lazy-load">
                      <div className="post-platform-icon">
                        <FaFacebook aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('facebook_title_4', 'Facebook Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('facebook_excerpt_4') || getContentValue('facebook_post_4').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="facebook" data-post-id="4">Read More</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner 2 Section - Between Facebook and Twitter */}
              <div className="banner-section banner-2" id="banner-2">
                {getContentValue('banner_2_image_url') ? (
                  <div className="banner-image-container lazy-load">
                    <img 
                      src={getContentValue('banner_2_image_url')} 
                      alt="Banner 2" 
                      className="banner-image"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="banner-default lazy-load">
                    <div className="banner-content">
                      <div className="banner-graphic"></div>
                    </div>
                  </div>
                )}
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
                      <div className="post-platform-icon">
                        <FaTwitter aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('twitter_title_1', 'Twitter Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('twitter_excerpt_1') || getContentValue('twitter_post_1').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="twitter" data-post-id="1">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Twitter Post 2 */}
                  {getContentValue('twitter_title_2') && (
                    <div className="social-post twitter-post lazy-load">
                      <div className="post-platform-icon">
                        <FaTwitter aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('twitter_title_2', 'Twitter Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('twitter_excerpt_2') || getContentValue('twitter_post_2').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="twitter" data-post-id="2">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Twitter Post 3 */}
                  {getContentValue('twitter_title_3') && (
                    <div className="social-post twitter-post lazy-load">
                      <div className="post-platform-icon">
                        <FaTwitter aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('twitter_title_3', 'Twitter Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('twitter_excerpt_3') || getContentValue('twitter_post_3').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="twitter" data-post-id="3">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Twitter Post 4 */}
                  {getContentValue('twitter_title_4') && (
                    <div className="social-post twitter-post lazy-load">
                      <div className="post-platform-icon">
                        <FaTwitter aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('twitter_title_4', 'Twitter Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('twitter_excerpt_4') || getContentValue('twitter_post_4').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="twitter" data-post-id="4">Read More</button>
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
                      <div className="post-platform-icon">
                        <FaInstagram aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('instagram_title_1', 'Instagram Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('instagram_excerpt_1') || getContentValue('instagram_post_1').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="instagram" data-post-id="1">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Instagram Post 2 */}
                  {getContentValue('instagram_title_2') && (
                    <div className="social-post instagram-post lazy-load">
                      <div className="post-platform-icon">
                        <FaInstagram aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('instagram_title_2', 'Instagram Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('instagram_excerpt_2') || getContentValue('instagram_post_2').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="instagram" data-post-id="2">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Instagram Post 3 */}
                  {getContentValue('instagram_title_3') && (
                    <div className="social-post instagram-post lazy-load">
                      <div className="post-platform-icon">
                        <FaInstagram aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('instagram_title_3', 'Instagram Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('instagram_excerpt_3') || getContentValue('instagram_post_3').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="instagram" data-post-id="3">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* Instagram Post 4 */}
                  {getContentValue('instagram_title_4') && (
                    <div className="social-post instagram-post lazy-load">
                      <div className="post-platform-icon">
                        <FaInstagram aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('instagram_title_4', 'Instagram Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('instagram_excerpt_4') || getContentValue('instagram_post_4').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="instagram" data-post-id="4">Read More</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner 3 Section - Between Instagram and LinkedIn */}
              <div className="banner-section banner-3" id="banner-3">
                {getContentValue('banner_3_image_url') ? (
                  <div className="banner-image-container lazy-load">
                    <img 
                      src={getContentValue('banner_3_image_url')} 
                      alt="Banner 3" 
                      className="banner-image"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="banner-default lazy-load">
                    <div className="banner-content">
                      <div className="banner-graphic"></div>
                    </div>
                  </div>
                )}
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
                      <div className="post-platform-icon">
                        <FaLinkedin aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('linkedin_title_1', 'LinkedIn Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('linkedin_excerpt_1') || getContentValue('linkedin_post_1').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="linkedin" data-post-id="1">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn Post 2 */}
                  {getContentValue('linkedin_title_2') && (
                    <div className="social-post linkedin-post lazy-load">
                      <div className="post-platform-icon">
                        <FaLinkedin aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('linkedin_title_2', 'LinkedIn Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('linkedin_excerpt_2') || getContentValue('linkedin_post_2').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="linkedin" data-post-id="2">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn Post 3 */}
                  {getContentValue('linkedin_title_3') && (
                    <div className="social-post linkedin-post lazy-load">
                      <div className="post-platform-icon">
                        <FaLinkedin aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('linkedin_title_3', 'LinkedIn Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('linkedin_excerpt_3') || getContentValue('linkedin_post_3').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="linkedin" data-post-id="3">Read More</button>
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn Post 4 */}
                  {getContentValue('linkedin_title_4') && (
                    <div className="social-post linkedin-post lazy-load">
                      <div className="post-platform-icon">
                        <FaLinkedin aria-hidden="true" />
                      </div>
                      <div className="social-post-content">
                        <h4 className="social-post-title">{getContentValue('linkedin_title_4', 'LinkedIn Post Title')}</h4>
                        <p className="social-post-excerpt">
                          {getContentValue('linkedin_excerpt_4') || getContentValue('linkedin_post_4').substring(0, 120) + '...'}
                        </p>
                        <button className="read-more-btn" data-platform="linkedin" data-post-id="4">Read More</button>
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
