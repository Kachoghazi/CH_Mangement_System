import React from 'react';
import Providers from '../../components/providers';
import Header from '@/components/Header';

const layout = ({ children }: { children: React.ReactNode }) => {
  return <Providers>
    <Header />
    {children}
    </Providers>;
};

export default layout;
