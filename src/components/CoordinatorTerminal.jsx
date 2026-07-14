import React, { useEffect, useState } from 'react';
import { Phone, CheckCircle, Clock, AlertTriangle, Landmark, Calendar, Sparkles, MapPin, Share2 } from 'lucide-react';

export default function CoordinatorTerminal({ weddingId, mockMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const hashToken = weddingId || 'mock-wedding-id';
  const publicLink = `${window.location.origin}/?public=${hashToken}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const targetId = weddingId || 'mock-wedding-id';
        const res = await fetch(`http://localhost:5000/api/wedding/public-portal/${targetId}`);
        const result = await res.json();
        if (res.ok) {
          setData(result);
        } else {
          // If fallback seeding or error, construct full interactive dummy data
          setMockFallback();
        }
      } catch (err) {
        setMockFallback();
      } finally {
        setLoading(false);
      }
    };

    const setMockFallback = () => {
      setData({
        wedding: { totalBudget: 45000, budgetSplitRatio: 50 },
        timeline: [
          { _id: '1', startTime: '08:00 AM', durationMinutes: 120, activityTitle: 'Bridal Makeup Session', assignedSide: 'Bride', coordinatorId: 'Aunt Lily (+1-555-9011)' },
          { _id: '2', startTime: '10:00 AM', durationMinutes: 60, activityTitle: 'Groom Prep & Suit Fitting', assignedSide: 'Groom', coordinatorId: 'Best Man Mark (+1-555-2244)' },
          { _id: '3', startTime: '11:30 AM', durationMinutes: 90, activityTitle: 'First Look Photoshoot', assignedSide: 'Shared', coordinatorId: 'Sarah Coordinator (+1-555-4499)' },
          { _id: '4', startTime: '01:30 PM', durationMinutes: 60, activityTitle: 'Ceremony Exchange', assignedSide: 'Shared', coordinatorId: 'Sarah Coordinator (+1-555-4499)' },
          { _id: '5', startTime: '03:00 PM', durationMinutes: 120, activityTitle: 'Grand Banquet Setup', assignedSide: 'Shared', coordinatorId: 'Dave Venue Manager (+1-555-8833)' }
        ],
        vendors: [
          { vendorName: 'Elegance Photography', category: 'Photography', status: 'Booked', packages: [{ packageName: 'Classic Collection', totalCost: 3500 }] },
          { vendorName: 'Blossom Makeup Artistry', category: 'Makeup', status: 'Booked', packages: [{ packageName: 'Bridal Glow Pack', totalCost: 1200 }] },
          { vendorName: 'Feast & Flavour Catering', category: 'Catering', status: 'Shortlisted', packages: [{ packageName: 'Deluxe Buffet', totalCost: 7500 }] }
        ]
      });
    };

    fetchPublicData();
  }, [weddingId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Retrieving coordinator terminal...</span>
      </div>
    );
  }

  const { timeline, vendors } = data || {};

  return (
    <div className="max-w-md mx-auto space-y-6">
      
      {/* Link Generator Tool (Only shown inside App context, not inside public read-only view) */}
      {!mockMode && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-base">Generate Public Access Link</h3>
          </div>
          <p className="text-xs text-indigo-200">
            Share this lightweight, mobile-friendly terminal with external vendors, family drivers, or venue staff. They don't need a login credentials to access the timeline.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              className="bg-indigo-900/35 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs flex-1 text-indigo-100 font-mono truncate outline-none"
              value={publicLink}
            />
            <button
              onClick={copyLink}
              className="bg-white text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}

      {/* Public Terminal Mobile View Simulator */}
      <div className="bg-slate-50 border-8 border-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden aspect-[9/19] flex flex-col relative max-h-[800px]">
        {/* Mobile Camera notch */}
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center z-20">
          <div className="w-24 h-4 bg-slate-900 rounded-b-xl"></div>
        </div>

        {/* Mobile Status Header */}
        <div className="bg-indigo-950 text-white pt-8 pb-4 px-5 text-center shadow-lg relative shrink-0">
          <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 animate-spin" /> WedStack Operations Terminal
          </span>
          <h2 className="text-lg font-black tracking-tight mt-1">Wedding Coordination Hub</h2>
          <div className="flex items-center justify-center gap-1.5 mt-2 bg-indigo-900/50 w-fit mx-auto px-2 py-0.5 rounded-full text-[10px] text-indigo-200 border border-indigo-800">
            <Calendar className="w-3 h-3" />
            Live Schedule Update
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Section: Operational Quick Contacts */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Family Leads</h3>
            <div className="grid grid-cols-1 gap-2">
              {Array.from(new Set(timeline.map(e => e.coordinatorId))).map((coordinator, idx) => {
                // Parse number if exists
                const name = coordinator.split('(')[0].trim();
                const phone = coordinator.match(/\+?\d[\d-]{7,15}/)?.[0] || '';
                return (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-700">{name}</div>
                      <div className="text-[10px] text-slate-400">Day-of Coordinator</div>
                    </div>
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="bg-indigo-50 hover:bg-indigo-100 p-2 rounded-full text-indigo-600 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Cash Collection Milestones */}
          <div className="space-y-2">
            <div className="flex justify-between items-center pl-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cash Milestones</h3>
              <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> Handover required
              </span>
            </div>
            <div className="bg-white rounded-xl border border-slate-250 p-4 shadow-sm space-y-3">
              {vendors.map((v, i) => {
                const total = v.packages?.[0]?.totalCost || 0;
                return (
                  <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                    <div>
                      <div className="font-bold text-slate-800">{v.vendorName}</div>
                      <div className="text-[10px] text-slate-400">Category: {v.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-rose-600 font-extrabold flex items-center justify-end gap-0.5">
                        <Landmark className="w-3.5 h-3.5" />
                        ${total.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">On Arrival</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Day-Of Timeline */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Arrival Agenda</h3>
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((ev, i) => (
                <div key={ev._id || i} className="relative pl-7">
                  <span className="absolute left-1.5 top-2.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-4 ring-slate-100 bg-indigo-600"></span>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-700 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {ev.startTime}
                      </span>
                      <span className="text-slate-400 font-semibold">{ev.durationMinutes}m</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-800">{ev.activityTitle}</h4>
                    <div className="text-[10px] text-slate-500">
                      Contact: {ev.coordinatorId.split('(')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Mobile footer home indicator */}
        <div className="h-6 bg-slate-900 flex items-center justify-center shrink-0">
          <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
        </div>
      </div>

    </div>
  );
}
