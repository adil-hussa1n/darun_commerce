import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Sparkles, 
  Image as ImageIcon, 
  ArrowLeft, 
  Save, 
  Loader2 
} from 'lucide-react';
import { addProduct } from '../services/api';

const DEFAULT_IMAGE_PREVIEW = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400';

export default function AddProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Skin Care',
    buy_price: '',
    sell_price: '',
    stock: '',
    image: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) {
      toast.error('Product Name is required');
      return false;
    }
    if (!form.category) {
      toast.error('Category is required');
      return false;
    }
    
    const buyNum = parseFloat(form.buy_price);
    const sellNum = parseFloat(form.sell_price);
    const stockNum = parseInt(form.stock, 10);

    if (isNaN(buyNum) || buyNum < 0) {
      toast.error('Buy Price must be a positive number');
      return false;
    }
    if (isNaN(sellNum) || sellNum < 0) {
      toast.error('Sell Price must be a positive number');
      return false;
    }
    if (sellNum < buyNum) {
      toast.warn('Sell price is lower than the buy price. Double-check your margin!');
    }
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error('Stock Quantity must be a non-negative integer');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await addProduct(form);
      toast.success('Product added successfully!');
      
      // Clear form or redirect
      navigate('/');
    } catch (err) {
      toast.error('Failed to save product to Google Sheets. Check configuration.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate formatting helper
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '৳ 0.00';
    return `৳ ${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header and Go Back */}
      <div className="space-y-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-beauty-taupe hover:text-beauty-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold font-serif tracking-tight text-beauty-dark">
            Register New Product
          </h2>
        </div>
        <p className="text-beauty-taupe text-sm">
          Add a brand-new beauty or skincare product to the Google Sheets inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Registration Form (3/5 width) */}
        <form 
          onSubmit={handleSubmit}
          className="lg:col-span-3 bg-white p-6 md:p-8 rounded-2xl border border-beauty-rose/20 shadow-xs space-y-6"
        >
          {/* Field: Product Name */}
          <div>
            <label htmlFor="name" className="beauty-label">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Vitamin C Radiance Serum"
              className="beauty-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Field: Category */}
            <div>
              <label htmlFor="category" className="beauty-label">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                list="category-suggestions"
                value={form.category}
                onChange={handleChange}
                placeholder="Select or type a category..."
                className="beauty-input"
                required
              />
              <datalist id="category-suggestions">
                <option value="Skin Care" />
                <option value="Body Care" />
                <option value="Hair Care" />
              </datalist>
            </div>

            {/* Field: Stock Quantity */}
            <div>
              <label htmlFor="stock" className="beauty-label">Initial Stock *</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="e.g. 15"
                min="0"
                step="1"
                className="beauty-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Field: Buy Price */}
            <div>
              <label htmlFor="buy_price" className="beauty-label">Buy Price (BDT ৳) *</label>
              <input
                type="number"
                id="buy_price"
                name="buy_price"
                value={form.buy_price}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="beauty-input"
                required
              />
            </div>

            {/* Field: Sell Price */}
            <div>
              <label htmlFor="sell_price" className="beauty-label">Sell Price (BDT ৳) *</label>
              <input
                type="number"
                id="sell_price"
                name="sell_price"
                value={form.sell_price}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="beauty-input"
                required
              />
            </div>
          </div>

          {/* Field: Product Image URL */}
          <div>
            <label htmlFor="image" className="beauty-label">Product Image URL</label>
            <input
              type="url"
              id="image"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="beauty-input"
            />
            <p className="text-[10px] text-beauty-taupe/80 mt-1">
              Provide a direct link to an image. (Tip: Use Unsplash for studio product shots).
            </p>
          </div>

          {/* Field: Notes/Description */}
          <div>
            <label htmlFor="notes" className="beauty-label">Notes & Description</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Formulation details, size (e.g. 50ml), ingredients or skin type usage instructions..."
              rows="3"
              className="beauty-input resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-beauty-taupe hover:bg-beauty-dark text-white rounded-xl font-medium tracking-wide transition-all shadow-xs hover:shadow-md disabled:bg-beauty-taupe/50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving to Google Sheets...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Register Product
              </>
            )}
          </button>
        </form>

        {/* Live Card Preview (2/5 width) */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-8">
          <h3 className="text-xs font-bold text-beauty-taupe tracking-wider uppercase pl-1">
            Live Preview
          </h3>
          
          <div className="bg-white rounded-2xl border border-beauty-rose/20 shadow-sm overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md">
            {/* Image Preview Window */}
            <div className="h-56 bg-beauty-cream relative overflow-hidden flex items-center justify-center border-b border-beauty-rose/10">
              <img 
                src={form.image || DEFAULT_IMAGE_PREVIEW} 
                alt="Product Preview" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                onError={(e) => {
                  // Fallback if URL is invalid
                  e.target.onerror = null;
                  e.target.src = DEFAULT_IMAGE_PREVIEW;
                }}
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-beauty-dark shadow-xs border border-white/50">
                {form.category}
              </div>
              
              {!form.image && (
                <div className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center text-beauty-taupe/40 gap-1.5 pointer-events-none">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Using Default Image</span>
                </div>
              )}
            </div>

            {/* Product Meta */}
            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-serif font-bold text-lg text-beauty-dark leading-tight truncate">
                  {form.name || 'Untitled Product'}
                </h4>
                <p className="text-xs text-beauty-taupe mt-1 h-8 line-clamp-2 overflow-hidden italic leading-relaxed">
                  {form.notes || 'No description provided yet.'}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 border-t border-b border-beauty-rose/15 py-3 text-center">
                <div>
                  <span className="block text-[9px] font-bold text-beauty-taupe/70 uppercase">Cost</span>
                  <span className="text-xs font-semibold text-beauty-dark/70">
                    {formatCurrency(form.buy_price)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-beauty-accent uppercase">Retail</span>
                  <span className="text-xs font-bold text-beauty-dark">
                    {formatCurrency(form.sell_price)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-beauty-taupe/70 uppercase">Stock</span>
                  <span className={`text-xs font-bold ${parseInt(form.stock, 10) < 5 ? 'text-rose-500' : 'text-beauty-dark/80'}`}>
                    {form.stock || '0'}
                  </span>
                </div>
              </div>

              {/* Status Tags */}
              <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-beauty-accent" />
                  <span className="font-semibold text-beauty-taupe">Created today</span>
                </div>
                {parseInt(form.stock, 10) < 5 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-100">
                    Low Stock Alert
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
