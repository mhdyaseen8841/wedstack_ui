import React, { useState, useEffect } from 'react';
import { DollarSign, Percent, Shield, Filter, Award, Save, Heart, User, Users, Lock } from 'lucide-react';

export default function CollaborativeBudget({ wedding, vendors, token, side, user, onUpdateWedding }) {
  const initialGroomTarget = Math.round((wedding.totalBudget * (wedding.budgetSplitRatio || 50)) / 100);
  const initialBrideTarget = Math.round(wedding.totalBudget - initialGroomTarget);

  const [groomTargetInput, setGroomTargetInput] = useState(initialGroomTarget);
  const [brideTargetInput, setBrideTargetInput] = useState(initialBrideTarget);
  const [filterSide, setFilterSide] = useState('All');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const gTarget = Math.round((wedding.totalBudget * (wedding.budgetSplitRatio || 50)) / 100);
    setGroomTargetInput(gTarget);
    setBrideTargetInput(wedding.totalBudget - gTarget);
  }, [wedding]);

  const getExpenses = (sideVisibility) => {
    return vendors
      .filter(v => v.sideVisibility === sideVisibility)
      .reduce((sum, v) => {
        const pkg = v.packages[0];
        if (pkg && (v.status === 'Booked' || v.status === 'Shortlisted')) {
          return sum + pkg.totalCost;
        }
        return sum;
      }, 0);
  };

  const groomSpentOnly = getExpenses('Groom');
  const brideSpentOnly = getExpenses('Bride');
  const sharedSpentTotal = getExpenses('Shared');

  const groomSharedContribution = sharedSpentTotal / 2;
  const brideSharedContribution = sharedSpentTotal / 2;

  const totalGroomCommitted = groomSpentOnly + groomSharedContribution;
  const totalBrideCommitted = brideSpentOnly + brideSharedContribution;
  const totalWeddingExpenses = groomSpentOnly + brideSpentOnly + sharedSpentTotal;

  const handleSaveBudget = async () => {
    setSaving(true);
    setMessage(null);
    
    const newTotalBudget = Number(groomTargetInput) + Number(brideTargetInput);
    const newSplitRatio = newTotalBudget > 0 ? Math.round((Number(groomTargetInput) / newTotalBudget) * 100) : 50;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['x-mock-side'] = 'Shared';
        headers['x-mock-wedding-id'] = 'mock-wedding-id';
      }

      const res = await fetch('http://localhost:5000/api/wedding', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          totalBudget: newTotalBudget,
          budgetSplitRatio: newSplitRatio
        })
      });
      const data = await res.json();
      if (res.ok) {
        onUpdateWedding(data);
        setMessage({ type: 'success', text: 'Separate targets successfully updated!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Database sync error.' });
    } finally {
      setSaving(false);
    }
  };

  // Determine what to show based on the active side
  const showBrideBudget = side === 'Bride' || side === 'Shared';
  const showGroomBudget = side === 'Groom' || side === 'Shared';

  // Role verification gates:
  // Planner can manage everything.
  // Bride can only edit Bride side target from Bride side page view.
  // Groom can only edit Groom side target from Groom side page view.
  // Shared (Mutual View) is display-only.
  const isPlanner = user?.role === 'Planner';
  const canEditBride = isPlanner || (user?.role === 'Bride' && side === 'Bride');
  const canEditGroom = isPlanner || (user?.role === 'Groom' && side === 'Groom');

  const hasEditAccess = (side === 'Bride' && canEditBride) || (side === 'Groom' && canEditGroom) || isPlanner;

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Target Setting Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-slate-900">
                {side === 'Shared' ? 'Mutual Wedding Budget targets' : `${side} Side Target Budget`}
              </h3>
              {!hasEditAccess && (
                <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase">
                  <Lock className="w-3 h-3" /> Read-Only
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {side === 'Shared' 
                ? 'Display view of mutual targets. Manage budgets from your respective side page.'
                : `Manage and set target limits. Logged in as ${user?.role || 'Guest'}.`
              }
            </p>
          </div>
          {message && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {message.text}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Bride side Budget Input */}
          {showBrideBudget && (
            <div className="bg-rose-50/20 border border-rose-100 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block">🌸 Bride Target Budget</span>
                {!canEditBride && <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Lock</span>}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-sm font-bold text-rose-700">₹</span>
                <input
                  type="number"
                  disabled={!canEditBride}
                  className="w-full pl-7 pr-3 py-1.5 border border-rose-200 rounded-xl text-sm font-bold text-rose-900 focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-550"
                  value={brideTargetInput}
                  onChange={(e) => setBrideTargetInput(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="text-[10px] text-rose-500 font-medium">Controls the Bride side allocation limits.</div>
            </div>
          )}

          {/* Groom side Budget Input */}
          {showGroomBudget && (
            <div className="bg-sky-50/20 border border-sky-100 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest block">🤵 Groom Target Budget</span>
                {!canEditGroom && <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Lock</span>}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-sm font-bold text-sky-700">₹</span>
                <input
                  type="number"
                  disabled={!canEditGroom}
                  className="w-full pl-7 pr-3 py-1.5 border border-sky-200 rounded-xl text-sm font-bold text-sky-900 focus:ring-2 focus:ring-sky-500/10 focus:border-sky-400 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-550"
                  value={groomTargetInput}
                  onChange={(e) => setGroomTargetInput(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="text-[10px] text-sky-500 font-medium">Controls the Groom side allocation limits.</div>
            </div>
          )}
        </div>

        {hasEditAccess && (
          <div className="pt-1 flex justify-end">
            <button
              onClick={handleSaveBudget}
              disabled={saving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Syncing...' : 'Save Targets'}
            </button>
          </div>
        )}
      </div>

      {/* Side-by-Side Budget Tracker Command Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bride Budget Status */}
        {showBrideBudget && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">Bride Side Ledger</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Target: ${brideTargetInput.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-rose-50/20 p-3 rounded-2xl border border-rose-100/50">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Bride Only</span>
                <span className="text-sm font-black text-rose-700">${brideSpentOnly.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Shared Share</span>
                <span className="text-sm font-black text-slate-700">${brideSharedContribution.toLocaleString()}</span>
              </div>
              <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Spent</span>
                <span className="text-sm font-black text-rose-805">${totalBrideCommitted.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-400 font-semibold">Remaining Limit Balance:</span>
              <span className={`font-black text-sm ${brideTargetInput >= totalBrideCommitted ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${(brideTargetInput - totalBrideCommitted).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Groom Budget Status */}
        {showGroomBudget && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">Groom Side Ledger</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Target: ${groomTargetInput.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-sky-50/20 p-3 rounded-2xl border border-sky-100/50">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Groom Only</span>
                <span className="text-sm font-black text-sky-700">${groomSpentOnly.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Shared Share</span>
                <span className="text-sm font-black text-slate-700">${groomSharedContribution.toLocaleString()}</span>
              </div>
              <div className="bg-sky-50/50 p-3 rounded-2xl border border-sky-100">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Spent</span>
                <span className="text-sm font-black text-sky-850">${totalGroomCommitted.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-400 font-semibold">Remaining Limit Balance:</span>
              <span className={`font-black text-sm ${groomTargetInput >= totalGroomCommitted ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${(groomTargetInput - totalGroomCommitted).toLocaleString()}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Double Stacked Allocation Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-widest">Workspace Allocation Chart</h4>
        
        <div className="h-6 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
          <div style={{ width: `${(groomSpentOnly / (totalWeddingExpenses || 1)) * 100}%` }} className="bg-sky-500" title={`Groom Only: ₹${groomSpentOnly}`}></div>
          <div style={{ width: `${(sharedSpentTotal / (totalWeddingExpenses || 1)) * 100}%` }} className="bg-indigo-500" title={`Shared: ₹${sharedSpentTotal}`}></div>
          <div style={{ width: `${(brideSpentOnly / (totalWeddingExpenses || 1)) * 100}%` }} className="bg-rose-500" title={`Bride Only: ₹${brideSpentOnly}`}></div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs font-bold pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500"></span>
            <span>Groom: ${groomSpentOnly.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <span className="w-3 h-3 rounded bg-indigo-500"></span>
            <span>Shared: ${sharedSpentTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span>Bride: ${brideSpentOnly.toLocaleString()}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
