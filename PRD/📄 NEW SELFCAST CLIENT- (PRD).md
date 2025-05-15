# **📄 Product Requirements Document (PRD)**

## **Self Cast Studios: Client CMS \+ Static Site Platform**

---

## **🔍 Overview**

This application allows Self Cast Studios clients to:

* Log in to a secure, scoped dashboard  
* Edit preloaded website content with restricted UI  
* Publish updates to a personal brand site  
* View their live site at: `https://selfcaststudios.com/{projectId}`

The entire system is powered by:

* **Next.js** (fullstack frontend/backend)  
* **MongoDB Atlas** (project content storage)  
* **Custom JWT authentication**  
* **Render** (deployment platform)

---

## **🎯 Goals**

* Give each client an easy-to-use content editor  
* Control edit access (no schema access, no layout changes)  
* Deploy static-style, content-driven personal sites  
* Use path-based routing, not subdomains (`/projectId`)  
* Keep architecture simple, scalable, and fast

---

## **🛠 Stack Summary**

| Layer | Technology |
| ----- | ----- |
| Framework | Next.js (Pages Router) |
| Hosting | Render |
| Database | MongoDB Atlas |
| Auth | Custom JWT-based auth |
| Styling | Tailwind CSS |
| Routing | Path-based (`/projectId`) |

---

## **🔐 Authentication & Access**

* Login via `/login` using email/password  
* On successful login:  
  * JWT issued and stored as HttpOnly cookie  
  * Token contains: `{ userId, role, projectId }`  
* Middleware protects `/dashboard`  
* Role-based access:  
  * `client`: only sees their `projectId` content  
  * `admin`: future use for global content management

---

## **📁 Data Model**

### **`users` Collection (MongoDB)**

{  
  \_id: ObjectId,  
  email: string,  
  passwordHash: string,  
  role: 'client',  
  projectId: string // foreign key to projects.projectId  
}

### **`projects` Collection (MongoDB)**

{  
  \_id: ObjectId,  
  projectId: string, // used for URL \+ lookup  
  name: string,  
  createdAt: Date,  
  updatedAt: Date,  
  content: \[  
    { key: string, value: string }  
  \]  
}

Each key-value pair in `content[]` maps directly to a UI input field and a template output placeholder.

---

## **🧩 Content Mapping Reference**

Complete Content Mapping Reference

This table shows the full mapping path from MongoDB database fields to Content Editor UI fields to the Static Template output. Use this as a reference when adding or modifying content in the system.

Basic Site Content

MongoDB Key

Content Editor UI Field

Static Template Output

Description

rendered\_title

Site Title

{{rendered\_title}}

Main site title

rendered\_subtitle

Site Subtitle

{{rendered\_subtitle}}

Site subtitle

rendered\_bio\_html

Bio HTML Content

{{rendered\_bio\_html}}

Main bio section HTML

client\_name

Client Name

{{client\_name}}

Client's name in footer

client\_website

Client Website

{{client\_website}}

Client's website URL

rendered\_footer\_slogan

Footer Slogan

{{rendered\_footer\_slogan}}

Text above copyright

current\_year

Auto-generated

{{current\_year}}

Current year for copyright

profile\_image\_url

Profile Image URL

{{profile\_image\_url}}

Profile/avatar image

Design Elements

MongoDB Key

Content Editor UI Field

Static Template Output

Description

primary\_color

Primary Color

{{primary\_color}}

Main brand color

accent\_color

Accent Color

{{accent\_color}}

Secondary/accent color

text\_color

Text Color

{{text\_color}}

Main text color

background\_color

Background Color

{{background\_color}}

Page background color

heading\_font

Heading Font

{{heading\_font}}

Font for headings

body\_font

Body Font

{{body\_font}}

Font for body text

Banner Images

MongoDB Key

Content Editor UI Field

Static Template Output

Description

banner\_image\_1\_url

Banner Image 1

{{banner\_image\_1\_url}}

First banner image

banner\_image\_2\_url

Banner Image 2

{{banner\_image\_2\_url}}

Second banner image

banner\_image\_3\_url

Banner Image 3

{{banner\_image\_3\_url}}

Third banner image

Blog Posts

MongoDB Key

Content Editor UI Field

Static Template Output

Description

rendered\_blog\_post\_1

Blog Post 1

{{rendered\_blog\_post\_1}}

Content for blog post 1

rendered\_blog\_post\_2

Blog Post 2

{{rendered\_blog\_post\_2}}

Content for blog post 2

rendered\_blog\_post\_3

Blog Post 3

{{rendered\_blog\_post\_3}}

Content for blog post 3

rendered\_blog\_post\_4

Blog Post 4

{{rendered\_blog\_post\_4}}

Content for blog post 4

blog\_1

Legacy Blog Post 1 Field

Maps to rendered\_blog\_post\_1

Legacy field for blog 1

blog\_2

Legacy Blog Post 2 Field

Maps to rendered\_blog\_post\_2

Legacy field for blog 2

blog\_3

Legacy Blog Post 3 Field

Maps to rendered\_blog\_post\_3

Legacy field for blog 3

blog\_4

Legacy Blog Post 4 Field

Maps to rendered\_blog\_post\_4

Legacy field for blog 4

Facebook Content

MongoDB Key

Content Editor UI Field

Static Template Output

Description

facebook\_title\_1

Facebook Post 1 Title

{{facebook\_title\_1}}

Title for Facebook post 1

facebook\_title\_2

Facebook Post 2 Title

{{facebook\_title\_2}}

Title for Facebook post 2

facebook\_title\_3

Facebook Post 3 Title

{{facebook\_title\_3}}

Title for Facebook post 3

facebook\_title\_4

Facebook Post 4 Title

{{facebook\_title\_4}}

Title for Facebook post 4

facebook\_post\_1

Facebook Post 1 Content

{{facebook\_post\_1}}

Content for Facebook post 1

facebook\_post\_2

Facebook Post 2 Content

{{facebook\_post\_2}}

Content for Facebook post 2

facebook\_post\_3

Facebook Post 3 Content

{{facebook\_post\_3}}

Content for Facebook post 3

facebook\_post\_4

Facebook Post 4 Content

{{facebook\_post\_4}}

Content for Facebook post 4

facebook\_url

Facebook Profile URL

{{facebook\_url}}

Facebook profile URL

Twitter Content

MongoDB Key

Content Editor UI Field

Static Template Output

Description

twitter\_title\_1

Twitter Post 1 Title

{{twitter\_title\_1}}

Title for Twitter post 1

twitter\_title\_2

Twitter Post 2 Title

{{twitter\_title\_2}}

Title for Twitter post 2

twitter\_title\_3

Twitter Post 3 Title

{{twitter\_title\_3}}

Title for Twitter post 3

twitter\_title\_4

Twitter Post 4 Title

{{twitter\_title\_4}}

Title for Twitter post 4

twitter\_post\_1

Twitter Post 1 Content

{{twitter\_post\_1}}

Content for Twitter post 1

twitter\_post\_2

Twitter Post 2 Content

{{twitter\_post\_2}}

Content for Twitter post 2

twitter\_post\_3

Twitter Post 3 Content

{{twitter\_post\_3}}

Content for Twitter post 3

twitter\_post\_4

Twitter Post 4 Content

{{twitter\_post\_4}}

Content for Twitter post 4

twitter\_url

Twitter Profile URL

{{twitter\_url}}

Twitter profile URL

Instagram Content

MongoDB Key

Content Editor UI Field

Static Template Output

Description

instagram\_title\_1

Instagram Post 1 Title

{{instagram\_title\_1}}

Title for Instagram post 1

instagram\_title\_2

Instagram Post 2 Title

{{instagram\_title\_2}}

Title for Instagram post 2

instagram\_title\_3

Instagram Post 3 Title

{{instagram\_title\_3}}

Title for Instagram post 3

instagram\_title\_4

Instagram Post 4 Title

{{instagram\_title\_4}}

Title for Instagram post 4

instagram\_post\_1

Instagram Post 1 Content

{{instagram\_post\_1}}

Content for Instagram post 1

instagram\_post\_2

Instagram Post 2 Content

{{instagram\_post\_2}}

Content for Instagram post 2

instagram\_post\_3

Instagram Post 3 Content

{{instagram\_post\_3}}

Content for Instagram post 3

instagram\_post\_4

Instagram Post 4 Content

{{instagram\_post\_4}}

Content for Instagram post 4

instagram\_url

Instagram Profile URL

{{instagram\_url}}

Instagram profile URL

LinkedIn Content

MongoDB Key

Content Editor UI Field

Static Template Output

Description

linkedin\_title\_1

LinkedIn Post 1 Title

{{linkedin\_title\_1}}

Title for LinkedIn post 1

linkedin\_title\_2

LinkedIn Post 2 Title

{{linkedin\_title\_2}}

Title for LinkedIn post 2

linkedin\_title\_3

LinkedIn Post 3 Title

{{linkedin\_title\_3}}

Title for LinkedIn post 3

linkedin\_title\_4

LinkedIn Post 4 Title

{{linkedin\_title\_4}}

Title for LinkedIn post 4

linkedin\_post\_1

LinkedIn Post 1 Content

{{linkedin\_post\_1}}

Content for LinkedIn post 1

linkedin\_post\_2

LinkedIn Post 2 Content

{{linkedin\_post\_2}}

Content for LinkedIn post 2

linkedin\_post\_3

LinkedIn Post 3 Content

{{linkedin\_post\_3}}

Content for LinkedIn post 3

linkedin\_post\_4

LinkedIn Post 4 Content

{{linkedin\_post\_4}}

Content for LinkedIn post 4

linkedin\_url

LinkedIn Profile URL

{{linkedin\_url}}

LinkedIn profile URL

Implementation

To implement this mapping in your project:

Content Editor: Fields appear in the SelfCast Content Editor interface

MongoDB: Data is stored with these keys in the MongoDB database

Static Template: The site generator uses these placeholders ({{key}}) to replace content in the HTML template

The flow of content is:

Content Editor UI → MongoDB Database → Static Site Generator → Final Website

📌 Global Site Keys

MongoDB Key

Template Variable

Description

rendered\_title

{{rendered\_title}}

Main site headline/title

rendered\_subtitle

{{rendered\_subtitle}}

Subtitle under main headline

rendered\_bio\_html

{{rendered\_bio\_html}}

Rich-text bio block

client\_name

{{client\_name}}

Displayed in footer and bylines

client\_website

{{client\_website}}

Footer/contact link

primary\_color

{{primary\_color}}

CSS theme color (hex or class)

accent\_color

{{accent\_color}}

Secondary accent color

text\_color

{{text\_color}}

Main text color

background\_color

{{background\_color}}

Background color

heading\_font

{{heading\_font}}

Font-family for headings

body\_font

{{body\_font}}

Font-family for body text

rendered\_footer\_slogan

{{rendered\_footer\_slogan}}

Footer slogan

profile\_image\_url

{{profile\_image\_url}}

Main avatar or headshot

banner\_image\_1\_url

{{banner\_image\_1\_url}}

Hero image 1

banner\_image\_2\_url

{{banner\_image\_2\_url}}

Hero image 2

banner\_image\_3\_url

{{banner\_image\_3\_url}}

Hero image 3

📝 Blog Content

MongoDB Key

Template Variable

Description

rendered\_blog\_post\_1

{{rendered\_blog\_post\_1}}

Blog 1 (HTML or text)

rendered\_blog\_post\_2

{{rendered\_blog\_post\_2}}

Blog 2

rendered\_blog\_post\_3

{{rendered\_blog\_post\_3}}

Blog 3

rendered\_blog\_post\_4

{{rendered\_blog\_post\_4}}

Blog 4

📱 Social Posts (Cross-platform)

Platform

Post Key

Template Variable

Facebook

facebook\_post\_1

{{facebook\_post\_1}}

Facebook

facebook\_title\_1

{{facebook\_title\_1}}

Twitter

twitter\_post\_1

{{twitter\_post\_1}}

Twitter

twitter\_title\_1

{{twitter\_title\_1}}

Instagram

instagram\_post\_1

{{instagram\_post\_1}}

Instagram

instagram\_title\_1

{{instagram\_title\_1}}

LinkedIn

linkedin\_post\_1

{{linkedin\_post\_1}}

LinkedIn

linkedin\_title\_1

{{linkedin\_title\_1}}

Repeat pattern for 2–4 if needed. Posts can be rendered as plain text or cards depending on site layout.

---

## **🎨 Static Site Template (HTML Reference)**

The following HTML template is used for all client sites. Content is injected using the `{{key}}` mapping described above:

\<\!DOCTYPE html\>  
\<html lang="en"\>  
\<head\>  
    \<meta charset="UTF-8"\>  
    \<meta name="viewport" content="width=device-width, initial-scale=1.0"\>  
    \<title data-key="rendered\_title"\>{{rendered\_title}}\</title\>  
    \<link rel="stylesheet" href="style.css"\>  
    \<link rel="stylesheet" href="social-styles.css"\>  
    \<link rel="preconnect" href="https://fonts.googleapis.com"\>  
    \<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin\>  
    \<link href="https://fonts.googleapis.com/css2?family={{heading\_font}}:wght@400;700\&family={{body\_font}}:wght@300;400;500\&display=swap" rel="stylesheet"\>  
      
    \<style id="dynamic-theme"\>  
        :root {  
            \--primary-color: {{primary\_color}};  
            \--accent-color: {{accent\_color}};  
            \--text-color: {{text\_color}};  
            \--background-color: {{background\_color}};  
            \--heading-font: '{{heading\_font}}', serif;  
            \--body-font: '{{body\_font}}', sans-serif;  
        }  
    \</style\>  
      
    \<\!-- Site Configuration \--\>  
    \<script src="../config.js"\>\</script\>  
      
    \<\!-- Site Scripts \--\>  
    \<script\>  
      // Site content will be populated by site generator  
      window.siteContent \= {  
        // Content will be injected at build time  
      };  
        
      // Disable Supabase loading in static site  
      async function loadContent() {  
        console.log("Content pre-loaded in static build");  
        // No need to load content, it's already embedded in the HTML  
      }  
        
      // Make sure parallax is initialized  
      document.addEventListener('DOMContentLoaded', function() {  
        console.log('Static site loaded \- all content pre-embedded');  
        initParallax();  
      });  
    \</script\>  
    \<script src="script.js"\>\</script\>  
    \<script src="modal-functions.js"\>\</script\>  
    \<script src="social-title-fix.js"\>\</script\>  
\</head\>  
\<body\>  
    \<\!-- Header Section \--\>  
    \<header class="site-header"\>  
        \<div class="container"\>  
            \<div class="profile-section"\>  
                \<div class="profile-image-container"\>  
                    \<img class="profile-image" src="{{profile\_image\_url}}" alt="{{client\_name}}" data-key="profile\_image\_url"\>  
                \</div\>  
                \<div class="header-content"\>  
                    \<h1 class="site-title" data-key="rendered\_title"\>{{rendered\_title}}\</h1\>  
                    \<p class="site-subtitle" data-key="rendered\_subtitle"\>{{rendered\_subtitle}}\</p\>  
                \</div\>  
            \</div\>  
        \</div\>  
    \</header\>  
      
    \<\!-- Banner Section 1 \--\>  
    \<div class="banner-divider banner-divider-1" data-key="banner\_image\_1\_url" style="background-image: url('{{banner\_image\_1\_url}}');"\>\</div\>  
      
    \<\!-- Bio Section \--\>  
    \<section class="bio-section"\>  
        \<div class="container"\>  
            \<div class="bio-content" data-key="rendered\_bio\_html"\>{{rendered\_bio\_html}}\</div\>  
        \</div\>  
    \</section\>  
      
    \<\!-- Banner Section 2 \--\>  
    \<div class="banner-divider banner-divider-2" data-key="banner\_image\_2\_url" style="background-image: url('{{banner\_image\_2\_url}}');"\>\</div\>  
      
    \<\!-- Blog Section \--\>  
    \<section class="blog-section"\>  
        \<div class="container"\>  
            \<h2\>Blog\</h2\>  
            \<div class="blog-grid"\>  
                \<\!-- Blog Post 1 \--\>  
                \<div class="blog-post"\>  
                    \<div class="post-content-preview"\>  
                        \<h3\>Blog Post 1\</h3\>  
                        \<p class="post-content"\>{{rendered\_blog\_post\_1}}\</p\>  
                        \<button class="action-button" onclick="openModal('blog-1')"\>Read More\</button\>  
                    \</div\>  
                \</div\>  
                  
                \<\!-- Blog Post 2 \--\>  
                \<div class="blog-post"\>  
                    \<div class="post-content-preview"\>  
                        \<h3\>Blog Post 2\</h3\>  
                        \<p class="post-content"\>{{rendered\_blog\_post\_2}}\</p\>  
                        \<button class="action-button" onclick="openModal('blog-2')"\>Read More\</button\>  
                    \</div\>  
                \</div\>  
                  
                \<\!-- Blog Post 3 \--\>  
                \<div class="blog-post"\>  
                    \<div class="post-content-preview"\>  
                        \<h3\>Blog Post 3\</h3\>  
                        \<p class="post-content"\>{{rendered\_blog\_post\_3}}\</p\>  
                        \<button class="action-button" onclick="openModal('blog-3')"\>Read More\</button\>  
                    \</div\>  
                \</div\>  
                  
                \<\!-- Blog Post 4 \--\>  
                \<div class="blog-post"\>  
                    \<div class="post-content-preview"\>  
                        \<h3\>Blog Post 4\</h3\>  
                        \<p class="post-content"\>{{rendered\_blog\_post\_4}}\</p\>  
                        \<button class="action-button" onclick="openModal('blog-4')"\>Read More\</button\>  
                    \</div\>  
                \</div\>  
            \</div\>  
        \</div\>  
    \</section\>  
      
    \<\!-- Banner Section 3 \--\>  
    \<div class="banner-divider banner-divider-3" data-key="banner\_image\_3\_url" style="background-image: url('{{banner\_image\_3\_url}}');"\>\</div\>  
      
    \<\!-- Social Media Section \--\>  
    \<section class="social-media-section"\>  
        \<div class="container"\>  
            \<h2\>Social Media\</h2\>  
              
            \<\!-- Facebook Posts \--\>  
            \<div class="social-platform facebook-section"\>  
                \<h3\>Facebook\</h3\>  
                \<div class="social-grid"\>  
                    \<\!-- Facebook Post 1 \--\>  
                    \<div class="social-post facebook-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{facebook\_title\_1}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{facebook\_post\_1}}\</p\>  
                            \<button class="action-button" onclick="openModal('facebook-1')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Facebook Post 2 \--\>  
                    \<div class="social-post facebook-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{facebook\_title\_2}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{facebook\_post\_2}}\</p\>  
                            \<button class="action-button" onclick="openModal('facebook-2')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Facebook Post 3 \--\>  
                    \<div class="social-post facebook-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{facebook\_title\_3}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{facebook\_post\_3}}\</p\>  
                            \<button class="action-button" onclick="openModal('facebook-3')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Facebook Post 4 \--\>  
                    \<div class="social-post facebook-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{facebook\_title\_4}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{facebook\_post\_4}}\</p\>  
                            \<button class="action-button" onclick="openModal('facebook-4')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                \</div\>  
            \</div\>  
              
            \<\!-- Twitter Posts \--\>  
            \<div class="social-platform twitter-section"\>  
                \<h3\>Twitter\</h3\>  
                \<div class="social-grid"\>  
                    \<\!-- Twitter Post 1 \--\>  
                    \<div class="social-post twitter-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{twitter\_title\_1}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{twitter\_post\_1}}\</p\>  
                            \<button class="action-button" onclick="openModal('twitter-1')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Twitter Post 2 \--\>  
                    \<div class="social-post twitter-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{twitter\_title\_2}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{twitter\_post\_2}}\</p\>  
                            \<button class="action-button" onclick="openModal('twitter-2')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Twitter Post 3 \--\>  
                    \<div class="social-post twitter-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{twitter\_title\_3}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{twitter\_post\_3}}\</p\>  
                            \<button class="action-button" onclick="openModal('twitter-3')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Twitter Post 4 \--\>  
                    \<div class="social-post twitter-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{twitter\_title\_4}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{twitter\_post\_4}}\</p\>  
                            \<button class="action-button" onclick="openModal('twitter-4')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                \</div\>  
            \</div\>  
              
            \<\!-- Instagram Posts \--\>  
            \<div class="social-platform instagram-section"\>  
                \<h3\>Instagram\</h3\>  
                \<div class="social-grid"\>  
                    \<\!-- Instagram Post 1 \--\>  
                    \<div class="social-post instagram-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{instagram\_title\_1}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{instagram\_post\_1}}\</p\>  
                            \<button class="action-button" onclick="openModal('instagram-1')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Instagram Post 2 \--\>  
                    \<div class="social-post instagram-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{instagram\_title\_2}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{instagram\_post\_2}}\</p\>  
                            \<button class="action-button" onclick="openModal('instagram-2')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Instagram Post 3 \--\>  
                    \<div class="social-post instagram-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{instagram\_title\_3}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{instagram\_post\_3}}\</p\>  
                            \<button class="action-button" onclick="openModal('instagram-3')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- Instagram Post 4 \--\>  
                    \<div class="social-post instagram-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{instagram\_title\_4}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{instagram\_post\_4}}\</p\>  
                            \<button class="action-button" onclick="openModal('instagram-4')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                \</div\>  
            \</div\>  
              
            \<\!-- LinkedIn Posts \--\>  
            \<div class="social-platform linkedin-section"\>  
                \<h3\>LinkedIn\</h3\>  
                \<div class="social-grid"\>  
                    \<\!-- LinkedIn Post 1 \--\>  
                    \<div class="social-post linkedin-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{linkedin\_title\_1}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{linkedin\_post\_1}}\</p\>  
                            \<button class="action-button" onclick="openModal('linkedin-1')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- LinkedIn Post 2 \--\>  
                    \<div class="social-post linkedin-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{linkedin\_title\_2}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{linkedin\_post\_2}}\</p\>  
                            \<button class="action-button" onclick="openModal('linkedin-2')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- LinkedIn Post 3 \--\>  
                    \<div class="social-post linkedin-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{linkedin\_title\_3}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{linkedin\_post\_3}}\</p\>  
                            \<button class="action-button" onclick="openModal('linkedin-3')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                      
                    \<\!-- LinkedIn Post 4 \--\>  
                    \<div class="social-post linkedin-post"\>  
                        \<div class="post-header"\>  
                            \<h4 class="platform-title"\>{{linkedin\_title\_4}}\</h4\>  
                        \</div\>  
                        \<div class="post-content-preview"\>  
                            \<p class="post-content"\>{{linkedin\_post\_4}}\</p\>  
                            \<button class="action-button" onclick="openModal('linkedin-4')"\>Read More\</button\>  
                        \</div\>  
                    \</div\>  
                \</div\>  
            \</div\>  
        \</div\>  
    \</section\>  
      
    \<\!-- Footer Section \--\>  
    \<footer\>  
        \<div class="container"\>  
            \<p class="footer-slogan" data-key="rendered\_footer\_slogan"\>{{rendered\_footer\_slogan}}\</p\>  
            \<p class="copyright"\>\&copy; {{client\_email}} \<a href="{{client\_website}}" target="\_blank"\>{{client\_name}}\</a\>. All rights reserved.\</p\>  
        \</div\>  
    \</footer\>  
      
    \<\!-- Modals for expanded content \--\>  
    \<div id="modal-container" class="modal-container"\>  
        \<div class="modal-content"\>  
            \<span class="close-modal" onclick="closeModal()"\>\&times;\</span\>  
            \<div id="modal-content-container"\>\</div\>  
        \</div\>  
    \</div\>  
\</body\>  
\</html\>

This HTML file includes:

* Header, banner, bio, blog, and footer sections  
* Dynamic variable injection with `{{key}}` format  
* Parallax background and modal expansion for longform content  
* Social sections per platform using the mapping schema

---

## **🔁 Content Flow Summary**

1. New user is created in `users`, with `projectId` assigned  
2. `project` is created with default content  
3. User logs in and gets a JWT with their `projectId`  
4. Dashboard fetches project data by `projectId`  
5. User edits and saves → updates `content[]`  
6. Site at `/projectId` renders latest `published` content via SSR

---

## **🚀 Deployment & Hosting**

* App deployed as Node web service on Render  
* Uses environment variables:  
  * `MONGODB_URI`  
  * `JWT_SECRET`  
  * `CORS_ORIGIN`  
* Public route: `https://selfcaststudios.com/{projectId}`  
* Server routes:  
  * `GET /api/projects/:projectId`  
  * `PUT /api/projects/:projectId` (for editor)

---

## **✅ Success Criteria**

* Clients can log in and edit only their own content  
* Clients can see a clear, simple editor with limited fields  
* Public-facing sites match template and reflect updates instantly  
* All routes use `/projectId` — no subdomain management needed  
* Data mapping is transparent, scalable, and fully documented

