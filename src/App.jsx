import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Sparkles } from 'lucide-react';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import SellProducts from './pages/SellProducts';

export default function App() {
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    // Elegant preloader duration
    const timer = setTimeout(() => {
      setIsPreloading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isPreloading) {
    return (
      <div className="fixed inset-0 z-[100] bg-beauty-cream flex flex-col items-center justify-center text-beauty-dark select-none">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-beauty-accent flex items-center justify-center text-white shadow-md animate-bounce">
            <Sparkles className="w-8 h-8 animate-pulse-subtle" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl tracking-widest text-beauty-dark uppercase leading-none">
              UK STORE
            </h1>
            <p className="text-[10px] text-beauty-taupe tracking-widest font-semibold mt-1">
              INVENTORY SYSTEM
            </p>
          </div>
          <div className="w-24 h-0.5 bg-beauty-rose/40 rounded-full overflow-hidden relative mt-1">
            <div className="absolute top-0 bottom-0 left-0 w-full bg-beauty-accent rounded-full skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/sell-products" element={<SellProducts />} />
        </Routes>
      </Layout>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="!rounded-xl border border-beauty-rose/30 !bg-white !text-beauty-dark !font-sans shadow-md"
        bodyClassName="!text-xs !font-medium"
      />
    </BrowserRouter>
  );
}
