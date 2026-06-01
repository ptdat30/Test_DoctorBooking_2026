import React from 'react';
import Header from './Header';
import Footer from './common/Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-shift">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-segesta-skyblue/30 blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-segesta-peach/25 blur-[100px] pointer-events-none -z-10"></div>

      <Header />
      
      <main className="pt-20">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
