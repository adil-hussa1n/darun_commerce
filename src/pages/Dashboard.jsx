import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  ShoppingBag,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getProducts, getSalesHistory } from '../services/api';
import { DashboardSkeleton } from '../components/Skeleton';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const loadDashboardData = async (isManual = false) => {
    try {
      if (isManual) {
        setSyncing(true);
      } else {
        setLoading(true);
      }
      const [prodList, salesList] = await Promise.all([
        getProducts(),
        getSalesHistory()
      ]);
      setProducts(prodList);
      setSales(salesList);
      if (isManual) {
        toast.success('Inventory synced with Google Sheets!');
      }
    } catch (err) {
      toast.error('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-serif tracking-tight text-beauty-dark">Inventory Overview</h2>
          <p className="text-beauty-taupe text-sm mt-1">Fetching store statistics...</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // Calculate stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 5);
  const lowStockCount = lowStockProducts.length;
  
  // Total Revenue & Units Sold
  const totalRevenue = sales.reduce((acc, sale) => acc + parseFloat(sale.total_price || 0), 0);
  const totalUnitsSold = sales.reduce((acc, sale) => acc + parseInt(sale.quantity || 0, 10), 0);

  // Format currencies
  const formatCurrency = (val) => {
    return `৳ ${parseFloat(val).toFixed(2)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-serif tracking-tight text-beauty-dark">
            Inventory Overview
          </h2>
          <p className="text-beauty-taupe text-sm mt-1">
            Real-time status of UK Store stock and sales logs.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-beauty-rose hover:bg-beauty-cream text-beauty-dark rounded-xl text-sm font-medium tracking-wide transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <Link 
            to="/add-product"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-beauty-taupe hover:bg-beauty-dark text-white rounded-xl text-sm font-medium tracking-wide transition-all shadow-xs hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
          <Link 
            to="/sell-products"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-beauty-rose hover:bg-beauty-cream text-beauty-dark rounded-xl text-sm font-medium tracking-wide transition-all shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            Sell Products
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Total Sales Revenue */}
        <div className="p-6 rounded-2xl bg-white border border-beauty-rose/20 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase">
              Total Revenue
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-beauty-dark">
              {formatCurrency(totalRevenue)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-beauty-rose/30 flex items-center justify-center text-beauty-taupe">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Unique Products */}
        <div className="p-6 rounded-2xl bg-white border border-beauty-rose/20 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase">
              Active Products
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-beauty-dark">
              {totalProducts}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-beauty-rose/30 flex items-center justify-center text-beauty-taupe">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Low Stock Alerts */}
        <div className="p-6 rounded-2xl bg-white border border-beauty-rose/20 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase">
              Low Stock Alert
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-beauty-dark">
              {lowStockCount}
            </h3>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-beauty-sage/40 text-emerald-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Sales Items */}
        <div className="p-6 rounded-2xl bg-white border border-beauty-rose/20 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase">
              Total Units Sold
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-beauty-dark">
              {totalUnitsSold}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-beauty-rose/30 flex items-center justify-center text-beauty-taupe">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Transactions & Stock warning alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Transactions List (Left 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-beauty-rose/20 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-beauty-dark font-serif">
                  Recent Sales Log
                </h3>
                <p className="text-xs text-beauty-taupe mt-0.5">
                  Latest customer purchases recorded in Google Sheets.
                </p>
              </div>
              <Link 
                to="/sell-products" 
                className="text-xs font-semibold text-beauty-accent hover:text-beauty-taupe flex items-center gap-1 group transition-colors"
              >
                New Sale
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-beauty-cream flex items-center justify-center text-beauty-taupe/40 mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-beauty-dark">No Sales Yet</h4>
                <p className="text-xs text-beauty-taupe max-w-xs mt-1">
                  Sales will show up here once products are sold on the Sell Products page.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-beauty-rose/20 text-[10px] font-bold uppercase tracking-wider text-beauty-taupe/80">
                      <th className="pb-3 pr-4 font-semibold">Sale ID</th>
                      <th className="pb-3 px-4 font-semibold">Product</th>
                      <th className="pb-3 px-4 font-semibold">Category</th>
                      <th className="pb-3 px-4 font-semibold text-right">Qty</th>
                      <th className="pb-3 px-4 font-semibold text-right">Price</th>
                      <th className="pb-3 pl-4 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-beauty-rose/10 text-xs text-beauty-dark/90">
                    {sales.slice(0, 5).map((sale) => (
                      <tr key={sale.sale_id} className="hover:bg-beauty-cream/30 transition-colors">
                        <td className="py-3.5 pr-4 font-mono text-[10px] text-beauty-taupe">
                          {sale.sale_id.replace('sale_', '#')}
                        </td>
                        <td className="py-3.5 px-4 font-medium max-w-[160px] truncate">
                          {sale.product_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full 
                            ${sale.category === 'Skin Care' ? 'bg-beauty-blush/60 text-beauty-dark/80' : ''}
                            ${sale.category === 'Body Care' ? 'bg-beauty-clay text-beauty-dark/80' : ''}
                            ${sale.category === 'Hair Care' ? 'bg-beauty-sage text-beauty-dark/80' : ''}
                          `}>
                            {sale.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium">
                          {sale.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right text-beauty-taupe">
                          {formatCurrency(sale.unit_price)}
                        </td>
                        <td className="py-3.5 pl-4 text-right font-semibold text-beauty-dark">
                          {formatCurrency(sale.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {sales.length > 5 && (
            <div className="border-t border-beauty-rose/10 pt-4 text-center">
              <span className="text-[10px] text-beauty-taupe font-medium">
                Showing latest 5 of {sales.length} transactions
              </span>
            </div>
          )}
        </div>

        {/* Low Stock Warning Panel (Right 1/3) */}
        <div className="bg-white rounded-2xl border border-beauty-rose/20 shadow-xs p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-beauty-dark font-serif flex items-center gap-2">
              Low Stock Alerts
              {lowStockCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                  {lowStockCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-beauty-taupe mt-0.5">
              Skincare and beauty stock items with less than 5 units left.
            </p>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-beauty-dark">All Stock Healthy!</h4>
              <p className="text-xs text-beauty-taupe max-w-xs mt-1">
                No items are currently running low. Good job!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.slice(0, 6).map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between p-3 rounded-xl border border-beauty-rose/10 hover:border-beauty-rose/30 transition-all bg-beauty-cream/10"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-10 h-10 object-cover rounded-lg border border-beauty-rose/25 bg-beauty-cream"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=100';
                      }}
                    />
                    <div className="max-w-[120px]">
                      <h4 className="text-xs font-semibold text-beauty-dark truncate">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-beauty-taupe">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md
                      ${product.stock === 0 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-amber-100 text-amber-800'
                      }
                    `}>
                      {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                    </span>
                    <Link 
                      to="/sell-products" 
                      className="text-[10px] font-semibold text-beauty-accent hover:underline"
                    >
                      Sell/Manage
                    </Link>
                  </div>
                </div>
              ))}
              
              {lowStockCount > 6 && (
                <p className="text-[10px] text-center text-beauty-taupe italic mt-2">
                  And {lowStockCount - 6} other items running low.
                </p>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
