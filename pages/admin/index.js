import { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AuthContext } from '../_app';

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch all projects
  useEffect(() => {
    async function fetchProjects() {
      if (!user || user.role !== 'admin') return;
      
      try {
        const res = await fetch('/api/projects');
        
        if (!res.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await res.json();
        setProjects(data.projects);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (user && user.role === 'admin') {
      fetchProjects();
    }
  }, [user]);

  // Loading state
  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Admin Dashboard | Self Cast Studios</title>
      </Head>

      {/* Admin Header */}
      <header className="bg-indigo-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Self Cast Studios Admin</h1>
          <div className="flex items-center">
            {user && (
              <div className="flex items-center">
                <span className="text-white mr-4">
                  {user.email}
                </span>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    router.push('/login');
                  }}
                  className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-800 bg-white hover:bg-indigo-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Existing Projects</h2>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500">No projects found. Projects must be created directly in MongoDB.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <li key={project._id}>
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-indigo-600 truncate">{project.name}</p>
                        <p className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="truncate">Project ID: {project.projectId}</span>
                        </p>
                        <p className="mt-1 flex items-center text-sm text-gray-500">
                          <span>Last updated: {new Date(project.updatedAt).toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Link href={`/admin/projects/${project.projectId}/edit`} legacyBehavior>
                          <a className="text-indigo-600 hover:text-indigo-900">Edit</a>
                        </Link>
                        <a 
                          href={`/${project.projectId}`}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="text-green-600 hover:text-green-900"
                        >
                          View Site
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
