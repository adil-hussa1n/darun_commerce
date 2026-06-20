import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ShoppingBag, 
  Menu, 
  X, 
  Store,
  Coins
} from 'lucide-react';

export default function Layout({ children, cart = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/add-product', name: 'Product Management', icon: PlusCircle },
    { to: '/sell-products', name: 'Create Sale', icon: ShoppingBag },
    { to: '/expenses', name: 'Expenses', icon: Coins },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col md:flex-row text-beauty-dark font-sans">
      
      {/* Mobile Header Bar */}
      <header className="md:hidden glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40 no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-beauty-accent flex items-center justify-center text-white shadow-sm">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-sans font-extrabold text-lg tracking-wider text-beauty-dark">
            UK STORE
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-beauty-dark hover:bg-beauty-rose/40 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (Desktop and Mobile Drawer combined) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-beauty-clay border-r border-white/5 p-6 flex flex-col justify-between z-50 transition-transform duration-300 md:translate-x-0 md:sticky md:h-screen md:top-0 no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            {/* Business Store Logo */}
            <div className="w-10 h-10 rounded-xl bg-beauty-accent flex items-center justify-center text-white shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-beauty-accent to-purple-700 opacity-80" />
              <Store className="w-5 h-5 relative z-10" />
            </div>
            <div>
              <h1 className="font-sans font-black text-xl tracking-wider leading-none text-beauty-dark">
                UK STORE
              </h1>
              <p className="text-[10px] text-beauty-taupe tracking-widest font-semibold mt-1">
                BUSINESS MANAGEMENT SYSTEM
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200
                    ${isActive 
                      ? 'bg-beauty-accent text-white shadow-md font-semibold' 
                      : 'text-beauty-taupe hover:bg-beauty-rose/40 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
        {/* Footer badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-beauty-accent/10 border border-beauty-accent/25">
          <div className="w-2 h-2 rounded-full bg-beauty-accent animate-pulse" />
          <span className="text-[10px] text-beauty-accent font-semibold">Free Trial Version</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

    </div>
  );
}
