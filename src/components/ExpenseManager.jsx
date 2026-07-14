import React, { useState } from 'react';
import { DollarSign, Landmark, Plus, Trash2, Check, AlertCircle, Filter, PieChart } from 'lucide-react';

export default function ExpenseManager({ expenses, token, onExpenseAdded, onExpenseUpdated, onExpenseDeleted, totalBudget }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Catering');
  const [paidBy, setPaidBy] = useState('Shared');
  const [isPaid, setIsPaid] = useState(false);
  const [filterPaidBy, setFilterPaidBy] = useState('All');
  const [message, setMessage] = useState(null);

  const categories = ['Catering', 'Photography', 'Decor', 'Music', 'Makeup', 'Attire', 'Invitations', 'Others'];

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses.filter(e => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = totalExpenses - paidExpenses;

  // Add expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      setMessage({ type: 'error', text: 'Expense title and amount are required.' });
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, amount, category, paidBy, isPaid })
      });
      if (res.ok) {
        const newExpense = await res.json();
        onExpenseAdded(newExpense);
        setTitle('');
        setAmount('');
        setIsPaid(false);
        setMessage({ type: 'success', text: 'Expense recorded successfully!' });
      }
    } catch (err) {
      // Local preview fallback
      const fallback = { _id: Date.now().toString(), title, amount: parseFloat(amount), category, paidBy, isPaid, paidDate: isPaid ? new Date() : null };
      onExpenseAdded(fallback);
      setTitle('');
      setAmount('');
      setIsPaid(false);
      setMessage({ type: 'success', text: 'Expense recorded locally (Offline mode).' });
    }
  };

  // Toggle paid
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
      // Offline fallback
      onExpenseUpdated({ _id: id, isPaid: !currentVal, paidDate: !currentVal ? new Date() : null });
    }
  };

  // Delete
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
    <div className="space-y-6">
      
      {/* Mini dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Budget</div>
          <div className="text-2xl font-black text-slate-800 mt-1">${totalBudget.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1.5">Configured globally</div>
        </div>

        {/* Total Logged Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Expenses</div>
          <div className="text-2xl font-black text-slate-800 mt-1">${totalExpenses.toLocaleString()}</div>
          <span className={`text-[10px] font-semibold ${totalExpenses <= totalBudget ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalBudget >= totalExpenses ? `${Math.round((totalExpenses/totalBudget)*100)}% utilized` : 'Budget Exceeded'}
          </span>
        </div>

        {/* Expenses Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expenses Paid</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">${paidExpenses.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1.5">Cleared balances</div>
        </div>

        {/* Expenses Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Payments</div>
          <div className="text-2xl font-black text-amber-600 mt-1">${pendingExpenses.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1.5">Pending clearance</div>
        </div>

      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Record Expense Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between lg:col-span-1">
          <div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">Record New Expense</h3>
            
            {message && (
              <div className={`p-3 rounded-lg text-xs font-semibold mb-4 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Label</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder="e.g. Wedding Cake Downpayment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                    placeholder="500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payer Pool</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                >
                  <option value="Shared">Shared Budget Pool</option>
                  <option value="Bride">Bride Side Pool</option>
                  <option value="Groom">Groom Side Pool</option>
                </select>
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="isPaid"
                  className="rounded text-indigo-650 mr-2"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                />
                <label htmlFor="isPaid" className="text-xs text-slate-650 font-bold select-none">Mark immediately as Paid</label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Save Expense
              </button>
            </form>
          </div>
        </div>

        {/* Expense log table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Detailed Expense Log</h3>
              
              {/* Filter */}
              <div className="flex gap-1 bg-white p-1 border border-slate-200 rounded-lg text-[10px] font-bold shadow-xs">
                {['All', 'Shared', 'Bride', 'Groom'].map(pool => (
                  <button
                    key={pool}
                    onClick={() => setFilterPaidBy(pool)}
                    className={`px-2 py-1 rounded transition-all ${
                      filterPaidBy === pool ? 'bg-slate-900 text-white' : 'text-slate-500'
                    }`}
                  >
                    {pool} Pool
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-3">Expense Label</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Paid By</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses
                    .filter(e => filterPaidBy === 'All' || e.paidBy === filterPaidBy)
                    .map(expense => (
                      <tr key={expense._id} className="border-b border-slate-100 hover:bg-slate-50/30">
                        <td className="p-3 font-semibold text-slate-700">{expense.title}</td>
                        <td className="p-3 text-slate-500">{expense.category}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            expense.paidBy === 'Bride' ? 'bg-rose-50 text-rose-650' :
                            expense.paidBy === 'Groom' ? 'bg-sky-50 text-sky-650' :
                            'bg-indigo-50 text-indigo-650'
                          }`}>
                            {expense.paidBy}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleTogglePaid(expense._id, expense.isPaid)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                              expense.isPaid 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-250 hover:bg-amber-100'
                            }`}
                          >
                            {expense.isPaid ? 'Paid' : 'Unpaid'}
                          </button>
                        </td>
                        <td className="p-3 text-right font-extrabold text-slate-800">
                          ${expense.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDelete(expense._id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {expenses.filter(e => filterPaidBy === 'All' || e.paidBy === filterPaidBy).length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 italic">No recorded expenses found. Log one on the left panel!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
