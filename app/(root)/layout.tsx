import React from 'react';
import Providers from '../../components/providers';

const layout = ({ children }: { children: React.ReactNode }) => {
  return <Providers>{children}</Providers>;
};

export default layout;
