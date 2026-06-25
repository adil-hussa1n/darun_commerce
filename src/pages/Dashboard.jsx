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
  Info,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getProducts, getSalesHistory, getExpenses, getReturns, executeReturn, syncOfflineData, getUnsyncedCount } from '../services/api';
import { DashboardSkeleton } from '../components/Skeleton';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [returnsList, setReturnsList] = useState([]);

  // Return Product Modal States
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedSaleItem, setSelectedSaleItem] = useState(null);
  const [returnQtyInput, setReturnQtyInput] = useState(1);
  const [refundAmtInput, setRefundAmtInput] = useState('');
  const [restockStatus, setRestockStatus] = useState('Restocked');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Purchasing History Pagination States
  const [historyPage, setHistoryPage] = useState(1);
  const historyItemsPerPage = 10;

  // Unsynced state
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  // Hidden/Reveal profit states
  const [showProfit, setShowProfit] = useState(false);
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // 30 seconds auto-hide timer
  useEffect(() => {
    let timer;
    if (showProfit) {
      timer = setTimeout(() => {
        setShowProfit(false);
      }, 30000);
    }
    return () => clearTimeout(timer);
  }, [showProfit]);

  // Reset pagination on filter changes
  useEffect(() => {
    setHistoryPage(1);
  }, [searchQuery, paymentFilter, dateRangeFilter, categoryFilter]);

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
      const [prodList, salesList, expensesList, returnsRes] = await Promise.all([
        getProducts(),
        getSalesHistory(),
        getExpenses(),
        getReturns()
      ]);
      setProducts(prodList);
      setSales(salesList);
      setExpenses(expensesList);
      setReturnsList(returnsRes || []);

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

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSaleItem) return;

    const returnQty = parseInt(returnQtyInput, 10);
    const refundAmt = parseFloat(refundAmtInput);

    const alreadyReturnedQty = returnsList
      .filter(r => r.sale_item_id === selectedSaleItem.id || r.sale_item_id === selectedSaleItem.sale_id)
      .reduce((sum, r) => sum + r.returned_quantity, 0);
    const maxReturnableQty = selectedSaleItem.quantity - alreadyReturnedQty;

    if (isNaN(returnQty) || returnQty <= 0) {
      toast.error('Return quantity must be greater than 0');
      return;
    }

    if (returnQty > maxReturnableQty) {
      toast.error(`Cannot return more than purchased quantity remaining (${maxReturnableQty})`);
      return;
    }

    if (isNaN(refundAmt) || refundAmt < 0) {
      toast.error('Refund amount must be a positive number or 0');
      return;
    }

    try {
      setSubmittingReturn(true);
      const res = await executeReturn(selectedSaleItem.id, returnQty, refundAmt, restockStatus);
      
      if (res && res.local) {
        toast.warning('Network issue — return recorded locally. Will sync later.');
      } else {
        toast.success('Return registered successfully!');
      }

      setReturnModalOpen(false);
      setSelectedSaleItem(null);
      
      // Reload dashboard data
      loadDashboardData(false, true);
    } catch (err) {
      toast.error(err.message || 'Failed to process return.');
      console.error(err);
    } finally {
      setSubmittingReturn(false);
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
      (sale.customer_phone || '').toLowerCase().includes(q) ||
      (sale.category || '').toLowerCase().includes(q);

    const matchesPayment = paymentFilter === 'All' ||
      (sale.payment_method || '').toLowerCase() === paymentFilter.toLowerCase();

    const matchesDate = isDateWithinRange(sale.date, dateRangeFilter);

    const matchesCategory = categoryFilter === 'All' ||
      (sale.category || '').toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesPayment && matchesDate && matchesCategory;
  });

  // Paginated Sales for history
  const totalHistoryPages = Math.ceil(filteredSales.length / historyItemsPerPage) || 1;
  const paginatedSales = filteredSales.slice(
    (historyPage - 1) * historyItemsPerPage,
    historyPage * historyItemsPerPage
  );

  // Filtered Expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesDate = isDateWithinRange(exp.created_at, dateRangeFilter);
    const matchesPayment = paymentFilter === 'All' ||
      (exp.transaction_type || '').toLowerCase() === paymentFilter.toLowerCase();
    return matchesDate && matchesPayment;
  });

  // Total Revenue & Units Sold
  const totalRevenue = filteredSales.reduce((acc, sale) => acc + parseFloat(sale.total_price || 0), 0);
  
  // Total purchase count excludes sales that are fully returned
  const totalPurchaseCount = filteredSales.filter(sale => {
    const alreadyReturnedQty = returnsList
      .filter(r => r.sale_item_id === sale.id || r.sale_item_id === sale.sale_id)
      .reduce((sum, r) => sum + r.returned_quantity, 0);
    return alreadyReturnedQty < sale.quantity;
  }).length;

  // Filtered Returns
  const filteredReturns = returnsList.filter(ret => {
    const originalSale = sales.find(s => s.id === ret.sale_item_id || s.sale_id === ret.sale_item_id);
    const matchesDate = isDateWithinRange(ret.created_at, dateRangeFilter);
    const matchesPayment = paymentFilter === 'All' ||
      (originalSale && (originalSale.payment_method || '').toLowerCase() === paymentFilter.toLowerCase());

    // Match search query against the original sale's product name, customer phone, or category
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (originalSale && (
        (originalSale.product_name || '').toLowerCase().includes(q) ||
        (originalSale.customer_phone || '').toLowerCase().includes(q) ||
        (originalSale.category || '').toLowerCase().includes(q)
      ));

    const matchesCategory = categoryFilter === 'All' ||
      (originalSale && (originalSale.category || '').toLowerCase() === categoryFilter.toLowerCase());

    return matchesDate && matchesPayment && matchesSearch && matchesCategory;
  });

  // Total refunds & net revenue
  const totalRefunds = filteredReturns.reduce((acc, r) => acc + parseFloat(r.refund_amount || 0), 0);
  const netRevenue = Math.max(0, totalRevenue - totalRefunds);

  // Total Profit (Gross)
  const grossProfit = filteredSales.reduce((acc, sale) => {
    const qty = parseInt(sale.quantity || 0, 10);
    const totalPrice = parseFloat(sale.total_price || 0);

    // If snapshot buy price is available, use it directly (immune to catalog modifications)
    if (sale.buy_price_snapshot !== null && sale.buy_price_snapshot !== undefined) {
      const buyPrice = parseFloat(sale.buy_price_snapshot);
      return acc + (totalPrice - (buyPrice * qty));
    }

    // Legacy fallback: look up product in current catalog
    const product = products.find(p => p.name.trim().toLowerCase() === sale.product_name.trim().toLowerCase());
    if (product) {
      const buyPrice = parseFloat(product.buy_price || 0);
      return acc + (totalPrice - (buyPrice * qty));
    } else {
      // Last-resort fallback for deleted/missing products
      return acc + (totalPrice * 0.5);
    }
  }, 0);

  // Returns profit deduction
  const returnsDeduction = filteredReturns.reduce((acc, r) => {
    const originalSale = sales.find(s => s.id === r.sale_item_id || s.sale_id === r.sale_item_id);
    let buyPrice = 0;
    if (originalSale) {
      if (originalSale.buy_price_snapshot !== null && originalSale.buy_price_snapshot !== undefined) {
        buyPrice = parseFloat(originalSale.buy_price_snapshot);
      } else {
        const product = products.find(p => p.name.trim().toLowerCase() === originalSale.product_name.trim().toLowerCase());
        buyPrice = product ? parseFloat(product.buy_price || 0) : (parseFloat(originalSale.total_price || 0) / parseInt(originalSale.quantity || 1, 10)) * 0.5;
      }
    }

    const refundAmt = parseFloat(r.refund_amount || 0);
    const qty = parseInt(r.returned_quantity || 0, 10);

    if (r.restock_status === 'Restocked') {
      const cogsReversal = buyPrice * qty;
      return acc + (refundAmt - cogsReversal);
    } else {
      return acc + refundAmt;
    }
  }, 0);

  const adjustedGrossProfit = grossProfit - returnsDeduction;

  // Total Expenses
  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + parseFloat(exp.amount || 0), 0);

  // Net Profit (adjusted for returns)
  const netProfit = adjustedGrossProfit - totalExpenses;

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
        <div className="absolute top-0 right-0 w-32 h-32 bg-beauty-accent/15 rounded-full blur-3xl pointer-events-none" />
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


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6">

        {/* KPI: Total Sales */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Net Sales
            </span>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white truncate" title={formatCurrency(netRevenue)}>
              {formatCurrency(netRevenue)}
            </h3>
            {totalRefunds > 0 ? (
              <div className="text-[10px] text-rose-400 font-medium flex flex-col gap-0.5 mt-0.5">
                <span className="opacity-95">Gross: {formatCurrency(totalRevenue)}</span>
                <span>Ref: -{formatCurrency(totalRefunds)}</span>
              </div>
            ) : (
              <span className="text-[10px] text-beauty-taupe/80 block">
                Started from 20 June 2026.
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-beauty-accent/15 flex items-center justify-center text-beauty-accent shrink-0 ml-4">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Purchase */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Total Purchase
            </span>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {totalPurchaseCount}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Successful checkouts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-beauty-accent/15 flex items-center justify-center text-beauty-accent shrink-0 ml-4">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Net Profit */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
                Net Profit
              </span>
              <button 
                type="button"
                onClick={() => {
                  if (showProfit) {
                    setShowProfit(false);
                  } else {
                    setPasswordPromptOpen(true);
                    setPasswordInput('');
                    setPasswordError(false);
                  }
                }}
                className="text-beauty-taupe/60 hover:text-white transition-colors cursor-pointer"
                title={showProfit ? "Hide Net Profit" : "Unlock Net Profit"}
              >
                {showProfit ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            {showProfit ? (
              <h3 className={`text-xl md:text-2xl font-bold tracking-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} animate-fade-in truncate`} title={formatCurrency(netProfit)}>
                {formatCurrency(netProfit)}
              </h3>
            ) : (
              <div 
                onClick={() => {
                  setPasswordPromptOpen(true);
                  setPasswordInput('');
                  setPasswordError(false);
                }}
                className="cursor-pointer group flex items-center gap-1.5"
                title="Click to reveal"
              >
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white/40 group-hover:text-white/60 transition-colors">
                  ••••••
                </h3>
                <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-beauty-cream/40 text-beauty-taupe font-bold uppercase tracking-wider group-hover:bg-beauty-cream group-hover:text-white transition-all">
                  Locked
                </span>
              </div>
            )}
            
            <span className="text-[10px] text-beauty-taupe/80 block">
              {showProfit ? "Gross profit - expenses" : "Click dots or eye to unlock"}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-4 ${
            !showProfit ? 'bg-beauty-cream/10 text-beauty-taupe/40' :
            netProfit >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Expenses */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Total Expenses
            </span>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-rose-300 truncate" title={formatCurrency(totalExpenses)}>
              {formatCurrency(totalExpenses)}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Operational costs
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-300 shrink-0 ml-4">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Stock Investment */}
        <div className="p-6 rounded-2xl bg-beauty-rose border border-white/5 shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:border-beauty-accent/20">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold text-beauty-taupe tracking-wider uppercase block">
              Stock Investment
            </span>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-amber-400 truncate" title={formatCurrency(stockInvestment)}>
              {formatCurrency(stockInvestment)}
            </h3>
            <span className="text-[10px] text-beauty-taupe/80 block">
              Total capital in stock
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0 ml-4">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Transactions (Full Width) */}
      <div className="grid grid-cols-1 gap-8">

        {/* Recent Purchasing History */}
        <div className="bg-beauty-rose rounded-2xl border border-white/5 shadow-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-sans">
                  Recent Purchasing History
                </h3>
              </div>
              <Link
                to="/sell-products"
                className="text-xs font-semibold text-beauty-accent hover:text-white flex items-center gap-1 group transition-colors self-start md:self-auto"
              >
                Create Sale
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Filter controls inside Purchasing History */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-beauty-taupe uppercase tracking-wider">Search</label>
                <input
                  type="text"
                  placeholder="Product name or customer phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-1 focus:ring-beauty-accent text-xs placeholder:text-beauty-taupe/40 w-full animate-transition"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-beauty-taupe uppercase tracking-wider">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-beauty-clay text-white focus:outline-none text-xs cursor-pointer h-[30px]"
                >
                  <option value="All">All Categories</option>
                  <option value="Skin Care">Skin Care</option>
                  <option value="Body Care">Body Care</option>
                  <option value="Hair Care">Hair Care</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-beauty-taupe uppercase tracking-wider">Payment Method</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-beauty-clay text-white focus:outline-none text-xs cursor-pointer h-[30px]"
                >
                  <option value="All">All Payments</option>
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-beauty-taupe uppercase tracking-wider">Date Range</label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-beauty-clay text-white focus:outline-none text-xs cursor-pointer h-[30px]"
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
              </div>
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
                      <th className="pb-3 px-4 font-semibold text-center no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white/90">
                    {paginatedSales.map((sale, idx) => {
                      const alreadyReturnedQty = returnsList
                        .filter(r => r.sale_item_id === sale.id || r.sale_item_id === sale.sale_id)
                        .reduce((sum, r) => sum + r.returned_quantity, 0);
                      const maxReturnableQty = Math.max(0, sale.quantity - alreadyReturnedQty);

                      return (
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
                          <td className="py-3.5 px-4 text-center no-print">
                            {maxReturnableQty <= 0 ? (
                              <span className="text-[10px] text-beauty-taupe/40 italic font-medium">Returned</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedSaleItem(sale);
                                  setReturnQtyInput(maxReturnableQty);
                                  setRefundAmtInput(((parseFloat(sale.total_price) / sale.quantity) * maxReturnableQty).toFixed(2));
                                  setRestockStatus('Restocked');
                                  setReturnModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title="Return Item"
                              >
                                Return
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Pagination Controls */}
          <div className="px-2 py-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <div className="text-xs text-beauty-taupe">
              Page <span className="font-bold text-white">{historyPage}</span> of <span className="font-bold text-white">{totalHistoryPages}</span>
              <span className="text-beauty-taupe/60 ml-2">({filteredSales.length} total sales)</span>
            </div>

            {totalHistoryPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                  disabled={historyPage === 1}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <button
                  onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                  disabled={historyPage === totalHistoryPages}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-beauty-accent hover:bg-beauty-accent/90 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                  title="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Return Product Modal */}
      {returnModalOpen && selectedSaleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-beauty-clay via-beauty-rose to-beauty-clay shadow-2xl space-y-5 animate-scale-up">
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Process Product Return</h3>
              <p className="text-xs text-beauty-taupe/80">
                Register a customer return and specify refund terms.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-beauty-cream/10 border border-white/5 space-y-2 text-xs text-white/90">
              <div className="flex justify-between"><span className="text-beauty-taupe">Product:</span> <span className="font-bold truncate max-w-[200px]">{selectedSaleItem.product_name}</span></div>
              <div className="flex justify-between"><span className="text-beauty-taupe">Invoice No:</span> <span className="font-mono font-bold">{selectedSaleItem.sale_id}</span></div>
              <div className="flex justify-between"><span className="text-beauty-taupe">Bought Qty:</span> <span className="font-bold">{selectedSaleItem.quantity} units</span></div>
              <div className="flex justify-between"><span className="text-beauty-taupe">Bought Price:</span> <span className="font-bold">{formatCurrency(selectedSaleItem.unit_price)}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-2 text-beauty-accent"><span className="font-semibold text-beauty-taupe">Net Total Paid:</span> <span className="font-bold">{formatCurrency(selectedSaleItem.total_price)}</span></div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              {/* Return Quantity */}
              <div className="space-y-1.5">
                <label className="beauty-label">Return Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedSaleItem.quantity - returnsList
                    .filter(r => r.sale_item_id === selectedSaleItem.id || r.sale_item_id === selectedSaleItem.sale_id)
                    .reduce((sum, r) => sum + r.returned_quantity, 0)}
                  value={returnQtyInput}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || '';
                    setReturnQtyInput(val);
                    if (val !== '') {
                      // Proportional refund auto-calculate
                      const unitPrice = parseFloat(selectedSaleItem.total_price) / selectedSaleItem.quantity;
                      setRefundAmtInput((unitPrice * val).toFixed(2));
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                />
              </div>

              {/* Refund Amount */}
              <div className="space-y-1.5">
                <label className="beauty-label">Refund Amount (BDT ৳)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={refundAmtInput}
                  onChange={(e) => setRefundAmtInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                />
              </div>

              {/* Inventory Status */}
              <div className="space-y-1.5">
                <label className="beauty-label">Inventory Status</label>
                <select
                  value={restockStatus}
                  onChange={(e) => setRestockStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-beauty-clay text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs cursor-pointer"
                >
                  <option value="Restocked" className="bg-[#151030] text-white">Restocked (Add back to store stock)</option>
                  <option value="Damaged" className="bg-[#151030] text-white">Damaged (Write off inventory cost)</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setReturnModalOpen(false);
                    setSelectedSaleItem(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-purple-500 hover:to-rose-600 text-white font-bold text-xs tracking-wider transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {submittingReturn ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    'Confirm Return'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Prompt Modal for revealing Net Profit */}
      {passwordPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-beauty-clay via-beauty-rose to-beauty-clay shadow-2xl space-y-4 animate-scale-up">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Enter Password</h3>
              <p className="text-xs text-beauty-taupe/80">
                Please enter the password to view the Net Profit dashboard card.
              </p>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordInput === 'UKSB2026') {
                  setShowProfit(true);
                  setPasswordPromptOpen(false);
                  setPasswordError(false);
                  setPasswordInput('');
                  toast.success('Net Profit revealed for 30 seconds');
                } else {
                  setPasswordError(true);
                  toast.error('Incorrect password');
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(false);
                  }}
                  className={`w-full px-4 py-2 rounded-xl border bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs ${
                    passwordError ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-white/10'
                  }`}
                  autoFocus
                />
                {passwordError && (
                  <span className="text-[10px] text-rose-400 font-medium">
                    Incorrect password. Please try again.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordPromptOpen(false);
                    setPasswordInput('');
                    setPasswordError(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-beauty-accent to-purple-600 hover:from-purple-500 hover:to-beauty-accent text-white font-bold text-xs tracking-wider transition-all duration-300 shadow-md cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
