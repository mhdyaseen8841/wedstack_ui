import React, { useState } from 'react';
import { Sliders, Check, Circle, AlertCircle, Sparkles } from 'lucide-react';

export default function VendorMatrix({ vendors }) {
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Variables simulated by the user using interactive sliders
  const [extraHours, setExtraHours] = useState(0);
  const [extraGuests, setExtraGuests] = useState(0);
  const [extraAlbums, setExtraAlbums] = useState(0);

  // Toggle selection
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Get selected vendors
  const comparedVendors = vendors.filter(v => selectedIds.includes(v._id));

  // Recalculate package cost including simulated variables
  const calculateTotal = (vendor, pkg) => {
    let total = pkg.totalCost;
    
    pkg.finePrint.forEach(fine => {
      const itemLower = fine.item.toLowerCase();
      if (itemLower.includes('hour')) {
        total += extraHours * fine.costPerUnit;
      } else if (itemLower.includes('guest') || itemLower.includes('plate') || itemLower.includes('person')) {
        total += extraGuests * fine.costPerUnit;
      } else if (itemLower.includes('album') || itemLower.includes('spread') || itemLower.includes('sheet')) {
        total += extraAlbums * fine.costPerUnit;
      }
    });
    
    return total;
  };

  // Auto-highlight cheapest option
  let cheapestPackage = null;
  if (comparedVendors.length > 0) {
    comparedVendors.forEach(vendor => {
      vendor.packages.forEach(pkg => {
        const total = calculateTotal(vendor, pkg);
        if (!cheapestPackage || total < cheapestPackage.cost) {
          cheapestPackage = {
            vendorName: vendor.vendorName,
            packageName: pkg.packageName,
            cost: total
          };
        }
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Intro and selection header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-lg text-slate-800 mb-2">Vendor "Vs" Comparison Matrix</h3>
        <p className="text-xs text-slate-500 mb-4">
          Select two or more vendors below to overlay their packages, deliverables, and extra fees. Use the calculators to stress-test your budgets with real-time variables.
        </p>
        
        {/* Selection badges */}
        <div className="flex flex-wrap gap-2">
          {vendors.map(v => {
            const isSelected = selectedIds.includes(v._id);
            return (
              <button
                key={v._id}
                onClick={() => toggleSelect(v._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Circle className="w-3.5 h-3.5 text-slate-400" />}
                {v.vendorName} <span className="text-[10px] text-slate-400">({v.category})</span>
              </button>
            );
          })}
        </div>
      </div>

      {comparedVendors.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Recalculation Controls (Sliders) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 lg:col-span-1">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Variable Add-ons</h4>
            </div>

            {/* Slider 1: Extra Hours */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Extra Coverage Hours</span>
                <span className="font-bold text-indigo-600">+{extraHours} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={extraHours}
                onChange={(e) => setExtraHours(parseInt(e.target.value))}
              />
              <span className="text-[10px] text-slate-400">Calculates added hourly fees</span>
            </div>

            {/* Slider 2: Extra Guests */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Simulated Guests</span>
                <span className="font-bold text-indigo-600">+{extraGuests} guests</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={extraGuests}
                onChange={(e) => setExtraGuests(parseInt(e.target.value))}
              />
              <span className="text-[10px] text-slate-400">Calculates cost-per-plate extras</span>
            </div>

            {/* Slider 3: Extra Album Spreads */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Extra Album Sheets</span>
                <span className="font-bold text-indigo-600">+{extraAlbums} sheets</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={extraAlbums}
                onChange={(e) => setExtraAlbums(parseInt(e.target.value))}
              />
              <span className="text-[10px] text-slate-400">Calculates print add-ons</span>
            </div>

            {/* Best Value Highlight Badge */}
            {cheapestPackage && (
              <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Optimal Budget Choice
                </div>
                <p className="text-[11px] text-slate-600">
                  <strong className="text-emerald-700 font-semibold">{cheapestPackage.vendorName}</strong> - {cheapestPackage.packageName} stands out at <strong className="text-slate-800 font-bold">${cheapestPackage.cost}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Evaluation Matrix Table */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Feature / Attribute</th>
                    {comparedVendors.map(vendor => (
                      <th key={vendor._id} className="p-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-l border-slate-100 text-center">
                        <div>{vendor.vendorName}</div>
                        <span className="text-[9px] font-normal text-slate-400 capitalize bg-slate-150/50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {vendor.category}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  
                  {/* Row: Packages Compare */}
                  <tr className="border-b border-slate-150/60 align-top">
                    <td className="p-4 text-xs font-bold text-slate-600 bg-slate-50/20">Packages Offered</td>
                    {comparedVendors.map(vendor => (
                      <td key={vendor._id} className="p-4 text-xs text-slate-600 border-l border-slate-100">
                        {vendor.packages.map((pkg, idx) => {
                          const computedTotal = calculateTotal(vendor, pkg);
                          return (
                            <div key={idx} className="mb-3 p-2 bg-slate-50/80 rounded border border-slate-200/50">
                              <div className="font-semibold text-slate-800 flex justify-between">
                                <span>{pkg.packageName}</span>
                                <span className="text-indigo-600 font-bold">${computedTotal}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">Base: ${pkg.totalCost}</div>
                              
                              {/* Deliverables checklist */}
                              <div className="mt-2 space-y-1 pl-1 border-l-2 border-slate-200">
                                {pkg.deliverables.map((del, dIdx) => (
                                  <div key={dIdx} className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <span className="text-emerald-500 font-bold">✓</span> {del}
                                  </div>
                                ))}
                              </div>

                              {/* Fine Print rates */}
                              {pkg.finePrint.length > 0 && (
                                <div className="mt-2 text-[9px] text-slate-400 bg-white p-1 rounded border border-slate-100">
                                  <div className="font-bold text-[8px] uppercase tracking-wider text-slate-500 mb-0.5">Extra charges info</div>
                                  {pkg.finePrint.map((fine, fIdx) => (
                                    <div key={fIdx}>
                                      • {fine.item}: ${fine.costPerUnit} / {fine.unit}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Cross View Settings */}
                  <tr className="border-b border-slate-150/60">
                    <td className="p-4 text-xs font-bold text-slate-600 bg-slate-50/20">Access Permissions</td>
                    {comparedVendors.map(vendor => (
                      <td key={vendor._id} className="p-4 text-xs text-slate-600 border-l border-slate-100 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          vendor.sideVisibility === 'Bride' ? 'bg-rose-50 text-rose-600' :
                          vendor.sideVisibility === 'Groom' ? 'bg-sky-50 text-sky-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {vendor.sideVisibility} View
                        </span>
                        <div className="text-[9px] text-slate-400 mt-1.5">
                          {vendor.allowCrossView ? 'Visible to both teams' : 'Private to aligned side'}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Status */}
                  <tr className="border-b border-slate-150/60">
                    <td className="p-4 text-xs font-bold text-slate-600 bg-slate-50/20">Status</td>
                    {comparedVendors.map(vendor => (
                      <td key={vendor._id} className="p-4 text-xs text-slate-600 border-l border-slate-100 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px]">
                          {vendor.status}
                        </span>
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-300 py-16 rounded-2xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-slate-600 font-medium text-sm">No vendors selected for matrix evaluation.</p>
          <p className="text-slate-400 text-xs mt-1">Check at least two vendors in the menu above to compare pricing variables.</p>
        </div>
      )}
    </div>
  );
}
