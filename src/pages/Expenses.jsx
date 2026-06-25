import React, { useState, useEffect } from 'react';
import { Coins, Trash2, Plus, Info, Receipt, ArrowLeft, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { getExpenses, addExpense, deleteExpense, updateExpense } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time');

  // Editing State
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, methodFilter, dateRangeFilter]);

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

  // Form State
  const [form, setForm] = useState({
    name: '',
    amount: '',
    transaction_type: 'Cash'
  });

  // Load Expenses
  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit new/edited expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please enter an expense description');
      return;
    }

    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      if (editingExpenseId) {
        // Update flow
        const res = await updateExpense(editingExpenseId, {
          name: form.name.trim(),
          amount: amt,
          transaction_type: form.transaction_type
        });

        if (res.success) {
          toast.success('Expense updated successfully!');
          setForm({ name: '', amount: '', transaction_type: 'Cash' });
          setEditingExpenseId(null);
          loadExpenses();
        } else {
          toast.error('Failed to update expense');
        }
      } else {
        // Creation flow
        const res = await addExpense({
          name: form.name.trim(),
          amount: amt,
          transaction_type: form.transaction_type
        });

        if (res.success) {
          toast.success('Expense recorded successfully!');
          setForm({ name: '', amount: '', transaction_type: 'Cash' });
          loadExpenses();
        } else {
          toast.error('Failed to record expense');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing expense details
  const handleStartEdit = (expense) => {
    setEditingExpenseId(expense.id);
    setForm({
      name: expense.name,
      amount: expense.amount.toString(),
      transaction_type: expense.transaction_type
    });
  };

  // Cancel editing mode
  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setForm({
      name: '',
      amount: '',
      transaction_type: 'Cash'
    });
  };

  // Delete expense handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await deleteExpense(id);
      if (res.success) {
        toast.success('Expense deleted');
        loadExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting expense');
    }
  };

  // Filtered expenses list
  const filteredExpenses = expenses.filter(expense => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (expense.name || '').toLowerCase().includes(q);
    
    const matchesMethod = methodFilter === 'All' || 
      (expense.transaction_type || '').toLowerCase() === methodFilter.toLowerCase();
      
    const matchesDate = isDateWithinRange(expense.created_at, dateRangeFilter);
    
    return matchesSearch && matchesMethod && matchesDate;
  });

  // Paginated Expenses
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Total Expenses
  const totalExpensesAmount = filteredExpenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  // Helper currency formatter
  const formatCurrency = (val) => {
    return `৳\u00a0${parseFloat(val).toFixed(2)}`;
  };

  // Date formatter
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Header and Go Back */}
      <div className="space-y-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-beauty-taupe hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Expenses Management
        </h2>
        <p className="text-beauty-taupe text-sm">
          Track your operational costs, utility bills, rents, and general expenses here.
        </p>
      </div>

      {/* Stats summary & Form wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Summary Card */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Expenses Metric Summary Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-beauty-taupe">
                Total Expenses
              </span>
              <Coins className="w-5 h-5 text-rose-400 shrink-0" />
            </div>
            <div className="mt-4 text-3xl font-black text-white whitespace-nowrap">
              {formatCurrency(totalExpensesAmount)}
            </div>
            <div className="text-[10px] text-beauty-taupe font-medium mt-1">
              Sum of all registered operational costs
            </div>
          </div>

          {/* Expense Entry Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/60 shadow-lg space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-beauty-accent" />
              {editingExpenseId ? 'Update Expense Details' : 'Record New Expense'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Expense Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="beauty-label">Expense Description *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Rent, Electricity Bill, Packaging"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs placeholder:text-beauty-taupe/40"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label htmlFor="amount" className="beauty-label">Amount (BDT ৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  id="amount"
                  name="amount"
                  required
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs placeholder:text-beauty-taupe/40"
                />
              </div>

              {/* Transaction Method */}
              <div className="space-y-1.5">
                <label htmlFor="transaction_type" className="beauty-label">Transaction Method *</label>
                <select
                  id="transaction_type"
                  name="transaction_type"
                  value={form.transaction_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-beauty-clay text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Submit / Cancel Actions */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-beauty-accent to-purple-600 hover:from-purple-500 hover:to-beauty-accent text-white font-bold text-xs tracking-wider transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      {editingExpenseId ? <Plus className="w-3.5 h-3.5 rotate-45" /> : <Plus className="w-3.5 h-3.5" />}
                      {editingExpenseId ? 'Update Expense' : 'Record Expense'}
                    </>
                  )}
                </button>
                
                {editingExpenseId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full py-2 rounded-xl border border-white/10 bg-beauty-rose/40 hover:bg-beauty-blush text-white font-semibold text-xs tracking-wide transition-all duration-200 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: List of Expenses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/40 shadow-lg space-y-6">
            
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-rose-400" />
                Expenses Log
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search expense description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-white/10 bg-beauty-cream/55 text-white placeholder:text-beauty-taupe/40 text-[11px] focus:outline-none focus:ring-1 focus:ring-beauty-accent w-full sm:w-40"
                />
                
                {/* Method */}
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-white/10 bg-beauty-clay text-white text-[11px] focus:outline-none"
                >
                  <option value="All">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                
                {/* Date Range */}
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-white/10 bg-beauty-clay text-white text-[11px] focus:outline-none"
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-beauty-taupe animate-pulse">
                Loading logged expenses...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-12 text-center max-w-sm mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-beauty-cream/30 flex items-center justify-center text-beauty-taupe/40 mx-auto">
                  <Info className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Matching Expenses</h4>
                <p className="text-xs text-beauty-taupe leading-relaxed">
                  Adjust your search or filter inputs to view operational costs.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-beauty-rose shadow-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-beauty-taupe bg-beauty-clay/50">
                      <th className="py-3 px-5 font-semibold whitespace-nowrap">Date & Time</th>
                      <th className="py-3 px-5 font-semibold whitespace-nowrap min-w-[150px]">Description</th>
                      <th className="py-3 px-5 font-semibold whitespace-nowrap">Method</th>
                      <th className="py-3 px-5 font-semibold text-right whitespace-nowrap">Amount</th>
                      <th className="py-3 px-5 font-semibold text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white/90 bg-beauty-rose/20">
                    {paginatedExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-beauty-blush/30 transition-colors">
                        <td className="py-3 px-5 font-mono text-[10px] text-beauty-taupe whitespace-nowrap">
                          {formatDate(expense.created_at)}
                        </td>
                        <td className="py-3 px-5 font-medium whitespace-normal break-words">
                          {expense.name}
                        </td>
                        <td className="py-3 px-5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            expense.transaction_type === 'Cash' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            expense.transaction_type === 'bKash' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                            expense.transaction_type === 'Card' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-amber-400/10 text-amber-400 border border-amber-400/25'
                          }`}>
                            {expense.transaction_type}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-rose-300 whitespace-nowrap">
                          -{formatCurrency(expense.amount)}
                        </td>
                        <td className="py-3 px-5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(expense)}
                              className="p-1.5 rounded-lg border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-beauty-accent hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Edit Expense"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-1.5 rounded-lg border border-white/10 bg-beauty-cream/30 hover:bg-rose-500/20 text-beauty-taupe hover:text-rose-400 transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5 mt-4">
                  <div className="text-xs text-beauty-taupe">
                    Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span>
                    <span className="text-beauty-taupe/60 ml-2">({filteredExpenses.length} total expenses)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-beauty-accent hover:bg-beauty-accent/90 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                      title="Next page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
