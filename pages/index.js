import Head from 'next/head';
import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from './_app';

export default function Home() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <Head>
        <title>Self Cast Studios | Client Platform</title>
        <meta name="description" content="Self Cast Studios client platform for personal brand sites" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {/* Header/Nav */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Self Cast Studios</h1>
            </div>
            <div>
              {!loading && (
                isAuthenticated ? (
                  <Link href="/dashboard" legacyBehavior>
                    <a className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      Dashboard
                    </a>
                  </Link>
                ) : (
                  <Link href="/login" legacyBehavior>
                    <a className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      Sign In
                    </a>
                  </Link>
                )
              )}
            </div>
          </div>
        </header>

        {/* Hero section */}
        <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Welcome to the Self Cast Studios Client Platform
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Manage your personalized brand site with our easy-to-use content management system.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/login" legacyBehavior>
              <a className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                Sign In to Your Dashboard
              </a>
            </Link>
          </div>
        </div>

        {/* Feature section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Platform Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to manage your online presence
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                With Self Cast Studios, you can easily edit your personal brand site and keep your content fresh.
              </p>
            </div>

            <div className="mt-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto mb-4">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Easy Content Editing</h3>
                  <p className="mt-2 text-base text-gray-500 text-center">
                    Update your bio, social media posts, and other content with our simple interface.
                  </p>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto mb-4">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Instant Preview</h3>
                  <p className="mt-2 text-base text-gray-500 text-center">
                    See how your changes look before publishing them to your live site.
                  </p>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto mb-4">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Secure Access</h3>
                  <p className="mt-2 text-base text-gray-500 text-center">
                    Your content is protected with secure login and authentication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} Self Cast Studios. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
