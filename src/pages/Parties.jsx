import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  ArrowLeft, 
  Plus, 
  Coins, 
  Phone, 
  MapPin, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  getParties, 
  addParty, 
  updateParty, 
  deleteParty, 
  getPartyTransactions, 
  addPartyTransaction, 
  updatePartyTransaction, 
  deletePartyTransaction 
} from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Parties() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingParty, setSubmittingParty] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  
  // Transactions ledger list for selected party
  const [transactions, setTransactions] = useState([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [submittingTx, setSubmittingTx] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Party Form State
  const [partyForm, setPartyForm] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [editingPartyId, setEditingPartyId] = useState(null);

  // Transaction Form State
  const [txForm, setTxForm] = useState({
    amount: '',
    type: 'Due (To Receive)', 
    description: ''
  });
  const [editingTxId, setEditingTxId] = useState(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Helper to determine balance sign impact
  const isPositiveType = (type) => {
    return type === 'Due (To Receive)' || type === 'Payment (Paid)' || type === 'Advance (Paid)';
  };

  // Calculate net balance for a list of transactions
  const calculateBalance = (txList) => {
    return txList.reduce((sum, t) => {
      return sum + (isPositiveType(t.type) ? t.amount : -t.amount);
    }, 0);
  };

  // Load Parties
  const loadParties = async () => {
    setLoading(true);
    try {
      const data = await getParties();
      
      // Enrich each party with their transactions to show balance in listing
      const enrichedParties = await Promise.all(data.map(async (party) => {
        const txs = await getPartyTransactions(party.id);
        return {
          ...party,
          balance: calculateBalance(txs)
        };
      }));

      setParties(enrichedParties);
    } catch (err) {
      toast.error('Failed to load parties directory');
    } finally {
      setLoading(false);
    }
  };

  // Load Transactions for Selected Party
  const loadTransactions = async (partyId) => {
    setLoadingTxs(true);
    try {
      const data = await getPartyTransactions(partyId);
      setTransactions(data);
    } catch (err) {
      toast.error('Failed to load ledger transactions');
    } finally {
      setLoadingTxs(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  // Handle party form changes
  const handlePartyInputChange = (e) => {
    const { name, value } = e.target;
    setPartyForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle transaction form changes
  const handleTxInputChange = (e) => {
    const { name, value } = e.target;
    setTxForm(prev => ({ ...prev, [name]: value }));
  };

  // Create / Update Party
  const handlePartySubmit = async (e) => {
    e.preventDefault();
    if (!partyForm.name.trim()) {
      toast.error('Please enter a party name');
      return;
    }

    setSubmittingParty(true);
    try {
      if (editingPartyId) {
        const res = await updateParty(editingPartyId, partyForm);
        if (res.success) {
          toast.success('Party details updated!');
          setPartyForm({ name: '', phone: '', address: '' });
          setEditingPartyId(null);
          loadParties();
          // If the edited party was currently selected, refresh its details
          if (selectedParty && selectedParty.id.toString() === editingPartyId.toString()) {
            setSelectedParty(prev => ({ ...prev, ...partyForm }));
          }
        } else {
          toast.error('Failed to update party');
        }
      } else {
        const res = await addParty(partyForm);
        if (res.success) {
          toast.success('Party added successfully!');
          setPartyForm({ name: '', phone: '', address: '' });
          loadParties();
        } else {
          toast.error('Failed to register party');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred');
    } finally {
      setSubmittingParty(false);
    }
  };

  // Edit party mode trigger
  const handleStartEditParty = (party) => {
    setEditingPartyId(party.id);
    setPartyForm({
      name: party.name,
      phone: party.phone,
      address: party.address
    });
  };

  const handleCancelPartyEdit = () => {
    setEditingPartyId(null);
    setPartyForm({ name: '', phone: '', address: '' });
  };

  // Delete Party
  const handleDeleteParty = (partyId, partyName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Party Ledger',
      message: `Are you sure you want to delete "${partyName}"? This will permanently erase this customer/supplier profile and all associated ledger records. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await deleteParty(partyId);
          if (res.success) {
            toast.success('Party deleted');
            if (selectedParty && selectedParty.id.toString() === partyId.toString()) {
              setSelectedParty(null);
            }
            loadParties();
          } else {
            toast.error('Failed to delete party');
          }
        } catch (err) {
          toast.error(err.message || 'Error occurred');
        }
      }
    });
  };

  // Select Party to view ledger statement
  const handleSelectParty = (party) => {
    setSelectedParty(party);
    loadTransactions(party.id);
    setEditingTxId(null);
    setTxForm({ amount: '', type: 'Due (To Receive)', description: '' });
  };

  // Create / Update Transaction
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(txForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setSubmittingTx(true);
    try {
      if (editingTxId) {
        const res = await updatePartyTransaction(editingTxId, {
          amount: amt,
          type: txForm.type,
          description: txForm.description
        });
        if (res.success) {
          toast.success('Transaction updated!');
          setTxForm({ amount: '', type: 'Due (To Receive)', description: '' });
          setEditingTxId(null);
          loadTransactions(selectedParty.id);
          loadParties(); // Refresh balances in background list
        } else {
          toast.error('Failed to update transaction');
        }
      } else {
        const res = await addPartyTransaction({
          party_id: selectedParty.id,
          amount: amt,
          type: txForm.type,
          description: txForm.description
        });
        if (res.success) {
          toast.success('Ledger entry added!');
          setTxForm({ amount: '', type: 'Due (To Receive)', description: '' });
          loadTransactions(selectedParty.id);
          loadParties(); // Refresh balances in background list
        } else {
          toast.error('Failed to record transaction');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred');
    } finally {
      setSubmittingTx(false);
    }
  };

  // Edit transaction mode trigger
  const handleStartEditTx = (tx) => {
    setEditingTxId(tx.id);
    setTxForm({
      amount: tx.amount.toString(),
      type: tx.type,
      description: tx.description
    });
  };

  const handleCancelTxEdit = () => {
    setEditingTxId(null);
    setTxForm({ amount: '', type: 'Due (To Receive)', description: '' });
  };

  // Delete transaction
  const handleDeleteTx = (txId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Ledger Entry',
      message: 'Are you sure you want to delete this ledger transaction entry? The outstanding balance will be recalculated accordingly.',
      onConfirm: async () => {
        try {
          const res = await deletePartyTransaction(txId);
          if (res.success) {
            toast.success('Transaction deleted');
            loadTransactions(selectedParty.id);
            loadParties(); // Refresh balances in background list
          } else {
            toast.error('Failed to delete transaction');
          }
        } catch (err) {
          toast.error(err.message || 'Error occurred');
        }
      }
    });
  };

  // Filtered party list
  const filteredParties = parties.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    return !q || 
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q);
  });

  // Calculate totals for selected party ledger
  const totalReceivables = transactions
    .filter(t => isPositiveType(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayables = transactions
    .filter(t => !isPositiveType(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalReceivables - totalPayables;

  const formatCurrency = (val) => {
    return `৳\u00a0${Math.abs(parseFloat(val)).toFixed(2)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
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
          Party Management
        </h2>
        <p className="text-beauty-taupe text-sm">
          Track customer/supplier ledgers, record due amounts, advance payments, and settle transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Party Forms & List (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Party Registration/Edit Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/60 shadow-lg space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-beauty-accent" />
              {editingPartyId ? 'Update Party Details' : 'Register New Party'}
            </h3>

            <form onSubmit={handlePartySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="beauty-label">Party Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Abul Hasan / Riya Wholesale"
                  value={partyForm.name}
                  onChange={handlePartyInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="beauty-label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="e.g. 01700000000"
                  value={partyForm.phone}
                  onChange={handlePartyInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="beauty-label">Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. Dhaka, Bangladesh"
                  value={partyForm.address}
                  onChange={handlePartyInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingParty}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-beauty-accent to-purple-600 hover:from-purple-500 hover:to-beauty-accent text-white font-bold text-xs tracking-wider transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingParty ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      {editingPartyId ? 'Update Party' : 'Add Party'}
                    </>
                  )}
                </button>
                {editingPartyId && (
                  <button
                    type="button"
                    onClick={handleCancelPartyEdit}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-beauty-rose/40 hover:bg-beauty-blush text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Party Directory List */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/40 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                Parties Directory
              </h3>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search party..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-beauty-cream/55 text-white placeholder:text-beauty-taupe/40 text-xs focus:outline-none focus:ring-1 focus:ring-beauty-accent w-full sm:w-44"
                />
                <Search className="w-3.5 h-3.5 text-beauty-taupe/50 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-beauty-taupe animate-pulse">
                Loading parties directory...
              </div>
            ) : filteredParties.length === 0 ? (
              <div className="py-12 text-center max-w-sm mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-beauty-cream/30 flex items-center justify-center text-beauty-taupe/40 mx-auto">
                  <Info className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-white">No Parties Registered</h4>
                <p className="text-[11px] text-beauty-taupe leading-relaxed">
                  Use the registration form above to register your first customer/supplier ledger.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredParties.map((party) => (
                  <div
                    key={party.id}
                    onClick={() => handleSelectParty(party)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left
                      ${selectedParty && selectedParty.id.toString() === party.id.toString() 
                        ? 'bg-beauty-accent/15 border-beauty-accent/40 shadow-sm' 
                        : 'bg-beauty-rose border-white/5 hover:bg-beauty-blush/20 hover:border-white/10'
                      }
                    `}
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{party.name}</h4>
                      {party.phone && (
                        <div className="flex items-center gap-1 text-[10px] text-beauty-taupe">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{party.phone}</span>
                        </div>
                      )}
                      {party.address && (
                        <div className="flex items-center gap-1 text-[10px] text-beauty-taupe truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{party.address}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold block ${
                        (party.balance || 0) > 0 ? 'text-rose-400' : 
                        (party.balance || 0) < 0 ? 'text-emerald-400' : 'text-beauty-taupe'
                      }`}>
                        {((party.balance || 0) > 0 ? '+' : (party.balance || 0) < 0 ? '-' : '')}{formatCurrency(party.balance || 0)}
                      </span>
                      <span className="text-[9px] text-beauty-taupe/65 font-medium">
                        {(party.balance || 0) > 0 ? 'Receivable' : 
                         (party.balance || 0) < 0 ? 'Payable' : 'Settled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Ledger Details (7 cols) */}
        <div className="lg:col-span-7">
          
          {selectedParty ? (
            <div className="space-y-8 animate-fade-in">
              
              {/* Selected Party Overview */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-beauty-rose via-beauty-clay to-beauty-rose border border-white/5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-beauty-accent/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white font-sans">{selectedParty.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-beauty-taupe">
                      {selectedParty.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-beauty-accent" />
                          {selectedParty.phone}
                        </span>
                      )}
                      {selectedParty.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-beauty-accent" />
                          {selectedParty.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditParty(selectedParty)}
                      className="p-2 rounded-xl border border-white/10 bg-beauty-cream/50 text-beauty-accent hover:text-white hover:bg-beauty-cream transition-all cursor-pointer inline-flex items-center justify-center"
                      title="Edit Party Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteParty(selectedParty.id, selectedParty.name)}
                      className="p-2 rounded-xl border border-white/10 bg-beauty-cream/50 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer inline-flex items-center justify-center"
                      title="Delete Party & Ledger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Balance Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  
                  {/* Total Receivable Oriented */}
                  <div className="p-4 rounded-xl bg-beauty-rose/65 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-beauty-taupe tracking-wider uppercase block">
                        Receivables
                      </span>
                      <h4 className="text-sm font-bold text-rose-300 mt-1">
                        {formatCurrency(totalReceivables)}
                      </h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Total Payable Oriented */}
                  <div className="p-4 rounded-xl bg-beauty-rose/65 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-beauty-taupe tracking-wider uppercase block">
                        Payables
                      </span>
                      <h4 className="text-sm font-bold text-emerald-400 mt-1">
                        {formatCurrency(totalPayables)}
                      </h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Net Balance Status */}
                  <div className="p-4 rounded-xl bg-beauty-rose/65 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-beauty-taupe tracking-wider uppercase block">
                        Net Balance
                      </span>
                      <h4 className={`text-sm font-bold mt-1 ${
                        netBalance > 0 ? 'text-rose-400' : 
                        netBalance < 0 ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {netBalance > 0 ? '+' : netBalance < 0 ? '-' : ''}{formatCurrency(netBalance)}
                      </h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-beauty-accent/15 text-beauty-accent flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Add Transaction Entry to Selected Party Ledger */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/60 shadow-lg space-y-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-beauty-accent" />
                  {editingTxId ? 'Update Ledger Entry' : 'Record Ledger Entry'}
                </h3>

                <form onSubmit={handleTxSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  
                  <div className="space-y-1.5 col-span-1">
                    <label className="beauty-label">Transaction Type *</label>
                    <select
                      name="type"
                      value={txForm.type}
                      onChange={handleTxInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-beauty-clay text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                    >
                      <option value="Due (To Receive)">Due (To Receive / Customer Ows Us)</option>
                      <option value="Due (To Pay)">Due (To Pay / We Owe Supplier)</option>
                      <option value="Payment (Received)">Payment (Received / Cash Collected)</option>
                      <option value="Payment (Paid)">Payment (Paid / Cash Paid Out)</option>
                      <option value="Advance (Paid)">Advance (Paid / Advance to Supplier)</option>
                      <option value="Advance (Received)">Advance (Received / Cust Advance)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="beauty-label">Amount (BDT ৳) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      placeholder="0.00"
                      value={txForm.amount}
                      onChange={handleTxInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 sm:col-span-3">
                    <label className="beauty-label">Description / Remarks</label>
                    <input
                      type="text"
                      name="description"
                      placeholder="e.g. Paid cash, Product purchase bill ref #12"
                      value={txForm.description}
                      onChange={handleTxInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-beauty-cream/50 focus:bg-beauty-cream text-white focus:outline-none focus:ring-2 focus:ring-beauty-accent/30 focus:border-beauty-accent transition-all text-xs"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-3 flex justify-end gap-2 mt-2">
                    {editingTxId && (
                      <button
                        type="button"
                        onClick={handleCancelTxEdit}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-beauty-rose/40 hover:bg-beauty-blush text-white font-semibold text-xs transition-all cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submittingTx}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-beauty-accent to-purple-600 hover:from-purple-500 hover:to-beauty-accent text-white font-bold text-xs tracking-wider transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {submittingTx ? (
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          {editingTxId ? 'Update Entry' : 'Record Entry'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Transactions Ledger Log */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-beauty-rose/40 shadow-lg space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-beauty-accent" />
                  Ledger Statement Log
                </h3>

                {loadingTxs ? (
                  <div className="py-12 text-center text-xs text-beauty-taupe animate-pulse">
                    Loading ledger log...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-12 text-center max-w-sm mx-auto space-y-2">
                    <div className="w-10 h-10 rounded-full bg-beauty-cream/35 flex items-center justify-center text-beauty-taupe/40 mx-auto">
                      <Coins className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Ledger is Empty</h4>
                    <p className="text-[11px] text-beauty-taupe leading-relaxed">
                      No ledger entries found for this party. Record your first ledger item above.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-beauty-rose shadow-md">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-beauty-taupe bg-beauty-clay/50">
                          <th className="py-3 px-5 font-semibold">Date & Time</th>
                          <th className="py-3 px-5 font-semibold">Type</th>
                          <th className="py-3 px-5 font-semibold">Description</th>
                          <th className="py-3 px-5 font-semibold text-right">Amount</th>
                          <th className="py-3 px-5 font-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-white/90 bg-beauty-rose/20">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-beauty-blush/30 transition-colors">
                            <td className="py-3 px-5 font-mono text-[10px] text-beauty-taupe whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPositiveType(tx.type) 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-3 px-5 whitespace-normal break-words max-w-[200px]">
                              {tx.description || '—'}
                            </td>
                            <td className={`py-3 px-5 text-right font-bold whitespace-nowrap ${
                              isPositiveType(tx.type) ? 'text-rose-300' : 'text-emerald-400'
                            }`}>
                              {isPositiveType(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="py-3 px-5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleStartEditTx(tx)}
                                  className="p-1.5 rounded-lg border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-beauty-accent hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Edit Entry"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTx(tx.id)}
                                  className="p-1.5 rounded-lg border border-white/10 bg-beauty-cream/30 hover:bg-rose-500/20 text-beauty-taupe hover:text-rose-400 transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Delete Entry"
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
                )}
              </div>

            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-white/5 bg-beauty-rose/30 shadow-lg text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-beauty-cream flex items-center justify-center text-beauty-taupe/40 mb-4 animate-pulse-subtle">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Select a Party</h3>
              <p className="text-xs text-beauty-taupe max-w-sm mt-2 leading-relaxed">
                Click on any supplier or customer from the directory on the left to inspect their financial ledger, view transaction history statement, or record a new payment/due entry.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-beauty-clay via-beauty-rose to-beauty-clay shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h3 className="text-base font-bold text-white leading-none">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-beauty-taupe/90 leading-relaxed mt-1">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 rounded-xl border border-white/10 bg-beauty-cream/30 hover:bg-beauty-cream/50 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmModal.onConfirm) {
                    await confirmModal.onConfirm();
                  }
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs tracking-wider transition-all duration-300 shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
