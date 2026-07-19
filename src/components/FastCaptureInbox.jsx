import React, { useState } from 'react';
import { Sparkles, Save, FileText, CheckCircle2, ChevronRight, Plus, Trash2, Check, Lock, Landmark, Users } from 'lucide-react';
import { API_URL } from '../config';

export default function FastCaptureInbox({ token, side, onVendorCreated, onVendorUpdated, onVendorDeleted, vendors, onUpdateVendorStatus, neededServices = [], categoryFilter, setCategoryFilter, onLogVendorExpense, expenses = [], onExpenseDeleted }) {
  const selectOptions = neededServices.length > 0
    ? neededServices.map(s => ({ name: s.name, category: s.category }))
    : [
        { name: 'Venue / Auditorium Booking', category: 'Venue' },
        { name: 'Makeup & Grooming (Groom)', category: 'Makeup' },
        { name: 'Makeup & Bridal Styling (Bride)', category: 'Makeup' },
        { name: 'Photo & Video Services', category: 'Photography' },
        { name: 'Event Planner / Decor Decorators', category: 'Decor' },
        { name: 'Entertainment & Music / DJ', category: 'Music' },
        { name: 'Food Catering Services', category: 'Catering' },
        { name: 'Vehicle & Transport Logistics', category: 'Others' }
      ];

  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState(selectOptions[0]?.category || 'Venue');
  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState('Quoted');
  const [sideVisibility, setSideVisibility] = useState(side === 'Shared' ? 'Shared' : side);
  const [allowCrossView, setAllowCrossView] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState(null);
  const [expenseModalVendor, setExpenseModalVendor] = useState(null);
  const [cancelModalVendor, setCancelModalVendor] = useState(null);
  const [showParserPanel, setShowParserPanel] = useState(true);
  const [editVendorModal, setEditVendorModal] = useState(null); // vendor object being edited
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState(null);

  // Drag and Drop state
  const [draggedVendor, setDraggedVendor] = useState(null);
  const [draggedOverCol, setDraggedOverCol] = useState(null);

  const handleDragStart = (e, vendor) => {
    setDraggedVendor(vendor);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e, statusCol) => {
    e.preventDefault();
    setDraggedOverCol(statusCol);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDraggedOverCol(null);
    if (draggedVendor && draggedVendor.status !== targetStatus) {
      onUpdateVendorStatus(draggedVendor._id, targetStatus);
    }
    setDraggedVendor(null);
  };

  // Expense popup form states
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseNeededServiceId, setExpenseNeededServiceId] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('Shared');
  const [expenseIsPaid, setExpenseIsPaid] = useState(false);
  const [expenseAdvancePaid, setExpenseAdvancePaid] = useState('');
  const [expensePaymentMode, setExpensePaymentMode] = useState('Cash');
  const [expensePaidDate, setExpensePaidDate] = useState('');
  const [expenseBalanceDueDate, setExpenseBalanceDueDate] = useState('');
  const [expenseBalanceRemarks, setExpenseBalanceRemarks] = useState('');
  const [expenseGroomSplit, setExpenseGroomSplit] = useState('');
  const [expenseBrideSplit, setExpenseBrideSplit] = useState('');
  const [expenseAdvancePayer, setExpenseAdvancePayer] = useState('Groom');
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  React.useEffect(() => {
    if (expenseModalVendor) {
      const pkg = expenseModalVendor.packages && expenseModalVendor.packages[0];
      setExpenseTitle(`Booked Vendor: ${expenseModalVendor.vendorName} (${pkg ? pkg.packageName : 'General Package'})`);
      setExpenseAmount(pkg ? pkg.totalCost || 0 : 0);
      setExpenseCategory(expenseModalVendor.category);
      setExpensePaidBy(expenseModalVendor.sideVisibility || (side === 'Shared' ? 'Shared' : side));
      setExpenseIsPaid(true);
      setExpenseAdvancePaid(pkg ? pkg.totalCost || 0 : 0);

      const matchingService = neededServices.find(s => s.category.toLowerCase() === expenseModalVendor.category.toLowerCase());
      if (matchingService) {
        setExpenseNeededServiceId(matchingService._id);
        setExpenseCategory(matchingService.name);
      } else {
        setExpenseNeededServiceId('');
      }
      setExpensePaymentMode('Bank Transfer');
      setExpenseBalanceRemarks('Logged from Vendor Booking');
      setExpensePaidDate(new Date().toISOString().split('T')[0]);
      setExpenseBalanceDueDate('');
    }
  }, [expenseModalVendor, neededServices, side]);

  React.useEffect(() => {
    if (categoryFilter) {
      setCategory(categoryFilter);
    }
  }, [categoryFilter]);

  const handleSaveExpenseFromModal = async (e) => {
    e.preventDefault();
    if (parseFloat(expenseAdvancePaid) > parseFloat(expenseAmount)) {
      alert("Advance paid cannot exceed the total cost!");
      return;
    }
    setExpenseSubmitting(true);

    let finalTitle = expenseTitle.trim();
    if (expensePaidBy === 'Shared') {
      const gSplit = parseFloat(expenseGroomSplit) || 0;
      const bSplit = parseFloat(expenseBrideSplit) || 0;
      const adv = parseFloat(expenseAdvancePaid) || 0;
      finalTitle = `${finalTitle}##split:${gSplit}:${bSplit}:${adv}:${expenseAdvancePayer}`;
    }

    const payload = {
      title: finalTitle,
      amount: parseFloat(expenseAmount) || 0,
      category: expenseCategory,
      paidBy: expensePaidBy,
      isPaid: expenseIsPaid,
      advancePaid: parseFloat(expenseAdvancePaid) || 0,
      paymentMode: expensePaymentMode,
      paidDate: expensePaidDate || undefined,
      balanceDueDate: expenseBalanceDueDate || undefined,
      balanceRemarks: expenseBalanceRemarks,
      neededServiceId: expenseNeededServiceId || undefined
    };

    if (onLogVendorExpense) {
      await onLogVendorExpense(expenseModalVendor, payload);
    }
    setExpenseSubmitting(false);
    setExpenseModalVendor(null);
  };

  const getAssociatedExpenses = (vendor) => {
    if (!vendor) return [];
    const matchingService = neededServices.find(s => s.category.toLowerCase() === vendor.category.toLowerCase());
    return expenses.filter(exp =>
      (matchingService && exp.neededServiceId === matchingService._id) ||
      exp.title.includes(vendor.vendorName)
    );
  };

  const handleDeleteAssociatedExpense = async (expenseId) => {
    if (token) {
      try {
        await fetch(`${API_URL}/api/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) { }
    }
    if (onExpenseDeleted) onExpenseDeleted(expenseId);
  };

  const handleCancelBookingAndCleanExpenses = async (vendor) => {
    const associated = getAssociatedExpenses(vendor);
    for (const exp of associated) {
      await handleDeleteAssociatedExpense(exp._id);
    }
    if (onUpdateVendorStatus) {
      await onUpdateVendorStatus(vendor._id, 'Shortlisted');
    }
    setCancelModalVendor(null);
  };

  const handleDeleteVendor = async (vendor) => {
    if (vendor.status === 'Booked') {
      alert("Booked vendors cannot be deleted. Cancel the booking first to delete.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${vendor.vendorName}? This will also delete all associated expenses.`)) {
      return;
    }

    try {
      const associated = getAssociatedExpenses(vendor);
      for (const exp of associated) {
        await handleDeleteAssociatedExpense(exp._id);
      }

      if (token) {
        const res = await fetch(`${API_URL}/api/vendors/${vendor._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          if (onVendorDeleted) onVendorDeleted(vendor._id);
        } else {
          const errData = await res.json();
          alert(errData.message || "Failed to delete vendor.");
        }
      } else {
        if (onVendorDeleted) onVendorDeleted(vendor._id);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting vendor.");
    }
  };

  // Handle parsing
  const handleParse = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/vendors/parse-text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rawText })
      });
      const data = await res.json();
      if (res.ok && data.packages) {
        setPackages(data.packages);
        // Use AI-extracted vendor name if returned, otherwise guess from first line
        if (data.vendorName && data.vendorName.trim()) {
          setVendorName(data.vendorName.trim().slice(0, 60));
        } else if (rawText.length > 0) {
          const firstLine = rawText.split('\n')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
          setVendorName(firstLine.slice(0, 30) || 'New AI Parsed Vendor');
        }
        setMessage({ type: 'success', text: `Quote parsed: ${data.packages.length} package${data.packages.length !== 1 ? 's' : ''} extracted!` });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to parse quote.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection to server failed. Ensure backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  // Add package manually
  const addPackage = () => {
    setPackages([...packages, {
      packageName: `Package Option ${packages.length + 1}`,
      totalCost: 1000,
      deliverables: [''],
      finePrint: []
    }]);
  };

  // Delete package
  const removePackage = (pIdx) => {
    setPackages(packages.filter((_, idx) => idx !== pIdx));
  };

  // Update package details
  const updatePackage = (pIdx, field, value) => {
    const updated = [...packages];
    updated[pIdx][field] = value;
    setPackages(updated);
  };

  // Add deliverable to package
  const addDeliverable = (pIdx) => {
    const updated = [...packages];
    updated[pIdx].deliverables.push('');
    setPackages(updated);
  };

  // Update deliverable
  const updateDeliverable = (pIdx, dIdx, val) => {
    const updated = [...packages];
    updated[pIdx].deliverables[dIdx] = val;
    setPackages(updated);
  };

  // Remove deliverable
  const removeDeliverable = (pIdx, dIdx) => {
    const updated = [...packages];
    updated[pIdx].deliverables = updated[pIdx].deliverables.filter((_, idx) => idx !== dIdx);
    setPackages(updated);
  };

  // Add fine print line
  const addFinePrint = (pIdx) => {
    const updated = [...packages];
    updated[pIdx].finePrint.push({ item: 'Extra Charge', costPerUnit: 50, unit: 'hour' });
    setPackages(updated);
  };

  // Update fine print line
  const updateFinePrint = (pIdx, fIdx, field, val) => {
    const updated = [...packages];
    updated[pIdx].finePrint[fIdx][field] = field === 'costPerUnit' ? parseFloat(val) || 0 : val;
    setPackages(updated);
  };

  // Remove fine print line
  const removeFinePrint = (pIdx, fIdx) => {
    const updated = [...packages];
    updated[pIdx].finePrint = updated[pIdx].finePrint.filter((_, idx) => idx !== fIdx);
    setPackages(updated);
  };

  // Save parsed vendor
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      setMessage({ type: 'error', text: 'Vendor Name is required' });
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/vendors`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          vendorName,
          category,
          status,
          sideVisibility,
          allowCrossView,
          packages,
          contactNumber,
          instagramUrl,
          remarks
        })
      });
      const data = await res.json();
      if (res.ok) {
        onVendorCreated(data);
        // Clear
        setRawText('');
        setVendorName('');
        setPackages([]);
        setContactNumber('');
        setInstagramUrl('');
        setRemarks('');
        setMessage({ type: 'success', text: 'Vendor saved and synced successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save vendor' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error connecting to database.' });
    }
  };

  // Open edit modal — pre-fill all fields
  const openEditModal = (vendor) => {
    setEditVendorModal({ ...vendor });
    setEditMessage(null);
  };

  // Save edited vendor via PATCH
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editVendorModal) return;
    setEditSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/vendors/${editVendorModal._id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          vendorName: editVendorModal.vendorName,
          category: editVendorModal.category,
          status: editVendorModal.status,
          sideVisibility: editVendorModal.sideVisibility,
          allowCrossView: editVendorModal.allowCrossView,
          contactNumber: editVendorModal.contactNumber || '',
          instagramUrl: editVendorModal.instagramUrl || '',
          remarks: editVendorModal.remarks || '',
          packages: editVendorModal.packages || []
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (onVendorUpdated) onVendorUpdated(data); // refresh parent list
        setEditMessage({ type: 'success', text: 'Vendor updated successfully!' });
        setTimeout(() => setEditVendorModal(null), 900);
      } else {
        setEditMessage({ type: 'error', text: data.message || 'Update failed' });
      }
    } catch {
      setEditMessage({ type: 'error', text: 'Connection error.' });
    } finally {
      setEditSaving(false);
    }
  };

  // Group vendors by status for the visual tracking board
  const boardStatuses = ['Discovered', 'Contacted', 'Quoted', 'Shortlisted', 'Booked'];

  return (
    <div className="space-y-8">
      {categoryFilter && (
        <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 flex justify-between items-center text-xs text-indigo-850 font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Currently filtering tracking board & category selector to: <span className="underline font-black text-indigo-950">{categoryFilter}</span></span>
          </div>
          <button
            onClick={() => {
              if (setCategoryFilter) setCategoryFilter(null);
            }}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 rounded-lg transition-colors font-bold uppercase text-[9px] tracking-wider"
          >
            ✕ Clear Filter
          </button>
        </div>
      )}
      {/* Accordion Wrapper for Quote Parser & Vendor Details */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowParserPanel(!showParserPanel)}
          className="w-full p-6 flex justify-between items-center text-left hover:bg-slate-50/50 transition-colors focus:outline-none"
        >
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Fast-Capture Quote Parser & Vendor Entry
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Add new vendors quickly by copy-pasting raw quote details or typing manually.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              {showParserPanel ? 'Click to hide forms' : 'Click to expand forms'}
            </span>
            <span className={`text-slate-400 transition-transform duration-300 font-black text-sm ${showParserPanel ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </div>
        </button>

        {showParserPanel && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side: Unstructured Paste */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h3 className="font-semibold text-lg text-slate-800">Fast-Capture Quote Parser</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Copy-paste unstructured quotes from WhatsApp, Instagram DMs, or emails. The AI engine will extract pricing, packages, and fine print.
            </p>
            <textarea
              className="w-full h-80 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-mono bg-slate-50/50 placeholder:text-slate-400"
              placeholder="Example:&#10;Hey! Here is the pricing for Elegance Photography:&#10;- Gold Package: ₹3500. Includes 8 hours of wedding coverage, digital gallery, and premium custom photo book.&#10;- Fine print: Extra hour is ₹200. Travel charges apply outside metro area (₹50/hour)."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
          <button
            onClick={handleParse}
            disabled={loading || !rawText.trim()}
            className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium text-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing quote details...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Quote with AI
              </>
            )}
          </button>
        </div>

        {/* Right Side: Editable Preview Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-rose-500" />
            <h3 className="font-semibold text-lg text-slate-800">Structured Vendor Details</h3>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSaveVendor} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4 overflow-y-auto max-h-[26rem] pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vendor Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Elegance Studio"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Needed Service</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {selectOptions.map(opt => (
                      <option key={opt.name} value={opt.category}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Board Status</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {boardStatuses.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Visibility</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={sideVisibility}
                    onChange={(e) => setSideVisibility(e.target.value)}
                  >
                    <option value="Shared">Shared Pool</option>
                    <option value="Bride">Bride Pool</option>
                    <option value="Groom">Groom Pool</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <input
                    type="checkbox"
                    id="allowCrossView"
                    className="rounded text-indigo-600 mr-2"
                    checked={allowCrossView}
                    onChange={(e) => setAllowCrossView(e.target.checked)}
                  />
                  <label htmlFor="allowCrossView" className="text-xs text-slate-650 font-semibold select-none">Allow Cross View</label>
                </div>
              </div>

              {/* Contact, Instagram, Remarks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Number</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Instagram URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/vendor"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm resize-none"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Met at bridal expo, very responsive, check portfolio again..."
                />
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Packages & Pricing</h4>
                  <button
                    type="button"
                    onClick={addPackage}
                    className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Package
                  </button>
                </div>

                {packages.map((pkg, pIdx) => (
                  <div key={pIdx} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => removePackage(pIdx)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-3 gap-2 pr-6">
                      <div className="col-span-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-sm font-semibold bg-white border border-slate-200 rounded"
                          placeholder="Package Name"
                          value={pkg.packageName}
                          onChange={(e) => updatePackage(pIdx, 'packageName', e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          className="w-full px-2 py-1 text-sm bg-white border border-slate-200 rounded font-semibold text-slate-700"
                          placeholder="Cost"
                          value={pkg.totalCost}
                          onChange={(e) => updatePackage(pIdx, 'totalCost', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Deliverables</span>
                        <button
                          type="button"
                          onClick={() => addDeliverable(pIdx)}
                          className="text-[10px] text-indigo-600 font-bold hover:underline"
                        >
                          + Add Line
                        </button>
                      </div>
                      {pkg.deliverables.map((del, dIdx) => (
                        <div key={dIdx} className="flex gap-1 items-center">
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                            placeholder="e.g. 8 Hours Coverage"
                            value={del}
                            onChange={(e) => updateDeliverable(pIdx, dIdx, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeDeliverable(pIdx, dIdx)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Fine Print / Variable Extras */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Variable Options & Fine Print</span>
                        <button
                          type="button"
                          onClick={() => addFinePrint(pIdx)}
                          className="text-[10px] text-indigo-600 font-bold hover:underline"
                        >
                          + Add Option
                        </button>
                      </div>
                      {pkg.finePrint.map((fp, fIdx) => (
                        <div key={fIdx} className="grid grid-cols-12 gap-1 items-center">
                          <input
                            type="text"
                            className="col-span-6 px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                            placeholder="Item name"
                            value={fp.item}
                            onChange={(e) => updateFinePrint(pIdx, fIdx, 'item', e.target.value)}
                          />
                          <input
                            type="number"
                            className="col-span-3 px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                            placeholder="Rate"
                            value={fp.costPerUnit}
                            onChange={(e) => updateFinePrint(pIdx, fIdx, 'costPerUnit', e.target.value)}
                          />
                          <input
                            type="text"
                            className="col-span-2 px-1 py-1 text-[10px] bg-white border border-slate-200 rounded"
                            placeholder="hour/guest"
                            value={fp.unit}
                            onChange={(e) => updateFinePrint(pIdx, fIdx, 'unit', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeFinePrint(pIdx, fIdx)}
                            className="col-span-1 text-slate-400 hover:text-rose-500 text-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Vendor to Tracking Board
            </button>
          </form>
        </div>

      </div>
    </div>
  )}
</div>

      {/* Visual Status Tracking Board (Kanban) */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold text-lg text-slate-800">Vendor Status Tracking Board</h3>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Category:</span>
            <select
              value={categoryFilter || ''}
              onChange={(e) => {
                if (setCategoryFilter) {
                  setCategoryFilter(e.target.value || null);
                }
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-xs"
            >
              <option value="">All Categories</option>
              {Array.from(new Set(selectOptions.map(o => o.category))).map(cat => {
                const matchedService = selectOptions.find(o => o.category === cat);
                return (
                  <option key={cat} value={cat}>
                    {matchedService ? matchedService.name.split(' (')[0].split(' / ')[0] : cat}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {boardStatuses.map(statusCol => {
            const filteredVendors = vendors
              .filter(v => !categoryFilter || v.category.toLowerCase() === categoryFilter.toLowerCase())
              .filter(v => v.status === statusCol);
            return (
              <div
                key={statusCol}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, statusCol)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, statusCol)}
                className={`rounded-xl p-4 min-h-[300px] border transition-all ${
                  draggedOverCol === statusCol
                    ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-100/60 border-slate-200/50'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{statusCol}</span>
                  <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {filteredVendors.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredVendors.map(vendor => (
                    <div
                      key={vendor._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, vendor)}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer relative group space-y-2 active:opacity-50"
                    >
                      <div className="font-bold text-slate-800 text-sm truncate">{vendor.vendorName}</div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">{vendor.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${vendor.sideVisibility === 'Bride' ? 'bg-rose-50 text-rose-600' :
                            vendor.sideVisibility === 'Groom' ? 'bg-sky-50 text-sky-600' :
                              'bg-indigo-50 text-indigo-600'
                          }`}>
                          {vendor.sideVisibility}
                        </span>
                      </div>

                      {/* Contact / Instagram chips */}
                      {(vendor.contactNumber || vendor.instagramUrl) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {vendor.contactNumber && (
                            <a
                              href={`tel:${vendor.contactNumber}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              📞 {vendor.contactNumber}
                            </a>
                          )}
                          {vendor.instagramUrl && (
                            <a
                              href={vendor.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg hover:bg-rose-100 transition-colors"
                            >
                              IG ↗
                            </a>
                          )}
                        </div>
                      )}
                      {vendor.remarks && (
                        <p className="text-[10px] text-slate-400 italic leading-snug line-clamp-2">{vendor.remarks}</p>
                      )}

                      <div className="flex justify-between items-center pt-1.5 gap-2 border-t border-slate-100/50 mt-1.5 flex-wrap">
                        {vendor.packages && vendor.packages.length > 0 ? (
                          <div className="text-[10px] font-black text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                            ₹{vendor.packages[0].totalCost.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-semibold italic">No package logged</span>
                        )}
                        {statusCol === 'Booked' && (
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpenseModalVendor(vendor);
                              }}
                              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider flex items-center gap-0.5"
                              title="Record this vendor package cost as a ledger expense item"
                            >
                              💸 Log Expense
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelModalVendor(vendor);
                              }}
                              className="text-[9px] font-bold text-rose-600 hover:text-rose-800 transition-colors uppercase tracking-wider flex items-center gap-0.5"
                              title="Cancel booking and manage associated ledger expenses"
                            >
                              🚫 Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Status mover + Edit button */}
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          {boardStatuses.indexOf(statusCol) > 0 && statusCol !== 'Booked' && (
                            <button
                              onClick={() => onUpdateVendorStatus(vendor._id, boardStatuses[boardStatuses.indexOf(statusCol) - 1])}
                              className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-xs text-slate-600 font-bold"
                            >
                              ←
                            </button>
                          )}
                          {boardStatuses.indexOf(statusCol) < boardStatuses.length - 1 && (
                            <button
                              onClick={() => onUpdateVendorStatus(vendor._id, boardStatuses[boardStatuses.indexOf(statusCol) + 1])}
                              className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-xs text-slate-600 font-bold"
                            >
                              →
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(vendor); }}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider flex items-center gap-0.5 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          {vendor.status !== 'Booked' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteVendor(vendor); }}
                              className="text-[9px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider flex items-center gap-0.5 transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredVendors.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-slate-400 italic">No vendors</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 4. Record Expense Popup Modal */}
      {expenseModalVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setExpenseModalVendor(null)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold transition-all"
            >
              ✕
            </button>
            <div className="mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-indigo-600" /> Record Expense
              </h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-1.5">
                Log the expense details for booked vendor <strong className="text-slate-700">{expenseModalVendor.vendorName}</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveExpenseFromModal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Linked Needed Service (Optional)</label>
                <select
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={expenseNeededServiceId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpenseNeededServiceId(val);
                    const linked = neededServices.find(s => s._id === val);
                    if (linked) {
                      setExpenseCategory(linked.name);
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
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700"
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
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
                  value={expensePaidBy}
                  onChange={(e) => setExpensePaidBy(e.target.value)}
                >
                  <option value="Shared">Shared / Common Split Cost</option>
                  <option value="Groom">Groom Personal Ledger (Private)</option>
                  <option value="Bride">Bride Personal Ledger (Private)</option>
                </select>
              </div>

              {expensePaidBy === 'Shared' && (
                <div className="p-4 border border-indigo-100 rounded-2xl bg-indigo-50/20 space-y-3">
                  <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wider block">Common Event Cost Split</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Groom Share (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        placeholder="₹1000"
                        value={expenseGroomSplit}
                        onChange={(e) => setExpenseGroomSplit(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Bride Share (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        placeholder="₹1000"
                        value={expenseBrideSplit}
                        onChange={(e) => setExpenseBrideSplit(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Bookkeeping & Payment Details</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      value={expenseAdvancePaid}
                      onChange={(e) => setExpenseAdvancePaid(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold focus:outline-none"
                      value={expensePaymentMode}
                      onChange={(e) => setExpensePaymentMode(e.target.value)}
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
                      value={expensePaidDate}
                      onChange={(e) => setExpensePaidDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Balance Due Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      value={expenseBalanceDueDate}
                      onChange={(e) => setExpenseBalanceDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Balance Remarks</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    value={expenseBalanceRemarks}
                    onChange={(e) => setExpenseBalanceRemarks(e.target.value)}
                  />
                </div>

                <div className="text-[10px] text-slate-400 font-bold uppercase pt-1 border-t border-slate-200 flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className="text-slate-800 font-extrabold">₹{(parseFloat(expenseAmount) || 0) - (parseFloat(expenseAdvancePaid) || 0)}</span>
                </div>
              </div>

              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="expenseIsPaidCheckbox"
                  className="rounded text-indigo-650 mr-2"
                  checked={expenseIsPaid}
                  onChange={(e) => {
                    setExpenseIsPaid(e.target.checked);
                    if (e.target.checked) {
                      setExpenseAdvancePaid(expenseAmount);
                    }
                  }}
                />
                <label htmlFor="expenseIsPaidCheckbox" className="text-xs text-slate-500 font-bold select-none cursor-pointer">Mark paid fully</label>
              </div>

              <button
                type="submit"
                disabled={expenseSubmitting}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> {expenseSubmitting ? 'Logging...' : 'Save Expense Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Cancel Booking Dialog Modal */}
      {cancelModalVendor && (() => {
        const associated = getAssociatedExpenses(cancelModalVendor);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setCancelModalVendor(null)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold transition-all"
              >
                ✕
              </button>

              <div className="mb-4">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-150 flex items-center gap-1.5 text-rose-600">
                  ⚠️ Cancel Booking Details
                </h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-1.5 leading-relaxed">
                  Cancelling the booking for <strong className="text-slate-700">{cancelModalVendor.vendorName}</strong>. Below are all matching logged ledger expenses associated with this vendor booking:
                </p>
              </div>

              <div className="space-y-3 my-4">
                {associated.length > 0 ? (
                  associated.map(exp => (
                    <div key={exp._id} className="p-3 border border-slate-200 bg-slate-50/50 rounded-2xl flex justify-between items-center gap-3">
                      <div className="truncate">
                        <span className="font-bold text-xs text-slate-800 block truncate">{exp.title}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{exp.category} &bull; Paid: ₹{exp.advancePaid || 0} / Total: ₹{exp.amount}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAssociatedExpense(exp._id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0"
                        title="Delete this expense only"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No logged expenses found for this booking.
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-2">
                {associated.length > 0 && (
                  <button
                    onClick={() => handleCancelBookingAndCleanExpenses(cancelModalVendor)}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete All Associated Expenses & Move to Shortlisted
                  </button>
                )}

                <button
                  onClick={async () => {
                    if (onUpdateVendorStatus) {
                      await onUpdateVendorStatus(cancelModalVendor._id, 'Shortlisted');
                    }
                    setCancelModalVendor(null);
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  Move back to Shortlisted without deleting expenses
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Vendor Modal ── */}
      {editVendorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  ✏️ Edit Vendor
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Update details, packages, and contact info for this vendor.</p>
              </div>
              <button
                onClick={() => setEditVendorModal(null)}
                className="w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 text-xs font-bold transition-all"
              >✕</button>
            </div>

            <form onSubmit={handleEditSave} className="overflow-y-auto flex-1 p-6 space-y-5">
              {editMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${editMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {editMessage.text}
                </div>
              )}

              {/* Name + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={editVendorModal.vendorName}
                    onChange={e => setEditVendorModal({ ...editVendorModal, vendorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={editVendorModal.category}
                    onChange={e => setEditVendorModal({ ...editVendorModal, category: e.target.value })}
                  >
                    {selectOptions.map(opt => (
                      <option key={opt.name} value={opt.category}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status + Visibility + Cross View */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none"
                    value={editVendorModal.status}
                    onChange={e => setEditVendorModal({ ...editVendorModal, status: e.target.value })}
                  >
                    {boardStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Visibility</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none"
                    value={editVendorModal.sideVisibility}
                    onChange={e => setEditVendorModal({ ...editVendorModal, sideVisibility: e.target.value })}
                  >
                    <option value="Shared">Shared Pool</option>
                    <option value="Bride">Bride Pool</option>
                    <option value="Groom">Groom Pool</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <input
                    type="checkbox"
                    id="editCrossView"
                    className="rounded text-indigo-600 mr-2"
                    checked={!!editVendorModal.allowCrossView}
                    onChange={e => setEditVendorModal({ ...editVendorModal, allowCrossView: e.target.checked })}
                  />
                  <label htmlFor="editCrossView" className="text-xs text-slate-600 font-semibold select-none">Allow Cross View</label>
                </div>
              </div>

              {/* Contact + Instagram */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Number</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={editVendorModal.contactNumber || ''}
                    onChange={e => setEditVendorModal({ ...editVendorModal, contactNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Instagram URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={editVendorModal.instagramUrl || ''}
                    onChange={e => setEditVendorModal({ ...editVendorModal, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/vendor"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  value={editVendorModal.remarks || ''}
                  onChange={e => setEditVendorModal({ ...editVendorModal, remarks: e.target.value })}
                  placeholder="Any notes about this vendor..."
                />
              </div>

              {/* Packages */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Packages & Pricing</h4>
                  <button
                    type="button"
                    onClick={() => setEditVendorModal({
                      ...editVendorModal,
                      packages: [...(editVendorModal.packages || []), { packageName: 'New Package', totalCost: 0, deliverables: [], finePrint: [] }]
                    })}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Package
                  </button>
                </div>
                {(editVendorModal.packages || []).map((pkg, pIdx) => (
                  <div key={pIdx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => setEditVendorModal({
                        ...editVendorModal,
                        packages: editVendorModal.packages.filter((_, i) => i !== pIdx)
                      })}
                      className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400"
                        value={pkg.packageName}
                        onChange={e => {
                          const pkgs = [...editVendorModal.packages];
                          pkgs[pIdx] = { ...pkgs[pIdx], packageName: e.target.value };
                          setEditVendorModal({ ...editVendorModal, packages: pkgs });
                        }}
                        placeholder="Package name"
                      />
                      <input
                        type="number"
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400"
                        value={pkg.totalCost}
                        onChange={e => {
                          const pkgs = [...editVendorModal.packages];
                          pkgs[pIdx] = { ...pkgs[pIdx], totalCost: Number(e.target.value) };
                          setEditVendorModal({ ...editVendorModal, packages: pkgs });
                        }}
                        placeholder="Total cost ₹"
                      />
                    </div>
                    {(pkg.deliverables || []).map((del, dIdx) => (
                      <div key={dIdx} className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                          value={del}
                          onChange={e => {
                            const pkgs = [...editVendorModal.packages];
                            const dels = [...pkgs[pIdx].deliverables];
                            dels[dIdx] = e.target.value;
                            pkgs[pIdx] = { ...pkgs[pIdx], deliverables: dels };
                            setEditVendorModal({ ...editVendorModal, packages: pkgs });
                          }}
                          placeholder="Deliverable item"
                        />
                        <button type="button" onClick={() => {
                          const pkgs = [...editVendorModal.packages];
                          pkgs[pIdx] = { ...pkgs[pIdx], deliverables: pkgs[pIdx].deliverables.filter((_, i) => i !== dIdx) };
                          setEditVendorModal({ ...editVendorModal, packages: pkgs });
                        }} className="text-slate-300 hover:text-rose-500">×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      const pkgs = [...editVendorModal.packages];
                      pkgs[pIdx] = { ...pkgs[pIdx], deliverables: [...(pkgs[pIdx].deliverables || []), ''] };
                      setEditVendorModal({ ...editVendorModal, packages: pkgs });
                    }} className="text-[10px] text-indigo-600 font-semibold hover:underline">+ Add Deliverable</button>
                  </div>
                ))}
              </div>

              {/* Save button */}
              <button
                type="submit"
                disabled={editSaving}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
