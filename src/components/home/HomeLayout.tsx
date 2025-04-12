
import React from 'react';

interface HomeLayoutProps {
  children: React.ReactNode;
}

const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col w-full overflow-x-hidden">
      {children}
    </div>
  );
};

export default HomeLayout;
