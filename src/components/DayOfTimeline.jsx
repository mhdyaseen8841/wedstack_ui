import React, { useState } from 'react';
import { Clock, Phone, User, Calendar, Plus, ChevronRight, AlertCircle, ArrowRight, Trash2 } from 'lucide-react';

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

  // Dynamic Shift Handler
  const handleShiftTime = async (eventId, shiftMinutes) => {
    setLoadingId(eventId);
    setMessage(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['x-mock-side'] = 'Shared';
        headers['x-mock-wedding-id'] = 'mock-wedding-id';
      }

      const res = await fetch('http://localhost:5000/api/timeline/shift-time', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ eventId, shiftMinutes })
      });
      const data = await res.json();
      if (res.ok) {
        onTimelineUpdated(); // Trigger refresh in parent
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

  // Add event handler
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
      } else {
        headers['x-mock-side'] = 'Shared';
        headers['x-mock-wedding-id'] = 'mock-wedding-id';
      }

      const res = await fetch('http://localhost:5000/api/timeline', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          activityTitle,
          startTime,
          durationMinutes,
          assignedSide,
          coordinatorId,
          linkedVendorId: linkedVendorId || undefined,
          eventDay: new Date() // Same day
        })
      });
      if (res.ok) {
        onTimelineUpdated();
        // Clear
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

  // Delete event
  const handleDeleteEvent = async (id) => {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['x-mock-side'] = 'Shared';
        headers['x-mock-wedding-id'] = 'mock-wedding-id';
      }

      const res = await fetch(`http://localhost:5000/api/timeline/${id}`, {
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

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-rose-50 text-rose-700 border border-rose-150'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="font-semibold text-base text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Live Day-of Execution Schedule
          </h3>
          <p className="text-xs text-slate-400">Chronological list of all wedding events. Shifts cascade automatically to all future events.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Add event form */}
      {showAddForm && (
        <form onSubmit={handleAddEvent} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Activity Title</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="e.g. Photo Team Arrival / Baraat Assembly"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="e.g. 06:00 AM"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (Mins)</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Side</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              value={assignedSide}
              onChange={(e) => setAssignedSide(e.target.value)}
            >
              <option value="Shared">Shared / Mutual</option>
              <option value="Bride">Bride Team</option>
              <option value="Groom">Groom Team</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coordinator (Name & Phone)</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="e.g. Uncle Steve (555-0199)"
              value={coordinatorId}
              onChange={(e) => setCoordinatorId(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Linked Vendor (Optional)</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
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
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
            >
              Save Event
            </button>
          </div>
        </form>
      )}

      {/* Timeline flow */}
      <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((ev, index) => {
          const isGroom = ev.assignedSide === 'Groom';
          const isBride = ev.assignedSide === 'Bride';
          const sideColorClass = isBride 
            ? 'border-l-4 border-l-rose-500 bg-rose-50/20' 
            : isGroom 
            ? 'border-l-4 border-l-sky-500 bg-sky-50/20' 
            : 'border-l-4 border-l-indigo-500 bg-indigo-50/20';

          return (
            <div key={ev._id} className="relative pl-10 group">
              {/* Timeline marker */}
              <span className={`absolute left-2.5 top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-4 ring-slate-100 ${
                isBride ? 'bg-rose-500' : isGroom ? 'bg-sky-500' : 'bg-indigo-600'
              }`}></span>

              {/* Event card */}
              <div className={`bg-white p-5 rounded-2xl border border-slate-150/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md ${sideColorClass}`}>
                
                {/* Information */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-700 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {ev.startTime}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">({ev.durationMinutes} Mins duration)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                      isBride ? 'bg-rose-100 text-rose-700' : isGroom ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {ev.assignedSide} Assignment
                    </span>
                  </div>
                  
                  <h4 className="font-extrabold text-slate-800 text-sm md:text-base">{ev.activityTitle}</h4>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Coordinator: <strong className="text-slate-700">{ev.coordinatorId}</strong>
                    </span>
                    {ev.linkedVendorId && (
                      <span className="bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-[10px] text-indigo-600 font-bold">
                        Linked Vendor Event
                      </span>
                    )}
                  </div>
                </div>

                {/* Operations & Shifts */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mr-1">Shift Block</div>
                  
                  <button
                    onClick={() => handleShiftTime(ev._id, -15)}
                    disabled={loadingId === ev._id}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    -15m
                  </button>
                  <button
                    onClick={() => handleShiftTime(ev._id, 15)}
                    disabled={loadingId === ev._id}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    +15m
                  </button>
                  <button
                    onClick={() => handleShiftTime(ev._id, 30)}
                    disabled={loadingId === ev._id}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    +30m delay
                  </button>
                  
                  <button
                    onClick={() => handleDeleteEvent(ev._id)}
                    className="text-slate-400 hover:text-rose-600 p-1 ml-2 transition-colors"
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
          <div className="bg-slate-50 border border-dashed border-slate-350 p-12 rounded-xl text-center text-slate-500 text-xs italic">
            No events scheduled for the day of execution. Add an event above to construct your timeline!
          </div>
        )}
      </div>

    </div>
  );
}
