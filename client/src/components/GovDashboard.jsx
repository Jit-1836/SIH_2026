import React, { useState, useEffect } from 'react';
import { 
  MapPin, AlertOctagon, ShieldAlert, Users, Package, 
  Search, Send, CheckCircle2, RefreshCw, AlertTriangle, 
  Building2, Radio, Filter, Plus, Flame, Lock, Volume2
} from 'lucide-react';
import IncidentMap from './IncidentMap';
import FaceMatchModule from './FaceMatchModule';
import { socket } from '../services/socket';

// Guaranteed Default Initial Seed Data for Government Command Center
const DEFAULT_ALERTS = [
  {
    id: "SOS-101",
    victim_name: "Rahul Sharma",
    phone: "+91 98765 43210",
    lat: 20.2961,
    lng: 85.8245,
    location_name: "Sector 4, Near Metro Pillar 42",
    category: "Voice SOS Locked Phone",
    urgency: "Critical",
    victim_count: 3,
    details: "⚡ Locked Phone Voice SOS: Victim screamed 'HELP HELP!' while phone was locked. Trapped under collapsed concrete beam.",
    trigger_type: "Voice_SOS_LockedPhone",
    status: "Pending",
    dispatch_team: null,
    timestamp: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: "SOS-102",
    victim_name: "Priya Das",
    phone: "+91 91234 56789",
    lat: 20.2995,
    lng: 85.8210,
    location_name: "River Ghat Road, House #14",
    category: "Water Rising",
    urgency: "Critical",
    victim_count: 5,
    details: "Water reached 1st floor balcony. Need NDRF boat evacuation immediately. 1 infant present.",
    trigger_type: "Manual",
    status: "Dispatched",
    dispatch_team: "NDRF Boat Unit 2",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: "SOS-103",
    victim_name: "Amitabh Swain",
    phone: "+91 94370 11223",
    lat: 20.2910,
    lng: 85.8350,
    location_name: "Block B, Janpath Enclave",
    category: "Medical",
    urgency: "High",
    victim_count: 2,
    details: "Elderly diabetic patient requires urgent insulin and oxygen cylinder replacement.",
    trigger_type: "Manual",
    status: "Pending",
    dispatch_team: null,
    timestamp: new Date(Date.now() - 25 * 60000).toISOString()
  },
  {
    id: "SOS-104",
    victim_name: "Sunita Mohanty",
    phone: "+91 99381 99887",
    lat: 20.2880,
    lng: 85.8180,
    location_name: "Community Center Ground",
    category: "Food/Water",
    urgency: "Moderate",
    victim_count: 14,
    details: "Drinking water completely depleted. Requesting 50 water bottles and emergency dry ration packets.",
    trigger_type: "Manual",
    status: "Resolved",
    dispatch_team: "Civil Defense Squad 4",
    timestamp: new Date(Date.now() - 60 * 60000).toISOString()
  },
  {
    id: "SOS-105",
    victim_name: "Vikramaditya Roy",
    phone: "+91 98300 44556",
    lat: 20.3040,
    lng: 85.8290,
    location_name: "Acharya Vihar Bridge, West End",
    category: "Trapped/Structural Collapse",
    urgency: "Critical",
    victim_count: 4,
    details: "Voice distress detection triggered background alert. Vehicle submerged under overpass wall collapse.",
    trigger_type: "Voice_SOS_LockedPhone",
    status: "Dispatched",
    dispatch_team: "NDRF Team Alpha",
    timestamp: new Date(Date.now() - 8 * 60000).toISOString()
  },
  {
    id: "SOS-106",
    victim_name: "Meenakshi Pattnaik",
    phone: "+91 97760 33441",
    lat: 20.2780,
    lng: 85.8420,
    location_name: "Old Town Canal Colony",
    category: "Water Rising",
    urgency: "High",
    victim_count: 8,
    details: "Current fast rising near embankment breach. 3 elderly citizens unable to wade through 4ft water.",
    trigger_type: "Manual",
    status: "Pending",
    dispatch_team: null,
    timestamp: new Date(Date.now() - 35 * 60000).toISOString()
  },
  {
    id: "SOS-107",
    victim_name: "Deepak Pradhan",
    phone: "+91 94371 88220",
    lat: 20.3120,
    lng: 85.8150,
    location_name: "Patia Station Road, Market Complex",
    category: "Medical",
    urgency: "High",
    victim_count: 1,
    details: "Fractured leg due to roof tile impact. Bleeding controlled, requires stretcher transport.",
    trigger_type: "Manual",
    status: "Pending",
    dispatch_team: null,
    timestamp: new Date(Date.now() - 45 * 60000).toISOString()
  },
  {
    id: "SOS-108",
    victim_name: "Kabita Behera",
    phone: "+91 91780 66778",
    lat: 20.2690,
    lng: 85.8310,
    location_name: "Samantarapur Primary School",
    category: "Food/Water",
    urgency: "Moderate",
    victim_count: 22,
    details: "22 school children sheltered in 2nd floor classroom. Running low on food supplies and infant milk powder.",
    trigger_type: "Manual",
    status: "Pending",
    dispatch_team: null,
    timestamp: new Date(Date.now() - 70 * 60000).toISOString()
  }
];

const DEFAULT_CAMPS = [
  {
    id: "CAMP-101",
    name: "Kalinga Stadium Relief Center",
    location: "Gate 3, Kalinga Complex, BBSR",
    lat: 20.2875,
    lng: 85.8280,
    capacity: 800,
    current_occupancy: 645,
    food_stock_pkts: 1950,
    water_stock_liters: 3400,
    first_aid_kits: 160,
    blankets: 500,
    contact_person: "Capt. R. K. Patnaik (+91 94370 00111)",
    status: "Operational"
  },
  {
    id: "CAMP-102",
    name: "DAV Public School Shelter",
    location: "Unit 8, Main Campus",
    lat: 20.2940,
    lng: 85.8190,
    capacity: 350,
    current_occupancy: 342,
    food_stock_pkts: 190, // Low stock alert trigger (< 1 pkt per head per day)
    water_stock_liters: 280, // Low stock alert trigger
    first_aid_kits: 18,
    blankets: 65,
    contact_person: "Dr. S. N. Sahoo (+91 98610 22334)",
    status: "Warning"
  },
  {
    id: "CAMP-103",
    name: "Utkal University Indoor Gym",
    location: "Vani Vihar Campus",
    lat: 20.3010,
    lng: 85.8410,
    capacity: 500,
    current_occupancy: 230,
    food_stock_pkts: 1350,
    water_stock_liters: 2400,
    first_aid_kits: 110,
    blankets: 360,
    contact_person: "Prof. M. B. Ray (+91 94382 55443)",
    status: "Operational"
  },
  {
    id: "CAMP-104",
    name: "Bhubaneswar Railway Colony Hall",
    location: "Master Canteen Area",
    lat: 20.2660,
    lng: 85.8390,
    capacity: 600,
    current_occupancy: 588,
    food_stock_pkts: 210, // Low stock alert trigger
    water_stock_liters: 390, // Low stock alert trigger
    first_aid_kits: 28,
    blankets: 120,
    contact_person: "Officer J. K. Jena (+91 97771 88990)",
    status: "Warning"
  },
  {
    id: "CAMP-105",
    name: "Capital High School Relief Complex",
    location: "Unit 3, Near Secretariat",
    lat: 20.2750,
    lng: 85.8230,
    capacity: 450,
    current_occupancy: 310,
    food_stock_pkts: 1100,
    water_stock_liters: 1900,
    first_aid_kits: 85,
    blankets: 290,
    contact_person: "Mrs. Arati Mohanty (+91 94372 99112)",
    status: "Operational"
  }
];

const DEFAULT_VICTIMS = [
  {
    id: "VIC-901",
    camp_id: "CAMP-101",
    name: "Aarav Mishra",
    age: 28,
    gender: "Male",
    family_head: "Rajesh Mishra",
    origin: "Nayapalli Sector 3",
    medical_needs: "Minor cuts, tetanus shot done",
    ration_token: "RATION-C101-901",
    registered_at: new Date(Date.now() - 360 * 60000).toISOString(),
    photo_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "VIC-902",
    camp_id: "CAMP-101",
    name: "Sneha Mishra",
    age: 26,
    gender: "Female",
    family_head: "Rajesh Mishra",
    origin: "Nayapalli Sector 3",
    medical_needs: "None",
    ration_token: "RATION-C101-902",
    registered_at: new Date(Date.now() - 350 * 60000).toISOString(),
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "VIC-903",
    camp_id: "CAMP-102",
    name: "Ramesh Jena",
    age: 54,
    gender: "Male",
    family_head: "Ramesh Jena",
    origin: "Old Town, River Colony",
    medical_needs: "High BP medicine needed",
    ration_token: "RATION-C102-903",
    registered_at: new Date(Date.now() - 180 * 60000).toISOString(),
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "VIC-904",
    camp_id: "CAMP-103",
    name: "Ananya Behera",
    age: 19,
    gender: "Female",
    family_head: "Bikash Behera",
    origin: "Acharya Vihar",
    medical_needs: "Dehydration - IV fluids given",
    ration_token: "RATION-C103-904",
    registered_at: new Date(Date.now() - 90 * 60000).toISOString(),
    photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "VIC-905",
    camp_id: "CAMP-104",
    name: "Sanjay Kumar Swain",
    age: 42,
    gender: "Male",
    family_head: "Sanjay Kumar Swain",
    origin: "Master Canteen Ward 4",
    medical_needs: "Asthma inhaler prescribed",
    ration_token: "RATION-C104-905",
    registered_at: new Date(Date.now() - 120 * 60000).toISOString(),
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "VIC-906",
    camp_id: "CAMP-105",
    name: "Pooja Mohapatra",
    age: 31,
    gender: "Female",
    family_head: "Manish Mohapatra",
    origin: "Unit 3 Housing Board",
    medical_needs: "Prenatal checkup completed",
    ration_token: "RATION-C105-906",
    registered_at: new Date(Date.now() - 45 * 60000).toISOString(),
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
  }
];

export default function GovDashboard({ isConnected, officer }) {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'triage' | 'camps' | 'face_search'

  // Pre-populated Default States
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [camps, setCamps] = useState(DEFAULT_CAMPS);
  const [victims, setVictims] = useState(DEFAULT_VICTIMS);

  const [triageFilter, setTriageFilter] = useState('ALL');

  useEffect(() => {
    fetchAllData();

    socket.on('victim_sos_received', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id)]);
    });

    socket.on('sos_status_updated', (updated) => {
      setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a));
    });

    socket.on('camp_updated', (updatedCamp) => {
      setCamps(prev => prev.map(c => c.id === updatedCamp.id ? updatedCamp : c));
    });

    socket.on('victim_registered', (newVictim) => {
      setVictims(prev => [newVictim, ...prev]);
    });

    return () => {
      socket.off('victim_sos_received');
      socket.off('sos_status_updated');
      socket.off('camp_updated');
      socket.off('victim_registered');
    };
  }, []);

  const fetchAllData = async () => {
    try {
      const [sosRes, campsRes, vicRes] = await Promise.all([
        fetch('/api/sos'),
        fetch('/api/camps'),
        fetch('/api/victims')
      ]);
      const sosData = await sosRes.json();
      const campsData = await campsRes.json();
      const vicData = await vicRes.json();

      if (Array.isArray(sosData) && sosData.length > 0) setAlerts(sosData);
      if (Array.isArray(campsData) && campsData.length > 0) setCamps(campsData);
      if (Array.isArray(vicData) && vicData.length > 0) setVictims(vicData);
    } catch (err) {
      console.warn("Using default pre-populated emergency dataset");
    }
  };

  const handleStatusUpdate = (id, newStatus, teamName = null) => {
    socket.emit('update_sos_status', { id, status: newStatus, dispatch_team: teamName });
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: newStatus, dispatch_team: teamName || a.dispatch_team };
      }
      return a;
    }));
  };

  const handleCampStockSubmit = (campId, stockUpdates) => {
    socket.emit('camp_stock_update', { camp_id: campId, stockUpdates });
    setCamps(prev => prev.map(c => c.id === campId ? { ...c, ...stockUpdates } : c));
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const rank = { 'Critical': 3, 'High': 2, 'Moderate': 1 };
    return (rank[b.urgency] || 0) - (rank[a.urgency] || 0);
  });

  const filteredAlerts = sortedAlerts.filter(a => {
    if (triageFilter === 'ALL') return true;
    if (triageFilter === 'Critical') return a.urgency === 'Critical';
    return a.status === triageFilter;
  });

  const totalSheltered = camps.reduce((acc, c) => acc + (c.current_occupancy || 0), 0);
  const criticalCount = alerts.filter(a => a.urgency === 'Critical' && a.status !== 'Resolved').length;
  const lowStockCampsCount = camps.filter(c => c.status === 'Warning' || (c.food_stock_pkts / (c.current_occupancy || 1)) < 1.0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* KPI Highlight Header Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Active SOS Alerts</p>
            <h3 className="text-3xl font-black text-white font-mono mt-1">{alerts.filter(a => a.status !== 'Resolved').length}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{criticalCount} Critical Level</p>
          </div>
          <div className="p-3 bg-red-500/20 rounded-2xl text-red-400 animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Shelter Occupants</p>
            <h3 className="text-3xl font-black text-white font-mono mt-1">{totalSheltered}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{camps.length} Operating Camps</p>
          </div>
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
            <Users className="w-8 h-8" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Camp Supply Alerts</p>
            <h3 className="text-3xl font-black text-white font-mono mt-1">{lowStockCampsCount}</h3>
            <p className="text-[11px] text-amber-300 font-semibold mt-0.5">&lt; 24h Buffer Deficit</p>
          </div>
          <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400">
            <Package className="w-8 h-8" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Refugee Records</p>
            <h3 className="text-3xl font-black text-white font-mono mt-1">{victims.length}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Face Photos Saved</p>
          </div>
          <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400">
            <Radio className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'map' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" /> Live Incident Map
          </button>
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'triage' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Triage Queue ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('camps')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'camps' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> Camp Supply Logistics ({camps.length})
          </button>
          <button
            onClick={() => setActiveTab('face_search')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'face_search' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" /> Facial Match Tracer ({victims.length})
          </button>
        </div>

        <button
          onClick={fetchAllData}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Telemetry
        </button>
      </div>

      {/* SECTION 1: INTERACTIVE LIVE MAP & LIVE TELEMETRY FEED */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
          <div className="lg:col-span-2 h-full">
            <IncidentMap alerts={alerts} onDispatchUpdate={handleStatusUpdate} />
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800 h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500 animate-pulse" /> Live Telemetry Feed
              </h4>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                REALTIME ({alerts.length} signals)
              </span>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    alert.urgency === 'Critical' 
                      ? 'bg-red-950/40 border-red-500/40 text-red-200' 
                      : alert.urgency === 'High' 
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-[11px] flex items-center gap-1.5">
                      {alert.trigger_type && alert.trigger_type.includes('Voice') && (
                        <Lock className="w-3 h-3 text-red-400 animate-pulse" />
                      )}
                      {alert.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      alert.urgency === 'Critical' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {alert.urgency}
                    </span>
                  </div>
                  <p className="font-bold text-slate-100">{alert.victim_name} ({alert.category})</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{alert.details}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                    <span className="font-mono text-cyan-400">GPS: {alert.lat}, {alert.lng}</span>
                    <span className="text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PRIORITY SOS TRIAGE QUEUE TABLE */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 uppercase">Filter Triage Queue:</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {['ALL', 'Critical', 'Pending', 'Dispatched', 'Resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTriageFilter(f)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    triageFilter === f ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="p-3.5">Urgency & ID</th>
                    <th className="p-3.5">Victim Telemetry</th>
                    <th className="p-3.5">Category & Details</th>
                    <th className="p-3.5">GPS Location</th>
                    <th className="p-3.5">Assigned Team</th>
                    <th className="p-3.5">Status & Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${
                            alert.urgency === 'Critical' ? 'bg-red-500 animate-ping' : alert.urgency === 'High' ? 'bg-orange-500' : 'bg-amber-400'
                          }`} />
                          <div>
                            <span className="font-mono font-bold text-slate-200">{alert.id}</span>
                            <p className="text-[10px] text-slate-500 font-semibold">{alert.urgency}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-bold text-slate-100">{alert.victim_name}</p>
                        <p className="text-[11px] text-slate-400">{alert.phone || 'No Phone'}</p>
                        <p className="text-[10px] text-cyan-400 font-mono">👥 {alert.victim_count || 1} victims</p>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[11px] flex items-center gap-1 w-fit">
                          {alert.trigger_type && alert.trigger_type.includes('Voice') && <Lock className="w-3 h-3 text-red-400" />}
                          {alert.category}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alert.details}</p>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-300">
                        <p>{alert.lat}, {alert.lng}</p>
                        <span className="text-[10px] text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </td>

                      <td className="p-3.5">
                        <select
                          value={alert.dispatch_team || ''}
                          onChange={(e) => handleStatusUpdate(alert.id, alert.status, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="">-- Assign Team --</option>
                          <option value="NDRF Team Alpha">NDRF Team Alpha</option>
                          <option value="NDRF Team Beta">NDRF Team Beta</option>
                          <option value="Medical Boat 1">Medical Boat 1</option>
                          <option value="Air Rescue Squad">Air Rescue Squad</option>
                        </select>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(alert.id, 'Dispatched', alert.dispatch_team || 'NDRF Unit 1')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              alert.status === 'Dispatched' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-amber-600 hover:text-white'
                            }`}
                          >
                            Dispatched
                          </button>

                          <button
                            onClick={() => handleStatusUpdate(alert.id, 'Resolved', alert.dispatch_team)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              alert.status === 'Resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            Resolved
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: RELIEF CAMP SUPPLY LOGISTICS */}
      {activeTab === 'camps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {camps.map((camp) => {
            const occupancyPct = Math.round((camp.current_occupancy / camp.capacity) * 100);
            const foodBufferHours = Math.round((camp.food_stock_pkts / (camp.current_occupancy || 1)) * 24);
            const isStockWarning = camp.status === 'Warning' || foodBufferHours < 24;

            return (
              <div key={camp.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
                {isStockWarning && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> &lt; 24H BUFFER DEFICIT
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-100 text-base">{camp.name}</h4>
                      <span className="font-mono text-xs text-cyan-400 font-bold">{camp.id}</span>
                    </div>
                    <p className="text-xs text-slate-400">{camp.location}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Shelter Occupancy:</span>
                      <span className={`font-mono ${occupancyPct > 90 ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                        {camp.current_occupancy} / {camp.capacity} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full ${occupancyPct > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 space-y-1">
                      <span className="text-slate-400">🍲 Food Packets</span>
                      <p className="font-bold text-slate-100 font-mono text-sm">{camp.food_stock_pkts} Pkts</p>
                      <p className={`text-[10px] ${foodBufferHours < 24 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                        ~{foodBufferHours} Hours Buffer
                      </p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 space-y-1">
                      <span className="text-slate-400">💧 Drinking Water</span>
                      <p className="font-bold text-slate-100 font-mono text-sm">{camp.water_stock_liters} Liters</p>
                      <p className="text-[10px] text-cyan-400 font-mono">
                        Calculated demand
                      </p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 space-y-1">
                      <span className="text-slate-400">🩹 First-Aid Kits</span>
                      <p className="font-bold text-slate-100 font-mono text-sm">{camp.first_aid_kits} Kits</p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 space-y-1">
                      <span className="text-slate-400">🛋️ Blankets</span>
                      <p className="font-bold text-slate-100 font-mono text-sm">{camp.blankets} Units</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCampStockSubmit(camp.id, {
                    food_stock_pkts: camp.food_stock_pkts + 500,
                    water_stock_liters: camp.water_stock_liters + 1000
                  })}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4 text-emerald-400" /> Replenish Stock (+500 Food / +1000L Water)
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 4: FACIAL MATCH TRACER */}
      {activeTab === 'face_search' && (
        <FaceMatchModule registeredVictims={victims} />
      )}
    </div>
  );
}
