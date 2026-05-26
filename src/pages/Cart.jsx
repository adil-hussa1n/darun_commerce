import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag as CartIcon, 
  Trash2, 
  Printer, 
  Download, 
  CheckCircle, 
  Loader2, 
  X, 
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { sellMultipleProducts } from '../services/api';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

export default function Cart({ cart, updateCartQty, removeFromCart, clearCart }) {
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const receiptRef = useRef(null);

  const phoneRegex = /^01[3-9]\d{8}$/;
  const isPhoneValid = phoneRegex.test(customerPhone);

  const cartTotal = cart.reduce((acc, item) => acc + (parseFloat(item.sell_price) * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your shopping cart is empty!');
      return;
    }

    if (!isPhoneValid) {
      toast.error('Enter a valid 11-digit phone number (e.g. 01711223344)');
      return;
    }

    try {
      setCheckingOut(true);
      
      // Perform batch sales transaction and stock reduction
      const res = await sellMultipleProducts(cart, customerPhone);
      
      // Celebrate!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#915EFF', '#151030', '#aaa6c9', '#ffffff']
      });

      // Prepare Invoice Data before clearing cart
      const newInvoice = {
        invoice_no: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        total: cartTotal
      };

      setInvoice(newInvoice);
      clearCart(); // Clear cart state ONLY on successful checkout
      if (res && res.local) {
        toast.warning('Network issue — sale recorded locally. Will sync later.');
      } else {
        toast.success('Sale recorded successfully! Invoice generated.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete checkout.');
      console.error(err);
      // Rollback: cart is NOT cleared on error! So the UI state is preserved!
    } finally {
      setCheckingOut(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJpg = () => {
    if (!receiptRef.current) return;
    
    toast.info('Generating JPG image...');
    
    html2canvas(receiptRef.current, { 
      scale: 3, 
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false
    }).then(canvas => {
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to create image blob.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `UK_Store_Invoice_${invoice.invoice_no}.jpg`;
        link.href = url;
        document.body.appendChild(link);
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

  const formatCurrency = (val) => {
    return `৳ ${parseFloat(val).toFixed(2)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in relative max-w-4xl mx-auto">
      
      {/* Header and Go Back */}
      <div className="space-y-2 no-print">
        <button 
          onClick={() => navigate('/sell-products')}
          className="flex items-center gap-1.5 text-xs font-semibold text-beauty-taupe hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Create Sales
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Checkout Invoice
          </h2>
        </div>
        <p className="text-beauty-taupe text-sm">
          Review items, adjust quantities, and complete the sale transaction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start no-print">
        
        {/* Cart items list (Left 2/3) */}
        <div className="md:col-span-2 space-y-4">
          {cart.length === 0 ? (
            <div className="bg-beauty-rose rounded-2xl border border-white/5 p-12 text-center shadow-md">
              <div className="w-16 h-16 rounded-full bg-beauty-cream flex items-center justify-center text-beauty-accent/40 mx-auto mb-4">
                <CartIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Your Cart is Empty</h3>
              <p className="text-xs text-beauty-taupe mt-1.5 mb-6">
                Go back to the Create Sale page to add skincare products.
              </p>
              <Link 
                to="/sell-products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-xl text-xs font-bold tracking-wide transition-all"
              >
                Go to Create Sale
              </Link>
            </div>
          ) : (
            <div className="bg-beauty-rose rounded-2xl border border-white/5 shadow-md overflow-hidden divide-y divide-white/5">
              {cart.map(item => (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-beauty-blush/20 transition-all">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded-lg border border-white/10 bg-beauty-cream shrink-0"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = '/logo.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                    <span className="text-xs font-bold text-beauty-accent mt-1.5 block">{formatCurrency(item.sell_price)}</span>
                  </div>
                  
                  {/* Quantity adjustments */}
                  <div className="flex items-center border border-white/10 bg-beauty-cream/50 rounded-lg overflow-hidden shrink-0">
                    <button
                      onClick={() => updateCartQty(item.id, -1, item.stock)}
                      className="px-2.5 py-1 hover:bg-beauty-blush text-white transition-colors cursor-pointer"
                      aria-label="Decrease Qty"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-white select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.id, 1, item.stock)}
                      className="px-2.5 py-1 hover:bg-beauty-blush text-white transition-colors cursor-pointer"
                      aria-label="Increase Qty"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[70px] hidden sm:block">
                    <span className="text-xs font-bold text-white block">
                      {formatCurrency(item.sell_price * item.quantity)}
                    </span>
                  </div>

                  {/* Remove */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 hover:text-rose-500 text-beauty-taupe/40 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Confirm Sell panel (Right 1/3) */}
        {cart.length > 0 && (
          <div className="bg-beauty-rose rounded-2xl border border-white/5 p-6 shadow-md space-y-6">
            <h3 className="font-sans font-bold text-lg text-white border-b border-white/5 pb-3">
              Order Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-beauty-taupe">
                <span>Total Items</span>
                <span className="font-bold text-white">
                  {cart.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-beauty-taupe">
                <span>Currency</span>
                <span className="font-bold text-white">BDT (৳)</span>
              </div>
              <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Grand Total</span>
                <span className="font-sans font-extrabold text-lg text-beauty-accent">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2 pt-4 border-t border-white/5">
              <label htmlFor="customerPhone" className="block text-xs font-semibold text-beauty-taupe">
                Customer Phone Number (Mandatory)
              </label>
              <input
                type="text"
                id="customerPhone"
                placeholder="e.g. 01711223344"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                maxLength={11}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-beauty-cream/10 text-white focus:outline-none focus:ring-1 focus:ring-beauty-accent focus:border-beauty-accent text-xs font-mono"
              />
              {customerPhone && !isPhoneValid && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1">
                  Must be 11 digits starting with 01 (e.g. 01711223344)
                </p>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut || !isPhoneValid}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-xl text-sm font-bold tracking-wider uppercase transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Create Sale
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* Invoice Receipt Modal */}
      {invoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print-overlay">
          <div className="bg-beauty-rose max-w-sm w-full rounded-2xl border border-white/5 shadow-2xl overflow-hidden animate-slide-up flex flex-col justify-between my-8 print-modal-container">
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
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
                  <h3 style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.05em', color: '#2C2523', textTransform: 'uppercase', margin: '0 0 6px 0', lineHeight: '1' }}>
                    UK STORE
                  </h3>
                  <p style={{ fontSize: '10px', color: '#8D7B70', fontFamily: 'sans-serif', letterSpacing: '0.025em', margin: '0 0 4px 0' }}>
                    Premium Skin, Body & Hair Care
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
                  <span style={{ color: '#915EFF', fontSize: '16px' }}>{formatCurrency(invoice.total)}</span>
                </div>

                {/* Footer notes */}
                <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px dashed #EAD5C9', fontSize: '8px', color: '#8D7B70', marginTop: '16px', lineHeight: '1.4' }}>
                  <p style={{ fontWeight: 'bold', color: '#2C2523', fontSize: '10px', margin: '0 0 4px 0' }}>Thank You for Shopping!</p>
                  <p style={{ margin: '0 0 2px 0' }}>Exchange within 7 days with original receipt.</p>
                  <p style={{ margin: '0' }}>System by UK Store Business Manager</p>
                </div>
              </div>
            </div>

            {/* Receipt Modal Footer Operations */}
            <div className="bg-beauty-clay p-4 border-t border-white/5 flex gap-2 shrink-0 print-actions no-print">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-beauty-rose border border-white/10 hover:bg-beauty-blush text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadJpg}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Save JPG
              </button>
              <button
                onClick={() => setInvoice(null)}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
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
          aside, header, .no-print, nav, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
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
