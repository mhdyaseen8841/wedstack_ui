import React, { useEffect, useState } from 'react';
import { Phone, Clock, AlertTriangle, Landmark, Calendar, Sparkles, Share2 } from 'lucide-react';

export default function CoordinatorTerminal({ weddingId, isPublicView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const hashToken = weddingId || '';
  const publicLink = `${window.location.origin}/?public=${hashToken}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!weddingId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/wedding/public-portal/${weddingId}`);
        const result = await res.json();
        if (res.ok) {
          setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [weddingId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Retrieving coordinator terminal...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center max-w-sm mx-auto bg-white rounded-3xl border border-slate-100 shadow-md">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
        <h3 className="font-bold text-sm text-slate-800">Connection Error</h3>
        <p className="text-xs text-slate-500 mt-1">Could not retrieve live coordinator terminal data. Please check your connection or invitation link.</p>
      </div>
    );
  }

  const { timeline = [], vendors = [] } = data;

  // Simple helper to parse phone links
  const getPhoneNumber = (text) => {
    const match = text.match(/[\+\d\-]{7,20}/);
    return match ? match[0] : null;
  };

  const renderContent = () => (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Mobile Top Header */}
      <div className="bg-indigo-950 text-white pt-6 pb-4 px-5 text-center shadow-md relative shrink-0">
        <span className="text-[9px] font-extrabold text-indigo-300 uppercase tracking-widest flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-300 animate-pulse" /> WedStack Live Coordinator Terminal
        </span>
        <h2 className="text-base font-black tracking-tight mt-1">Wedding Coordination Hub</h2>
        <div className="flex items-center justify-center gap-1.5 mt-2 bg-indigo-900/50 w-fit mx-auto px-2.5 py-0.5 rounded-full text-[9px] text-indigo-200 border border-indigo-850">
          <Calendar className="w-3.5 h-3.5" />
          <span>Real-time Operational Timeline</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Section: Operational Quick Contacts */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Family Leads</h3>
          <div className="grid grid-cols-1 gap-2">
            {Array.from(new Set(timeline.map(e => e.coordinatorId))).map((coordinator, idx) => {
              const name = coordinator.split('(')[0].trim();
              const phone = getPhoneNumber(coordinator);
              return (
                <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-700">{name}</div>
                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Day-of Lead</div>
                  </div>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="bg-indigo-50 hover:bg-indigo-150 p-2.5 rounded-xl text-indigo-650 transition-colors shadow-xs"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Cash Handover Milestones */}
        <div className="space-y-2">
          <div className="flex justify-between items-center pl-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Handover Cash Milestones</h3>
            <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> Cash Required
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-xs space-y-3">
            {vendors.map((v, i) => {
              const total = v.packages?.[0]?.totalCost || 0;
              return (
                <div key={i} className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div>
                    <div className="font-bold text-slate-800">{v.vendorName}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{v.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-rose-600 font-extrabold flex items-center justify-end gap-0.5">
                      <Landmark className="w-3.5 h-3.5" />
                      ${total.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">On Arrival</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Timeline agenda */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Arrival Agenda</h3>
          <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((ev, i) => (
              <div key={ev._id || i} className="relative pl-7">
                <span className="absolute left-1.5 top-2.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-4 ring-slate-100 bg-indigo-650"></span>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-700 flex items-center gap-0.5 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ev.startTime}
                    </span>
                    <span className="text-slate-400 font-medium">({ev.durationMinutes} mins)</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-850">{ev.activityTitle}</h4>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Contact: {ev.coordinatorId.split('(')[0]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  // If isPublicView (meaning viewed directly via public link URL), render clean responsive full page without device frame
  if (isPublicView) {
    return (
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col justify-between">
        {renderContent()}
      </div>
    );
  }

  // Else, render inside setup simulator panel inside the App dashboard
  return (
    <div className="max-w-md mx-auto space-y-6">
      
      {/* Link Generator Tool */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-extrabold text-sm tracking-wide">Generate Public Access Link</h3>
        </div>
        <p className="text-xs text-indigo-200 leading-relaxed font-medium">
          Share this link with your decorators, catering leads, family drivers, or coordinator teams. They can access the timeline directly on their smartphones without needing accounts.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            className="bg-indigo-900/35 border border-indigo-800 rounded-xl px-3 py-2 text-xs flex-1 text-indigo-100 font-mono truncate outline-none"
            value={publicLink}
          />
          <button
            onClick={copyLink}
            className="bg-white text-slate-950 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Simulator Device Frame */}
      <div className="bg-slate-50 border-8 border-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden aspect-[9/18] flex flex-col relative max-h-[700px] w-full max-w-sm mx-auto">
        {/* Device Notch */}
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center z-20 shrink-0">
          <div className="w-24 h-4 bg-slate-900 rounded-b-xl"></div>
        </div>

        {/* Content View */}
        <div className="flex-1 flex flex-col overflow-hidden pt-6">
          {renderContent()}
        </div>

        {/* Home Indicator */}
        <div className="h-4 bg-slate-900 flex items-center justify-center shrink-0">
          <div className="w-24 h-1 bg-slate-700 rounded-full"></div>
        </div>
      </div>

    </div>
  );
}
