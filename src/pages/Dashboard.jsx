import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Banknote,
  Package, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  ShoppingBag,
  RefreshCw,
  Handshake,
  Wallet,
  Receipt
} from 'lucide-react';
import { getProducts, getSalesHistory } from '../services/api';
import { DashboardSkeleton } from '../components/Skeleton';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const loadDashboardData = async (isManual = false, isSilent = false) => {
    try {
      if (isManual) {
        setSyncing(true);
      } else if (!isSilent) {
        setLoading(true);
      }
      const [prodList, salesList] = await Promise.all([
        getProducts(),
        getSalesHistory()
      ]);
      setProducts(prodList);
      setSales(salesList);
      if (isManual) {
        toast.success('Inventory synced successfully!');
      }
    } catch (err) {
      if (!isSilent) {
        toast.error('Failed to load dashboard data.');
      }
      console.error(err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData(false, true);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-beauty-dark">Shop Overview</h2>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // Calculate stats
  const totalProducts = products.length;
  
  // Total Revenue & Units Sold
  const totalRevenue = sales.reduce((acc, sale) => acc + parseFloat(sale.total_price || 0), 0);
  const totalPurchaseCount = sales.length;

  // Total Profit
  const totalProfit = sales.reduce((acc, sale) => {
    const product = products.find(p => p.name.trim().toLowerCase() === sale.product_name.trim().toLowerCase());
    if (product) {
      const buyPrice = parseFloat(product.buy_price || 0);
      const unitPrice = parseFloat(sale.unit_price || 0);
      const qty = parseInt(sale.quantity || 0, 10);
      return acc + ((unitPrice - buyPrice) * qty);
    } else {
      const totalPrice = parseFloat(sale.total_price || 0);
      return acc + (totalPrice * 0.5);
    }
  }, 0);

  // Stock Investment: sum of (buy_price * stock) for all products
  const stockInvestment = products.reduce((acc, p) => {
    return acc + (parseFloat(p.buy_price || 0) * parseInt(p.stock || 0, 10));
  }, 0);

  // Format currencies
  const formatCurrency = (val) => {
    return `৳ ${parseFloat(val).toFixed(2)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Greeting Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-beauty-rose via-beauty-blush to-beauty-rose border border-white/5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-beauty-accent/15 rounded-full blur-3xl" />
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-base md:text-lg font-bold text-white tracking-wide leading-relaxed">
            Thank You For Choosing Darun, Wishing you a productive business day ahead.
          </h3>
          <Handshake className="w-6 h-6 text-beauty-accent shrink-0 animate-pulse" />
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Shop Overview
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Create Sale button */}
            <Link 
              to="/sell-products"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-beauty-rose border border-white/10 hover:bg-beauty-blush text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              Create Sale
            </Link>
            {/* Product Management button */}
            <Link 
              to="/add-product"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-xs hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Product Management
            </Link>
          </div>
          {/* Sync button on the right */}
          <button
            onClick={() => loadDashboardData(true)}
            disabled={syncing}
            title="Sync data"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-beauty-rose border border-white/10 hover:bg-beauty-blush text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Total Sales */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Total Sales
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {formatCurrency(totalRevenue)}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Data from 26 May 2026.
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-beauty-accent/15 flex items-center justify-center text-beauty-accent">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Purchase */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Total Purchase
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {totalPurchaseCount}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Successful checkouts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-beauty-accent/15 flex items-center justify-center text-beauty-accent">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Profit */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Total Profit
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-emerald-400">
              {formatCurrency(totalProfit)}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Data from 26 May 2026.
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Stock Investment */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Stock Investment
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-amber-400">
              {formatCurrency(stockInvestment)}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Total capital in stock
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Transactions (Full Width) */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Recent Purchasing History */}
        <div className="bg-beauty-rose rounded-2xl border border-white/5 shadow-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white font-sans">
                  Recent Purchasing History
                </h3>
              </div>
              <Link 
                to="/sell-products" 
                className="text-xs font-semibold text-beauty-accent hover:text-white flex items-center gap-1 group transition-colors"
              >
                Create Sale
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-beauty-cream flex items-center justify-center text-beauty-taupe/40 mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">No Sales Yet</h4>
                <p className="text-xs text-beauty-taupe max-w-xs mt-1">
                  Sales will show up here once products are sold on the Sell Products page.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-beauty-taupe">
                      <th className="pb-3 pr-4 font-semibold">Mobile Number</th>
                      <th className="pb-3 px-4 font-semibold">Product</th>
                      <th className="pb-3 px-4 font-semibold">Category</th>
                      <th className="pb-3 px-4 font-semibold text-right">Qty</th>
                      <th className="pb-3 px-4 font-semibold text-right">Price</th>
                      <th className="pb-3 pl-4 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white/90">
                    {sales.slice(0, 10).map((sale, idx) => (
                      <tr key={sale.sale_id || idx} className="hover:bg-beauty-blush/30 transition-colors">
                        <td className="py-3.5 pr-4 font-mono text-[10px] text-beauty-taupe">
                          {sale.customer_phone || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-medium max-w-[240px] truncate">
                          {sale.product_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full 
                            ${sale.category === 'Skin Care' ? 'bg-[#151030] text-[#915EFF] border border-[#915EFF]/20' : ''}
                            ${sale.category === 'Body Care' ? 'bg-[#151030] text-[#aaa6c9] border border-[#aaa6c9]/25' : ''}
                            ${sale.category === 'Hair Care' ? 'bg-[#151030] text-emerald-400 border border-emerald-400/20' : ''}
                          `}>
                            {sale.category || 'Beauty Item'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium">
                          {sale.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right text-beauty-taupe">
                          {formatCurrency(sale.unit_price)}
                        </td>
                        <td className="py-3.5 pl-4 text-right font-semibold text-white">
                          {formatCurrency(sale.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {sales.length > 10 && (
            <div className="border-t border-white/5 pt-4 text-center mt-4">
              <span className="text-[10px] text-beauty-taupe font-medium">
                Showing latest 10 of {sales.length} transactions
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
