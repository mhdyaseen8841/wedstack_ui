import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Clock, DollarSign, Share2, ClipboardList, Shield, LogOut, User as UserIcon, Lightbulb, Trash2, Plus, Landmark, Music, Copy, Check, Menu, X } from 'lucide-react';
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
  
  // Mobile responsive sidebar state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sidebar Toggles
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteSideSelect, setNoteSideSelect] = useState('Shared');
  
  // Workspace Accent State: 'Bride', 'Groom', 'Shared'
  const [activeSide, setActiveSide] = useState('Shared');
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Bride');
  const [authError, setAuthError] = useState(null);
  const [regMode, setRegMode] = useState('create');
  const [regWeddingCode, setRegWeddingCode] = useState('');
  const [regWeddingDate, setRegWeddingDate] = useState('');
  const [regTotalBudget, setRegTotalBudget] = useState('45000');
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [publicPortalId, setPublicPortalId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pubId = params.get('public');
    if (pubId) {
      setPublicPortalId(pubId);
    }
  }, []);

  const loadData = async () => {
    if (!token || token === 'mock-token') return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const userRes = await fetch('http://localhost:5000/api/auth/me', { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        if (userData.role) {
          setActiveSide(userData.role === 'Planner' ? 'Shared' : userData.role);
        }
      }

      const weddingRes = await fetch('http://localhost:5000/api/wedding', { headers });
      if (weddingRes.ok) {
        const weddingData = await weddingRes.json();
        setWedding(weddingData);
      }

      const vendorsRes = await fetch('http://localhost:5000/api/vendors', { headers });
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setVendors(vendorsData);
      }

      const timelineRes = await fetch('http://localhost:5000/api/timeline', { headers });
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        setTimelineEvents(timelineData);
      }

      const notesRes = await fetch('http://localhost:5000/api/notes', { headers });
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }

      const expensesRes = await fetch('http://localhost:5000/api/expenses', { headers });
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      const pdRes = await fetch('http://localhost:5000/api/program-details', { headers });
      if (pdRes.ok) {
        const pdData = await pdRes.json();
        setProgramDetails(pdData);
      }
    } catch (err) {
      console.warn('API offline. Using offline mock sandbox mode.');
      loadMockData();
    }
  };

  const loadMockData = () => {
    setUser({ name: 'Guest Wedding Planner', email: 'guest@wedstack.com', role: 'Planner' });
    setWedding({ _id: 'mock-wedding-id', totalBudget: 45000, budgetSplitRatio: 55, weddingCode: 'WED-8914', weddingDate: new Date() });
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

  const handleUpdateVendorStatus = async (vendorId, newStatus) => {
    const original = [...vendors];
    setVendors(vendors.map(v => v._id === vendorId ? { ...v, status: newStatus } : v));
    if (token === 'mock-token') return;
    try {
      const res = await fetch(`http://localhost:5000/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) setVendors(original);
    } catch (err) {
      setVendors(original);
    }
  };

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
      setAuthError('Could not reach backend. Starting locally in mock mode.');
      triggerMockSession();
    }
  };

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

  const handleExpenseAdded = (newExp) => setExpenses([...expenses, newExp]);
  const handleExpenseUpdated = (updated) => setExpenses(expenses.map(e => e._id === updated._id ? { ...e, ...updated } : e));
  const handleExpenseDeleted = (id) => setExpenses(expenses.filter(e => e._id !== id));

  const handleDetailAdded = (newDetail) => {
    const exists = programDetails.some(d => d.category === newDetail.category && d.key === newDetail.key);
    if (exists) {
      setProgramDetails(programDetails.map(d => (d.category === newDetail.category && d.key === newDetail.key) ? newDetail : d));
    } else {
      setProgramDetails([...programDetails, newDetail]);
    }
  };
  const handleDetailDeleted = (id) => setProgramDetails(programDetails.filter(d => d._id !== id));

  // Notes/Sticky helpers
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    const fallback = { _id: Date.now().toString(), content: newNoteContent, side: noteSideSelect, completed: false };
    setNotes([...notes, fallback]);
    setNewNoteContent('');
    if (token === 'mock-token') return;
    try {
      const res = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newNoteContent, side: noteSideSelect })
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => prev.map(n => n._id === fallback._id ? newNote : n));
      }
    } catch (err) {}
  };

  const handleToggleNote = async (id, completed) => {
    setNotes(notes.map(n => n._id === id ? { ...n, completed } : n));
    if (token === 'mock-token') return;
    try {
      await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ completed })
      });
    } catch (err) {}
  };

  const handleDeleteNote = async (id) => {
    setNotes(notes.filter(n => n._id !== id));
    if (token === 'mock-token') return;
    try {
      await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {}
  };

  const copyInviteCode = () => {
    if (wedding?.weddingCode) {
      navigator.clipboard.writeText(wedding.weddingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (publicPortalId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <CoordinatorTerminal weddingId={publicPortalId} mockMode={true} />
      </div>
    );
  }

  // Elegant Minimal Login
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 antialiased text-slate-800">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md">
              <Heart className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 pt-3">WedStack Platform</h1>
            <p className="text-xs text-slate-500 font-medium">Collaborative planner & Day-of execution dashboard</p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 text-center font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-slate-50/50"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Eleanor Vance"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-slate-50/50"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-slate-50/50"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Workspace Assignment Role</label>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white"
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value)}
                  >
                    <option value="Bride">Bride side aligned</option>
                    <option value="Groom">Groom side aligned</option>
                    <option value="Planner">Shared Wedding Planner</option>
                  </select>
                </div>

                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setRegMode('create')}
                      className={`flex-1 py-1.5 rounded-md transition-all ${
                        regMode === 'create' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      Start New Event
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegMode('join')}
                      className={`flex-1 py-1.5 rounded-md transition-all ${
                        regMode === 'join' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      Join with Code
                    </button>
                  </div>

                  {regMode === 'create' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Wedding Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                          value={regWeddingDate}
                          onChange={(e) => setRegWeddingDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Budget Target ($)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                          value={regTotalBudget}
                          onChange={(e) => setRegTotalBudget(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Wedding invite code</label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white"
                        placeholder="e.g. WED-3814"
                        value={regWeddingCode}
                        onChange={(e) => setRegWeddingCode(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-600/10"
            >
              {isRegister ? 'Register & Setup' : 'Login'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            onClick={triggerMockSession}
            className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Use Quick-Start Mock Session
          </button>

          <div className="text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-650 hover:underline font-semibold"
            >
              {isRegister ? 'Already registered? Sign in' : 'Create new shared wedding? Sign up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Theme Accent Colors
  const accentColorClass = activeSide === 'Bride'
    ? 'bg-rose-50 border border-rose-100 text-rose-700'
    : activeSide === 'Groom'
    ? 'bg-sky-50 border border-sky-100 text-sky-700'
    : 'bg-indigo-600 text-white hover:bg-indigo-700';

  const textAccent = activeSide === 'Bride' ? 'text-rose-600' : activeSide === 'Groom' ? 'text-sky-650' : 'text-indigo-600';
  const borderAccent = activeSide === 'Bride' ? 'border-rose-300' : activeSide === 'Groom' ? 'border-sky-300' : 'border-indigo-600';

  return (
    <div className="min-h-screen md:h-screen w-screen md:overflow-hidden flex flex-col md:flex-row bg-slate-50 text-slate-800 tracking-tight antialiased">
      
      {/* Mobile Drawer Menu (Sidebar overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-full border-r border-slate-850 shadow-2xl z-20">
            <div className="flex flex-col">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-extrabold text-white text-base tracking-tight">WedStack</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Workspace Switcher */}
              <div className="p-4 border-b border-slate-800 space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pl-2 mb-1">Workspace</span>
                <button
                  onClick={() => { setActiveSide('Bride'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeSide === 'Bride' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> Bride Workspace
                </button>
                <button
                  onClick={() => { setActiveSide('Shared'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeSide === 'Shared' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Mutual Shared View
                </button>
                <button
                  onClick={() => { setActiveSide('Groom'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeSide === 'Groom' ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' : 'hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span> Groom Workspace
                </button>
              </div>

              {/* Modules List */}
              <nav className="p-4 space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pl-2 mb-2">Modules</span>
                {[
                  { id: 'inbox', label: 'AI Quote Inbox', icon: Sparkles },
                  { id: 'comparison', label: 'VS Matrix Grid', icon: ClipboardList },
                  { id: 'budget', label: 'Collaborative Budget', icon: DollarSign },
                  { id: 'expenses', label: 'Expenses Log', icon: Landmark },
                  { id: 'program', label: 'Program details', icon: Music },
                  { id: 'timeline', label: 'Day-of Timeline', icon: Clock },
                  { id: 'terminal', label: 'Coordinator Portal', icon: Share2 }
                ].map(tab => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  let activeTabClass = 'bg-indigo-600 text-white shadow-sm';
                  if (isActive) {
                    if (activeSide === 'Bride') activeTabClass = 'bg-rose-600 text-white';
                    else if (activeSide === 'Groom') activeTabClass = 'bg-sky-600 text-white';
                  }
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                        isActive ? activeTabClass : 'hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <TabIcon className="w-4.5 h-4.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Profile Info */}
            <div className="p-4 border-t border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-left leading-none">
                  <div className="text-xs font-bold text-white truncate max-w-[120px]">{user?.name || 'Guest User'}</div>
                  <span className="text-[9px] text-slate-500 font-medium">{user?.role || 'Planner'}</span>
                </div>
              </div>
              <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-lg transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Sleek Left Sidebar (Desktop Only) */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col justify-between shrink-0 border-r border-slate-800 shadow-xl z-20">
        <div className="flex flex-col">
          {/* Logo & Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">WedStack</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold ml-1.5 uppercase">SaaS</span>
            </div>
          </div>

          {/* Primary View switching switcher */}
          <div className="p-4 border-b border-slate-800 space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pl-2 mb-1">Workspace Environment</span>
            
            <button
              onClick={() => setActiveSide('Bride')}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSide === 'Bride' 
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                  : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
              Bride Workspace
            </button>
            <button
              onClick={() => setActiveSide('Shared')}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSide === 'Shared' 
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' 
                  : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Mutual Shared View
            </button>
            <button
              onClick={() => setActiveSide('Groom')}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSide === 'Groom' 
                  ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
                  : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              Groom Workspace
            </button>
          </div>

          {/* Tab Navigation List */}
          <nav className="p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pl-2 mb-2">Planning Modules</span>
            {[
              { id: 'inbox', label: 'AI Quote Inbox', icon: Sparkles },
              { id: 'comparison', label: 'VS Matrix Grid', icon: ClipboardList },
              { id: 'budget', label: 'Collaborative Budget', icon: DollarSign },
              { id: 'expenses', label: 'Expenses Log', icon: Landmark },
              { id: 'program', label: 'Program details', icon: Music },
              { id: 'timeline', label: 'Day-of Timeline', icon: Clock },
              { id: 'terminal', label: 'Coordinator Portal', icon: Share2 }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              
              let activeTabClass = 'bg-indigo-600 text-white shadow-md';
              if (isActive) {
                if (activeSide === 'Bride') activeTabClass = 'bg-rose-600 text-white shadow-md';
                else if (activeSide === 'Groom') activeTabClass = 'bg-sky-600 text-white shadow-md';
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? activeTabClass 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <TabIcon className="w-4.5 h-4.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile capsule and logout */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-left leading-none">
              <div className="text-xs font-bold text-white truncate max-w-[120px]">{user?.name || 'Guest User'}</div>
              <span className="text-[9px] text-slate-500 font-medium">{user?.role || 'Planner'} role</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 rounded-lg text-slate-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 2. Sleek top header (glassmorphism) */}
        <header className="h-16 border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs ${accentColorClass}`}>
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">{activeSide === 'Shared' ? 'Mutual Planning Workspace' : `${activeSide} Workspace View`}</span>
              <span className="sm:hidden">{activeSide === 'Shared' ? 'Mutual' : activeSide}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live code invitation */}
            {wedding?.weddingCode && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full pl-3 pr-1.5 py-1 text-xs text-slate-600 font-semibold shadow-xs">
                Invite partner: <span className="font-mono font-bold text-slate-800 bg-white border px-2 py-0.5 rounded">{wedding.weddingCode}</span>
                <button
                  onClick={copyInviteCode}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Brain dump reminders drawer toggle */}
            <button
              onClick={() => setShowNotesSidebar(true)}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs"
              title="Toggle Scratchpad Notes"
            >
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-100" />
              <span>Notes ({notes.filter(n => !n.completed).length})</span>
            </button>
          </div>
        </header>

        {/* Tab Viewport Scrollable container */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
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

          </div>
        </main>
      </div>

      {/* Brain Dump Collapsible Sidebar Drawer */}
      {showNotesSidebar && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity"
            onClick={() => setShowNotesSidebar(false)}
          ></div>
          
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200/80 z-20">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-100" />
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Brain Dump Notes</h3>
              </div>
              <button 
                onClick={() => setShowNotesSidebar(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 rounded-md hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNote} className="p-4 border-b border-slate-100 space-y-2 bg-slate-50/50">
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none bg-white font-medium"
                placeholder="Write down ideas before you forget..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <select
                  className="px-2 py-1 border border-slate-200 rounded text-[10px] font-bold bg-white text-slate-500"
                  value={noteSideSelect}
                  onChange={(e) => setNoteSideSelect(e.target.value)}
                >
                  <option value="Shared">Shared Notes</option>
                  <option value="Bride">Bride Notes</option>
                  <option value="Groom">Groom Notes</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" /> Save Note
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
              {notes.map(note => {
                const noteSide = note.side || 'Shared';
                const isCompleted = note.completed;
                const sideColor = noteSide === 'Bride' 
                  ? 'bg-rose-50/50 border-rose-100 text-rose-900' 
                  : noteSide === 'Groom' 
                  ? 'bg-sky-50/50 border-sky-100 text-sky-900' 
                  : 'bg-indigo-50/50 border-indigo-100 text-indigo-900';

                return (
                  <div 
                    key={note._id} 
                    className={`p-3 rounded-xl border shadow-xs flex justify-between gap-3 transition-all ${sideColor} ${
                      isCompleted ? 'opacity-40 line-through' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                        checked={isCompleted}
                        onChange={(e) => handleToggleNote(note._id, e.target.checked)}
                      />
                      <div className="text-xs leading-relaxed font-semibold text-slate-700">
                        {note.content}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 shrink-0 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {notes.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  Scratchpad is empty!
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Wedding Scratchpad Syncs Live
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
