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
  Receipt,
  Coins,
  Info
} from 'lucide-react';
import { getProducts, getSalesHistory, getExpenses, syncOfflineData, getUnsyncedCount } from '../services/api';
import { DashboardSkeleton } from '../components/Skeleton';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time');

  // Unsynced state
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  // Date range checking helper
  const isDateWithinRange = (dateString, range) => {
    if (range === 'All Time') return true;
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'Today':
        return date >= startOfToday;
      case 'Yesterday': {
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        return date >= startOfYesterday && date < startOfToday;
      }
      case 'Last 7 Days': {
        const startOf7DaysAgo = new Date(startOfToday);
        startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
        return date >= startOf7DaysAgo;
      }
      case 'Last 30 Days': {
        const startOf30DaysAgo = new Date(startOfToday);
        startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);
        return date >= startOf30DaysAgo;
      }
      default:
        return true;
    }
  };

  const loadDashboardData = async (isManual = false, isSilent = false) => {
    try {
      if (isManual) {
        setSyncing(true);
      } else if (!isSilent) {
        setLoading(true);
      }

      // 1. Sync offline data first if any
      let syncedAnything = false;
      let countSynced = 0;
      const countPending = getUnsyncedCount();
      if (countPending > 0) {
        try {
          const syncRes = await syncOfflineData();
          if (syncRes && syncRes.success && syncRes.syncedCount > 0) {
            syncedAnything = true;
            countSynced = syncRes.syncedCount;
          }
        } catch (syncErr) {
          console.warn('Auto-sync offline data failed:', syncErr);
        }
      }

      // 2. Fetch fresh data
      const [prodList, salesList, expensesList] = await Promise.all([
        getProducts(),
        getSalesHistory(),
        getExpenses()
      ]);
      setProducts(prodList);
      setSales(salesList);
      setExpenses(expensesList);
      
      // Update unsynced count
      setUnsyncedCount(getUnsyncedCount());

      if (syncedAnything) {
        toast.success(`Successfully uploaded ${countSynced} offline entries to Supabase!`);
      } else if (isManual) {
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

    const handleOnline = () => {
      loadDashboardData(true);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
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

  // Filtered Sales
  const filteredSales = sales.filter(sale => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (sale.product_name || '').toLowerCase().includes(q) ||
      (sale.customer_phone || '').toLowerCase().includes(q);
      
    const matchesPayment = paymentFilter === 'All' || 
      (sale.payment_method || '').toLowerCase() === paymentFilter.toLowerCase();
      
    const matchesDate = isDateWithinRange(sale.date, dateRangeFilter);
    
    return matchesSearch && matchesPayment && matchesDate;
  });

  // Filtered Expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesDate = isDateWithinRange(exp.created_at, dateRangeFilter);
    const matchesPayment = paymentFilter === 'All' || 
      (exp.transaction_type || '').toLowerCase() === paymentFilter.toLowerCase();
    return matchesDate && matchesPayment;
  });

  // Total Revenue & Units Sold
  const totalRevenue = filteredSales.reduce((acc, sale) => acc + parseFloat(sale.total_price || 0), 0);
  const totalPurchaseCount = filteredSales.length;

  // Total Profit (Gross)
  const grossProfit = filteredSales.reduce((acc, sale) => {
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

  // Total Expenses
  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + parseFloat(exp.amount || 0), 0);

  // Net Profit
  const netProfit = grossProfit - totalExpenses;

  // Stock Investment: sum of (buy_price * stock) for all products
  const stockInvestment = products.reduce((acc, p) => {
    return acc + (parseFloat(p.buy_price || 0) * parseInt(p.stock || 0, 10));
  }, 0);

  // Format currencies
  const formatCurrency = (val) => {
    return `৳\u00a0${parseFloat(val).toFixed(2)}`;
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

      {/* Unsynced Offline Entries Alert */}
      {unsyncedCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Info className="w-5 h-5 shrink-0" />
            <div className="text-xs font-semibold">
              You have <span className="text-white font-bold underline">{unsyncedCount}</span> offline transactions/products pending database sync. Click "Sync" to upload.
            </div>
          </div>
          <button
            onClick={() => loadDashboardData(true)}
            disabled={syncing}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-beauty-dark font-bold text-[10px] rounded-lg tracking-wider transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto text-center shrink-0"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

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

      {/* Filtering Panel */}
      <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-beauty-rose/40 shadow-md flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="text-xs font-bold text-white uppercase tracking-wider">
          Filter Overview
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 max-w-2xl justify-end">
          {/* Search bar */}
          <input
            type="text"
            placeholder="Search product or customer phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-1 focus:ring-beauty-accent text-xs placeholder:text-beauty-taupe/40 w-full sm:w-60"
          />

          {/* Payment Method filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-beauty-clay text-white focus:outline-none text-xs"
          >
            <option value="All">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="bKash">bKash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>

          {/* Date Range filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-beauty-clay text-white focus:outline-none text-xs"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
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

        {/* KPI: Net Profit */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Net Profit
            </span>
            <h3 className={`text-2xl font-bold tracking-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netProfit)}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Gross profit - expenses
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Expenses */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Total Expenses
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-rose-300">
              {formatCurrency(totalExpenses)}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Operational costs
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-300">
            <Coins className="w-6 h-6" />
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

            {filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-beauty-cream flex items-center justify-center text-beauty-taupe/40 mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">No Matching Sales</h4>
                <p className="text-xs text-beauty-taupe max-w-xs mt-1">
                  Adjust your search or filter inputs to see transaction records.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-beauty-taupe">
                      <th className="pb-3 pr-4 font-semibold">Date/Time</th>
                      <th className="pb-3 px-4 font-semibold">Mobile Number</th>
                      <th className="pb-3 px-4 font-semibold">Product</th>
                      <th className="pb-3 px-4 font-semibold">Category</th>
                      <th className="pb-3 px-4 font-semibold text-right">Qty</th>
                      <th className="pb-3 px-4 font-semibold text-right">Price</th>
                      <th className="pb-3 px-4 font-semibold text-right">Discount</th>
                      <th className="pb-3 px-4 font-semibold text-center">Payment</th>
                      <th className="pb-3 pl-4 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white/90">
                    {filteredSales.slice(0, 10).map((sale, idx) => (
                      <tr key={sale.sale_id || idx} className="hover:bg-beauty-blush/30 transition-colors">
                        <td className="py-3.5 pr-4 font-mono text-[10px] text-beauty-taupe whitespace-nowrap">
                          {sale.date ? new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-beauty-taupe">
                          {sale.customer_phone || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-medium max-w-[200px] truncate">
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
                        <td className="py-3.5 px-4 text-right text-rose-500 font-medium">
                          {parseFloat(sale.discount) > 0 ? `-${formatCurrency(sale.discount)}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-beauty-cream/50 text-white rounded">
                            {sale.payment_method || 'Cash'}
                          </span>
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
          {filteredSales.length > 10 && (
            <div className="border-t border-white/5 pt-4 text-center mt-4">
              <span className="text-[10px] text-beauty-taupe font-medium">
                Showing latest 10 of {filteredSales.length} filtered transactions
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
