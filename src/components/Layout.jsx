import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ShoppingBag, 
  Menu, 
  X, 
  Database, 
  Sparkles 
} from 'lucide-react';
import { isApiConfigured } from '../services/api';

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const isLive = isApiConfigured();

  const navItems = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/add-product', name: 'Add Product', icon: PlusCircle },
    { to: '/sell-products', name: 'Sell Products', icon: ShoppingBag },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col md:flex-row text-beauty-dark font-sans">
      
      {/* Mobile Header Bar */}
      <header className="md:hidden glass-panel border-b border-beauty-rose/20 px-6 py-4 flex items-center justify-between sticky top-0 z-40 no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-beauty-accent flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-serif font-semibold text-lg tracking-wider text-beauty-dark">
            UK STORE
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-beauty-dark hover:bg-beauty-rose/20 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (Desktop and Mobile Drawer combined) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-beauty-clay border-r border-beauty-rose/30 p-6 flex flex-col justify-between z-50 transition-transform duration-300 md:translate-x-0 md:sticky md:h-screen md:top-0 no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-beauty-accent flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl tracking-wider leading-none text-beauty-dark">
                UK STORE
              </h1>
              <p className="text-[10px] text-beauty-taupe tracking-widest font-semibold mt-1">
                INVENTORY SYSTEM
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
                      ? 'bg-beauty-rose text-beauty-dark shadow-xs font-semibold' 
                      : 'text-beauty-dark/70 hover:bg-beauty-rose/30 hover:text-beauty-dark'
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

        {/* Database Status indicator */}
        <div className="border-t border-beauty-rose/30 pt-6">
          <div className="p-4 rounded-xl bg-white/50 border border-beauty-rose/20 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 ${isLive ? 'text-beauty-accent' : 'text-beauty-taupe/60'}`} />
              <span className="text-xs font-semibold tracking-wide uppercase text-beauty-dark/80">
                Database Mode
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-medium text-beauty-dark">
                {isLive ? 'SheetDB Active' : 'Local Fallback'}
              </span>
            </div>
            
            {!isLive && (
              <p className="text-[10px] text-beauty-dark/50 leading-relaxed mt-1">
                Running in preview mode using browser local storage.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

    </div>
  );
}
