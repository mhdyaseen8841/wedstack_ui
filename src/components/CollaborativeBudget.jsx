import React, { useState } from 'react';
import { DollarSign, Percent, Shield, Filter, Award, Save } from 'lucide-react';

export default function CollaborativeBudget({ wedding, vendors, token, onUpdateWedding }) {
  const [totalBudget, setTotalBudget] = useState(wedding.totalBudget || 45000);
  const [splitRatio, setSplitRatio] = useState(wedding.budgetSplitRatio || 50); // Groom allocation percentage
  const [filterSide, setFilterSide] = useState('All'); // 'All', 'Groom', 'Bride', 'Shared'
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Aligned shares
  const groomShare = (totalBudget * splitRatio) / 100;
  const brideShare = totalBudget - groomShare;

  // Calculate committed expenses (Booked and Shortlisted packages)
  const getExpenses = (sideVisibility) => {
    return vendors
      .filter(v => (sideVisibility === 'All' || v.sideVisibility === sideVisibility))
      .reduce((sum, v) => {
        // Find cost of Booked or first package if shortlisted
        const pkg = v.packages[0];
        if (pkg && (v.status === 'Booked' || v.status === 'Shortlisted')) {
          return sum + pkg.totalCost;
        }
        return sum;
      }, 0);
  };

  const groomExpenses = getExpenses('Groom');
  const brideExpenses = getExpenses('Bride');
  const sharedExpenses = getExpenses('Shared');
  const totalExpenses = groomExpenses + brideExpenses + sharedExpenses;

  const saveBudgetSettings = async () => {
    setSaving(true);
    setMessage(null);
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
          totalBudget,
          budgetSplitRatio: splitRatio
        })
      });
      const data = await res.json();
      if (res.ok) {
        onUpdateWedding(data);
        setMessage({ type: 'success', text: 'Budget targets successfully synced!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update budget.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error connecting to database.' });
    } finally {
      setSaving(false);
    }
  };

  // Stacked percentages for progress bar
  const totalExLimit = Math.max(totalBudget, totalExpenses);
  const pctGroom = (groomExpenses / totalExLimit) * 100;
  const pctBride = (brideExpenses / totalExLimit) * 100;
  const pctShared = (sharedExpenses / totalExLimit) * 100;
  const pctRemaining = Math.max(0, 100 - pctGroom - pctBride - pctShared);

  return (
    <div className="space-y-6">
      
      {/* Budget overview config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Inputs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-150/60 pb-3">
            <h3 className="font-semibold text-base text-slate-800">Wedding Budget Allocation</h3>
            {message && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {message.text}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Total Budget Target */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Global Target Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm font-semibold"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Split Ratio Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  Split (Groom / Bride)
                </span>
                <span className="text-indigo-600 font-bold">{splitRatio}% / {100 - splitRatio}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={splitRatio}
                onChange={(e) => setSplitRatio(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>More Groom Share</span>
                <span>More Bride Share</span>
              </div>
            </div>

          </div>

          {/* Target Share Display Cards */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Groom Pool Share ({splitRatio}%)</span>
              <div className="text-xl font-extrabold text-sky-800">${groomShare.toLocaleString()}</div>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Bride Pool Share ({100 - splitRatio}%)</span>
              <div className="text-xl font-extrabold text-rose-800">${brideShare.toLocaleString()}</div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={saveBudgetSettings}
              disabled={saving}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Syncing...' : 'Save Targets'}
            </button>
          </div>
        </div>

        {/* Expenses Summary Ring */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">Committed Cost Tracker</h4>
            <div className="py-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Total Committed:</span>
                <span className="font-bold text-slate-800">${totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Remaining Cash Allocation:</span>
                <span className={`font-bold ${totalBudget >= totalExpenses ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${(totalBudget - totalExpenses).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/50 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Utilisation</span>
            <span className={`text-2xl font-black ${totalExpenses > totalBudget ? 'text-rose-600 animate-pulse' : 'text-indigo-600'}`}>
              {totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* Tri-Color Stacked Expense Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Dynamic Budget Pool Chart</h4>
          <span className="text-xs text-slate-400">Values based on Booked / Shortlisted contracts</span>
        </div>

        {/* The Bar */}
        <div className="h-6 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
          <div style={{ width: `${pctGroom}%` }} className="bg-sky-500 transition-all duration-500" title={`Groom Pool: $${groomExpenses}`}></div>
          <div style={{ width: `${pctShared}%` }} className="bg-indigo-500 transition-all duration-500" title={`Shared Pool: $${sharedExpenses}`}></div>
          <div style={{ width: `${pctBride}%` }} className="bg-rose-500 transition-all duration-500" title={`Bride Pool: $${brideExpenses}`}></div>
          <div style={{ width: `${pctRemaining}%` }} className="bg-slate-200 transition-all duration-500" title={`Available: $${Math.max(0, totalBudget - totalExpenses)}`}></div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-sky-500 block"></span>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Groom Pool</span>
              <span className="text-slate-800">${groomExpenses.toLocaleString()} ({Math.round(pctGroom)}%)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-indigo-50 block"></span>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Shared Pool</span>
              <span className="text-slate-800">${sharedExpenses.toLocaleString()} ({Math.round(pctShared)}%)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-rose-500 block"></span>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Bride Pool</span>
              <span className="text-slate-800">${brideExpenses.toLocaleString()} ({Math.round(pctBride)}%)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-slate-200 block"></span>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Available Target</span>
              <span className="text-emerald-600">${Math.max(0, totalBudget - totalExpenses).toLocaleString()} ({Math.round(pctRemaining)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filterable Itemized Budget Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wider">Itemised Vendor Budgets</h4>
          </div>

          {/* Toggle filter */}
          <div className="flex gap-1 bg-white p-1 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm">
            {['All', 'Shared', 'Bride', 'Groom'].map(pool => (
              <button
                key={pool}
                onClick={() => setFilterSide(pool)}
                className={`px-3 py-1 rounded-md transition-all ${
                  filterSide === pool
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {pool} {pool !== 'All' ? 'Pool' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">Vendor Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Visibility Pool</th>
                <th className="p-4">Contract Status</th>
                <th className="p-4 text-right">Committed Cost</th>
              </tr>
            </thead>
            <tbody>
              {vendors
                .filter(v => filterSide === 'All' || v.sideVisibility === filterSide)
                .map(v => {
                  const pkg = v.packages[0];
                  const cost = pkg ? pkg.totalCost : 0;
                  const isCounted = v.status === 'Booked' || v.status === 'Shortlisted';
                  return (
                    <tr key={v._id} className="border-b border-slate-100 hover:bg-slate-50/30">
                      <td className="p-4 font-bold text-slate-700">{v.vendorName}</td>
                      <td className="p-4 text-slate-500">{v.category}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          v.sideVisibility === 'Bride' ? 'bg-rose-50 text-rose-600' :
                          v.sideVisibility === 'Groom' ? 'bg-sky-50 text-sky-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {v.sideVisibility}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[9px] ${
                          isCounted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {v.status} {isCounted ? '(Counted)' : '(Estimate)'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-800">
                        ${cost.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              {vendors.filter(v => filterSide === 'All' || v.sideVisibility === filterSide).length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400 italic">No budget items match this visibility pool.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
