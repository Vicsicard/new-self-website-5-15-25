import { useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AuthContext } from '../../pages/_app';
import { FaSave, FaEye, FaInfoCircle } from 'react-icons/fa';

export default function DashboardLayout({ children, onSave }) {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex px-2 lg:px-0">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">Self Cast Studios</h1>
              </div>
            </div>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center">
                  <span className="text-gray-700 mr-4">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar & Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow h-screen fixed">
          <div className="p-4">
            <p className="text-lg font-semibold border-b pb-2 mb-4">Dashboard</p>
            <nav className="mt-5">
              <Link href="/dashboard" legacyBehavior>
                <a className={`block py-2 px-4 rounded ${router.pathname === '/dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Overview
                </a>
              </Link>
              <Link href="/dashboard/edit" legacyBehavior>
                <a className={`block py-2 px-4 rounded ${router.pathname === '/dashboard/edit' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Edit Content
                </a>
              </Link>
              <Link href="/dashboard/preview" legacyBehavior>
                <a className={`block py-2 px-4 rounded ${router.pathname === '/dashboard/preview' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Preview Site
                </a>
              </Link>
              
              {/* Save Changes Button - Only show on edit page */}
              {router.pathname === '/dashboard/edit' && (
                <div className="mt-8">
                  <div className="bg-yellow-50 p-3 rounded-md mb-3 border border-yellow-200">
                    <div className="flex items-start">
                      <FaInfoCircle className="text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                      <p className="text-sm text-yellow-700">
                        Remember to save your changes before previewing your site.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onSave}
                    className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <FaSave className="mr-2" />
                    Save Changes
                  </button>
                  <a 
                    href={`${process.env.NEXT_PUBLIC_CLIENT_DOMAIN || 'https://clients.selfcaststudios.com'}/${user?.projectId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <FaEye className="mr-2" />
                    View Public Site
                  </a>
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
