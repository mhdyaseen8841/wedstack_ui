import React, { useState } from 'react';
import { DollarSign, Landmark, Plus, Trash2, Check, AlertCircle, Eye, EyeOff, Users, ArrowRight, Lock, Save } from 'lucide-react';

export default function ExpenseManager({ expenses, token, side, user, wedding, onUpdateWedding, onExpenseAdded, onExpenseUpdated, onExpenseDeleted, totalBudget, neededServices = [] }) {
  const categories = neededServices.length > 0 
    ? neededServices.map(s => s.name)
    : ['Venue / Auditorium Booking', 'Makeup & Grooming (Groom)', 'Makeup & Bridal Styling (Bride)', 'Photo & Video Services', 'Event Planner / Decor Decorators', 'Entertainment & Music / DJ', 'Food Catering Services', 'Vehicle & Transport Logistics'];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Venue / Auditorium Booking');
  
  // Default to the active side
  const [paidBy, setPaidBy] = useState(side === 'Shared' ? 'Shared' : side); 
  const [isPaid, setIsPaid] = useState(false);
  const [message, setMessage] = useState(null);

  // New Shared Split inputs
  const [groomSplit, setGroomSplit] = useState('');
  const [brideSplit, setBrideSplit] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [advancePayer, setAdvancePayer] = useState('Groom');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidDate, setPaidDate] = useState('');
  const [balanceDueDate, setBalanceDueDate] = useState('');
  const [balanceRemarks, setBalanceRemarks] = useState('');
  const [selectedNeededServiceId, setSelectedNeededServiceId] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);

  const [editingExpense, setEditingExpense] = useState(null);
  
  // Edit sub-form states
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNeededServiceId, setEditNeededServiceId] = useState('');
  const [editPaidBy, setEditPaidBy] = useState('Shared');
  const [editIsPaid, setEditIsPaid] = useState(false);
  const [editAdvancePaid, setEditAdvancePaid] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState('Cash');
  const [editPaidDate, setEditPaidDate] = useState('');
  const [editBalanceDueDate, setEditBalanceDueDate] = useState('');
  const [editBalanceRemarks, setEditBalanceRemarks] = useState('');
  const [editGroomSplit, setEditGroomSplit] = useState('');
  const [editBrideSplit, setEditBrideSplit] = useState('');
  const [editAdvancePayer, setEditAdvancePayer] = useState('Groom');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Edit sub-form installments list states
  const [editInstallments, setEditInstallments] = useState([]);
  const [newInstAmount, setNewInstAmount] = useState('');
  const [newInstDate, setNewInstDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInstMode, setNewInstMode] = useState('Cash');
  const [newInstRemarks, setNewInstRemarks] = useState('');

  React.useEffect(() => {
    if (editingExpense) {
      const parsed = parseExpense(editingExpense);
      setEditTitle(parsed.cleanTitle);
      setEditAmount(parsed.amount);
      setEditCategory(parsed.category);
      setEditNeededServiceId(parsed.neededServiceId || '');
      setEditPaidBy(parsed.paidBy);
      setEditIsPaid(parsed.isPaid || false);
      setEditAdvancePaid(parsed.advancePaid || '');
      setEditPaymentMode(parsed.paymentMode || 'Cash');
      setEditPaidDate(parsed.paidDate ? new Date(parsed.paidDate).toISOString().split('T')[0] : '');
      setEditBalanceDueDate(parsed.balanceDueDate ? new Date(parsed.balanceDueDate).toISOString().split('T')[0] : '');
      setEditBalanceRemarks(parsed.balanceRemarks || '');
      setEditInstallments(parsed.installments || []);
      
      if (parsed.isSharedSplit) {
        setEditGroomSplit(parsed.groomShare);
        setEditBrideSplit(parsed.brideShare);
        setEditAdvancePayer(parsed.advancePayer || 'Groom');
      } else {
        setEditGroomSplit('');
        setEditBrideSplit('');
        setEditAdvancePayer('Groom');
      }
    }
  }, [editingExpense]);

  // Sync state if workspace side switches
  React.useEffect(() => {
    setPaidBy(side === 'Shared' ? 'Shared' : side);
  }, [side]);

  // Parse custom metadata encoded inside expense titles:
  // Format: "Title Text##split:groomShare:brideShare:advancePaid:advancePayer"
  const parseExpense = (exp) => {
    let rawInstallments = exp.installments || [];
    let cleanTitle = '';
    let isSharedSplit = false;
    let groomShare = 0;
    let brideShare = 0;
    let advancePaid = 0;
    let advancePayer = 'Groom';

    if (exp.title) {
      const parts = exp.title.split('##split:');
      if (parts.length < 2) {
        cleanTitle = exp.title;
        groomShare = exp.paidBy === 'Groom' ? exp.amount : 0;
        brideShare = exp.paidBy === 'Bride' ? exp.amount : 0;
        advancePaid = exp.advancePaid !== undefined ? exp.advancePaid : (exp.isPaid ? exp.amount : 0);
        advancePayer = exp.paidBy;
      } else {
        const [titleText, meta] = parts;
        cleanTitle = titleText;
        isSharedSplit = true;
        const [gShare, bShare, adv, advPayer] = meta.split(':');
        groomShare = parseFloat(gShare) || 0;
        brideShare = parseFloat(bShare) || 0;
        advancePaid = parseFloat(adv) || 0;
        advancePayer = advPayer || 'Groom';
      }
    }

    // Sum installments if present, otherwise fall back to advancePaid
    let totalPaid = 0;
    let installments = [...rawInstallments];
    if (installments.length > 0) {
      totalPaid = installments.reduce((sum, inst) => sum + inst.amount, 0);
    } else {
      totalPaid = advancePaid || 0;
      if (totalPaid > 0) {
        installments = [{
          _id: 'default-inst',
          amount: totalPaid,
          date: exp.paidDate || exp.createdAt || new Date(),
          paymentMode: exp.paymentMode || 'Cash',
          remarks: exp.balanceRemarks || 'Initial payment'
        }];
      }
    }

    return {
      ...exp,
      cleanTitle,
      isSharedSplit,
      groomShare,
      brideShare,
      advancePaid: totalPaid, // Overwrite with true total paid from installments
      advancePayer,
      installments
    };
  };

  const parsedExpenses = expenses.map(parseExpense);

  const groomPersonal = parsedExpenses.filter(e => e.paidBy === 'Groom');
  const bridePersonal = parsedExpenses.filter(e => e.paidBy === 'Bride');
  const sharedExpenses = parsedExpenses.filter(e => e.paidBy === 'Shared');

  const totalGroomPersonal = groomPersonal.reduce((sum, e) => sum + e.amount, 0);
  const totalBridePersonal = bridePersonal.reduce((sum, e) => sum + e.amount, 0);
  const totalSharedExpenses = sharedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Role Validation Gates
  const isPlanner = user?.role === 'Planner';
  const isGroom = user?.role === 'Groom';
  const isBride = user?.role === 'Bride';

  // Can the current user add/edit expenses in the active side view?
  const canEditCurrentSide = isPlanner || (isGroom && side === 'Groom') || (isBride && side === 'Bride');

  // Can the user manage specific columns?
  const canManageGroomLedger = isGroom || isPlanner;
  const canManageBrideLedger = isBride || isPlanner;
  const canManageSharedLedger = isGroom || isBride || isPlanner;

  // DB-backed permissions
  const brideAllowsLedgerShare = wedding.brideAllowsLedgerShare !== false;
  const groomAllowsLedgerShare = wedding.groomAllowsLedgerShare !== false;

  // Active state representing whether I allow sharing my ledger
  const myLedgerSharingState = isBride ? brideAllowsLedgerShare : groomAllowsLedgerShare;
  
  // Can I see my partner's ledger? Checks if partner allows sharing.
  const showPartnerLedger = isBride ? groomAllowsLedgerShare : brideAllowsLedgerShare;

  const handleToggleSharingPermission = async (e) => {
    const checked = e.target.checked;
    const payload = isBride 
      ? { brideAllowsLedgerShare: checked }
      : { groomAllowsLedgerShare: checked };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/wedding', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateWedding(updated);
      }
    } catch (err) {}
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!canEditCurrentSide) return;
    if (!title.trim() || !amount) {
      setMessage({ type: 'error', text: 'Expense title and amount are required.' });
      return;
    }
    if (parseFloat(advancePaid) > parseFloat(amount)) {
      setMessage({ type: 'error', text: 'Advance paid cannot exceed the total cost.' });
      return;
    }

    let finalTitle = title.trim();
    if (paidBy === 'Shared') {
      const gSplit = parseFloat(groomSplit) || 0;
      const bSplit = parseFloat(brideSplit) || 0;
      const adv = parseFloat(advancePaid) || 0;
      finalTitle = `${finalTitle}##split:${gSplit}:${bSplit}:${adv}:${advancePayer}`;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          title: finalTitle, 
          amount: parseFloat(amount), 
          category, 
          paidBy, 
          isPaid,
          advancePaid: parseFloat(advancePaid) || 0,
          paymentMode,
          paidDate: paidDate || undefined,
          balanceDueDate: balanceDueDate || undefined,
          balanceRemarks,
          neededServiceId: selectedNeededServiceId || undefined
        })
      });
      if (res.ok) {
        const newExpense = await res.json();
        onExpenseAdded(newExpense);
        setTitle('');
        setAmount('');
        setSelectedNeededServiceId('');
        setGroomSplit('');
        setBrideSplit('');
        setAdvancePaid('');
        setIsPaid(false);
        setPaymentMode('Cash');
        setPaidDate('');
        setBalanceDueDate('');
        setBalanceRemarks('');
        setMessage({ type: 'success', text: 'Expense recorded successfully!' });
        setShowRecordModal(false);
      }
    } catch (err) {
      const fallback = { 
        _id: Date.now().toString(), 
        title: finalTitle, 
        amount: parseFloat(amount), 
        category, 
        paidBy, 
        isPaid, 
        paidDate: paidDate ? new Date(paidDate) : (isPaid ? new Date() : null),
        advancePaid: parseFloat(advancePaid) || 0,
        paymentMode,
        balanceDueDate: balanceDueDate ? new Date(balanceDueDate) : null,
        balanceRemarks
      };
      onExpenseAdded(fallback);
      setTitle('');
      setAmount('');
      setGroomSplit('');
      setBrideSplit('');
      setAdvancePaid('');
      setIsPaid(false);
      setPaymentMode('Cash');
      setPaidDate('');
      setBalanceDueDate('');
      setBalanceRemarks('');
      setMessage({ type: 'success', text: 'Expense recorded locally (Offline).' });
      setShowRecordModal(false);
    }
  };

  const handleTogglePaid = async (id, currentVal) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isPaid: !currentVal })
      });
      if (res.ok) {
        const updated = await res.json();
        onExpenseUpdated(updated);
      }
    } catch (err) {
      onExpenseUpdated({ _id: id, isPaid: !currentVal, paidDate: !currentVal ? new Date() : null });
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: 'DELETE',
        headers
      });
      onExpenseDeleted(id);
    } catch (err) {
      onExpenseDeleted(id);
    }
  };

  const handleSaveEditExpense = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editAmount) {
      alert('Expense title and amount are required.');
      return;
    }
    if (parseFloat(editAdvancePaid) > parseFloat(editAmount)) {
      alert('Advance paid cannot exceed the total cost.');
      return;
    }
    setEditSubmitting(true);

    let finalTitle = editTitle.trim();
    if (editPaidBy === 'Shared') {
      const gSplit = parseFloat(editGroomSplit) || 0;
      const bSplit = parseFloat(editBrideSplit) || 0;
      const adv = parseFloat(editAdvancePaid) || 0;
      finalTitle = `${finalTitle}##split:${gSplit}:${bSplit}:${adv}:${editAdvancePayer}`;
    }

    const totalPaid = editInstallments.reduce((sum, inst) => sum + inst.amount, 0);

    const payload = {
      title: finalTitle,
      amount: parseFloat(editAmount),
      category: editCategory,
      paidBy: editPaidBy,
      isPaid: totalPaid >= parseFloat(editAmount),
      advancePaid: totalPaid,
      paymentMode: editPaymentMode,
      paidDate: editPaidDate || undefined,
      balanceDueDate: editBalanceDueDate || undefined,
      balanceRemarks: editBalanceRemarks,
      neededServiceId: editNeededServiceId || undefined,
      installments: editInstallments
    };

    if (token) {
      try {
        const res = await fetch(`http://localhost:5000/api/expenses/${editingExpense._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          onExpenseUpdated(updated);
        }
      } catch (err) {}
    }

    setEditSubmitting(false);
    setEditingExpense(null);
  };

  const handleAddInstallmentToEdit = () => {
    const amt = parseFloat(newInstAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    const totalExisting = editInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    const newTotal = totalExisting + amt;
    if (newTotal > parseFloat(editAmount)) {
      alert("Total payments cannot exceed the total cost of the service!");
      return;
    }

    const newInst = {
      _id: Date.now().toString(),
      amount: amt,
      date: newInstDate || new Date().toISOString().split('T')[0],
      paymentMode: newInstMode,
      remarks: newInstRemarks || 'Installment'
    };

    setEditInstallments([...editInstallments, newInst]);
    setNewInstAmount('');
    setNewInstRemarks('');
  };

  const handleDeleteInstallmentFromEdit = (idx) => {
    setEditInstallments(editInstallments.filter((_, i) => i !== idx));
  };

  // Calculate service breakdown stats
  const serviceStats = neededServices.map(srv => {
    // Find all expenses linked to this service
    const linkedExpenses = expenses.filter(e => 
      e.neededServiceId === srv._id || 
      (e.category && srv.name && e.category.toLowerCase() === srv.name.toLowerCase()) ||
      (e.category && srv.category && e.category.toLowerCase() === srv.category.toLowerCase())
    ).map(e => parseExpense(e));
    const totalCost = linkedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = linkedExpenses.reduce((sum, e) => sum + (e.advancePaid || 0), 0);
    const totalBalance = totalCost - totalPaid;
    return {
      _id: srv._id,
      name: srv.name,
      icon: srv.icon,
      totalCost,
      totalPaid,
      totalBalance,
      expensesCount: linkedExpenses.length
    };
  }).filter(stat => stat.totalCost > 0); // Only show services with recorded expenses

  const grandTotalCost = serviceStats.reduce((sum, s) => sum + s.totalCost, 0);
  const grandTotalPaid = serviceStats.reduce((sum, s) => sum + s.totalPaid, 0);
  const editTotalPaid = editInstallments.reduce((sum, inst) => sum + inst.amount, 0);

  return (
    <div className="space-y-6 text-slate-850">
      
      {/* 1. Header Toggles for Privacy Sharing (Tied directly to Mongoose DB) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900">Personal & Shared Expense Command</h3>
          <p className="text-xs text-slate-400 font-medium">Keep your personal costs private, or share view-only access with your partner.</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600">
          {!isPlanner && (
            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100/50 transition-colors">
              <input
                type="checkbox"
                className="rounded text-indigo-650 focus:ring-0 mr-1"
                checked={myLedgerSharingState}
                onChange={handleToggleSharingPermission}
              />
              <span>Allow Partner to View My Private Ledger</span>
            </label>
          )}

          <div className="flex items-center gap-1.5 text-slate-450 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold uppercase text-[9px]">
            {showPartnerLedger ? (
              <span className="text-emerald-600">Partner Sharing: Enabled</span>
            ) : (
              <span className="text-rose-500">Partner Sharing: Private</span>
            )}
          </div>

          {canEditCurrentSide && (
            <button
              onClick={() => setShowRecordModal(true)}
              className="px-5 py-2.5 bg-[#1a1a3c] hover:bg-[#2c2c5c] text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5" /> Record Expense
            </button>
          )}
        </div>
      </div>

      {/* 2. Visual Service Analytics breakdown */}
      {serviceStats.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-widest mb-4">Service Budget & Payments Visualizer</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Donut Chart Display */}
            <div className="flex flex-col items-center justify-center border-r border-slate-100/80 pr-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="3" />
                  {(() => {
                    let accumulatedPercent = 0;
                    const colors = [
                      '#6366f1', '#10b981', '#0ea5e9', '#f43f5e', 
                      '#f59e0b', '#8b5cf6', '#14b8a6', '#db2777'
                    ];
                    return serviceStats.map((stat, idx) => {
                      const percent = grandTotalCost > 0 ? (stat.totalCost / grandTotalCost) * 100 : 0;
                      const strokeDasharray = `${percent} ${100 - percent}`;
                      const strokeDashoffset = 100 - accumulatedPercent;
                      accumulatedPercent += percent;
                      const color = colors[idx % colors.length];
                      
                      return (
                        <circle
                          key={stat._id}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke={color}
                          strokeWidth="3.2"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-[4]"
                        />
                      );
                    });
                  })()}
                </svg>
                
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Paid Share</span>
                  <span className="text-sm font-black text-slate-800">
                    {grandTotalCost > 0 ? Math.round((grandTotalPaid / grandTotalCost) * 100) : 0}%
                  </span>
                  <span className="text-[9px] text-slate-450 font-bold uppercase mt-0.5">₹{grandTotalPaid.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {serviceStats.map((stat, idx) => {
                  const colors = [
                    '#6366f1', '#10b981', '#0ea5e9', '#f43f5e', 
                    '#f59e0b', '#8b5cf6', '#14b8a6', '#db2777'
                  ];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={stat._id} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                      <span>{stat.icon} {stat.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Service Breakdown details lists */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {serviceStats.map((stat, idx) => {
                const colors = [
                  '#6366f1', '#10b981', '#0ea5e9', '#f43f5e', 
                  '#f59e0b', '#8b5cf6', '#14b8a6', '#db2777'
                ];
                const color = colors[idx % colors.length];
                const payPercent = stat.totalCost > 0 ? Math.round((stat.totalPaid / stat.totalCost) * 100) : 0;
                
                return (
                  <div key={stat._id} className="p-3.5 border border-slate-100/80 rounded-2xl bg-slate-50/30 flex flex-col justify-between gap-1.5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{stat.icon}</span>
                        <div>
                          <span className="font-extrabold text-[11px] text-slate-700 block truncate max-w-[120px]">{stat.name}</span>
                          <span className="text-[9px] text-slate-450 font-bold uppercase">{stat.expensesCount} records</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xs text-slate-800 block">₹{stat.totalCost.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400 font-bold block">Paid: ₹{stat.totalPaid.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                        <span>Paid progress</span>
                        <span style={{ color }}>{payPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${payPercent}%`, backgroundColor: color }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 2. Ledger Columns */}
      <div className="space-y-6">
          
          {/* 1. Shared / Common Ledger items */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-widest">Shared Common Events & Expenses</h4>
              </div>
              <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                Total Shared: ${totalSharedExpenses.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-3">Event/Vendor</th>
                    <th className="p-3">Cost split</th>
                    <th className="p-3">Advance Paid</th>
                    <th className="p-3 text-right">Total Cost</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedExpenses.map(e => {
                    const outstanding = e.amount - e.advancePaid;
                    return (
                      <tr key={e._id} className="border-b border-slate-100 hover:bg-slate-50/30">
                        <td className="p-3">
                          <span className="font-bold text-slate-700 block">{e.cleanTitle}</span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase">{e.category}</span>
                          {(() => {
                            const linkedSrv = neededServices.find(s => s._id === e.neededServiceId);
                            if (linkedSrv) {
                              return (
                                <div className="mt-1.5 flex items-center gap-1 text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md w-fit font-bold">
                                  <span>🔗 {linkedSrv.icon} {linkedSrv.name}</span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          Groom: <span className="font-bold text-slate-700">₹{e.groomShare}</span> | Bride: <span className="font-bold text-slate-700">₹{e.brideShare}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-emerald-600 block">₹{e.advancePaid}</span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase">Paid by: {e.advancePayer}</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-extrabold text-slate-800">₹{e.amount.toLocaleString()}</div>
                          <div className="text-[9px] text-rose-500 font-bold">Outstanding: ₹{outstanding}</div>
                        </td>
                        <td className="p-3 text-center">
                          {canManageSharedLedger ? (
                            <div className="flex justify-center items-center gap-1.5">
                              <button onClick={() => setEditingExpense(e)} className="text-slate-400 hover:text-indigo-650 transition-colors p-1 rounded" title="Edit Expense">
                                <span className="text-xs select-none">✏️</span>
                              </button>
                              <button onClick={() => handleDelete(e._id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded" title="Delete Expense">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-350 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {sharedExpenses.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-450 italic">No shared common expenses logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Personal Private Ledgers Grid (Bride & Groom Columns) */}
          <div className={`grid grid-cols-1 ${showPartnerLedger || isPlanner ? 'md:grid-cols-2' : ''} gap-6`}>
            
            {/* Groom Personal Ledger (Shown if Groom, Planner, or Bride allows) */}
            {(isGroom || isPlanner || (isBride && showPartnerLedger)) && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-sky-50/20 flex justify-between items-center">
                  <span className="font-extrabold text-xs text-sky-700 uppercase tracking-widest">Groom Ledger</span>
                  <span className="text-xs font-bold text-sky-850 bg-sky-100 px-2.5 py-0.5 rounded-full">₹{totalGroomPersonal.toLocaleString()}</span>
                </div>
                 <div className="p-4 space-y-3">
                  {groomPersonal.map(e => {
                    const balance = e.amount - (e.advancePaid || 0);
                    return (
                      <div key={e._id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/40 flex flex-col justify-between gap-2.5 group hover:border-slate-200 transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="font-bold text-xs text-slate-700">{e.cleanTitle}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{e.category}</div>
                            {(() => {
                              const linkedSrv = neededServices.find(s => s._id === e.neededServiceId);
                              if (linkedSrv) {
                                return (
                                  <div className="mt-1 flex items-center gap-1 text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md w-fit font-bold">
                                    <span>🔗 {linkedSrv.icon} {linkedSrv.name}</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-slate-800">₹{e.amount.toLocaleString()}</span>
                            {canManageGroomLedger ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditingExpense(e)} className="text-slate-400 hover:text-indigo-655 p-0.5 transition-colors shrink-0" title="Edit Expense">
                                  <span className="text-[10px] select-none">✏️</span>
                                </button>
                                <button onClick={() => handleDelete(e._id)} className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors shrink-0" title="Delete Expense">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Bookkeeping detail badges */}
                        <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-1 text-[9px] text-slate-500 font-bold uppercase">
                          <div>
                            <span>Paid: <span className="text-emerald-600 font-extrabold">₹{e.advancePaid || 0}</span></span>
                            {e.paymentMode && <span className="block text-[8px] text-slate-400">{e.paymentMode}</span>}
                          </div>
                          <div className="text-right">
                            <span>Bal: <span className="text-rose-500 font-extrabold">₹{balance}</span></span>
                            {e.balanceDueDate && (
                              <span className="block text-[8px] text-slate-400 truncate" title={`Due: ${new Date(e.balanceDueDate).toLocaleDateString()}`}>
                                📅 {new Date(e.balanceDueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {e.balanceRemarks && (
                          <div className="text-[9px] text-slate-450 italic bg-white/50 border border-slate-100 px-2 py-1 rounded-lg">
                            &ldquo;{e.balanceRemarks}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {groomPersonal.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs italic">Groom personal ledger is empty.</div>
                  )}
                </div>
              </div>
            )}

            {/* Bride Personal Ledger (Shown if Bride, Planner, or Groom allows) */}
            {(isBride || isPlanner || (isGroom && showPartnerLedger)) && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-rose-50/20 flex justify-between items-center">
                  <span className="font-extrabold text-xs text-rose-700 uppercase tracking-widest">Bride Ledger</span>
                  <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">₹{totalBridePersonal.toLocaleString()}</span>
                </div>
                
                <div className="p-4 space-y-3">
                  {bridePersonal.map(e => {
                    const balance = e.amount - (e.advancePaid || 0);
                    return (
                      <div key={e._id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/40 flex flex-col justify-between gap-2.5 group hover:border-slate-200 transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="font-bold text-xs text-slate-700">{e.cleanTitle}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{e.category}</div>
                            {(() => {
                              const linkedSrv = neededServices.find(s => s._id === e.neededServiceId);
                              if (linkedSrv) {
                                return (
                                  <div className="mt-1 flex items-center gap-1 text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md w-fit font-bold">
                                    <span>🔗 {linkedSrv.icon} {linkedSrv.name}</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-slate-800">₹{e.amount.toLocaleString()}</span>
                            {canManageBrideLedger ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditingExpense(e)} className="text-slate-400 hover:text-indigo-655 p-0.5 transition-colors shrink-0" title="Edit Expense">
                                  <span className="text-[10px] select-none">✏️</span>
                                </button>
                                <button onClick={() => handleDelete(e._id)} className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors shrink-0" title="Delete Expense">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Bookkeeping detail badges */}
                        <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-1 text-[9px] text-slate-500 font-bold uppercase">
                          <div>
                            <span>Paid: <span className="text-emerald-600 font-extrabold">₹{e.advancePaid || 0}</span></span>
                            {e.paymentMode && <span className="block text-[8px] text-slate-400">{e.paymentMode}</span>}
                          </div>
                          <div className="text-right">
                            <span>Bal: <span className="text-rose-500 font-extrabold">₹{balance}</span></span>
                            {e.balanceDueDate && (
                              <span className="block text-[8px] text-slate-400 truncate" title={`Due: ${new Date(e.balanceDueDate).toLocaleDateString()}`}>
                                📅 {new Date(e.balanceDueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {e.balanceRemarks && (
                          <div className="text-[9px] text-slate-450 italic bg-white/50 border border-slate-100 px-2 py-1 rounded-lg">
                            &ldquo;{e.balanceRemarks}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {bridePersonal.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs italic">Bride personal ledger is empty.</div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      {/* Edit Expense Popup Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEditingExpense(null)} 
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold transition-all"
            >
              ✕
            </button>
            <div className="mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-1.5">
                ✏️ Edit Expense Record
              </h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-1.5">
                Modify recorded expense ledger item.
              </p>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-4 text-slate-850">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Linked Needed Service (Optional)</label>
                <select
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-705 outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={editNeededServiceId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditNeededServiceId(val);
                    const linked = neededServices.find(s => s._id === val);
                    if (linked) {
                      setEditCategory(linked.name);
                    }
                  }}
                >
                  <option value="">None / General Expense</option>
                  {neededServices.map(srv => (
                    <option key={srv._id} value={srv._id}>{srv.icon} {srv.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Cost (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-705"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payer Pool</label>
                <select
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-705"
                  value={editPaidBy}
                  onChange={(e) => setEditPaidBy(e.target.value)}
                >
                  <option value="Shared">Shared / Common Split Cost</option>
                  <option value="Groom">Groom Personal Ledger (Private)</option>
                  <option value="Bride">Bride Personal Ledger (Private)</option>
                </select>
              </div>

              {editPaidBy === 'Shared' && (
                <div className="p-4 border border-indigo-100 rounded-2xl bg-indigo-50/20 space-y-3">
                  <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wider block">Common Event Cost Split</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Groom Share (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        placeholder="₹1000"
                        value={editGroomSplit}
                        onChange={(e) => setEditGroomSplit(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Bride Share (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        placeholder="₹1000"
                        value={editBrideSplit}
                        onChange={(e) => setEditBrideSplit(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-200 pb-1.5 flex justify-between items-center">
                  <span>💰 Installments Ledger</span>
                  <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-bold">
                    Paid: ₹{editTotalPaid.toLocaleString()}
                  </span>
                </span>

                {/* List of current installments */}
                <div className="space-y-2">
                  {editInstallments.length > 0 ? (
                    editInstallments.map((inst, index) => (
                      <div key={inst._id || index} className="p-2.5 bg-white border border-slate-100 rounded-xl flex justify-between items-center gap-3">
                        <div className="truncate">
                          <span className="font-extrabold text-[11px] text-slate-800 block">₹{inst.amount.toLocaleString()} <span className="text-[8px] text-indigo-600 font-bold uppercase">&bull; {inst.paymentMode}</span></span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase">{inst.remarks} &bull; {new Date(inst.date).toLocaleDateString()}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleDeleteInstallmentFromEdit(index)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-[10px] italic">No installment payments recorded yet.</div>
                  )}
                </div>

                {/* Add new installment section */}
                <div className="pt-2 border-t border-slate-200 space-y-2.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Add New Installment</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                      <input
                        type="number"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        placeholder="₹1000"
                        value={newInstAmount}
                        onChange={(e) => setNewInstAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Payment Mode</label>
                      <select
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold focus:outline-none"
                        value={newInstMode}
                        onChange={(e) => setNewInstMode(e.target.value)}
                      >
                        <option value="Cash">💵 Cash</option>
                        <option value="Card">💳 Card</option>
                        <option value="Bank Transfer">🏦 Bank Transfer</option>
                        <option value="UPI">📱 UPI</option>
                        <option value="Others">⚙️ Others</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Payment Date</label>
                      <input
                        type="date"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        value={newInstDate}
                        onChange={(e) => setNewInstDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Remarks</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        placeholder="e.g. Stage deposit"
                        value={newInstRemarks}
                        onChange={(e) => setNewInstRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddInstallmentToEdit}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all"
                  >
                    ➕ Add Installment Payment
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 font-bold uppercase pt-1.5 border-t border-slate-200 flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className="text-slate-800 font-extrabold">₹{(parseFloat(editAmount) || 0) - editTotalPaid}</span>
                </div>
              </div>

              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="editIsPaidCheckbox"
                  className="rounded text-indigo-650 mr-2"
                  checked={editTotalPaid >= parseFloat(editAmount) && parseFloat(editAmount) > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const bal = (parseFloat(editAmount) || 0) - editTotalPaid;
                      if (bal > 0) {
                        setEditInstallments([...editInstallments, {
                          _id: Date.now().toString(),
                          amount: bal,
                          date: new Date().toISOString().split('T')[0],
                          paymentMode: 'Bank Transfer',
                          remarks: 'Final Balance Settlement'
                        }]);
                      }
                    }
                  }}
                />
                <label htmlFor="editIsPaidCheckbox" className="text-xs text-slate-500 font-bold select-none cursor-pointer">Mark paid fully (Settle Balance)</label>
              </div>

              <button
                type="submit"
                disabled={editSubmitting}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                ✏️ {editSubmitting ? 'Saving...' : 'Update Expense Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Popup Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowRecordModal(false)} 
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold transition-all"
            >
              ✕
            </button>
            
            <div className="mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-1.5">
                ➕ Record Expense
              </h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-1.5">
                Log a new budget or ledger expense item.
              </p>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-bold mb-4 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4 text-slate-850">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none"
                  placeholder="e.g. Wedding Suit purchase / Rings deposit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Linked Needed Service (Optional)</label>
                <select
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={selectedNeededServiceId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedNeededServiceId(val);
                    const linked = neededServices.find(s => s._id === val);
                    if (linked) {
                      setCategory(linked.name);
                    }
                  }}
                >
                  <option value="">None / General Expense</option>
                  {neededServices.map(srv => (
                    <option key={srv._id} value={srv._id}>{srv.icon} {srv.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Cost (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                    placeholder="₹2000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payer Pool</label>
                <select
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                >
                  {isPlanner && <option value="Shared">Shared / Common Split Cost</option>}
                  {side === 'Groom' || isPlanner ? <option value="Groom">Groom Personal Ledger (Private)</option> : null}
                  {side === 'Bride' || isPlanner ? <option value="Bride">Bride Personal Ledger (Private)</option> : null}
                </select>
              </div>

              {paidBy === 'Shared' && (
                <div className="p-4 border border-indigo-100 rounded-2xl bg-indigo-50/20 space-y-3">
                  <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wider block">Common Event Cost Split</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Groom Share (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        placeholder="₹1000"
                        value={groomSplit}
                        onChange={(e) => setGroomSplit(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Bride Share (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        placeholder="₹1000"
                        value={brideSplit}
                        onChange={(e) => setBrideSplit(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Advance Paid (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        placeholder="₹500"
                        value={advancePaid}
                        onChange={(e) => setAdvancePaid(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Paid By</label>
                      <select
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        value={advancePayer}
                        onChange={(e) => setAdvancePayer(e.target.value)}
                      >
                        <option value="Groom">Groom</option>
                        <option value="Bride">Bride</option>
                        <option value="Both">Both (50/50)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookkeeping & Advance Fields */}
              <div className="p-4 border border-slate-200/60 rounded-2xl bg-slate-50/50 space-y-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Bookkeeping & Payment Details</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      placeholder="e.g. 500"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold focus:outline-none"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="Card">💳 Card</option>
                      <option value="Bank Transfer">🏦 Bank Transfer</option>
                      <option value="UPI">📱 UPI</option>
                      <option value="Others">⚙️ Others</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Payment Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Balance Due Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      value={balanceDueDate}
                      onChange={(e) => setBalanceDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Balance Remarks (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    placeholder="e.g. Pay remaining on delivery"
                    value={balanceRemarks}
                    onChange={(e) => setBalanceRemarks(e.target.value)}
                  />
                </div>

                <div className="text-[10px] text-slate-400 font-bold uppercase pt-1 border-t border-slate-200/60 flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className="text-slate-800 font-extrabold">₹{(parseFloat(amount) || 0) - (parseFloat(advancePaid) || 0)}</span>
                </div>
              </div>

              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="isPaid"
                  className="rounded text-indigo-650 mr-2"
                  checked={isPaid}
                  onChange={(e) => {
                    setIsPaid(e.target.checked);
                    if (e.target.checked && amount) {
                      setAdvancePaid(amount);
                    }
                  }}
                />
                <label htmlFor="isPaid" className="text-xs text-slate-500 font-bold select-none cursor-pointer">Mark paid fully</label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Save Expense Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
