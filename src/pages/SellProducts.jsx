import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag as CartIcon, 
  Plus, 
  Minus,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info
} from 'lucide-react';
import { getProducts } from '../services/api';
import { TableRowSkeleton } from '../components/Skeleton';
import { toast } from 'react-toastify';

export default function SellProducts({ cart = [], addToCart, updateCartQty }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadProducts = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      if (!isSilent) {
        toast.error('Failed to load products.');
      }
      console.error(err);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProducts();
    const interval = setInterval(() => {
      loadProducts(true);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Reset pagination on search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (product.name || '').toLowerCase().includes(query) ||
      (product.category || '').toLowerCase().includes(query) ||
      (product.brand || '').toLowerCase().includes(query) ||
      (product.serial_no || '').toLowerCase().includes(query) ||
      (product.model_barcode || '').toLowerCase().includes(query) ||
      (product.ml_mg || '').toLowerCase().includes(query) ||
      (product.id || '').toLowerCase().includes(query)
    );
  });

  // Paginated subset
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // BDT formatter helper
  const formatCurrency = (val) => {
    return `৳\u00a0${parseFloat(val).toFixed(2)}`;
  };

  const totalItemsInCart = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Create Sale
          </h2>
          {/* Highlighted instruction banner */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-beauty-accent/10 border border-beauty-accent/25 w-fit">
            <Info className="w-4 h-4 text-beauty-accent shrink-0" />
            <p className="text-beauty-accent text-sm font-semibold">
              Add items to your invoice, then click{' '}
              <span className="text-white font-bold">"View Invoice"</span>{' '}
              to confirm.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Controls: Search Bar */}
        <div className="flex justify-start w-full">
          <div className="relative w-full max-w-md flex items-center">
            <Search 
              className="absolute text-beauty-taupe pointer-events-none shrink-0" 
              style={{ left: '14px', width: '16px', height: '16px' }}
            />
            <input
              type="text"
              placeholder="Search items by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all duration-200 placeholder:text-beauty-taupe/40 text-sm"
              style={{ paddingLeft: '40px', paddingRight: '40px' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute text-beauty-taupe/65 hover:text-white cursor-pointer flex items-center justify-center"
                style={{ right: '14px', width: '16px', height: '16px' }}
                aria-label="Clear Search"
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Table Products list */}
        {loading ? (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-beauty-rose shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-beauty-taupe">
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">Serial no</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">Category</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">Brand</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">Product Name</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">model / barcode</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">ml/mg</th>
                  <th className="py-4 px-6 font-semibold text-right whitespace-nowrap">Stock</th>
                  <th className="py-4 px-6 font-semibold text-right whitespace-nowrap">Sell Price</th>
                  <th className="py-4 px-6 font-semibold text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </tbody>
            </table>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-beauty-rose rounded-2xl border border-white/5 p-12 text-center max-w-md mx-auto shadow-md">
            <div className="w-16 h-16 rounded-full bg-beauty-cream flex items-center justify-center text-beauty-taupe/40 mx-auto mb-4">
              <CartIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Products Found</h3>
            <p className="text-xs text-beauty-taupe mt-1.5 leading-relaxed">
              Try clearing filters or search term to load products.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-beauty-rose shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>                <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-beauty-taupe">
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">Serial no</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">Category</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">Brand</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">Product Name</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">model / barcode</th>
                  <th className="py-4 px-6 font-semibold whitespace-nowrap">ml/mg</th>
                  <th className="py-4 px-6 font-semibold text-right whitespace-nowrap">Stock</th>
                  <th className="py-4 px-6 font-semibold text-right whitespace-nowrap">Sell Price</th>
                  <th className="py-4 px-6 font-semibold text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/90">
                {paginatedProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock < 5;
                  const cartItem = cart.find(item => item.id === product.id);
                  const qtyInCart = cartItem ? cartItem.quantity : 0;
                  
                  return (
                    <tr key={product.id} className="hover:bg-beauty-blush/30 transition-colors">
                      {/* Serial no */}
                      <td className="py-3 px-6 font-mono text-[10px] text-beauty-taupe">
                        {product.serial_no || '—'}
                      </td>
                      
                      {/* Category */}
                      <td className="py-3 px-6 text-beauty-taupe">
                        {product.category || '—'}
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-6 text-beauty-taupe">
                        {product.brand || '—'}
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-6 max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={product.image || '/logo.png'} 
                            alt={product.name} 
                            className="w-8 h-8 object-cover rounded-lg border border-white/10 bg-beauty-cream shrink-0"
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = '/logo.png';
                            }}
                          />
                          <div className="font-semibold text-white truncate">{product.name}</div>
                        </div>
                      </td>

                      {/* Model / barcode */}
                      <td className="py-3 px-6 text-beauty-taupe font-mono text-[10px]">
                        {product.model_barcode || '—'}
                      </td>

                      {/* ml/mg */}
                      <td className="py-3 px-6 text-beauty-taupe">
                        {product.ml_mg || '—'}
                      </td>
                      
                      {/* Stock status */}
                      <td className="py-3 px-6 text-right">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/25 animate-pulse-subtle">
                            Low Stock ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {product.stock}
                          </span>
                        )}
                      </td>
                      
                      {/* Sell Price */}
                      <td className="py-3 px-6 text-right font-bold text-white whitespace-nowrap">
                        {formatCurrency(product.sell_price)}
                      </td>
                      
                      {/* Action controls */}
                      <td className="py-3 px-6 text-center">
                        {isOutOfStock ? (
                          <span className="text-[11px] font-semibold text-beauty-taupe/40">Sold Out</span>
                        ) : qtyInCart > 0 ? (
                          <div className="inline-flex items-center border border-white/10 bg-beauty-cream/50 rounded-lg overflow-hidden shrink-0">
                            <button
                              onClick={() => updateCartQty(product.id, -1, product.stock)}
                              className="px-2.5 py-1.5 hover:bg-beauty-blush text-white transition-colors cursor-pointer"
                              aria-label="Decrease Qty"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-white select-none">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => updateCartQty(product.id, 1, product.stock)}
                              className="px-2.5 py-1.5 hover:bg-beauty-blush text-white transition-colors cursor-pointer"
                              aria-label="Increase Qty"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="py-1.5 px-4 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#151030] rounded-b-2xl gap-3">
                {/* Left: page controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-white/10 rounded-xl text-white hover:bg-beauty-blush disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-semibold text-white whitespace-nowrap">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-white/10 rounded-xl text-white hover:bg-beauty-blush disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Right: View Invoice button */}
                <Link
                  to="/cart"
                  className="relative flex items-center justify-center gap-2 flex-1 max-w-xs py-2.5 px-6 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-md"
                  aria-label="View Invoice"
                >
                  <FileText className="w-4 h-4" />
                  View Invoice
                  {totalItemsInCart > 0 && (
                    <span className="bg-white text-beauty-accent font-bold px-2 py-0.5 rounded-full text-xs animate-pulse">
                      {totalItemsInCart}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
