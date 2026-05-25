import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingBag, 
  AlertCircle, 
  Plus, 
  Minus,
  Loader2,
  X,
  Trash2,
  Printer,
  Download,
  CheckCircle,
  Sparkles,
  ShoppingBag as CartIcon
} from 'lucide-react';
import { getProducts, sellMultipleProducts } from '../services/api';
import { ProductCardSkeleton } from '../components/Skeleton';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

export default function SellProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Shopping Cart state: [ { id, name, category, quantity, sell_price, stock, image } ]
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false); // Mobile drawer toggle
  const [checkingOut, setCheckingOut] = useState(false);

  // Invoice Receipt State (For Modal display)
  const [invoice, setInvoice] = useState(null);
  const receiptRef = useRef(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products based on search & tab selection
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.notes && product.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  const cartTotal = cart.reduce((acc, item) => acc + (parseFloat(item.sell_price) * item.quantity), 0);

  // Batch Checkout Submission
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your shopping cart is empty!');
      return;
    }

    try {
      setCheckingOut(true);
      
      // Perform batch sales transaction and stock reduction
      await sellMultipleProducts(cart);
      
      // Celebrate!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D9A78B', '#FAF7F5', '#8D7B70', '#EAD5C9']
      });

      // Prepare Invoice Data before clearing cart
      const newInvoice = {
        invoice_no: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        total: cartTotal
      };

      setInvoice(newInvoice);
      setCart([]); // Clear cart
      toast.success('Sale recorded successfully! Invoice generated.');
      
      // Reload products to update stock quantities
      await loadProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to complete checkout.');
      console.error(err);
    } finally {
      setCheckingOut(false);
    }
  };

  // Export functions
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJpg = () => {
    if (!receiptRef.current) return;
    
    toast.info('Generating JPG image...');
    
    html2canvas(receiptRef.current, { 
      scale: 3, // High resolution crisp text
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false
    }).then(canvas => {
      // Use toBlob for more reliable downloads on PC/Mobile and sandboxed browsers
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to create image blob.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `UK_Store_Invoice_${invoice.invoice_no}.jpg`;
        link.href = url;
        document.body.appendChild(link); // Required for Firefox/some browsers
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        toast.success('Invoice saved as JPG!');
      }, 'image/jpeg', 0.95);
    }).catch(err => {
      toast.error('Failed to export image.');
      console.error(err);
    });
  };

  // BDT formatter helper
  const formatCurrency = (val) => {
    return `৳ ${parseFloat(val).toFixed(2)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-serif tracking-tight text-beauty-dark">
            Point of Sale (POS)
          </h2>
          <p className="text-beauty-taupe text-sm mt-1">
            Build carts, checkout multiple items, and print or export invoices in BDT.
          </p>
        </div>
        
        {/* Floating Mobile Cart Toggle button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="md:hidden relative flex items-center justify-center p-3.5 bg-beauty-taupe text-white rounded-full shadow-lg no-print"
          aria-label="View Cart"
        >
          <CartIcon className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-beauty-accent text-beauty-dark text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
              {cart.reduce((a, i) => a + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Products Display (Left 3/4) */}
        <div className="lg:col-span-3 space-y-6 no-print">
          
          {/* Controls: search and filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex bg-beauty-clay/60 border border-beauty-rose/25 p-1 rounded-xl w-full sm:w-auto overflow-x-auto whitespace-nowrap">
              {['All', 'Skin Care', 'Body Care', 'Hair Care'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200
                    ${selectedCategory === category 
                      ? 'bg-white text-beauty-dark shadow-xs' 
                      : 'text-beauty-dark/60 hover:text-beauty-dark hover:bg-white/30'
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-beauty-taupe">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search beauty items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="beauty-input pl-10 pr-10 h-[42px]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-beauty-taupe/60 hover:text-beauty-dark"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Grid Products list */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-beauty-rose/20 p-12 text-center max-w-md mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-full bg-beauty-cream flex items-center justify-center text-beauty-taupe/40 mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-beauty-dark font-serif">No Products Found</h3>
              <p className="text-xs text-beauty-taupe mt-1.5 leading-relaxed">
                Try clearing filters or search term to load skincare products.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock < 5;
                const cartItem = cart.find(item => item.id === product.id);
                const qtyInCart = cartItem ? cartItem.quantity : 0;
                
                return (
                  <div 
                    key={product.id}
                    className="bg-white rounded-2xl border border-beauty-rose/20 shadow-xs overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-md hover:border-beauty-rose/40"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="h-44 bg-beauty-cream relative overflow-hidden border-b border-beauty-rose/10">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        
                        <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[10px] font-bold text-beauty-dark px-2.5 py-1 rounded-full shadow-xs border border-white/50">
                          {product.category}
                        </span>

                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          {isOutOfStock ? (
                            <span className="bg-rose-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="bg-amber-400 text-beauty-dark text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1 animate-pulse-subtle">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Low Stock ({product.stock})
                            </span>
                          ) : (
                            <span className="bg-beauty-sage/95 backdrop-blur-xs text-beauty-dark text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs border border-white/50">
                              {product.stock} Available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5 space-y-2">
                        <h3 className="font-serif font-bold text-base text-beauty-dark leading-snug truncate group-hover:text-beauty-accent transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-beauty-taupe line-clamp-2 h-8 leading-relaxed">
                          {product.notes || 'No description available.'}
                        </p>
                      </div>
                    </div>

                    {/* Footer / POS Actions */}
                    <div className="px-5 pb-5 pt-3 border-t border-beauty-rose/10 bg-beauty-cream/15 flex items-center justify-between">
                      <div className="text-left">
                        <span className="block text-[9px] font-bold text-beauty-taupe/80 uppercase">Sell Price</span>
                        <span className="font-bold text-beauty-dark text-sm">
                          {formatCurrency(product.sell_price)}
                        </span>
                      </div>

                      {isOutOfStock ? (
                        <button
                          disabled
                          className="py-1.5 px-3 bg-beauty-clay/60 border border-beauty-rose/25 text-beauty-taupe/65 text-xs font-semibold rounded-lg cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      ) : qtyInCart > 0 ? (
                        <div className="flex items-center border border-beauty-accent bg-white rounded-lg overflow-hidden shrink-0">
                          <button
                            onClick={() => updateCartQty(product.id, -1, product.stock)}
                            className="px-2 py-1.5 hover:bg-beauty-cream text-beauty-dark transition-colors"
                            aria-label="Decrease Qty"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-beauty-dark select-none">
                            {qtyInCart}
                          </span>
                          <button
                            onClick={() => updateCartQty(product.id, 1, product.stock)}
                            className="px-2 py-1.5 hover:bg-beauty-cream text-beauty-dark transition-colors"
                            aria-label="Increase Qty"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="py-1.5 px-4 bg-beauty-taupe hover:bg-beauty-dark text-white rounded-lg text-xs font-semibold tracking-wider transition-all"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shopping Cart Drawer/Panel (Right 1/4) */}
        {/* Desktop display */}
        <div className="hidden md:block bg-white/70 backdrop-blur-md rounded-2xl border border-beauty-rose/30 p-5 shadow-xs space-y-6 lg:sticky lg:top-8 h-[calc(100vh-11rem)] max-h-[700px] flex flex-col justify-between no-print">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-beauty-rose/10 pb-3">
              <h3 className="font-serif font-bold text-lg text-beauty-dark flex items-center gap-2">
                <CartIcon className="w-5 h-5 text-beauty-taupe" />
                Shopping Cart
              </h3>
              {cart.length > 0 && (
                <span className="bg-beauty-rose text-beauty-dark text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              )}
            </div>

            {/* Cart Items list */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-beauty-taupe/65">
                <CartIcon className="w-10 h-10 stroke-1 mb-2 text-beauty-rose" />
                <p className="text-xs">Cart is empty.</p>
                <p className="text-[10px] mt-0.5">Click "Add to Cart" to start adding skincare products.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-beauty-cream/20 border border-beauty-rose/10 hover:border-beauty-rose/20 transition-all">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-10 h-10 object-cover rounded-md border border-beauty-rose/20 shrink-0 bg-beauty-cream"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-beauty-dark truncate">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-beauty-taupe">
                        <span>{formatCurrency(item.sell_price)} x {item.quantity}</span>
                        <span className="font-bold text-beauty-dark">{formatCurrency(item.sell_price * item.quantity)}</span>
                      </div>
                    </div>
                    
                    {/* Delete item */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:text-rose-500 text-beauty-taupe/40 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart totals & submit */}
          {cart.length > 0 && (
            <div className="border-t border-beauty-rose/20 pt-4 space-y-4 bg-white shrink-0">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-beauty-taupe">Grand Total</span>
                <span className="font-serif font-bold text-lg text-beauty-accent">{formatCurrency(cartTotal)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  disabled={checkingOut}
                  className="px-3 py-2.5 border border-beauty-rose hover:bg-rose-50 hover:border-rose-200 text-beauty-dark/70 hover:text-rose-500 rounded-xl transition-all"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-beauty-taupe hover:bg-beauty-dark text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs disabled:opacity-50"
                >
                  {checkingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking Out...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Checkout
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Cart Slider Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end no-print">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-80 max-w-full bg-white h-full p-5 shadow-2xl flex flex-col justify-between animate-fade-in z-10">
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-beauty-rose/10 pb-3">
                <h3 className="font-serif font-bold text-lg text-beauty-dark flex items-center gap-2">
                  <CartIcon className="w-5 h-5 text-beauty-taupe" />
                  Cart ({cart.reduce((a, i) => a + i.quantity, 0)})
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-beauty-taupe hover:text-beauty-dark rounded-md hover:bg-beauty-cream transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-beauty-taupe/65">
                  <CartIcon className="w-10 h-10 stroke-1 mb-2 text-beauty-rose" />
                  <p className="text-xs">Cart is empty.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-beauty-cream/20 border border-beauty-rose/10">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-10 h-10 object-cover rounded-md shrink-0 bg-beauty-cream"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-beauty-dark truncate">{item.name}</h4>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-beauty-taupe">
                          <span>{formatCurrency(item.sell_price)} x {item.quantity}</span>
                          <span className="font-bold text-beauty-dark">{formatCurrency(item.sell_price * item.quantity)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-beauty-taupe/40 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-beauty-rose/20 pt-4 space-y-4 bg-white">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-beauty-taupe">Grand Total</span>
                  <span className="font-serif font-bold text-lg text-beauty-accent">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="px-3 py-2.5 border border-beauty-rose text-beauty-dark/70 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      handleCheckout();
                      setIsCartOpen(false);
                    }}
                    className="flex-1 py-2.5 bg-beauty-taupe hover:bg-beauty-dark text-white rounded-xl text-xs font-semibold uppercase tracking-wider text-center"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {invoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print-overlay">
          
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col justify-between my-8 print-modal-container">
            
            {/* Scrollable Receipt Area */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              
              {/* Receipt Node Captured by html2canvas */}
              <div 
                ref={receiptRef} 
                id="invoice-receipt" 
                style={{
                  backgroundColor: '#ffffff',
                  color: '#2C2523',
                  border: '1px solid rgba(234, 213, 201, 0.4)',
                  borderRadius: '16px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  padding: '24px',
                  lineHeight: '1.5',
                  boxShadow: 'none',
                  width: '100%',
                  maxWidth: '380px',
                  margin: '0 auto',
                  boxSizing: 'border-box'
                }}
              >
                {/* Header branding */}
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #EAD5C9', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: 'serif', fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.05em', color: '#2C2523', textTransform: 'uppercase', margin: '0 0 6px 0', lineHeight: '1' }}>
                    UK STORE
                  </h3>
                  <p style={{ fontSize: '10px', color: '#8D7B70', fontFamily: 'sans-serif', letterSpacing: '0.025em', margin: '0 0 4px 0' }}>
                    Premium Skincare, Body & Hair Care
                  </p>
                  <p style={{ fontSize: '9px', color: '#8D7B70', opacity: 0.8, fontFamily: 'sans-serif', margin: '0' }}>
                    Musa Market, Beanibazar, Sylhet | Support: info@ukstore.com
                  </p>
                </div>

                {/* Receipt Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px', borderBottom: '1px dashed #EAD5C9', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Receipt No:</span>
                    <span style={{ fontWeight: 'bold' }}>{invoice.invoice_no}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date:</span>
                    <span>{invoice.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8D7B70' }}>
                    <span>Currency:</span>
                    <span>BDT (৳)</span>
                  </div>
                </div>

                {/* Table Items */}
                <div style={{ borderBottom: '1px dashed #EAD5C9', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', color: '#8D7B70', marginBottom: '8px' }}>
                    <span>Item Description</span>
                    <span style={{ textAlign: 'right' }}>Total</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {invoice.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ maxWidth: '200px' }}>
                          <span style={{ display: 'block', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                          <span style={{ fontSize: '9px', color: '#8D7B70' }}>
                            {formatCurrency(item.sell_price)} x {item.quantity}
                          </span>
                        </div>
                        <span style={{ fontWeight: 'bold', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {formatCurrency(item.sell_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 'bold', paddingTop: '6px' }}>
                  <span style={{ textTransform: 'uppercase' }}>Grand Total:</span>
                  <span style={{ color: '#D9A78B', fontSize: '16px' }}>{formatCurrency(invoice.total)}</span>
                </div>

                {/* Footer notes */}
                <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px dashed #EAD5C9', fontSize: '8px', color: '#8D7B70', marginTop: '16px', lineHeight: '1.4' }}>
                  <p style={{ fontWeight: 'bold', color: '#2C2523', fontSize: '10px', margin: '0 0 4px 0' }}>Thank You for Shopping!</p>
                  <p style={{ margin: '0 0 2px 0' }}>Exchange within 7 days with original receipt.</p>
                  <p style={{ margin: '0' }}>System by UK Store Inventory Manager</p>
                </div>

              </div>

            </div>

            {/* Receipt Modal Footer Operations */}
            <div className="bg-beauty-cream/30 p-4 border-t border-beauty-rose/15 flex gap-2 shrink-0 print-actions no-print">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-beauty-rose hover:bg-beauty-cream text-beauty-dark rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadJpg}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-beauty-accent hover:bg-beauty-taupe hover:text-white text-beauty-dark rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                Save JPG
              </button>
              <button
                onClick={() => setInvoice(null)}
                className="px-3.5 py-2.5 bg-beauty-taupe hover:bg-beauty-dark text-white rounded-xl transition-all"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Embedded print friendly stylesheet */}
      <style>{`
        @media print {
          /* Hide sidebar, header, navigation, and everything inside body that is marked no-print */
          aside, header, .no-print, nav, button {
            display: none !important;
          }
          
          /* Remove page layout padding and margins */
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          /* Force modal overlay backdrop to be static and transparent */
          .print-overlay {
            position: absolute !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
            overflow: visible !important;
            z-index: 9999 !important;
          }

          /* Strip modal card styling */
          .print-modal-container {
            border: none !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            display: block !important;
          }
        }
      `}</style>

    </div>
  );
}
