'use client';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

const Home = () => {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
    if (status === 'authenticated') {
      console.log('User session: ', session);
    }
  }, [status]);
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <button onClick={() => signOut()} className="bg-red-500 text-white p-2 rounded">
        Logout
      </button>
    </div>
  );
};

export default Home;
