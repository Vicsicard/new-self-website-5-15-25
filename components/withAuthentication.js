import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../pages/_app';

// HOC to protect authenticated routes
export default function withAuthentication(Component) {
  return function AuthenticatedComponent(props) {
    const { user, isAuthenticated, loading } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      );
    }

    // If authenticated, render the component
    return isAuthenticated ? <Component {...props} /> : null;
  };
}
