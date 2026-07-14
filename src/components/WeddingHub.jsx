import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Heart, Plus, Trash2, Shield, Star, Award, Sparkles, Check, ChevronRight } from 'lucide-react';

export default function WeddingHub({ wedding, vendors, token, side, user, timelineEvents, onUpdateWedding, onUpdateTimeline }) {
  const isPlanner = user?.role === 'Planner';
  const isBride = user?.role === 'Bride';
  const isGroom = user?.role === 'Groom';

  // Real-time countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Event program form states
  const [eventDate, setEventDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [isMainDay, setIsMainDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [duration, setDuration] = useState('120');
  const [coordinator, setCoordinator] = useState('');
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [assignedSide, setAssignedSide] = useState(side === 'Shared' ? 'Shared' : side);
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setAssignedSide(side === 'Shared' ? 'Shared' : side);
  }, [side]);

  // Live countdown ticker
  useEffect(() => {
    if (!wedding?.weddingDate) return;
    
    const calculateTime = () => {
      const target = new Date(wedding.weddingDate);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [wedding?.weddingDate]);

  // Group timelineEvents by date to show multiple programs per day
  const groupEventsByDate = () => {
    const groups = {};
    timelineEvents.forEach(evt => {
      if (!evt.eventDay) return;
      
      // Filter personal roadmap events based on active side workspace
      if (side !== 'Shared' && !isPlanner) {
        if (side === 'Groom' && evt.assignedSide === 'Bride') return;
        if (side === 'Bride' && evt.assignedSide === 'Groom') return;
      }

      const dateStr = new Date(evt.eventDay).toISOString().split('T')[0];
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          programs: []
        };
      }
      groups[dateStr].programs.push(evt);
    });

    // Sort programs in each day chronologically (roughly by startTime)
    Object.values(groups).forEach(group => {
      group.programs.sort((a, b) => {
        // Simple comparison of AM/PM strings
        const timeA = convertTo24Hour(a.startTime);
        const timeB = convertTo24Hour(b.startTime);
        return timeA.localeCompare(timeB);
      });
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  };

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "00:00";
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!eventDate || !eventName) {
      setMessage({ type: 'error', text: 'Date and Event Name are required.' });
      return;
    }
    
    setSubmitting(true);
    setMessage(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Create sub-program as a timeline event
      const res = await fetch('http://localhost:5000/api/timeline', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventDay: eventDate,
          startTime,
          durationMinutes: Number(duration),
          activityTitle: eventName,
          assignedSide,
          coordinatorId: coordinator || 'Coordinators',
          locationName,
          coordinates
        })
      });

      if (res.ok) {
        // 2. If marked as Main Day, update the main weddingDate
        if (isMainDay) {
          const wedRes = await fetch('http://localhost:5000/api/wedding', {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ weddingDate: eventDate })
          });
          if (wedRes.ok) {
            const updatedWed = await wedRes.json();
            onUpdateWedding(updatedWed);
          }
        }
        
        onUpdateTimeline(); // Reload timeline lists
        setEventName('');
        setCoordinator('');
        setLocationName('');
        setCoordinates('');
        setIsMainDay(false);
        setMessage({ type: 'success', text: 'Program event added successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to add event.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed. Local simulation updated.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (id) => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:5000/api/timeline/${id}`, {
        method: 'DELETE',
        headers
      });
      onUpdateTimeline();
    } catch (err) {}
  };

  const isMainWeddingDay = (dateStr) => {
    if (!wedding?.weddingDate) return false;
    const mainStr = new Date(wedding.weddingDate).toISOString().split('T')[0];
    return mainStr === dateStr;
  };

  const groupedDays = groupEventsByDate();

  return (
    <div className="space-y-8 text-slate-800 antialiased">
      
      {/* 1. WOW FACTOR COUNTDOWN WIDGET (COMPACT & SPARKLING) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 p-5 text-white shadow-2xl shadow-indigo-950/40 border border-white/10 shrink-0">
        
        {/* Shifting Glow Circles Decoration (Animated Halo) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-indigo-500/10 rounded-full blur-3xl animate-pulse duration-[6000ms]"></div>
        <div className="absolute top-0 right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl animate-pulse duration-[3000ms]"></div>

        {/* Floating Heart & Sparkles Backdrop Mix */}
        <div className="absolute top-3 left-4 text-rose-500/20 animate-pulse duration-1000">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute bottom-4 right-6 text-rose-400/15 animate-bounce duration-[3500ms]">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div className="absolute top-4 right-1/4 text-amber-300/20 animate-pulse duration-[2000ms]">
          <Sparkles className="w-4 h-4 animate-spin duration-[8000ms]" />
        </div>
        <div className="absolute bottom-3 left-10 text-indigo-300/15 animate-pulse duration-[4000ms]">
          <Sparkles className="w-5 h-5 animate-spin duration-[12000ms]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border border-white/20 text-rose-250">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400 animate-pulse" />
            <Sparkles className="w-3 h-3 text-amber-300 animate-spin duration-3000" />
            <span>Grand Countdown</span>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-rose-100">
              The Grand Union
            </h2>
            <p className="text-slate-350 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none">
              {wedding?.weddingDate 
                ? `Main Ceremony Day: ${new Date(wedding.weddingDate).toLocaleDateString(undefined, { dateStyle: 'long' })}`
                : 'Add a date below and select "Main Wedding Ceremony"!'
              }
            </p>
          </div>

          {/* Countdown ticking blocks */}
          {wedding?.weddingDate ? (
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-sm w-full pt-1">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds }
              ].map(block => (
                <div key={block.label} className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-1.5 backdrop-blur-md shadow-lg flex flex-col justify-center items-center hover:border-white/20 transition-colors">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">{String(block.value).padStart(2, '0')}</span>
                  <span className="text-[8px] uppercase tracking-widest font-bold text-indigo-250 mt-1">{block.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 text-slate-300 italic text-xs">
              No main wedding date configured. Use the form below to configure.
            </div>
          )}
        </div>
      </div>

      {/* 2. Page Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: Add multi-date program form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
          <div>
            <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-widest pb-3 border-b border-slate-100">Add Day Program</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Add sub-events or programs to specific dates. E.g., morning puja, evening reception.</p>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-bold ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAddProgram} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Event Date</label>
              <input
                type="date"
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Program / Event Name</label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="e.g. Sangeet / Morning Ceremony / Evening Reception"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-semibold"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  <option value="07:00 AM">07:00 AM</option>
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                  <option value="07:00 PM">07:00 PM</option>
                  <option value="08:00 PM">08:00 PM</option>
                  <option value="09:00 PM">09:00 PM</option>
                  <option value="10:00 PM">10:00 PM</option>
                  <option value="11:00 PM">11:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (Min)</label>
                <input
                  type="number"
                  className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lead Coordinator</label>
              <input
                type="text"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="Uncle Mark (+1-555-0104)"
                value={coordinator}
                onChange={(e) => setCoordinator(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location Name</label>
              <input
                type="text"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="e.g. Grand Ballroom Plaza"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Coordinates (Optional - For Map Embed)</label>
              <input
                type="text"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="e.g. 40.7128,-74.0060"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Event Scope</label>
              <select
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700 focus:outline-none"
                value={assignedSide}
                onChange={(e) => setAssignedSide(e.target.value)}
              >
                <option value="Shared">Shared / Both Sides</option>
                <option value="Bride">Bride Side Only</option>
                <option value="Groom">Groom Side Only</option>
              </select>
            </div>

            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                id="isMainDayCheckbox"
                className="rounded text-indigo-650 mr-2 focus:ring-0"
                checked={isMainDay}
                onChange={(e) => setIsMainDay(e.target.checked)}
              />
              <label htmlFor="isMainDayCheckbox" className="text-xs text-slate-650 font-bold select-none cursor-pointer flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-300" />
                Set as Main Wedding Ceremony Day
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> {submitting ? 'Adding...' : 'Save Program Day'}
            </button>
          </form>
        </div>

        {/* Access Permissions Card (Tied to Mongoose DB) */}
        {!isPlanner && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div>
              <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-widest pb-3 border-b border-slate-100">Mutual View Sharing</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Control if your partner is allowed to collaborate with you on the Mutual View page.</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl hover:bg-slate-100/50 transition-colors text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                className="rounded text-indigo-650 focus:ring-0 mr-1"
                checked={isBride ? (wedding.brideAllowsMutual !== false) : (wedding.groomAllowsMutual !== false)}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  const payload = isBride 
                    ? { brideAllowsMutual: checked }
                    : { groomAllowsMutual: checked };

                  try {
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const res = await fetch('http://localhost:5000/api/wedding', {
                      method: 'PATCH',
                      headers,
                      body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                      const updated = await res.json();
                      onUpdateWedding(updated);
                    }
                  } catch (err) {}
                }}
              />
              <span>Allow Partner to access Mutual View</span>
            </label>
          </div>
        )}

        {/* Right column: Multi-Date Events RoadMap timeline list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-850 uppercase tracking-widest">Multi-Day Wedding Roadmap</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Chronological Roadmap</span>
            </div>

            <div className="space-y-4 relative pl-4 border-l border-slate-200">
              {groupedDays.map((day, idx) => {
                const dateObj = new Date(day.date + 'T00:00:00');
                const isMain = isMainWeddingDay(day.date);

                return (
                  <div key={day.date} className="relative space-y-2.5 pb-2">
                    
                    {/* Circle timeline marker */}
                    <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${
                      isMain ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-indigo-600'
                    }`}></div>

                    {/* Day Date Header Card */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800">
                          {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-450 font-bold bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                          {dateObj.toLocaleDateString(undefined, { weekday: 'long' })}
                        </span>
                      </div>
                      
                      {isMain && (
                        <span className="flex items-center gap-1 text-[9px] bg-amber-50 border border-amber-200 text-amber-700 font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                          <Star className="w-3 h-3 fill-amber-300 text-amber-500" /> Main Wedding Day
                        </span>
                      )}
                    </div>

                    {/* Intraday programs card list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                      {day.programs.map(prog => (
                        <div key={prog._id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs relative group">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-extrabold text-xs text-slate-700 leading-tight block">{prog.activityTitle}</span>
                              <button 
                                onClick={() => handleDeleteProgram(prog._id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-0.5 shrink-0"
                                title="Delete program"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-1">🕒 {prog.startTime} ({prog.durationMinutes} min)</span>
                            
                            {prog.locationName && (
                              <span className="text-[9px] text-slate-500 font-extrabold block truncate mt-2">📍 {prog.locationName}</span>
                            )}
                            
                            {prog.coordinates && (
                              <div className="mt-1">
                                <iframe 
                                  title="Location Map"
                                  src={`https://maps.google.com/maps?q=${encodeURIComponent(prog.coordinates)}&t=&z=14&ie=UTF8&iwloc=&output=embed`} 
                                  className="w-full h-20 rounded-xl border border-slate-200/60 bg-white" 
                                  allowFullScreen
                                  loading="lazy"
                                ></iframe>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-200/50 mt-3 pt-2 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase">
                            <span>Assign: {prog.assignedSide}</span>
                            <span className="truncate max-w-[100px]">{prog.coordinatorId}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}

              {groupedDays.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic text-xs">
                  No programs logged. Use the form on the left to schedule your wedding events roadmap!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
