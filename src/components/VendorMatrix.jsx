import React, { useState } from 'react';
import { Sliders, Check, Circle, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

export default function VendorMatrix({ vendors }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSelectionPanel, setShowSelectionPanel] = useState(true);
  
  // Simulated sliders state
  const [extraHours, setExtraHours] = useState(0);
  const [extraGuests, setExtraGuests] = useState(0);
  const [extraAlbums, setExtraAlbums] = useState(0);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const comparedVendors = vendors.filter(v => selectedIds.includes(v._id));

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
    <div className="space-y-6 text-slate-800">
      
      {/* Intro Header */}
      {/* Collapsible Selection Accordion Header */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSelectionPanel(!showSelectionPanel)}
          className="w-full p-6 flex justify-between items-center text-left hover:bg-slate-50/50 transition-colors focus:outline-none"
        >
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">Vendor "Vs" Comparison Grid</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Select two or more vendors to overlay packages side-by-side. Stress-test your budgets in real-time with variable option sliders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              {showSelectionPanel ? 'Click to hide selection' : 'Click to expand selection'}
            </span>
            <span className={`text-slate-400 transition-transform duration-300 font-black text-sm ${showSelectionPanel ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </div>
        </button>

        {showSelectionPanel && (
          <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50/5">
            {/* Selection badges grouped by category */}
            <div className="space-y-4 pt-4">
              {Object.entries(
                vendors.reduce((groups, v) => {
                  if (!groups[v.category]) groups[v.category] = [];
                  groups[v.category].push(v);
                  return groups;
                }, {})
              ).map(([categoryName, categoryVendors]) => (
                <div key={categoryName} className="space-y-2">
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">{categoryName}</span>
                  <div className="flex flex-wrap gap-2">
                    {categoryVendors.map(v => {
                      const isSelected = selectedIds.includes(v._id);
                      return (
                        <button
                          key={v._id}
                          onClick={() => toggleSelect(v._id)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                          <span>{v.vendorName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {comparedVendors.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Recalculation Controls (Sliders) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 lg:col-span-1">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4.5 h-4.5 text-indigo-600" />
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-widest">Simulation Variables</h4>
            </div>

            {/* Slider 1: Extra Hours */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Extra Coverage Hours</span>
                <span className="text-indigo-600 font-extrabold">+{extraHours} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={extraHours}
                onChange={(e) => setExtraHours(parseInt(e.target.value))}
              />
              <span className="text-[10px] text-slate-400 block font-medium">Applies to hourly overtime items</span>
            </div>

            {/* Slider 2: Extra Guests */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Simulated Guests</span>
                <span className="text-indigo-600 font-extrabold">+{extraGuests} guests</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={extraGuests}
                onChange={(e) => setExtraGuests(parseInt(e.target.value))}
              />
              <span className="text-[10px] text-slate-400 block font-medium">Calculates food/beverage plates</span>
            </div>

            {/* Slider 3: Extra Album Spreads */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Extra Album Sheets</span>
                <span className="text-indigo-600 font-extrabold">+{extraAlbums} sheets</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={extraAlbums}
                onChange={(e) => setExtraAlbums(parseInt(e.target.value))}
              />
              <span className="text-[10px] text-slate-400 block font-medium">Calculates album/print extras</span>
            </div>

            {/* Optimal choice recommendation */}
            {cheapestPackage && (
              <div className="bg-emerald-50/50 border border-emerald-100 p-4.5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Optimal Budget Choice
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  <span className="text-emerald-700 font-extrabold">{cheapestPackage.vendorName}</span>'s {cheapestPackage.packageName} package stands out at <span className="text-slate-900 font-bold">₹{cheapestPackage.cost}</span>.
                </p>
              </div>
            )}
          </div>

          {/* Matrix side-by-side column grid */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparedVendors.map(vendor => (
              <div 
                key={vendor._id} 
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 hover:shadow-md transition-shadow relative"
              >
                {/* Header */}
                <div className="pb-4 border-b border-slate-100 flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {vendor.category}
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 mt-2">{vendor.vendorName}</h4>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="px-2.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                      {vendor.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                      vendor.sideVisibility === 'Bride' ? 'bg-rose-50 text-rose-600' :
                      vendor.sideVisibility === 'Groom' ? 'bg-sky-50 text-sky-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {vendor.sideVisibility} View
                    </span>
                  </div>
                </div>

                {/* Packages list */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Packages Offered</span>
                  {vendor.packages.map((pkg, idx) => {
                    const computedTotal = calculateTotal(vendor, pkg);
                    return (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{pkg.packageName}</div>
                            <div className="text-[10px] text-slate-400">Base: ₹{pkg.totalCost}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-indigo-600">₹{computedTotal}</div>
                            <div className="text-[9px] text-slate-400">with simulation</div>
                          </div>
                        </div>

                        {/* Deliverables */}
                        <div className="space-y-1.5 pt-2.5 border-t border-slate-200/50">
                          {pkg.deliverables.map((del, dIdx) => (
                            <div key={dIdx} className="text-[11px] text-slate-600 flex items-center gap-2 font-medium">
                              <span className="text-emerald-500 font-extrabold">✓</span>
                              <span>{del}</span>
                            </div>
                          ))}
                        </div>

                        {/* Fine print */}
                        {pkg.finePrint.length > 0 && (
                          <div className="mt-2.5 text-[10px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                            <span className="font-bold text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5">Variable rates info</span>
                            {pkg.finePrint.map((fine, fIdx) => (
                              <div key={fIdx} className="flex justify-between">
                                <span className="font-medium">• {fine.item}</span>
                                <span className="font-bold text-slate-700">₹{fine.costPerUnit} / {fine.unit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Cross view visibility */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Joint View Access:</span>
                  <span className="font-bold text-slate-600">
                    {vendor.allowCrossView ? 'Both Sides (Shared)' : 'Aligned Workspace Only'}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 py-16 rounded-3xl flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="w-10 h-10 text-slate-405 text-slate-400 mb-2" />
          <p className="text-slate-700 font-bold text-sm">No vendors selected for matrix evaluation.</p>
          <p className="text-slate-400 text-xs mt-1 max-w-sm">
            Check one or more vendors at the top of this tab to overlay package options side-by-side.
          </p>
        </div>
      )}
    </div>
  );
}
