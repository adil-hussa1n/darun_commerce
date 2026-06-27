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
  const [discountType, setDiscountType] = useState('flat');
  const [discountInput, setDiscountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const receiptRef = useRef(null);

  const phoneRegex = /^01[3-9]\d{8}$/;
  const isPhoneValid = phoneRegex.test(customerPhone);

  const cartTotal = cart.reduce((acc, item) => acc + (parseFloat(item.sell_price) * item.quantity), 0);

  // Discount calculation
  const discountVal = parseFloat(discountInput) || 0;
  const calculatedDiscount = discountType === 'percentage' 
    ? (cartTotal * discountVal) / 100 
    : discountVal;
  
  const finalDiscount = Math.min(cartTotal, Math.max(0, calculatedDiscount));
  const grandTotal = Math.max(0, cartTotal - finalDiscount);

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
      const res = await sellMultipleProducts(cart, customerPhone, finalDiscount, paymentMethod);
      
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
        subtotal: cartTotal,
        discount: finalDiscount,
        total: grandTotal,
        payment_method: paymentMethod
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
    return `৳\u00a0${parseFloat(val).toFixed(2)}`;
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
                    src={item.image || '/logo.png'} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded-lg border border-white/10 bg-beauty-cream shrink-0"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = '/logo.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-beauty-taupe">
                        Category: <strong className="text-white font-semibold">{item.category || '—'}</strong>
                      </span>
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-beauty-taupe">
                        Brand: <strong className="text-white font-semibold">{item.brand || '—'}</strong>
                      </span>
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-beauty-taupe">
                        Model: <strong className="text-white font-semibold">{item.model_barcode || '—'}</strong>
                      </span>
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-beauty-taupe">
                        Vol: <strong className="text-white font-semibold">{item.ml_mg || '—'}</strong>
                      </span>
                      {item.serial_no && (
                        <span className="bg-beauty-accent/10 border border-beauty-accent/25 px-2 py-0.5 rounded text-beauty-accent font-mono">
                          SN: <strong className="text-white font-bold">{item.serial_no}</strong>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-beauty-accent mt-3 block">{formatCurrency(item.sell_price)}</span>
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
                <span>Subtotal</span>
                <span className="font-bold text-white">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-beauty-taupe">
                <span>Currency</span>
                <span className="font-bold text-white">BDT (৳)</span>
              </div>

              {/* Discount Selector and Input */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <label className="block text-xs font-semibold text-beauty-taupe">
                  Apply Discount
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value);
                        setDiscountInput('');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-beauty-cream focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs font-semibold cursor-pointer"
                    >
                      <option value="flat" className="bg-[#151030] text-white">Flat (৳)</option>
                      <option value="percentage" className="bg-[#151030] text-white">Percent (%)</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 150'}
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-beauty-cream focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <label htmlFor="paymentMethod" className="block text-xs font-semibold text-beauty-taupe">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-beauty-cream focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs font-semibold cursor-pointer"
                >
                  <option value="Cash" className="bg-[#151030] text-white">Cash</option>
                  <option value="Card" className="bg-[#151030] text-white">Card</option>
                  <option value="bKash" className="bg-[#151030] text-white">bKash</option>
                  <option value="Nagad" className="bg-[#151030] text-white">Nagad</option>
                  <option value="Rocket" className="bg-[#151030] text-white">Rocket</option>
                  <option value="Bank" className="bg-[#151030] text-white">Bank</option>
                </select>
              </div>

              {finalDiscount > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-500 font-semibold pt-2">
                  <span>Discount Applied</span>
                  <span>-{formatCurrency(finalDiscount)}</span>
                </div>
              )}

              <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Grand Total</span>
                <span className="font-sans font-extrabold text-lg text-beauty-accent">
                  {formatCurrency(grandTotal)}
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
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-beauty-cream focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs font-mono"
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
                  color: '#1C1917',
                  border: '1px solid #E5E5E5',
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
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #D6C2B4', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.05em', color: '#1C1917', textTransform: 'uppercase', margin: '0 0 6px 0', lineHeight: '1' }}>
                    UK STORE
                  </h3>
                  <p style={{ fontSize: '11px', color: '#57534E', fontFamily: 'sans-serif', letterSpacing: '0.025em', margin: '0 0 4px 0' }}>
                    Premium Skin, Body & Hair Care
                  </p>
                  <p style={{ fontSize: '10px', color: '#78716C', fontFamily: 'sans-serif', margin: '0' }}>
                    Musa Market, Beanibazar, Sylhet | Support: info@ukstore.com
                  </p>
                </div>

                {/* Receipt Details */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', borderBottom: '1px dashed #D6C2B4', paddingBottom: '12px', marginBottom: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '3px 0', color: '#1C1917' }}>Receipt No:</td>
                      <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 'bold', color: '#1C1917' }}>{invoice.invoice_no}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '3px 0', color: '#1C1917' }}>Date:</td>
                      <td style={{ textAlign: 'right', padding: '3px 0', color: '#1C1917' }}>{invoice.date}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '3px 0', color: '#1C1917' }}>Payment Method:</td>
                      <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 'bold', color: '#1C1917' }}>{invoice.payment_method || 'Cash'}</td>
                    </tr>
                    <tr style={{ color: '#57534E' }}>
                      <td style={{ textAlign: 'left', padding: '3px 0' }}>Currency:</td>
                      <td style={{ textAlign: 'right', padding: '3px 0' }}>BDT (৳)</td>
                    </tr>
                  </tbody>
                </table>

                {/* Table Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', borderBottom: '1px dashed #D6C2B4', paddingBottom: '12px', marginBottom: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px dashed #D6C2B4' }}>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 'bold', color: '#57534E' }}>Item Description</th>
                      <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold', color: '#57534E' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} style={{ verticalAlign: 'top' }}>
                        <td style={{ textAlign: 'left', padding: '6px 0', paddingRight: '12px' }}>
                          <span style={{ display: 'block', fontWeight: '500', color: '#1C1917' }}>{item.name}</span>
                          {(item.brand || item.ml_mg) && (
                            <span style={{ display: 'block', fontSize: '10px', color: '#57534E', margin: '2px 0' }}>
                              {[item.brand, item.ml_mg].filter(Boolean).join(' • ')}
                            </span>
                          )}
                          {(item.serial_no || item.model_barcode) && (
                            <span style={{ display: 'block', fontSize: '9px', color: '#78716C', fontFamily: 'monospace', margin: '2px 0' }}>
                              {[item.serial_no ? `SN: ${item.serial_no}` : null, item.model_barcode ? `BC: ${item.model_barcode}` : null].filter(Boolean).join(' | ')}
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: '#57534E' }}>
                            {formatCurrency(item.sell_price)} x {item.quantity}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold', color: '#1C1917', whiteSpace: 'nowrap' }}>
                          {formatCurrency(item.sell_price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary totals */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', borderBottom: '1px dashed #D6C2B4', paddingBottom: '8px', marginBottom: '8px' }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '4px 0', color: '#1C1917' }}>Subtotal:</td>
                      <td style={{ textAlign: 'right', padding: '4px 0', color: '#1C1917' }}>{formatCurrency(invoice.subtotal)}</td>
                    </tr>
                    {invoice.discount > 0 && (
                      <tr>
                        <td style={{ textAlign: 'left', padding: '4px 0', color: '#dc2626' }}>Discount:</td>
                        <td style={{ textAlign: 'right', padding: '4px 0', color: '#dc2626', fontWeight: 'bold' }}>-{formatCurrency(invoice.discount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Grand Total */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontWeight: 'bold', paddingTop: '4px', marginBottom: '16px' }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '6px 0', color: '#1C1917', textTransform: 'uppercase' }}>Grand Total:</td>
                      <td style={{ textAlign: 'right', padding: '6px 0', color: '#7C3AED', fontSize: '16px' }}>{formatCurrency(invoice.total)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer notes */}
                <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px dashed #D6C2B4', fontSize: '10px', color: '#57534E', marginTop: '16px', lineHeight: '1.4' }}>
                  <p style={{ fontWeight: 'bold', color: '#1C1917', fontSize: '11px', margin: '0 0 4px 0' }}>Thank You for Shopping!</p>
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
          @page {
            margin: 0 !important;
          }
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
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            display: block !important;
            background: #ffffff !important;
          }
          #invoice-receipt {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 32px 8px 12px 8px !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
          }
          #invoice-receipt * {
            color: #000000 !important;
            opacity: 1 !important;
            background: transparent !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #invoice-receipt table,
          #invoice-receipt td,
          #invoice-receipt th,
          #invoice-receipt div,
          #invoice-receipt p,
          #invoice-receipt span {
            border-color: #000000 !important;
          }
        }
      `}</style>

    </div>
  );
}
