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

  // Sync state if workspace side switches
  React.useEffect(() => {
    setPaidBy(side === 'Shared' ? 'Shared' : side);
  }, [side]);

  // Parse custom metadata encoded inside expense titles:
  // Format: "Title Text##split:groomShare:brideShare:advancePaid:advancePayer"
  const parseExpense = (exp) => {
    if (!exp.title) return { ...exp, cleanTitle: '', isSharedSplit: false };
    const parts = exp.title.split('##split:');
    if (parts.length < 2) {
      return { 
        ...exp, 
        cleanTitle: exp.title, 
        isSharedSplit: false,
        groomShare: exp.paidBy === 'Groom' ? exp.amount : 0,
        brideShare: exp.paidBy === 'Bride' ? exp.amount : 0,
        advancePaid: exp.advancePaid !== undefined ? exp.advancePaid : (exp.isPaid ? exp.amount : 0),
        advancePayer: exp.paidBy
      };
    }
    const [cleanTitle, meta] = parts;
    const [gShare, bShare, adv, advPayer] = meta.split(':');
    return {
      ...exp,
      cleanTitle,
      isSharedSplit: true,
      groomShare: parseFloat(gShare) || 0,
      brideShare: parseFloat(bShare) || 0,
      advancePaid: parseFloat(adv) || 0,
      advancePayer: advPayer || 'Groom'
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
        </div>
      </div>

      {/* 2. Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Record Expense Form OR Lock Banner */}
        <div className="lg:col-span-1">
          {canEditCurrentSide ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-widest pb-3 border-b border-slate-100">Record Expense</h3>
              
              {message && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleAddExpense} className="space-y-4">
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

                  {/* Realtime Balance display */}
                  <div className="text-[10px] text-slate-400 font-bold uppercase pt-1 border-t border-slate-200/60 flex justify-between">
                    <span>Remaining Balance:</span>
                    <span className="text-slate-800 font-extrabold">₹{(parseFloat(amount) || 0) - (parseFloat(advancePaid) || 0)}</span>
                  </div>
                </div>

                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    id="isPaid"
                    className="rounded text-indigo-655 mr-2"
                    checked={isPaid}
                    onChange={(e) => {
                      setIsPaid(e.target.checked);
                      if (e.target.checked && amount) {
                        setAdvancePaid(amount);
                      }
                    }}
                  />
                  <label htmlFor="isPaid" className="text-xs text-slate-500 font-bold select-none">Mark paid fully</label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Save Expense Record
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 text-center space-y-4 shadow-inner">
              <Lock className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-widest block">Read-Only View</h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">Logged in: {user?.role || 'Guest'}</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                You are in <strong>{side} View</strong>. Expenses can only be recorded and managed directly from your own personal workspace page view.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Ledger Columns (Side-by-Side) */}
        <div className="lg:col-span-2 space-y-6">
          
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
                            <button onClick={() => handleDelete(e._id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                              <button onClick={() => handleDelete(e._id)} className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
                              <button onClick={() => handleDelete(e._id)} className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      </div>

    </div>
  );
}
