import { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/dashboard/Layout';
import { AuthContext } from '../_app';

export default function Dashboard() {
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

  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard | Self Cast Studios</title>
      </Head>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Your Dashboard</h1>

        {project ? (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">Your Site</h2>
              <p className="text-gray-700">
                Project Name: <span className="font-medium">{project.name}</span>
              </p>
              <p className="text-gray-700 mt-1">
                Public URL:{' '}
                <a
                  href={`https://selfcaststudios.com/${project.projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://selfcaststudios.com/{project.projectId}
                </a>
              </p>
              <p className="text-gray-700 mt-1">
                Last Updated: <span className="font-medium">{new Date(project.updatedAt).toLocaleString()}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-lg text-gray-700 mb-3">Edit Your Content</h3>
                <p className="text-gray-600 mb-4">
                  Update your site content using our simple editor interface.
                </p>
                <button
                  onClick={() => router.push('/dashboard/edit')}
                  className="btn btn-primary"
                >
                  Go to Editor
                </button>
              </div>

              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-lg text-gray-700 mb-3">Preview Your Site</h3>
                <p className="text-gray-600 mb-4">
                  See how your website looks before publishing changes.
                </p>
                <button
                  onClick={() => router.push('/dashboard/preview')}
                  className="btn btn-secondary"
                >
                  Preview Site
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            No project has been assigned to your account yet. Please contact support.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
