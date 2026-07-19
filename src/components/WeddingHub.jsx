import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Heart, Plus, Trash2, Shield, Star, Award, Sparkles, Check, ChevronRight, CheckSquare, ListTodo, Edit, Users, Copy } from 'lucide-react';
import { API_URL } from '../config';

export default function WeddingHub({
  wedding,
  vendors,
  neededServices = [],
  token,
  side,
  user,
  timelineEvents,
  onUpdateWedding,
  onUpdateTimeline,
  onToggleService,
  onAddService,
  onUpdateService,
  onDeleteService,
  onNavigateToTab
}) {
  const isPlanner = user?.role === 'Planner';
  const isBride = user?.role === 'Bride';
  const isGroom = user?.role === 'Groom';

  // Real-time countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, months: 0, remainingDays: 0 });
  const [isMonthMode, setIsMonthMode] = useState(true);

  // Dialog Popups state
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showMutualSharingModal, setShowMutualSharingModal] = useState(false);

  // Service CRUD Manager state
  const [showServiceManager, setShowServiceManager] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Venue');
  const [newServiceIcon, setNewServiceIcon] = useState('🏢');

  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIcon, setEditIcon] = useState('');

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
  const [editingProgram, setEditingProgram] = useState(null);

  const openEditModal = (prog) => {
    setEditingProgram(prog);
    setEventDate(prog.eventDay ? new Date(prog.eventDay).toISOString().split('T')[0] : '');
    setEventName(prog.activityTitle || '');
    setIsMainDay(isMainWeddingDay(prog.eventDay ? new Date(prog.eventDay).toISOString().split('T')[0] : ''));
    setStartTime(prog.startTime || '09:00 AM');
    setDuration(String(prog.durationMinutes || '120'));
    setCoordinator(prog.coordinatorId === 'Coordinators' || prog.coordinatorId === 'General Coordinator' ? '' : (prog.coordinatorId || ''));
    setLocationName(prog.locationName || '');
    setCoordinates(prog.coordinates || '');
    setAssignedSide(prog.assignedSide || 'Shared');
    setMessage(null);
    setShowAddProgramModal(true);
  };

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
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, months: 0, remainingDays: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      // Calendar month & remaining days breakdown calculation
      let months = 0;
      let remainingDays = 0;
      if (diff > 0) {
        const yearDiff = target.getFullYear() - now.getFullYear();
        const monthDiff = target.getMonth() - now.getMonth();
        let totalMonths = yearDiff * 12 + monthDiff;

        // If target day of month is less than today's day, subtract 1 month
        if (target.getDate() < now.getDate()) {
          totalMonths--;
        }

        months = Math.max(0, totalMonths);

        // Find reference date after adding full months
        const tempNow = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
        // Adjust for month end overflow
        if (tempNow.getDate() !== now.getDate()) {
          tempNow.setDate(0);
        }
        const remainingMs = target.getTime() - tempNow.getTime();
        remainingDays = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
      }

      setTimeLeft({ days, hours, minutes, seconds, months, remainingDays });
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

      const url = editingProgram
        ? `${API_URL}/api/timeline/${editingProgram._id}`
        : `${API_URL}/api/timeline`;

      const method = editingProgram ? 'PATCH' : 'POST';

      // 1. Create or update sub-program as a timeline event
      const res = await fetch(url, {
        method,
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
          const wedRes = await fetch(`${API_URL}/api/wedding`, {
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
        setEditingProgram(null);
        setShowAddProgramModal(false);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save event.' });
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
      await fetch(`${API_URL}/api/timeline/${id}`, {
        method: 'DELETE',
        headers
      });
      onUpdateTimeline();
    } catch (err) { }
  };

  const isMainWeddingDay = (dateStr) => {
    if (!wedding?.weddingDate) return false;
    const mainStr = new Date(wedding.weddingDate).toISOString().split('T')[0];
    return mainStr === dateStr;
  };

  const groupedDays = groupEventsByDate();

  const totalServicesCount = neededServices.length;
  const bookedServicesCount = neededServices.filter(service => {
    const autoBooked = vendors.some(v => v.category.toLowerCase() === service.category.toLowerCase() && v.status === 'Booked');
    const brideChecked = service.brideCompleted || false;
    const groomChecked = service.groomCompleted || false;
    return autoBooked || (
      side === 'Bride' ? brideChecked : side === 'Groom' ? groomChecked : (brideChecked && groomChecked)
    );
  }).length;
  const progressPercent = totalServicesCount > 0 ? Math.round((bookedServicesCount / totalServicesCount) * 100) : 0;
  const isGroomJoined = !!wedding?.groomId;
  const isBrideJoined = !!wedding?.brideId;
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(wedding?.weddingCode || '');
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const groomName = (wedding?.groomId && typeof wedding.groomId === 'object' && wedding.groomId.name) || wedding?.groomName || 'Groom';
  const brideName = (wedding?.brideId && typeof wedding.brideId === 'object' && wedding.brideId.name) || wedding?.brideName || 'Bride';

  return (
    <div className="space-y-6 md:space-y-8 text-slate-800 antialiased">

      {/* Elegant & Romantic Couple Banner (Compact) */}
      <div className="bg-gradient-to-r from-indigo-50/60 via-rose-50/30 to-sky-50/20 rounded-2xl border border-rose-100/40 shadow-xs p-3.5 md:py-3 md:px-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Subtle Decorative Glows */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-rose-250/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-3 w-full min-w-0">
          <div className="hidden sm:flex items-center justify-center w-9 h-9 bg-white/95 border border-rose-100 rounded-full shadow-xs shrink-0">
            <Heart className="w-4.5 h-4.5 text-rose-500 fill-rose-100 animate-pulse" />
          </div>
          
          <div className="space-y-0.5 min-w-0 flex-1 text-center sm:text-left">
            {isGroomJoined && isBrideJoined ? (
              <>
                <h2 className="text-base md:text-lg font-extrabold tracking-tight text-slate-800 font-serif-wedding flex flex-wrap items-center justify-center sm:justify-start gap-1.5 leading-tight">
                  <span>{groomName}</span>
                  <span className="text-rose-500 fill-rose-500 animate-pulse text-sm mx-0.5">❤️</span>
                  <span>{brideName}</span>
                </h2>
                <p className="text-[9.5px] text-slate-450 font-bold uppercase tracking-wider">
                  ✨ Two hearts planning one beautiful beginning • Together in Sync
                </p>
              </>
            ) : (
              <>
                <h2 className="text-base md:text-lg font-extrabold tracking-tight text-slate-800 font-serif-wedding flex flex-wrap items-center justify-center sm:justify-start gap-1.5 leading-tight">
                  {isGroomJoined ? (
                    <>
                      <span>{groomName}</span>
                      <span className="text-slate-400 text-xs italic font-normal">& His Bride-to-be</span>
                    </>
                  ) : (
                    <>
                      <span>{brideName}</span>
                      <span className="text-slate-400 text-xs italic font-normal">& Her Groom-to-be</span>
                    </>
                  )}
                </h2>
                <p className="text-[9px] text-rose-500 font-black uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <span>⏳ Waiting for partner to join the planning workspace...</span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action / Collaboration code if not both joined */}
        {!isGroomJoined || !isBrideJoined ? (
          <div className="shrink-0 z-10 w-full md:w-auto bg-white/80 backdrop-blur-xs border border-rose-100/40 p-2 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <div className="text-[9px] font-bold text-slate-500 pl-1.5">
              <span className="text-slate-400 uppercase tracking-widest text-[7.5px] font-black block">Invite Code</span>
              <span className="font-mono font-black text-slate-800 select-all">{wedding?.weddingCode}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs"
            >
              {copiedInvite ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedInvite ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        ) : null}
      </div>

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
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-rose-100 font-serif-wedding">
              The Grand Union
            </h1>
            <p className="text-slate-350 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none">
              {wedding?.weddingDate
                ? `Main Ceremony Day: ${new Date(wedding.weddingDate).toLocaleDateString(undefined, { dateStyle: 'long' })}`
                : 'Add a date below and select "Main Wedding Ceremony"!'
              }
            </p>
          </div>

          {/* Countdown ticking blocks */}
          {wedding?.weddingDate ? (
            <div className="space-y-3.5 w-full flex flex-col items-center">
              <div className={`grid ${isMonthMode ? 'grid-cols-5 max-w-md' : 'grid-cols-4 max-w-sm'} gap-2 sm:gap-3 w-full pt-1 transition-all duration-300`}>
                {(isMonthMode ? [
                  { label: 'Months', value: timeLeft.months || 0 },
                  { label: 'Days', value: timeLeft.remainingDays || 0 },
                  { label: 'Hours', value: timeLeft.hours || 0 },
                  { label: 'Minutes', value: timeLeft.minutes || 0 },
                  { label: 'Seconds', value: timeLeft.seconds || 0 }
                ] : [
                  { label: 'Days', value: timeLeft.days || 0 },
                  { label: 'Hours', value: timeLeft.hours || 0 },
                  { label: 'Minutes', value: timeLeft.minutes || 0 },
                  { label: 'Seconds', value: timeLeft.seconds || 0 }
                ]).map(block => (
                  <div key={block.label} className="bg-white/5 border border-white/10 rounded-xl py-2 px-1 backdrop-blur-md shadow-lg flex flex-col justify-center items-center hover:border-white/20 transition-all">
                    <span className="text-lg sm:text-xl font-black text-white tracking-tight leading-none">{String(block.value).padStart(2, '0')}</span>
                    <span className="text-[8px] uppercase tracking-wider font-bold text-indigo-250 mt-1 truncate max-w-full">{block.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsMonthMode(!isMonthMode)}
                className="text-[8px] sm:text-[9px] font-bold text-white/40 hover:text-white/80 transition-colors uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5 hover:border-white/10"
              >
                {isMonthMode ? "Show Total Days Mode" : "Show Months & Days Mode"}
              </button>
            </div>
          ) : (
            <div className="py-2 text-slate-350 italic text-xs">
              No main wedding date configured. Use the "+ Add Day Program" modal to schedule one!
            </div>
          )}
        </div>
      </div>

      {/* Popups / Dialogs Backdrops */}
      {showAddProgramModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowAddProgramModal(false);
                setEditingProgram(null);
                setEventName('');
                setCoordinator('');
                setLocationName('');
                setCoordinates('');
                setIsMainDay(false);
              }}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold transition-all"
            >
              ✕
            </button>
            <div className="mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100">
                {editingProgram ? 'Edit Day Program' : 'Add Day Program'}
              </h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-1.5">
                {editingProgram ? 'Modify the sub-event or program details below.' : 'Add sub-events or programs to specific dates. E.g., morning puja, evening reception.'}
              </p>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-bold mb-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none bg-slate-50/50"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Program / Event Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none bg-slate-50/50"
                  placeholder="e.g. Sangeet / Morning Ceremony"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-semibold focus:outline-none"
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
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50/50"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lead Coordinator</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none bg-slate-50/50"
                  placeholder="Uncle Mark (+1-555-0104)"
                  value={coordinator}
                  onChange={(e) => setCoordinator(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location Name</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none bg-slate-50/50"
                  placeholder="e.g. Grand Ballroom Plaza"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Coordinates / Plus Code / Address (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none bg-slate-50/50"
                  placeholder="e.g. 40.7128,-74.0060 or 49Q3+H54, Aluva, Kerala"
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
                  className="rounded text-indigo-650 mr-2 focus:ring-0 cursor-pointer"
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
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm mt-2"
              >
                {!editingProgram && <Plus className="w-4 h-4" />} {submitting ? 'Saving...' : editingProgram ? 'Save Changes' : 'Save Program Day'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showMutualSharingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowMutualSharingModal(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold transition-all"
            >
              ✕
            </button>
            <div className="mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100">Mutual View Sharing</h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-1.5 leading-relaxed">Control if your partner is allowed to collaborate with you on the Mutual View page.</p>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3.5 py-3 rounded-xl hover:bg-slate-100/50 transition-colors text-xs font-bold text-slate-700 mt-2">
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

                    const res = await fetch(`${API_URL}/api/wedding`, {
                      method: 'PATCH',
                      headers,
                      body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                      const updated = await res.json();
                      onUpdateWedding(updated);
                    }
                  } catch (err) { }
                }}
              />
              <span>Allow Partner to access Mutual View</span>
            </label>
          </div>
        </div>
      )}

      {/* 2. Page Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Full width timeline list */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="font-extrabold text-base md:text-lg text-slate-850 font-serif-wedding tracking-wide">Multi-Day Wedding Roadmap</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingProgram(null);
                    setEventDate('');
                    setEventName('');
                    setStartTime('09:00 AM');
                    setDuration('120');
                    setCoordinator('');
                    setLocationName('');
                    setCoordinates('');
                    setAssignedSide(side === 'Shared' ? 'Shared' : side);
                    setMessage(null);
                    setShowAddProgramModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs uppercase tracking-wider"
                >
                  + Add Day Program
                </button>
                {!isPlanner && (
                  <button
                    onClick={() => setShowMutualSharingModal(true)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200 shadow-xs uppercase tracking-wider"
                  >
                    🔒 Mutual Sharing
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4 relative pl-4 border-l border-slate-200">
              {groupedDays.map((day, idx) => {
                const dateObj = new Date(day.date + 'T00:00:00');
                const isMain = isMainWeddingDay(day.date);

                return (
                  <div key={day.date} className="relative space-y-2.5 pb-2">

                    {/* Circle timeline marker */}
                    <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${isMain ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-indigo-600'
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
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => openEditModal(prog)}
                                  className="text-slate-400 hover:text-indigo-650 transition-colors p-0.5"
                                  title="Edit program"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProgram(prog._id)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                                  title="Delete program"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
          {/* Needed Services Checklist Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-600" />
                <h2 className="font-extrabold text-base md:text-lg text-slate-850 font-serif-wedding tracking-wide">Needed Services Checklist</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowServiceManager(!showServiceManager)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all shadow-sm ${showServiceManager
                      ? "bg-rose-600 hover:bg-rose-750 text-white"
                      : "bg-slate-50 border border-slate-250 text-indigo-650 hover:bg-slate-100"
                    }`}
                >
                  {showServiceManager ? "✕ Close Editor" : "🔧 Edit Needed Services"}
                </button>
                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Auto-syncs with Vendor Bookings</span>
              </div>
            </div>

            {/* Checklist Progress Bar */}
            {totalServicesCount > 0 && (
              <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl mb-2 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">📊 Needed Services Booked</span>
                  <span className="text-indigo-600">{bookedServicesCount} of {totalServicesCount} services booked ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            )}

            {/* Inline Dynamic CRUD Service Manager */}
            {showServiceManager && (
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-150 space-y-4 shadow-inner">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">⚙️ Custom Services CRUD builder</h4>

                {/* Add service form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-150 shadow-xs">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Service name</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 bg-white font-medium"
                      placeholder="e.g. Wedding Hall Auditorium"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor Category</label>
                    <select
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-655 font-bold outline-none"
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                    >
                      <option value="Venue">Venue</option>
                      <option value="Catering">Catering</option>
                      <option value="Photography">Photography</option>
                      <option value="Decor">Decor</option>
                      <option value="Music">Music</option>
                      <option value="Makeup">Makeup</option>
                      <option value="Attire">Attire</option>
                      <option value="Invitations">Invitations</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-14">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Emoji</label>
                      <input
                        type="text"
                        maxLength="2"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-white outline-none"
                        value={newServiceIcon}
                        onChange={(e) => setNewServiceIcon(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newServiceName.trim()) return;
                        onAddService(newServiceName, newServiceCategory, newServiceIcon);
                        setNewServiceName('');
                      }}
                      className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Services list with Edit/Delete options */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {neededServices.map(service => (
                    <div key={service._id} className="flex justify-between items-center p-2.5 bg-white border border-slate-150 rounded-xl gap-3">
                      {editingServiceId === service._id ? (
                        <div className="flex items-center gap-2 flex-grow">
                          <input
                            type="text"
                            maxLength="2"
                            className="w-10 px-1 py-0.5 border border-slate-200 rounded text-center text-xs"
                            value={editIcon}
                            onChange={(e) => setEditIcon(e.target.value)}
                          />
                          <input
                            type="text"
                            className="px-2 py-0.5 border border-slate-200 rounded text-xs flex-grow"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <select
                            className="px-1.5 py-0.5 border border-slate-200 rounded text-xs bg-white"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                          >
                            <option value="Venue">Venue</option>
                            <option value="Catering">Catering</option>
                            <option value="Photography">Photography</option>
                            <option value="Decor">Decor</option>
                            <option value="Music">Music</option>
                            <option value="Makeup">Makeup</option>
                            <option value="Attire">Attire</option>
                            <option value="Invitations">Invitations</option>
                            <option value="Others">Others</option>
                          </select>
                          <button
                            onClick={() => {
                              onUpdateService(service._id, editName, editCategory, editIcon);
                              setEditingServiceId(null);
                            }}
                            className="px-2.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingServiceId(null)}
                            className="px-2 py-0.5 bg-slate-100 border rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">{service.icon}</span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">{service.name}</span>
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Category: {service.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingServiceId(service._id);
                                setEditName(service.name);
                                setEditCategory(service.category);
                                setEditIcon(service.icon);
                              }}
                              className="text-[10px] font-bold text-indigo-650 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteService(service._id)}
                              className="text-[10px] font-bold text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {neededServices.map(service => {
                const bookedVendors = vendors.filter(v => v.category.toLowerCase() === service.category.toLowerCase() && v.status === 'Booked');
                const autoBooked = bookedVendors.length > 0;

                const brideChecked = service.brideCompleted || false;
                const groomChecked = service.groomCompleted || false;

                const isCompleted = autoBooked || (
                  side === 'Bride' ? brideChecked : side === 'Groom' ? groomChecked : (brideChecked && groomChecked)
                );

                return (
                  <div
                    key={service._id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${isCompleted
                        ? 'bg-emerald-50/20 border-emerald-100 text-emerald-850'
                        : 'bg-slate-50/40 border-slate-200/60 text-slate-700 hover:border-indigo-200'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Clicking the service title redirects to the vendor page filtered by category */}
                      <div
                        onClick={() => {
                          if (onNavigateToTab) {
                            onNavigateToTab('inbox', service.category);
                          }
                        }}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer group/item flex-1"
                        title="Click to view & manage vendors for this service category"
                      >
                        <span className="text-base shrink-0 group-hover/item:scale-110 transition-transform">{service.icon}</span>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate group-hover/item:text-indigo-650 ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {service.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                            Category: {service.category} ↗
                          </span>
                          {autoBooked && (
                            <span className="text-[9px] text-emerald-700 font-extrabold block mt-0.5">
                              Vendor: {bookedVendors.map(v => v.vendorName).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {autoBooked && (
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                          <Check className="w-2.5 h-2.5" /> Booked
                        </span>
                      )}
                    </div>

                    {!autoBooked && (
                      <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between text-[10px] text-slate-450 font-bold uppercase">
                        {side === 'Shared' ? (
                          <div className="flex justify-between w-full">
                            <span className="flex items-center gap-1">
                              🤵 Groom: {groomChecked ? <span className="text-emerald-600">✓ Done</span> : <span className="text-slate-400">⚡ Pending</span>}
                            </span>
                            <span className="flex items-center gap-1">
                              🌸 Bride: {brideChecked ? <span className="text-rose-600">✓ Done</span> : <span className="text-slate-400">⚡ Pending</span>}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-400">Status:</span>
                              {isCompleted ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 border border-emerald-250 text-emerald-700 uppercase tracking-wider">✓ Booked</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 border border-amber-200 text-amber-600 uppercase tracking-wider">⚡ Pending</span>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              className="rounded text-indigo-655 focus:ring-0 w-4 h-4 cursor-pointer"
                              checked={side === 'Bride' ? brideChecked : groomChecked}
                              onChange={(e) => onToggleService(service._id, e.target.checked, side)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
