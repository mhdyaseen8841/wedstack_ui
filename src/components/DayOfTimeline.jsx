import React, { useState } from 'react';
import { Clock, Phone, User, Calendar, Plus, ChevronRight, AlertCircle, ArrowRight, Trash2, ArrowUpDown } from 'lucide-react';
import { API_URL } from '../config';

export default function DayOfTimeline({ events, token, onTimelineUpdated, vendors }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [assignedSide, setAssignedSide] = useState('Shared');
  const [coordinatorId, setCoordinatorId] = useState('');
  const [linkedVendorId, setLinkedVendorId] = useState('');
  const [message, setMessage] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const handleShiftTime = async (eventId, shiftMinutes) => {
    setLoadingId(eventId);
    setMessage(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/timeline/shift-time`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ eventId, shiftMinutes })
      });
      const data = await res.json();
      if (res.ok) {
        onTimelineUpdated();
        setMessage({ type: 'success', text: `Cascaded shift of ${shiftMinutes} mins applied successfully!` });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to apply shift.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server connection error.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!activityTitle.trim() || !coordinatorId.trim()) {
      setMessage({ type: 'error', text: 'Activity Title and Coordinator contact details are required.' });
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/timeline`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          activityTitle,
          startTime,
          durationMinutes,
          assignedSide,
          coordinatorId,
          linkedVendorId: linkedVendorId || undefined,
          eventDay: new Date()
        })
      });
      if (res.ok) {
        onTimelineUpdated();
        setActivityTitle('');
        setCoordinatorId('');
        setLinkedVendorId('');
        setShowAddForm(false);
        setMessage({ type: 'success', text: 'New agenda event created successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to create event.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Database sync error.' });
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/timeline/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        onTimelineUpdated();
        setMessage({ type: 'success', text: 'Event removed from schedule.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to extract phone number for calling
  const getPhoneNumber = (text) => {
    const match = text.match(/[\+\d\-]{7,20}/);
    return match ? match[0] : null;
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-650" />
            Day-of Execution Schedule
          </h3>
          <p className="text-xs text-slate-400 font-medium">Chronological order list. Adjustments cascade automatically to subsequent agenda items.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Add Event Form */}
      {showAddForm && (
        <form onSubmit={handleAddEvent} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Activity Title</label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
              placeholder="e.g. Photo Team Arrival / Ceremony Start"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Time</label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-semibold text-slate-700"
              placeholder="e.g. 08:30 AM"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
            <input
              type="number"
              required
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Side</label>
            <select
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-white font-semibold text-slate-700"
              value={assignedSide}
              onChange={(e) => setAssignedSide(e.target.value)}
            >
              <option value="Shared">Shared / Mutual</option>
              <option value="Bride">Bride Team</option>
              <option value="Groom">Groom Team</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Coordinator Contact (Name & Phone)</label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
              placeholder="e.g. Sarah Coordinator (+1-555-4499)"
              value={coordinatorId}
              onChange={(e) => setCoordinatorId(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Linked Vendor (Optional)</label>
            <select
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-white font-semibold text-slate-700"
              value={linkedVendorId}
              onChange={(e) => setLinkedVendorId(e.target.value)}
            >
              <option value="">None</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>{v.vendorName} ({v.category})</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-650 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Save Event
            </button>
          </div>
        </form>
      )}

      {/* Premium Vertical Step-Tracker */}
      <div className="relative pl-6 sm:pl-16 space-y-6 before:absolute before:left-2 sm:before:left-12 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((ev, index) => {
          const isGroom = ev.assignedSide === 'Groom';
          const isBride = ev.assignedSide === 'Bride';
          const phoneNum = getPhoneNumber(ev.coordinatorId);
          
          let markerColor = 'bg-indigo-600 ring-indigo-100';
          let sideBorder = 'border-l-indigo-600';
          if (isBride) {
            markerColor = 'bg-rose-500 ring-rose-100';
            sideBorder = 'border-l-rose-500';
          } else if (isGroom) {
            markerColor = 'bg-sky-500 ring-sky-100';
            sideBorder = 'border-l-sky-500';
          }

          return (
            <div key={ev._id} className="relative group">
              {/* Chronological Label Node */}
              <div className="absolute -left-8 sm:-left-24 top-2 flex flex-col items-center">
                <span className="text-xs font-extrabold text-slate-800 bg-white border border-slate-100 shadow-xs px-2 py-1 rounded-lg font-mono">
                  {ev.startTime}
                </span>
                <span className="text-[9px] text-slate-400 font-bold mt-1">
                  {ev.durationMinutes}m
                </span>
              </div>

              {/* Node Dot */}
              <span className={`absolute -left-5 sm:-left-5 top-4.5 w-3 h-3 rounded-full border-2 border-white ring-4 ${markerColor} z-10`}></span>

              {/* Event Container Card */}
              <div className={`bg-white p-5 rounded-2xl border border-slate-100 border-l-4 ${sideBorder} shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
                
                {/* Text attributes */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      isBride ? 'bg-rose-50 text-rose-600' : isGroom ? 'bg-sky-50 text-sky-655' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {ev.assignedSide} Assignment
                    </span>
                    {ev.linkedVendorId && (
                      <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-[9px] text-slate-500 font-bold uppercase">
                        Vendor Event
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{ev.activityTitle}</h4>

                  {/* Click-to-call mobile coordinator layout */}
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-450" />
                      <span>{ev.coordinatorId}</span>
                    </div>

                    {phoneNum && (
                      <a 
                        href={`tel:${phoneNum}`}
                        className="flex items-center gap-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-indigo-600 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors shadow-xs"
                      >
                        <Phone className="w-3 h-3" /> Call Coordinator
                      </a>
                    )}
                  </div>
                </div>

                {/* Operations & Shift delay triggers */}
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/50 justify-between sm:justify-start">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1 mr-1 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" /> Shift
                  </span>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleShiftTime(ev._id, -15)}
                      disabled={loadingId === ev._id}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      -15m
                    </button>
                    <button
                      onClick={() => handleShiftTime(ev._id, 15)}
                      disabled={loadingId === ev._id}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      +15m
                    </button>
                    <button
                      onClick={() => handleShiftTime(ev._id, 30)}
                      disabled={loadingId === ev._id}
                      className="px-2.5 py-1 bg-indigo-650 bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      +30m
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(ev._id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors ml-1"
                    title="Remove event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="bg-slate-50 border border-dashed border-slate-200 p-12 rounded-3xl text-center text-slate-400 text-xs italic">
            Timeline schedule is currently empty. Add your first wedding event above!
          </div>
        )}
      </div>

    </div>
  );
}
