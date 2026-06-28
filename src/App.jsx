import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Store } from 'lucide-react';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import SellProducts from './pages/SellProducts';
import Cart from './pages/Cart';
import Expenses from './pages/Expenses';
import Parties from './pages/Parties';
import Investments from './pages/Investments';
import { toast } from 'react-toastify';

export default function App() {
  const [isPreloading, setIsPreloading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Elegant preloader duration
    const timer = setTimeout(() => {
      setIsPreloading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('This product is out of stock!');
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.warn(`Cannot add more. Only ${product.stock} units available in stock.`);
        return;
      }
      setCart(prev => prev.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
      toast.success(`Added another ${product.name} to cart.`);
    } else {
      setCart(prev => [...prev, { ...product, quantity: 1 }]);
      toast.success(`${product.name} added to cart.`);
    }
  };

  const updateCartQty = (productId, change, maxStock) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + change;
          if (newQty <= 0) return null; // mark for deletion
          if (newQty > maxStock) {
            toast.warn(`Only ${maxStock} units available.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    toast.info('Item removed from cart.');
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Cart cleared.');
  };

  if (isPreloading) {
    return (
      <div className="fixed inset-0 z-[100] bg-beauty-cream flex flex-col items-center justify-center text-beauty-dark select-none">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-beauty-accent flex items-center justify-center text-white shadow-md animate-bounce">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-2xl tracking-widest text-beauty-dark uppercase leading-none">
              UK STORE
            </h1>
            <p className="text-[10px] text-beauty-taupe tracking-widest font-semibold mt-1">
              BUSINESS MANAGEMENT SYSTEM
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
      <Layout cart={cart}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route 
            path="/sell-products" 
            element={
              <SellProducts 
                cart={cart} 
                addToCart={addToCart} 
                updateCartQty={updateCartQty} 
              />
            } 
          />
          <Route 
            path="/cart" 
            element={
              <Cart 
                cart={cart} 
                updateCartQty={updateCartQty} 
                removeFromCart={removeFromCart} 
                clearCart={clearCart} 
              />
            } 
          />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/parties" element={<Parties />} />
          <Route path="/investments" element={<Investments />} />
        </Routes>
      </Layout>
      <ToastContainer 
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="!rounded-2xl !border !border-white/10 !bg-[#1a1738] !text-white !font-sans !shadow-2xl !backdrop-blur-md"
        bodyClassName="!text-sm !font-semibold !tracking-wide"
        progressStyle={{ height: '3px', borderRadius: '9999px' }}
      />
    </BrowserRouter>
  );
}
