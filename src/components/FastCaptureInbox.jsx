import React, { useState } from 'react';
import { Sparkles, Save, FileText, CheckCircle2, ChevronRight, Plus, Trash2 } from 'lucide-react';

export default function FastCaptureInbox({ token, side, onVendorCreated, vendors, onUpdateVendorStatus }) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState('Photography');
  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState('Quoted');
  const [sideVisibility, setSideVisibility] = useState(side === 'Shared' ? 'Shared' : side);
  const [allowCrossView, setAllowCrossView] = useState(false);
  const [message, setMessage] = useState(null);

  const categories = ['Photography', 'Catering', 'Events', 'Makeup', 'Music', 'Venue'];

  // Handle parsing
  const handleParse = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Fallback testing headers
        headers['x-mock-side'] = side;
        headers['x-mock-wedding-id'] = 'mock-wedding-id';
      }

      const res = await fetch('http://localhost:5000/api/vendors/parse-text', {
        method: 'POST',
        headers,
        body: JSON.stringify({ rawText })
      });
      const data = await res.json();
      if (res.ok && data.packages) {
        setPackages(data.packages);
        // Autopopulate vendor name if guessed
        if (rawText.length > 0) {
          const firstLine = rawText.split('\n')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
          setVendorName(firstLine.slice(0, 30) || 'New AI Parsed Vendor');
        }
        setMessage({ type: 'success', text: 'Quote successfully parsed by WedStack AI!' });
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
      } else {
        headers['x-mock-side'] = side;
        headers['x-mock-wedding-id'] = 'mock-wedding-id';
      }

      const res = await fetch('http://localhost:5000/api/vendors', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          vendorName,
          category,
          status,
          sideVisibility,
          allowCrossView,
          packages
        })
      });
      const data = await res.json();
      if (res.ok) {
        onVendorCreated(data);
        // Clear
        setRawText('');
        setVendorName('');
        setPackages([]);
        setMessage({ type: 'success', text: 'Vendor saved and synced successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save vendor' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error connecting to database.' });
    }
  };

  // Group vendors by status for the visual tracking board
  const boardStatuses = ['Discovered', 'Contacted', 'Quoted', 'Shortlisted', 'Booked'];

  return (
    <div className="space-y-8">
      {/* Inbox Split View Panel */}
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
            <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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

              {/* Packages List */}
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

      {/* Visual Status Tracking Board (Kanban) */}
      <div>
        <h3 className="font-bold text-lg text-slate-800 mb-4">Vendor Status Tracking Board</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {boardStatuses.map(statusCol => {
            const filteredVendors = vendors.filter(v => v.status === statusCol);
            return (
              <div key={statusCol} className="bg-slate-100/60 rounded-xl p-4 min-h-[300px] border border-slate-200/50">
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
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer relative group space-y-2"
                    >
                      <div className="font-bold text-slate-800 text-sm truncate">{vendor.vendorName}</div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">{vendor.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          vendor.sideVisibility === 'Bride' ? 'bg-rose-50 text-rose-600' :
                          vendor.sideVisibility === 'Groom' ? 'bg-sky-50 text-sky-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {vendor.sideVisibility}
                        </span>
                      </div>
                      
                      {/* Simple status mover arrows */}
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-slate-400 font-bold">Move:</span>
                        <div className="flex gap-1">
                          {boardStatuses.indexOf(statusCol) > 0 && (
                            <button
                              onClick={() => onUpdateVendorStatus(vendor._id, boardStatuses[boardStatuses.indexOf(statusCol) - 1])}
                              className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-xs text-slate-655 font-bold"
                            >
                              ←
                            </button>
                          )}
                          {boardStatuses.indexOf(statusCol) < boardStatuses.length - 1 && (
                            <button
                              onClick={() => onUpdateVendorStatus(vendor._id, boardStatuses[boardStatuses.indexOf(statusCol) + 1])}
                              className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-xs text-slate-655 font-bold"
                            >
                              →
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
    </div>
  );
}
