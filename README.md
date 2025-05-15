# Self Cast Studios Client CMS + Static Site Platform

This platform allows Self Cast Studios clients to manage and edit their personal brand sites through a secure dashboard.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

## Overview

The Self Cast Studios Client CMS is a full-stack Next.js application that provides the following capabilities:
- Secure client login to a personalized dashboard
- Content editing interface for personal brand sites
- Live preview functionality
- Path-based client site routing (`/{projectId}`)
- Static site generation for client brand sites
- MongoDB integration for content storage

## Features

- **Authentication System**: JWT-based authentication with secure HttpOnly cookies
- **Role-Based Access**: Client users can only see and edit their own projects
- **Content Management**: Intuitive interface for updating site content
- **Live Preview**: Real-time preview of site changes before publishing
- **Responsive Design**: All pages are fully responsive for desktop and mobile

## Tech Stack

- **Framework**: Next.js (Pages Router)
- **Database**: MongoDB Atlas
- **Authentication**: Custom JWT-based auth
- **Deployment**: Render
- **Styling**: Tailwind CSS

## Local Development Setup

1. Clone the repository
```bash
git clone <repository-url>
cd selfcast-platform
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (create a `.env.local` file)
```
MONGODB_URI=mongodb://localhost:27017/selfcast
MONGODB_DB=selfcast
JWT_SECRET=your-secret-key-here
```

4. Run the development server
```bash
npm run dev
```

5. Access the application
- Visit `http://localhost:3000` for the homepage
- Visit `http://localhost:3000/login` for the login page

## Environment Variables

- `MONGODB_URI`: Connection string for your MongoDB database
- `MONGODB_DB`: Name of the MongoDB database
- `JWT_SECRET`: Secret key for JWT token generation and verification
- `NODE_ENV`: Environment setting (development/production)

## Deployment

This application is configured to deploy on Render. The `render.yaml` file includes all necessary configuration.

### Deployment Steps

1. Push your code to your Git repository
2. Create a new web service on Render
3. Connect to your Git repository
4. Select "Blueprint" when creating your service to use the `render.yaml` configuration

The application will be deployed with a MongoDB database instance and all required environment variables.

## Project Structure

```
selfcast-platform/
├── components/         # Reusable React components
│   └── dashboard/      # Dashboard specific components
├── lib/                # Utility libraries
│   └── db.js           # Database connection
├── middleware/         # Custom middleware
│   └── withAuth.js     # Authentication middleware
├── models/             # Database models
│   ├── Project.js      # Project model
│   └── User.js         # User model
├── pages/              # Next.js pages
│   ├── api/            # API endpoints
│   ├── dashboard/      # Dashboard pages
│   ├── _app.js         # App component with auth context
│   ├── index.js        # Homepage
│   ├── login.js        # Login page
│   └── [projectId].js  # Dynamic client site route
├── public/             # Static files
├── styles/             # Global styles
├── utils/              # Utility functions
├── render.yaml         # Render deployment configuration
└── README.md           # Project documentation
```

## Content Mapping

The platform uses a key-value approach for content management. Each key maps to both a UI input field and a template output placeholder. Refer to the PRD for the complete mapping reference.
