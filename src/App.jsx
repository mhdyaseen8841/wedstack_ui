import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Clock, DollarSign, Share2, ClipboardList, Shield, LogOut, User as UserIcon, Lightbulb, Trash2, Plus, Landmark, Music, Copy, Check, Lock } from 'lucide-react';
import FastCaptureInbox from './components/FastCaptureInbox';
import VendorMatrix from './components/VendorMatrix';
import CollaborativeBudget from './components/CollaborativeBudget';
import DayOfTimeline from './components/DayOfTimeline';
import CoordinatorTerminal from './components/CoordinatorTerminal';
import ExpenseManager from './components/ExpenseManager';
import ProgramPlanner from './components/ProgramPlanner';
import WeddingHub from './components/WeddingHub';

function LogoIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Left Ring */}
      <circle cx="9" cy="13" r="5.5" />
      {/* Right Ring */}
      <circle cx="15" cy="13" r="5.5" />
      {/* Diamond Sparkle Glint */}
      <path d="M15.5 3.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('wedstack_token') || null);
  const [user, setUser] = useState(null);
  const [wedding, setWedding] = useState({ totalBudget: 45000, budgetSplitRatio: 50 });
  const [vendors, setVendors] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [programDetails, setProgramDetails] = useState([]);
  const [neededServices, setNeededServices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(null);
  
  // Sidebar Toggles
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteSideSelect, setNoteSideSelect] = useState('Shared');
  
  // Workspace Accent State: 'Bride', 'Groom', 'Shared'
  const [activeSide, setActiveSide] = useState('Shared');
  
  // Dashboard Tabs (Initialize from URL hash if available)
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'hub';
  });

  // Keep URL hash in sync with active tab
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);
  
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

      const nsRes = await fetch('http://localhost:5000/api/needed-services', { headers });
      if (nsRes.ok) {
        const nsData = await nsRes.json();
        setNeededServices(nsData);
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
    setNeededServices([
      { _id: 'm-s1', name: 'Venue / Auditorium Booking', category: 'Venue', icon: '🏢', brideCompleted: false, groomCompleted: false },
      { _id: 'm-s2', name: 'Makeup & Grooming (Groom)', category: 'Makeup', icon: '🤵', brideCompleted: false, groomCompleted: false },
      { _id: 'm-s3', name: 'Makeup & Bridal Styling (Bride)', category: 'Makeup', icon: '💄', brideCompleted: false, groomCompleted: false },
      { _id: 'm-s4', name: 'Photo & Video Services', category: 'Photography', icon: '📸', brideCompleted: false, groomCompleted: false },
      { _id: 'm-s5', name: 'Event Planner / Decor Decorators', category: 'Decor', icon: '🎪', brideCompleted: false, groomCompleted: false },
      { _id: 'm-s6', name: 'Entertainment & Music / DJ', category: 'Music', icon: '🎵', brideCompleted: false, groomCompleted: false },
      { _id: 'm-s7', name: 'Food Catering Services', category: 'Catering', icon: '🍽️', brideCompleted: false, groomCompleted: false },
      { _id: 'm-s8', name: 'Vehicle & Transport Logistics', category: 'Others', icon: '🚗', brideCompleted: false, groomCompleted: false }
    ]);
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  useEffect(() => {
    if (activeSide === 'Shared' && user?.role !== 'Planner' && (wedding?.brideAllowsMutual === false || wedding?.groomAllowsMutual === false)) {
      setActiveSide(user?.role === 'Groom' ? 'Groom' : 'Bride');
    }
  }, [wedding?.brideAllowsMutual, wedding?.groomAllowsMutual, activeSide, user]);

  const handleUpdateVendorStatus = async (vendorId, newStatus) => {
    const original = [...vendors];
    setVendors(vendors.map(v => v._id === vendorId ? { ...v, status: newStatus } : v));

    const vendorToUpdate = vendors.find(v => v._id === vendorId);

    // Automation hook when a vendor becomes "Booked"
    if (newStatus === 'Booked' && vendorToUpdate) {
      // 1. Auto-complete matching needed service
      const matchingService = neededServices.find(s => s.name.toLowerCase() === vendorToUpdate.category.toLowerCase());
      if (matchingService) {
        const sideToUpdate = vendorToUpdate.sideVisibility === 'Shared' ? 'Both' : vendorToUpdate.sideVisibility;
        const servicePayload = {};
        if (sideToUpdate === 'Bride' || sideToUpdate === 'Both') servicePayload.brideCompleted = true;
        if (sideToUpdate === 'Groom' || sideToUpdate === 'Both') servicePayload.groomCompleted = true;

        setNeededServices(prev => prev.map(s => s._id === matchingService._id ? { ...s, ...servicePayload } : s));

        if (token !== 'mock-token') {
          try {
            await fetch(`http://localhost:5000/api/needed-services/${matchingService._id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(servicePayload)
            });
          } catch (err) {}
        }
      }

      // 2. Auto-log an expense for this vendor
      const pkg = vendorToUpdate.packages && vendorToUpdate.packages[0];
      if (pkg) {
        const title = `Booked Vendor: ${vendorToUpdate.vendorName} (${pkg.packageName})`;
        const amount = pkg.totalCost || 0;
        const category = vendorToUpdate.category;
        const paidBy = vendorToUpdate.sideVisibility;

        const expensePayload = {
          title,
          amount,
          category,
          paidBy,
          isPaid: true,
          paidDate: new Date(),
          paymentMode: 'Bank Transfer',
          balanceRemarks: 'Auto-logged from Vendor Booking',
          neededServiceId: matchingService ? matchingService._id : undefined
        };

        const fallbackExp = { _id: Date.now().toString(), ...expensePayload };
        setExpenses(prev => [...prev, fallbackExp]);

        if (token !== 'mock-token') {
          try {
            const expRes = await fetch('http://localhost:5000/api/expenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(expensePayload)
            });
            if (expRes.ok) {
              const savedExp = await expRes.json();
              setExpenses(prev => prev.map(e => e._id === fallbackExp._id ? savedExp : e));
            }
          } catch (err) {}
        }
      }
    }

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

  const handleLogVendorExpense = async (vendor) => {
    const pkg = vendor.packages && vendor.packages[0];
    const amount = pkg ? pkg.totalCost : 0;
    const title = `Logged Expense: ${vendor.vendorName} (${pkg ? pkg.packageName : 'General Package'})`;
    const category = vendor.category;
    const paidBy = vendor.sideVisibility;
    const matchingService = neededServices.find(s => s.category.toLowerCase() === vendor.category.toLowerCase());

    const payload = {
      title,
      amount,
      category,
      paidBy,
      isPaid: true,
      paidDate: new Date(),
      paymentMode: 'Bank Transfer',
      balanceRemarks: 'Logged from Vendor Card interface',
      neededServiceId: matchingService ? matchingService._id : undefined
    };

    const fallback = { _id: Date.now().toString(), ...payload };
    setExpenses(prev => [...prev, fallback]);

    if (token === 'mock-token') return;
    try {
      const res = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setExpenses(prev => prev.map(e => e._id === fallback._id ? saved : e));
      }
    } catch (err) {}
  };

  const handleToggleService = async (serviceId, checked, sideToUpdate) => {
    const isBride = sideToUpdate === 'Bride';
    const updatePayload = isBride ? { brideCompleted: checked } : { groomCompleted: checked };
    
    const original = [...neededServices];
    setNeededServices(neededServices.map(s => s._id === serviceId ? { ...s, ...updatePayload } : s));
    
    if (token === 'mock-token') return;
    try {
      const res = await fetch(`http://localhost:5000/api/needed-services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatePayload)
      });
      if (!res.ok) setNeededServices(original);
    } catch (err) {
      setNeededServices(original);
    }
  };

  const handleAddNeededService = async (name, category, icon) => {
    const fallback = { _id: Date.now().toString(), name, category, icon: icon || '🏢', brideCompleted: false, groomCompleted: false };
    setNeededServices([...neededServices, fallback]);
    
    if (token === 'mock-token') return;
    try {
      const res = await fetch('http://localhost:5000/api/needed-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, category, icon })
      });
      if (res.ok) {
        const saved = await res.json();
        setNeededServices(prev => prev.map(s => s._id === fallback._id ? saved : s));
      }
    } catch (err) {}
  };

  const handleUpdateNeededService = async (serviceId, name, category, icon) => {
    const original = [...neededServices];
    setNeededServices(neededServices.map(s => s._id === serviceId ? { ...s, name, category, icon } : s));
    
    if (token === 'mock-token') return;
    try {
      const res = await fetch(`http://localhost:5000/api/needed-services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, category, icon })
      });
      if (!res.ok) setNeededServices(original);
    } catch (err) {
      setNeededServices(original);
    }
  };

  const handleDeleteNeededService = async (serviceId) => {
    const original = [...neededServices];
    setNeededServices(neededServices.filter(s => s._id !== serviceId));
    
    if (token === 'mock-token') return;
    try {
      const res = await fetch(`http://localhost:5000/api/needed-services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) setNeededServices(original);
    } catch (err) {
      setNeededServices(original);
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
              <LogoIcon className="w-7 h-7 text-white" />
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
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Budget Target (₹)</label>
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
              className="text-xs text-indigo-655 hover:underline font-semibold"
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
    <div className="min-h-screen w-screen bg-slate-50 text-slate-800 tracking-tight antialiased flex flex-col">
      
      {/* 1. Global Responsive Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-sm shrink-0">
        
        {/* Row 1: Brand details, segmented Workspace Pill Switcher, and profile tools */}
        <div className="w-full px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <LogoIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight hidden sm:inline">WedStack</span>
          </div>

          {/* Segmented Workspace Toggles (Role-Based Filtering) */}
          <div className="hidden sm:flex bg-slate-100 p-1 border border-slate-200 rounded-xl text-[10px] font-extrabold shadow-inner">
            {user?.role !== 'Groom' && (
              <button
                onClick={() => setActiveSide('Bride')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeSide === 'Bride' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bride View
              </button>
            )}
            {wedding?.brideAllowsMutual !== false && wedding?.groomAllowsMutual !== false && (
              <button
                onClick={() => setActiveSide('Shared')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeSide === 'Shared' ? 'bg-white shadow-sm text-indigo-650' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mutual View
              </button>
            )}
            {user?.role !== 'Bride' && (
              <button
                onClick={() => setActiveSide('Groom')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeSide === 'Groom' ? 'bg-white shadow-sm text-sky-655' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Groom View
              </button>
            )}
          </div>

          {/* Compact Dropdown Switcher (Mobile Only & Role-Based Filtering) */}
          <select
            value={activeSide}
            onChange={(e) => setActiveSide(e.target.value)}
            className="sm:hidden px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 focus:outline-none shadow-xs"
          >
            {user?.role !== 'Groom' && <option value="Bride">🌸 Bride View</option>}
            {wedding?.brideAllowsMutual !== false && wedding?.groomAllowsMutual !== false && (
              <option value="Shared">🤝 Mutual View</option>
            )}
            {user?.role !== 'Bride' && <option value="Groom">🤵 Groom View</option>}
          </select>

          {/* Right Tools */}
          <div className="flex items-center gap-3">
            {wedding?.weddingCode && (
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 select-all" title="Share this code with your partner!">
                🔑 Code: <span className="font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{wedding.weddingCode}</span>
                <button onClick={copyInviteCode} className="p-0.5 text-slate-400 hover:text-slate-700">
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}

            <button
              onClick={() => setShowNotesSidebar(true)}
              className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors flex items-center gap-1 text-[10px] font-bold shadow-xs"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-50" />
              <span className="hidden sm:inline">Reminders ({notes.filter(n => !n.completed).length})</span>
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-slate-150 border border-slate-200 flex items-center justify-center text-slate-500" title={`Logged in as ${user?.name || 'Guest'}`}>
                <UserIcon className="w-4 h-4" />
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Desktop Tabs Menu (Dedicate a separate line to tabs, preventing clumping) */}
        <div className="hidden md:block border-t border-slate-100 bg-slate-50/50">
          <div className="w-full px-4 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'hub', label: 'Wedding Hub', icon: Heart },
              { id: 'inbox', label: 'AI Quote Inbox', icon: Sparkles },
              { id: 'comparison', label: 'VS Comparison Matrix', icon: ClipboardList },
              { id: 'budget', label: 'Tri-Color Budget', icon: DollarSign },
              { id: 'expenses', label: 'Expenses Log', icon: Landmark },
              { id: 'program', label: 'Program details', icon: Music },
              { id: 'timeline', label: 'Execution Timeline', icon: Clock },
              { id: 'terminal', label: 'Coordinator Portal', icon: Share2 }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              
              let activeClass = 'bg-white border border-slate-200/80 text-indigo-650 shadow-xs';
              if (isActive) {
                if (activeSide === 'Bride') activeClass = 'bg-white border border-rose-200 text-rose-600 shadow-xs';
                else if (activeSide === 'Groom') activeClass = 'bg-white border border-sky-200 text-sky-655 shadow-xs';
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive ? activeClass : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                          <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. Main Viewport Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
        <div className="w-full mx-auto">
          {activeSide === 'Shared' && user?.role !== 'Planner' && (wedding?.brideAllowsMutual === false || wedding?.groomAllowsMutual === false) ? (
            <div className="max-w-md mx-auto my-16 bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-850">Mutual View Restricted</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Mutual View collaboration requires permissions from both partners. One or both sides have set this view to private.
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase border-t border-slate-100 pt-3">
                Go to your personal workspace settings in the Wedding Hub to toggle permission.
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'hub' && (
                <WeddingHub
                  wedding={wedding}
                  vendors={vendors}
                  neededServices={neededServices}
                  token={token}
                  side={activeSide}
                  user={user}
                  timelineEvents={timelineEvents}
                  onUpdateWedding={(updated) => setWedding(updated)}
                  onUpdateTimeline={loadData}
                  onToggleService={handleToggleService}
                  onAddService={handleAddNeededService}
                  onUpdateService={handleUpdateNeededService}
                  onDeleteService={handleDeleteNeededService}
                  onNavigateToTab={(tabName, catFilter) => {
                    setActiveTab(tabName);
                    if (catFilter) setCategoryFilter(catFilter);
                  }}
                />
              )}

              {activeTab === 'inbox' && (
                <FastCaptureInbox
                  token={token}
                  side={activeSide}
                  vendors={vendors}
                  neededServices={neededServices}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  onVendorCreated={(newVendor) => setVendors([...vendors, newVendor])}
                  onUpdateVendorStatus={handleUpdateVendorStatus}
                  onLogVendorExpense={handleLogVendorExpense}
                />
              )}
              
              {activeTab === 'comparison' && (
                <VendorMatrix vendors={vendors} />
              )}

              {activeTab === 'budget' && (
                <CollaborativeBudget
                  wedding={wedding}
                  vendors={vendors}
                  expenses={expenses}
                  token={token}
                  side={activeSide}
                  user={user}
                  onUpdateWedding={(updated) => setWedding(updated)}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpenseManager
                  expenses={expenses}
                  token={token}
                  side={activeSide}
                  user={user}
                  wedding={wedding}
                  neededServices={neededServices}
                  onUpdateWedding={(updated) => setWedding(updated)}
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
            </>
          )}
        </div>
      </main>

      {/* 3. Mobile Fixed Bottom Navigation Bar (Shown only on small screens) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 flex items-center justify-around py-2.5 px-2 shadow-lg shrink-0">
        {[
          { id: 'hub', label: 'Hub', icon: Heart },
          { id: 'inbox', label: 'AI Inbox', icon: Sparkles },
          { id: 'comparison', label: 'Vs Matrix', icon: ClipboardList },
          { id: 'budget', label: 'Budget', icon: DollarSign },
          { id: 'expenses', label: 'Expense', icon: Landmark },
          { id: 'program', label: 'Details', icon: Music },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'terminal', label: 'Portal', icon: Share2 }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          
          let activeText = 'text-indigo-600';
          if (isActive) {
            if (activeSide === 'Bride') activeText = 'text-rose-600';
            else if (activeSide === 'Groom') activeText = 'text-sky-600';
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
                isActive ? `${activeText} font-extrabold scale-105` : 'text-slate-400 font-semibold'
              }`}
            >
              <TabIcon className="w-4.5 h-4.5" />
              <span className="text-[9px] tracking-tight leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scratchpad Reminders drawer */}
      {showNotesSidebar && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity"
            onClick={() => setShowNotesSidebar(false)}
          ></div>
          
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 z-20">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-100" />
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Brain Dump Notes</h3>
              </div>
              <button 
                onClick={() => setShowNotesSidebar(false)}
                className="text-slate-405 text-slate-400 hover:text-slate-655 font-bold text-sm p-1 rounded-md hover:bg-slate-150"
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
