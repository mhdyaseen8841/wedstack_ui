import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Clock, DollarSign, Eye, EyeOff, BarChart2, Share2, ClipboardList, Shield, LogOut, User as UserIcon, Lightbulb, Trash2, Plus, CheckCircle, Check, Landmark, Music } from 'lucide-react';
import FastCaptureInbox from './components/FastCaptureInbox';
import VendorMatrix from './components/VendorMatrix';
import CollaborativeBudget from './components/CollaborativeBudget';
import DayOfTimeline from './components/DayOfTimeline';
import CoordinatorTerminal from './components/CoordinatorTerminal';
import ExpenseManager from './components/ExpenseManager';
import ProgramPlanner from './components/ProgramPlanner';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('wedstack_token') || null);
  const [user, setUser] = useState(null);
  const [wedding, setWedding] = useState({ totalBudget: 45000, budgetSplitRatio: 50 });
  const [vendors, setVendors] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [programDetails, setProgramDetails] = useState([]);
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteSideSelect, setNoteSideSelect] = useState('Shared');
  
  // Workspace Accent State: 'Bride', 'Groom', 'Shared'
  const [activeSide, setActiveSide] = useState('Shared');
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Registration and Code join parameters
  const [regMode, setRegMode] = useState('create'); // 'create' or 'join'
  const [regWeddingCode, setRegWeddingCode] = useState('');
  const [regWeddingDate, setRegWeddingDate] = useState('');
  const [regTotalBudget, setRegTotalBudget] = useState('45000');
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Bride');
  const [authError, setAuthError] = useState(null);

  // Check if viewing public portal directly from URL parameter ?public=<weddingId>
  const [publicPortalId, setPublicPortalId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pubId = params.get('public');
    if (pubId) {
      setPublicPortalId(pubId);
    }
  }, []);

  // Fetch initial data
  const loadData = async () => {
    if (!token) return;
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      // Fetch user profile
      const userRes = await fetch('http://localhost:5000/api/auth/me', { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        if (userData.role) {
          setActiveSide(userData.role === 'Planner' ? 'Shared' : userData.role);
        }
      }

      // Fetch Wedding Details
      const weddingRes = await fetch('http://localhost:5000/api/wedding', { headers });
      if (weddingRes.ok) {
        const weddingData = await weddingRes.json();
        setWedding(weddingData);
      }

      // Fetch Vendors
      const vendorsRes = await fetch('http://localhost:5000/api/vendors', { headers });
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setVendors(vendorsData);
      }

      // Fetch Timeline
      const timelineRes = await fetch('http://localhost:5000/api/timeline', { headers });
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        setTimelineEvents(timelineData);
      }

      // Fetch Notes
      const notesRes = await fetch('http://localhost:5000/api/notes', { headers });
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }

      // Fetch Expenses
      const expensesRes = await fetch('http://localhost:5000/api/expenses', { headers });
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      // Fetch Program Details
      const pdRes = await fetch('http://localhost:5000/api/program-details', { headers });
      if (pdRes.ok) {
        const pdData = await pdRes.json();
        setProgramDetails(pdData);
      }
    } catch (err) {
      console.warn('API connection failed. Loading local simulated seed data.');
      loadMockData();
    }
  };

  // Fallback Mock data for sandbox validation
  const loadMockData = () => {
    setUser({ name: 'Guest Wedding Planner', email: 'guest@wedstack.com', role: 'Planner' });
    setWedding({ totalBudget: 45000, budgetSplitRatio: 55 });
    setVendors([
      {
        _id: 'mock-v1',
        vendorName: 'Elegance Photography',
        category: 'Photography',
        status: 'Shortlisted',
        sideVisibility: 'Shared',
        allowCrossView: true,
        packages: [{
          packageName: 'Classic Collection',
          totalCost: 3500,
          deliverables: ['8 Hours Coverage', 'Digital Album', '1 Lead Photographer'],
          finePrint: [{ item: 'Extra Coverage Hour', costPerUnit: 200, unit: 'hour' }]
        }]
      },
      {
        _id: 'mock-v2',
        vendorName: 'Blossom Bridal Makeup',
        category: 'Makeup',
        status: 'Booked',
        sideVisibility: 'Bride',
        allowCrossView: false,
        packages: [{
          packageName: 'Bridal Glow Pack',
          totalCost: 1200,
          deliverables: ['Airbrush Makeup', 'Hairstyling', 'Saree Draping'],
          finePrint: [{ item: 'Extra Bridesmaid Makeup', costPerUnit: 150, unit: 'guest' }]
        }]
      },
      {
        _id: 'mock-v3',
        vendorName: 'Sartorial Groom Suits',
        category: 'Events',
        status: 'Quoted',
        sideVisibility: 'Groom',
        allowCrossView: false,
        packages: [{
          packageName: 'Tuxedo Ensemble',
          totalCost: 800,
          deliverables: ['Bespoke Velvet Tuxedo', 'Shirt & Bowtie'],
          finePrint: [{ item: 'Late Alteration Fee', costPerUnit: 100, unit: 'request' }]
        }]
      }
    ]);
    setTimelineEvents([
      { _id: 'mock-e1', startTime: '08:00 AM', durationMinutes: 120, activityTitle: 'Bridal Makeup Session', assignedSide: 'Bride', coordinatorId: 'Jane (+1-555-9011)' },
      { _id: 'mock-e2', startTime: '10:00 AM', durationMinutes: 60, activityTitle: 'Groom Preparation', assignedSide: 'Groom', coordinatorId: 'Mark (+1-555-2244)' },
      { _id: 'mock-e3', startTime: '11:30 AM', durationMinutes: 90, activityTitle: 'First Look & Portraits', assignedSide: 'Shared', coordinatorId: 'Sarah (+1-555-4499)' }
    ]);
    setNotes([
      { _id: 'mock-n1', content: 'Book extra room for relatives arriving early', side: 'Bride', completed: false },
      { _id: 'mock-n2', content: 'Finalize suit fabrics and matching ties', side: 'Groom', completed: false },
      { _id: 'mock-n3', content: 'Double check catering plate count by Friday', side: 'Shared', completed: true }
    ]);
    setExpenses([
      { _id: 'mock-exp1', title: 'Catering deposit payment', amount: 3500, category: 'Catering', paidBy: 'Shared', isPaid: true, paidDate: new Date() },
      { _id: 'mock-exp2', title: 'Photographer retainer', amount: 1500, category: 'Photography', paidBy: 'Bride', isPaid: true, paidDate: new Date() },
      { _id: 'mock-exp3', title: 'Velvet Suit alterations deposit', amount: 400, category: 'Attire', paidBy: 'Groom', isPaid: false }
    ]);
    setProgramDetails([
      { _id: 'mock-pd1', category: 'Music', key: 'Grand Entry Song', value: 'ABCD', side: 'Shared' },
      { _id: 'mock-pd2', category: 'Music', key: 'Bride Entry Song', value: 'A Thousand Years', side: 'Bride' },
      { _id: 'mock-pd3', category: 'Cake & Dessert', key: 'Wedding Cake Flavour', value: 'Chocolate Fudge Berry', side: 'Shared' }
    ]);
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Notes Helpers
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const res = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: newNoteContent, side: noteSideSelect })
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes([...notes, newNote]);
        setNewNoteContent('');
      } else {
        const fallback = { _id: Date.now().toString(), content: newNoteContent, side: noteSideSelect, completed: false };
        setNotes([...notes, fallback]);
        setNewNoteContent('');
      }
    } catch (err) {
      const fallback = { _id: Date.now().toString(), content: newNoteContent, side: noteSideSelect, completed: false };
      setNotes([...notes, fallback]);
      setNewNoteContent('');
    }
  };

  const handleToggleNote = async (id, completed) => {
    const original = [...notes];
    setNotes(notes.map(n => n._id === id ? { ...n, completed } : n));
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      });
      if (!res.ok) setNotes(original);
    } catch (err) {
      // Keep optimistic
    }
  };

  const handleDeleteNote = async (id) => {
    const original = [...notes];
    setNotes(notes.filter(n => n._id !== id));
    try {
      await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      // Keep optimistic
    }
  };

  // Refetches timeline (called when shifted)
  const refreshTimeline = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/timeline', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimelineEvents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update vendor status
  const handleUpdateVendorStatus = async (vendorId, newStatus) => {
    const original = [...vendors];
    // Optimistic update
    setVendors(vendors.map(v => v._id === vendorId ? { ...v, status: newStatus } : v));
    try {
      const res = await fetch(`http://localhost:5000/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        setVendors(original);
      }
    } catch (err) {
      setVendors(original);
    }
  };

  // Auth Submit Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isRegister ? 'register' : 'login';
    const payload = isRegister 
      ? { 
          name: authName, 
          email: authEmail, 
          password: authPassword, 
          role: authRole,
          weddingCode: regMode === 'join' ? regWeddingCode : undefined,
          totalBudget: regMode === 'create' ? Number(regTotalBudget) : undefined,
          weddingDate: regMode === 'create' ? regWeddingDate : undefined
        }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('wedstack_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setAuthError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Could not reach backend server. Starting in mock sandbox mode.');
      // Fallback for sandboxed preview
      localStorage.setItem('wedstack_token', 'mock-token');
      setToken('mock-token');
      loadMockData();
    }
  };

  // Direct Mock Bypass trigger
  const triggerMockSession = () => {
    localStorage.setItem('wedstack_token', 'mock-token');
    setToken('mock-token');
    loadMockData();
  };

  const handleLogout = () => {
    localStorage.removeItem('wedstack_token');
    setToken(null);
    setUser(null);
    setVendors([]);
    setTimelineEvents([]);
    setExpenses([]);
    setProgramDetails([]);
  };

  // Expense Handlers
  const handleExpenseAdded = (newExp) => {
    setExpenses([...expenses, newExp]);
  };
  const handleExpenseUpdated = (updated) => {
    setExpenses(expenses.map(e => e._id === updated._id ? { ...e, ...updated } : e));
  };
  const handleExpenseDeleted = (id) => {
    setExpenses(expenses.filter(e => e._id !== id));
  };

  // Program Planner Handlers
  const handleDetailAdded = (newDetail) => {
    const exists = programDetails.some(d => d.category === newDetail.category && d.key === newDetail.key);
    if (exists) {
      setProgramDetails(programDetails.map(d => (d.category === newDetail.category && d.key === newDetail.key) ? newDetail : d));
    } else {
      setProgramDetails([...programDetails, newDetail]);
    }
  };
  const handleDetailDeleted = (id) => {
    setProgramDetails(programDetails.filter(d => d._id !== id));
  };

  // Public coordinator viewport
  if (publicPortalId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <CoordinatorTerminal weddingId={publicPortalId} mockMode={true} />
      </div>
    );
  }

  // Auth Screen viewport
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-4">
        <div className="max-w-md w-full bg-white/75 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-slate-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg">
              <Heart className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">WedStack SaaS</h1>
            <p className="text-xs text-slate-500 font-medium">Collaborative Wedding Workspace & Execution Platform</p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 text-center font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@domain.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Workspace Role</label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-sm bg-white"
                  value={authRole}
                  onChange={(e) => setAuthRole(e.target.value)}
                >
                  <option value="Bride">Bride Team / Aligned</option>
                  <option value="Groom">Groom Team / Aligned</option>
                  <option value="Planner">Shared Wedding Planner</option>
                </select>
              </div>
            )}

            {isRegister && (
              <div className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/20 space-y-3">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRegMode('create')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      regMode === 'create' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    Start a New Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegMode('join')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      regMode === 'join' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    Join Existing Event
                  </button>
                </div>

                {regMode === 'create' ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Wedding Event Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        value={regWeddingDate}
                        onChange={(e) => setRegWeddingDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider">Initial Budget Target ($)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                        value={regTotalBudget}
                        onChange={(e) => setRegTotalBudget(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Wedding Invite Code</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold placeholder:font-sans"
                      placeholder="e.g. WED-8491"
                      value={regWeddingCode}
                      onChange={(e) => setRegWeddingCode(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-indigo-600/10"
            >
              {isRegister ? 'Register & Initialize Wedding' : 'Access Wedding Workspace'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Quick-Start Mock bypass button */}
          <button
            onClick={triggerMockSession}
            className="w-full py-3 border border-indigo-200 text-indigo-700 hover:bg-indigo-50/50 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Use Quick-Start Mock Session
          </button>

          <div className="text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              {isRegister ? 'Already have a wedding account? Log in' : 'Set up a new Wedding Team? Sign up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Set workspace theme accents
  const accentColorClass = activeSide === 'Bride' 
    ? 'text-rose-600 focus:ring-rose-500 border-rose-600 bg-rose-600' 
    : activeSide === 'Groom' 
    ? 'text-sky-600 focus:ring-sky-500 border-sky-600 bg-sky-600' 
    : 'text-indigo-600 focus:ring-indigo-500 border-indigo-600 bg-indigo-600';

  const badgeColorClass = activeSide === 'Bride' 
    ? 'bg-rose-50 border-rose-100 text-rose-700' 
    : activeSide === 'Groom' 
    ? 'bg-sky-50 border-sky-100 text-sky-700' 
    : 'bg-indigo-50 border-indigo-100 text-indigo-700';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Header */}
      <header className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Logo & Invite Code */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${accentColorClass}`}>
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-base tracking-tight">WedStack</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold ml-1.5 uppercase">Workspace</span>
              </div>
            </div>
            {wedding?.weddingCode && (
              <div className="hidden lg:flex items-center bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-700 select-all" title="Share this code with your partner to join this wedding!">
                🔑 Invite Code: <span className="underline ml-1 font-mono font-bold">{wedding.weddingCode}</span>
              </div>
            )}
          </div>

          {/* Tri-Color Workspace Switcher */}
          <div className="flex bg-slate-100 p-1 border border-slate-200/60 rounded-xl shadow-inner text-xs font-bold">
            <button
              onClick={() => setActiveSide('Bride')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSide === 'Bride' 
                  ? 'bg-rose-550 bg-rose-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300"></span>
              Bride Side View
            </button>
            <button
              onClick={() => setActiveSide('Shared')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSide === 'Shared' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-300"></span>
              Mutual Planner View
            </button>
            <button
              onClick={() => setActiveSide('Groom')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSide === 'Groom' 
                  ? 'bg-sky-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-300"></span>
              Groom Side View
            </button>
          </div>

          {/* User Details & Logout */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotesSidebar(true)}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors flex items-center gap-1.5"
              title="Quick Thoughts / Reminders"
            >
              <Lightbulb className="w-4.5 h-4.5 text-amber-500 fill-amber-100" />
              <span className="hidden sm:inline text-xs font-bold text-slate-650">Brain Dump ({notes.filter(n => !n.completed).length})</span>
            </button>

            <div className={`border px-3 py-1.5 rounded-xl flex items-center gap-2 ${badgeColorClass}`}>
              <UserIcon className="w-4 h-4" />
              <div className="text-left leading-none">
                <div className="font-extrabold text-[10px]">{user?.name || 'Guest User'}</div>
                <span className="text-[9px] opacity-75">{user?.role || 'Planner'} Role</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 text-sm font-semibold py-1">
            {[
              { id: 'inbox', label: 'AI Vendor Inbox', icon: Sparkles },
              { id: 'comparison', label: 'Comparison Matrix', icon: ClipboardList },
              { id: 'budget', label: 'Tri-Color Budget', icon: DollarSign },
              { id: 'expenses', label: 'Expenses Log', icon: Landmark },
              { id: 'program', label: 'Program details', icon: Music },
              { id: 'timeline', label: 'Execution Timeline', icon: Clock },
              { id: 'terminal', label: 'Coordinator Portal', icon: Share2 }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              
              // Custom active indicators based on active side
              let activeTabBorder = 'border-indigo-600 text-indigo-600';
              if (isActive) {
                if (activeSide === 'Bride') activeTabBorder = 'border-rose-600 text-rose-600';
                else if (activeSide === 'Groom') activeTabBorder = 'border-sky-600 text-sky-600';
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-xs uppercase tracking-wider transition-colors ${
                    isActive 
                      ? activeTabBorder 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dashboard Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        {activeTab === 'inbox' && (
          <FastCaptureInbox
            token={token}
            side={activeSide}
            vendors={vendors}
            onVendorCreated={(newVendor) => setVendors([...vendors, newVendor])}
            onUpdateVendorStatus={handleUpdateVendorStatus}
          />
        )}
        
        {activeTab === 'comparison' && (
          <VendorMatrix vendors={vendors} />
        )}

        {activeTab === 'budget' && (
          <CollaborativeBudget
            wedding={wedding}
            vendors={vendors}
            token={token}
            onUpdateWedding={(updated) => setWedding(updated)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseManager
            expenses={expenses}
            token={token}
            onExpenseAdded={handleExpenseAdded}
            onExpenseUpdated={handleExpenseUpdated}
            onExpenseDeleted={handleExpenseDeleted}
            totalBudget={wedding.totalBudget}
          />
        )}

        {activeTab === 'program' && (
          <ProgramPlanner
            details={programDetails}
            token={token}
            onDetailAdded={handleDetailAdded}
            onDetailDeleted={handleDetailDeleted}
          />
        )}

        {activeTab === 'timeline' && (
          <DayOfTimeline
            events={timelineEvents}
            token={token}
            vendors={vendors}
            onTimelineUpdated={loadData}
          />
        )}

        {activeTab === 'terminal' && (
          <CoordinatorTerminal
            weddingId={wedding._id || 'mock-wedding-id'}
            mockMode={false}
          />
        )}
      </main>

      {/* Sticky Notes Collapsible Sidebar Drawer */}
      {showNotesSidebar && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowNotesSidebar(false)}
          ></div>
          
          {/* Drawer body */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-100" />
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Brain Dump & Reminders</h3>
              </div>
              <button 
                onClick={() => setShowNotesSidebar(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1.5 rounded-md hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddNote} className="p-4 border-b border-slate-100 space-y-2">
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Got a thought? Write it down before you forget..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <select
                  className="px-2 py-1 border border-slate-200 rounded text-[10px] font-bold bg-white text-slate-650"
                  value={noteSideSelect}
                  onChange={(e) => setNoteSideSelect(e.target.value)}
                >
                  <option value="Shared">Shared List</option>
                  <option value="Bride">Bride List</option>
                  <option value="Groom">Groom List</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Thought
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notes.map(note => {
                const noteSide = note.side || 'Shared';
                const isCompleted = note.completed;
                const sideColor = noteSide === 'Bride' 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : noteSide === 'Groom' 
                  ? 'bg-sky-50 border-sky-200 text-sky-800' 
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800';

                return (
                  <div 
                    key={note._id} 
                    className={`p-3 rounded-xl border shadow-xs flex justify-between gap-2 transition-all ${sideColor} ${
                      isCompleted ? 'opacity-55 line-through' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                        checked={isCompleted}
                        onChange={(e) => handleToggleNote(note._id, e.target.checked)}
                      />
                      <div className="text-xs leading-relaxed font-semibold break-all">
                        {note.content}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 shrink-0 transition-colors"
                      title="Delete thought"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {notes.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  Workspace is completely clear! Write down thoughts so you don't forget.
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
              Sticky notes sync live to your active workspace team.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
