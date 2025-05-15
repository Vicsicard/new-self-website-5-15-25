import Head from 'next/head';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { AuthContext } from '../../pages/_app';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  // Logout function
  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    router.push('/login');
  };

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
                  onClick={handleLogout}
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
          {children}
        </div>
      </main>
    </div>
  );
}
