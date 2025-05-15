import Head from 'next/head';
import Link from 'next/link';

export default function Error({ statusCode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <Head>
        <title>Error | Self Cast Studios</title>
      </Head>
      
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">
          {statusCode || 'Error'}
        </h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-6">
          Something went wrong
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          {statusCode
            ? `An error ${statusCode} occurred on the server`
            : 'An error occurred on the client'}
        </p>
        <Link href="/" legacyBehavior>
          <a className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Return to Homepage
          </a>
        </Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
