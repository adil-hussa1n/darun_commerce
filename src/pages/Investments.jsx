import React, { useState, useEffect } from 'react';
import { Wallet, Trash2, Plus, Info, Edit, ArrowLeft, ChevronLeft, ChevronRight, Search, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { getInvestments, addInvestment, deleteInvestment, updateInvestment } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Investments() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState(null);

  // Custom Confirm Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset pagination on search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Form State
  const [form, setForm] = useState({
    name: '',
    amount: '',
    description: ''
  });

  // Load Investments
  const loadInvestments = async () => {
    setLoading(true);
    try {
      const data = await getInvestments();
      setInvestments(data);
    } catch (err) {
      toast.error('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, []);

  // Form Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit Add or Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please enter an investor name');
      return;
    }

    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update flow
        const res = await updateInvestment(editingId, {
          name: form.name.trim(),
          amount: amt,
          description: form.description.trim()
        });

        if (res.success) {
          toast.success('Investment updated successfully!');
          setForm({ name: '', amount: '', description: '' });
          setEditingId(null);
          loadInvestments();
        } else {
          toast.error('Failed to update investment');
        }
      } else {
        // Creation flow
        const res = await addInvestment({
          name: form.name.trim(),
          amount: amt,
          description: form.description.trim()
        });

        if (res.success) {
          toast.success('Investment recorded successfully!');
          setForm({ name: '', amount: '', description: '' });
          loadInvestments();
        } else {
          toast.error('Failed to record investment');
        }
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Button Handler
  const handleStartEdit = (inv) => {
    setEditingId(inv.id);
    setForm({
      name: inv.name,
      amount: inv.amount.toString(),
      description: inv.description || ''
    });
    // Scroll smoothly to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      name: '',
      amount: '',
      description: ''
    });
  };

  // Delete Handler
  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id) => {
    setDeleteConfirmId(null);
    try {
      const res = await deleteInvestment(id);
      if (res.success) {
        toast.success('Investment record deleted');
        loadInvestments();
      } else {
        toast.error('Failed to delete investment');
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting investment');
    }
  };

  // Format Currency (BDT)
  const formatCurrency = (val) => {
    return `৳\u00a0${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Date Formatter
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

  // Filter individual records
  const filteredInvestments = investments.filter(inv => {
    const q = searchQuery.toLowerCase().trim();
    return !q || 
      (inv.name || '').toLowerCase().includes(q) || 
      (inv.description || '').toLowerCase().includes(q);
  });

  // Paginated records
  const totalPages = Math.ceil(filteredInvestments.length / itemsPerPage) || 1;
  const paginatedInvestments = filteredInvestments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Totals calculations
  const totalInvestedCapital = investments.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  // Group by Investor Name for Share Calculations
  const investorAggregates = {};
  investments.forEach(inv => {
    const nameKey = inv.name.trim();
    if (!investorAggregates[nameKey]) {
      investorAggregates[nameKey] = {
        name: nameKey,
        total: 0,
        lastInvested: null
      };
    }
    investorAggregates[nameKey].total += inv.amount;
    const invDate = new Date(inv.created_at);
    if (!investorAggregates[nameKey].lastInvested || invDate > new Date(investorAggregates[nameKey].lastInvested)) {
      investorAggregates[nameKey].lastInvested = inv.created_at;
    }
  });

  // Calculate percentages and sort
  const sharesBreakdown = Object.values(investorAggregates).map(investor => ({
    ...investor,
    percentage: totalInvestedCapital > 0 ? (investor.total / totalInvestedCapital) * 100 : 0
  })).sort((a, b) => b.total - a.total);

  // Beautiful visual progress bar background colors array
  const barColors = [
    'bg-beauty-accent',
    'bg-amber-500',
    'bg-rose-400',
    'bg-teal-500',
    'bg-purple-500',
    'bg-sky-500'
  ];

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Header and navigation */}
      <div className="space-y-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-beauty-taupe hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Investment Capital Management
        </h2>
        <p className="text-beauty-taupe text-sm">
          Track individual capital investments and automatically monitor equity or share ratios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & General Stats */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Total Invested Metric Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-beauty-accent/10 rounded-full blur-2xl animate-pulse" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-beauty-taupe">
                Total Capital Invested
              </span>
              <Wallet className="w-5 h-5 text-beauty-accent shrink-0" />
            </div>
            <div className="mt-4 text-3xl font-black text-white whitespace-nowrap">
              {formatCurrency(totalInvestedCapital)}
            </div>
            <div className="text-[10px] text-beauty-taupe font-medium mt-1">
              Aggregate of all active investment records
            </div>
          </div>

          {/* Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/60 shadow-lg space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-beauty-accent" />
              {editingId ? 'Update Investment Record' : 'Record Investment'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Investor Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="beauty-label">Investor Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 w-4 h-4 text-beauty-taupe/50" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Adnan, Sarah, Nabeel"
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs placeholder:text-beauty-taupe/40"
                  />
                </div>
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

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="description" className="beauty-label">Description / Notes</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Notes about this investment (e.g. Initial capital, Phase 2 expansion)"
                  value={form.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs placeholder:text-beauty-taupe/40 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-beauty-accent hover:bg-beauty-accent/90 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Record'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Columns: Percentages & Individual Records */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Share Ratios / Percentages Table */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/40 shadow-lg space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-beauty-accent" />
                Capital Share Distribution
              </h3>
              <span className="text-[10px] bg-beauty-accent/20 text-beauty-accent px-2 py-0.5 rounded-full font-bold">
                Live Percentages
              </span>
            </div>

            {sharesBreakdown.length === 0 ? (
              <div className="text-center py-8 text-beauty-taupe text-xs">
                No investors found. Record an investment to view share percentages.
              </div>
            ) : (
              <div className="space-y-4">
                {sharesBreakdown.map((investor, idx) => {
                  const colorClass = barColors[idx % barColors.length];
                  return (
                    <div key={investor.name} className="space-y-1 animate-slide-up">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-white">{investor.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-beauty-taupe">{formatCurrency(investor.total)}</span>
                          <span className="font-bold text-beauty-accent">{investor.percentage.toFixed(2)}%</span>
                        </div>
                      </div>
                      
                      {/* Share gauge visual */}
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colorClass} rounded-full transition-all duration-1000`}
                          style={{ width: `${investor.percentage}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-beauty-taupe/80 flex justify-between">
                        <span>Last transaction: {formatDate(investor.lastInvested)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Individual records list */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/40 shadow-lg space-y-6">
            
            {/* List Header and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-beauty-accent" />
                Investment Ledger
              </h3>
              
              <div className="relative max-w-xs w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-beauty-taupe/50" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/5 bg-beauty-clay focus:bg-beauty-cream/10 text-white focus:outline-none focus:ring-1 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs placeholder:text-beauty-taupe/40"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-beauty-taupe text-xs">
                Loading ledger records...
              </div>
            ) : paginatedInvestments.length === 0 ? (
              <div className="text-center py-12 text-beauty-taupe text-xs border border-dashed border-white/5 rounded-xl">
                No investment ledger records found.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scrollable table body */}
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-beauty-clay/50 text-beauty-taupe border-b border-white/5 font-semibold">
                        <th className="p-3">Date</th>
                        <th className="p-3">Investor</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedInvestments.map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/2 transition-colors text-white">
                          <td className="p-3 whitespace-nowrap text-beauty-taupe">
                            {formatDate(inv.created_at)}
                          </td>
                          <td className="p-3 font-semibold">
                            {inv.name}
                          </td>
                          <td className="p-3 font-bold text-beauty-accent">
                            {formatCurrency(inv.amount)}
                          </td>
                          <td className="p-3 max-w-xs truncate text-beauty-taupe/90" title={inv.description}>
                            {inv.description || '—'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEdit(inv)}
                                className="p-1.5 text-beauty-taupe hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(inv.id)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
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

                {/* Pagination footer */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs">
                  <div className="text-beauty-taupe">
                    Showing <span className="font-semibold text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-semibold text-white">
                      {Math.min(currentPage * itemsPerPage, filteredInvestments.length)}
                    </span> of{' '}
                    <span className="font-semibold text-white">{filteredInvestments.length}</span> records
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-white/5 rounded-lg font-bold text-white">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1738] border border-white/10 max-w-sm w-full rounded-2xl p-6 shadow-2xl animate-slide-up space-y-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Delete Investment Record?</h3>
              <p className="text-xs text-beauty-taupe">
                Are you sure you want to delete this investment record? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
