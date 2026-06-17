import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Image as ImageIcon, 
  ArrowLeft, 
  Save, 
  Loader2,
  Search,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Edit
} from 'lucide-react';
import { addProduct, getProducts, updateProduct } from '../services/api';

const DEFAULT_IMAGE_PREVIEW = '/logo.png';

export default function AddProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [form, setForm] = useState({
    name: '',
    category: '',
    buy_price: '',
    sell_price: '',
    stock: '',
    image: '',
    notes: ''
  });

  // Editing state variables
  const [editingProduct, setEditingProduct] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    buy_price: '',
    sell_price: '',
    stock: '',
    image: '',
    notes: ''
  });

  const handleStartEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || '',
      category: product.category || '',
      buy_price: product.buy_price !== undefined ? product.buy_price.toString() : '',
      sell_price: product.sell_price !== undefined ? product.sell_price.toString() : '',
      stock: product.stock !== undefined ? product.stock.toString() : '',
      image: product.image || '',
      notes: product.notes || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const validateEdit = () => {
    if (!editForm.name.trim()) {
      toast.error('Product Name is required');
      return false;
    }
    if (!editForm.category) {
      toast.error('Category is required');
      return false;
    }
    
    const buyNum = parseFloat(editForm.buy_price);
    const sellNum = parseFloat(editForm.sell_price);
    const stockNum = parseInt(editForm.stock, 10);

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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEdit()) return;

    try {
      setUpdating(true);
      await updateProduct(editingProduct.id, editForm);
      toast.success('Product updated successfully!');
      setEditingProduct(null);
      
      // Reload products list
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      toast.error('Failed to update product.');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProducts(true);
        const data = await getProducts();
        setProducts(data);
      } catch {
        /* silent */
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, []);

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
      navigate('/');
    } catch (err) {
      toast.error('Failed to save product. Check configuration.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '৳ 0.00';
    return `৳ ${num.toFixed(2)}`;
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filtered products for the list
  const filteredProducts = products.filter(product => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (product.name || '').toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="space-y-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-beauty-taupe hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Product Management
        </h2>
        <p className="text-beauty-taupe text-sm">
          Manage your inventory — view existing products and add new ones below.
        </p>
      </div>

      {/* ─── Existing Products Table ─── */}
      <div className="bg-beauty-rose rounded-2xl border border-white/5 shadow-md overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 pt-5 pb-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white tracking-wide">All Products</h3>
          {/* Search */}
          <div className="relative w-full sm:max-w-xs flex items-center">
            <Search
              className="absolute text-beauty-taupe pointer-events-none shrink-0"
              style={{ left: '12px', width: '14px', height: '14px' }}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all duration-200 placeholder:text-beauty-taupe/40 text-xs"
              style={{ paddingLeft: '32px', paddingRight: '32px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-beauty-taupe/65 hover:text-white cursor-pointer"
              >
                <X style={{ width: '13px', height: '13px' }} />
              </button>
            )}
          </div>
        </div>

        {loadingProducts ? (
          <div className="py-10 text-center text-beauty-taupe text-xs animate-pulse">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-8 h-8 text-beauty-taupe/30 mx-auto mb-3" />
            <p className="text-xs text-beauty-taupe">No products found. Add one below.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-beauty-taupe border-b border-white/5">
                    <th className="py-3 px-5 font-semibold">Image</th>
                    <th className="py-3 px-5 font-semibold">Name</th>
                    <th className="py-3 px-5 font-semibold">Category</th>
                    <th className="py-3 px-5 font-semibold text-right">Buy ৳</th>
                    <th className="py-3 px-5 font-semibold text-right">Sell ৳</th>
                    <th className="py-3 px-5 font-semibold text-right">Stock</th>
                    <th className="py-3 px-5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white/90">
                  {paginatedProducts.map((product) => {
                    const isLow = product.stock > 0 && product.stock < 5;
                    const isOut = product.stock <= 0;
                    return (
                      <tr key={product.id} className="hover:bg-beauty-blush/30 transition-colors">
                        <td className="py-3 px-5 shrink-0">
                          <img
                            src={product.image || DEFAULT_IMAGE_PREVIEW}
                            alt={product.name}
                            className="w-10 h-10 object-contain rounded-lg border border-white/10 bg-beauty-cream"
                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE_PREVIEW; }}
                          />
                        </td>
                        <td className="py-3 px-5 font-semibold text-white max-w-[200px] truncate">{product.name}</td>
                        <td className="py-3 px-5 text-beauty-taupe">{product.category || '—'}</td>
                        <td className="py-3 px-5 text-right text-beauty-taupe">{formatCurrency(product.buy_price)}</td>
                        <td className="py-3 px-5 text-right font-bold text-white">{formatCurrency(product.sell_price)}</td>
                        <td className="py-3 px-5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOut ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            isLow ? 'bg-amber-400/10 text-amber-400 border border-amber-400/25' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            onClick={() => handleStartEdit(product)}
                            className="p-1.5 rounded-lg border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-beauty-accent hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-beauty-taupe">
                Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> 
                <span className="text-beauty-taupe/60 ml-2">({filteredProducts.length} total)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-beauty-accent hover:bg-beauty-accent/90 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                  title="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Add New Product Section ─── */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white tracking-tight">Add New Product</h3>
        <p className="text-beauty-taupe text-sm">Fill in the details below to add a new product.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Form (3/5 width) */}
        <form 
          onSubmit={handleSubmit}
          className="lg:col-span-3 bg-beauty-rose p-6 md:p-8 rounded-2xl border border-white/5 shadow-md space-y-6"
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
            <label htmlFor="image" className="beauty-label opacity-50 cursor-not-allowed">Product Image URL</label>
            <input
              type="url"
              id="image"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="beauty-input opacity-50 cursor-not-allowed"
              disabled
            />
            <p className="text-[10px] text-beauty-taupe mt-1 opacity-50">
              This field is currently disabled.
            </p>
          </div>

          {/* Field: Notes/Description */}
          <div>
            <label htmlFor="notes" className="beauty-label">Notes &amp; Description</label>
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
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-xl font-semibold tracking-wide transition-all shadow-md disabled:bg-beauty-accent/50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Add Product
              </>
            )}
          </button>
        </form>

        {/* Live Card Preview (2/5 width) */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-8">
          <h3 className="text-xs font-bold text-beauty-taupe tracking-wider uppercase pl-1">
            Live Preview
          </h3>
          
          <div className="bg-beauty-rose rounded-2xl border border-white/5 shadow-md overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-white/10">
            {/* Image Preview Window */}
            <div className="h-64 bg-beauty-cream/30 relative overflow-hidden flex items-center justify-center border-b border-white/5 p-4">
              <img 
                src={form.image || DEFAULT_IMAGE_PREVIEW} 
                alt="Product Preview" 
                className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_IMAGE_PREVIEW;
                }}
              />
              <div className="absolute top-3 right-3 bg-[#151030] text-[#915EFF] border border-[#915EFF]/20 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs">
                {form.category || 'No Category'}
              </div>
              
              {!form.image && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-1.5 pointer-events-none">
                  <span className="text-[10px] font-medium text-beauty-taupe/60 bg-beauty-cream/60 px-2 py-0.5 rounded-full">Default Logo</span>
                </div>
              )}
            </div>

            {/* Product Meta */}
            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-sans font-bold text-lg text-white leading-tight truncate">
                  {form.name || 'Untitled Product'}
                </h4>
                <p className="text-xs text-beauty-taupe mt-1 h-8 line-clamp-2 overflow-hidden italic leading-relaxed">
                  {form.notes || 'No description provided yet.'}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 border-t border-b border-white/5 py-3 text-center">
                <div>
                  <span className="block text-[9px] font-bold text-beauty-taupe uppercase">Cost</span>
                  <span className="text-xs font-semibold text-white/70">
                    {formatCurrency(form.buy_price)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-beauty-accent uppercase">Retail</span>
                  <span className="text-xs font-bold text-white">
                    {formatCurrency(form.sell_price)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-beauty-taupe uppercase">Stock</span>
                  <span className={`text-xs font-bold ${parseInt(form.stock, 10) < 5 ? 'text-rose-500' : 'text-white/80'}`}>
                    {form.stock || '0'}
                  </span>
                </div>
              </div>

              {/* Status Tags */}
              <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-beauty-accent" />
                  <span className="font-semibold text-beauty-taupe">Created today</span>
                </div>
                {parseInt(form.stock, 10) < 5 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                    Low Stock Alert
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-beauty-rose max-w-lg w-full rounded-2xl border border-white/5 shadow-2xl overflow-hidden animate-slide-up flex flex-col justify-between my-8">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <Edit className="w-5 h-5 text-beauty-accent" />
                Edit Product Info
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:text-rose-500 text-beauty-taupe/40 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="edit_name" className="beauty-label">Product Name *</label>
                <input
                  type="text"
                  id="edit_name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="beauty-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit_category" className="beauty-label">Category *</label>
                  <input
                    type="text"
                    id="edit_category"
                    name="category"
                    list="edit-category-suggestions"
                    value={editForm.category}
                    onChange={handleEditChange}
                    className="beauty-input"
                    required
                  />
                  <datalist id="edit-category-suggestions">
                    <option value="Skin Care" />
                    <option value="Body Care" />
                    <option value="Hair Care" />
                  </datalist>
                </div>

                <div>
                  <label htmlFor="edit_stock" className="beauty-label">Stock Quantity *</label>
                  <input
                    type="number"
                    id="edit_stock"
                    name="stock"
                    value={editForm.stock}
                    onChange={handleEditChange}
                    min="0"
                    step="1"
                    className="beauty-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit_buy_price" className="beauty-label">Buy Price (BDT ৳) *</label>
                  <input
                    type="number"
                    id="edit_buy_price"
                    name="buy_price"
                    value={editForm.buy_price}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    className="beauty-input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit_sell_price" className="beauty-label">Sell Price (BDT ৳) *</label>
                  <input
                    type="number"
                    id="edit_sell_price"
                    name="sell_price"
                    value={editForm.sell_price}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    className="beauty-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit_image" className="beauty-label">Product Image URL</label>
                <input
                  type="text"
                  id="edit_image"
                  name="image"
                  value={editForm.image}
                  onChange={handleEditChange}
                  className="beauty-input"
                />
              </div>

              <div>
                <label htmlFor="edit_notes" className="beauty-label">Notes &amp; Description</label>
                <textarea
                  id="edit_notes"
                  name="notes"
                  value={editForm.notes}
                  onChange={handleEditChange}
                  rows="3"
                  className="beauty-input resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all cursor-pointer text-center text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50 cursor-pointer text-xs"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
