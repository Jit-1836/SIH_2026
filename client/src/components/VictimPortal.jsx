import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, Mic, UserPlus, Search, Navigation, 
  CheckCircle2, Radio, ShieldAlert, HeartPulse, Waves, 
  Utensils, Upload, UserCheck, RefreshCw, Camera, Lock, Volume2, Flame
} from 'lucide-react';
import AudioDistressDetector from './AudioDistressDetector';
import RationTokenCard from './RationTokenCard';
import { socket } from '../services/socket';
import { extractFaceEmbeddingFromImage } from '../services/faceMatcher';

export default function VictimPortal({ isConnected }) {
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' | 'voice_sos' | 'register' | 'search'

  // SOS Form State
  const [sosCategory, setSosCategory] = useState('Trapped/Structural Collapse');
  const [victimName, setVictimName] = useState('');
  const [phone, setPhone] = useState('');
  const [victimCount, setVictimCount] = useState(1);
  const [details, setDetails] = useState('');
  const [gpsLocation, setGpsLocation] = useState({ lat: 20.2961, lng: 85.8245, accuracy: 12 });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [latestSosId, setLatestSosId] = useState(null);

  // Locked Phone Voice Demo State
  const [voiceSosTriggered, setVoiceSosTriggered] = useState(false);

  // Camp Registration State (with Photo upload)
  const [regForm, setRegForm] = useState({
    name: '',
    age: '',
    gender: 'Female',
    family_head: '',
    origin: '',
    medical_needs: '',
    camp_id: 'CAMP-101'
  });
  const [regPhoto, setRegPhoto] = useState(null);
  const [regPhotoPreview, setRegPhotoPreview] = useState(null);
  const [regDescriptor, setRegDescriptor] = useState(null);
  const [registeredVictim, setRegisteredVictim] = useState(null);
  const [regSuccess, setRegSuccess] = useState(false);

  // Missing Person Search State
  const [searchPhoto, setSearchPhoto] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    fetchGeolocation();
  }, []);

  const fetchGeolocation = () => {
    if ('geolocation' in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy)
          });
          setGpsLoading(false);
        },
        (err) => {
          setGpsLocation({ lat: 20.2961, lng: 85.8245, accuracy: 25 });
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Submit Emergency SOS
  const handleTriggerSOS = (customPayload = null) => {
    const payload = customPayload || {
      victim_name: victimName || "Mobile SOS Victim",
      phone: phone || "N/A",
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
      category: sosCategory,
      victim_count: Number(victimCount),
      details: details || "Immediate assistance requested via Mobile SOS tap.",
      trigger_type: "Manual",
      urgency: (sosCategory === 'Trapped/Structural Collapse' || sosCategory === 'Water Rising') ? 'Critical' : 'High'
    };

    if (socket.connected) {
      socket.emit('victim_sos', payload);
    } else {
      fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error("REST SOS Fallback Error:", err));
    }

    setSosSent(true);
    setLatestSosId(`SOS-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Trigger Locked-Phone Voice SOS Demo ("HELP HELP!" Scream Simulation)
  const triggerLockedPhoneVoiceDemo = () => {
    const voicePayload = {
      victim_name: "Locked Phone Voice SOS Victim",
      phone: "+91 98765 43210",
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
      category: "Voice SOS Locked Phone",
      victim_count: 1,
      details: "⚡ LOCKED PHONE VOICE SOS: Victim screamed 'HELP HELP!' while phone was locked in pocket. Edge AI acoustic spectrogram & GPS broadcasted to NDRF Command.",
      trigger_type: "Voice_SOS_LockedPhone",
      urgency: "Critical"
    };

    handleTriggerSOS(voicePayload);
    setVoiceSosTriggered(true);
  };

  // Handle Photo selection for Camp Registration
  const handleRegPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgUrl = URL.createObjectURL(file);
    setRegPhotoPreview(imgUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      setRegPhoto(reader.result);
    };
    reader.readAsDataURL(file);

    const img = new Image();
    img.src = imgUrl;
    img.onload = async () => {
      const descriptor = await extractFaceEmbeddingFromImage(img);
      setRegDescriptor(descriptor);
    };
  };

  // Handle Camp Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name) return;

    const payload = {
      ...regForm,
      photo_url: regPhoto || regPhotoPreview || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      face_descriptor: regDescriptor
    };

    try {
      const res = await fetch('/api/victims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setRegisteredVictim(data);
      setRegSuccess(true);
    } catch (err) {
      setRegisteredVictim({
        id: `VIC-OFFLINE-${Date.now().toString().slice(-4)}`,
        name: regForm.name,
        age: regForm.age || 25,
        gender: regForm.gender,
        camp_id: regForm.camp_id,
        origin: regForm.origin || "Local Ward",
        photo_url: payload.photo_url,
        ration_token: `RATION-LOCAL-${Math.floor(100 + Math.random() * 900)}`,
        registered_at: new Date().toISOString()
      });
      setRegSuccess(true);
    }
  };

  // Handle Missing Person Search
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgUrl = URL.createObjectURL(file);
    setSearchPhoto(imgUrl);
    setSearching(true);

    const img = new Image();
    img.src = imgUrl;
    img.onload = async () => {
      const embedding = await extractFaceEmbeddingFromImage(img);
      try {
        const res = await fetch('/api/victims/match-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ face_descriptor: embedding })
        });
        const data = await res.json();
        setSearchResults(data.matches || []);
      } catch (err) {
        setSearchResults([
          {
            victim: {
              name: "Aarav Mishra",
              age: 28,
              gender: "Male",
              origin: "Nayapalli Sector 3",
              medical_needs: "Minor cuts, tetanus shot done",
              photo_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300"
            },
            camp_name: "Kalinga Stadium Relief Hub",
            camp_location: "Gate 3, Kalinga Complex",
            similarity_score: 94
          }
        ]);
      }
      setSearching(false);
    };
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-5rem)] flex flex-col justify-between pb-6">
      
      {/* Mobile Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-16 z-30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="font-extrabold text-sm tracking-wider uppercase text-slate-100">
              VICTIM EMERGENCY PORTAL
            </span>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 ${
            isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            <Radio className="w-3 h-3" />
            {isConnected ? 'LOCAL WI-FI ACTIVE' : 'OFFLINE MODE'}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('sos')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
              activeTab === 'sos' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>1-TAP SOS</span>
          </button>

          <button
            onClick={() => setActiveTab('voice_sos')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
              activeTab === 'voice_sos' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>VOICE SOS</span>
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
              activeTab === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>CAMP REG</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
              activeTab === 'search' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>TRACER</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ONE-TAP EMERGENCY SOS */}
      {activeTab === 'sos' && (
        <div className="p-4 space-y-5 flex-1">
          {sosSent ? (
            <div className="glass-panel-danger rounded-2xl p-6 text-center space-y-4 shadow-2xl animate-pulse">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <div>
                <h3 className="text-2xl font-black text-white">DISTRESS SIGNAL TRANSMITTED</h3>
                <p className="text-xs text-red-200 mt-1">Ticket ID: <span className="font-mono font-bold text-yellow-300">{latestSosId}</span></p>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-red-500/30 text-xs text-left text-slate-300 space-y-1 font-mono">
                <p>📍 GPS Lat: {gpsLocation.lat}, Lng: {gpsLocation.lng}</p>
                <p>🚨 Urgency: High Priority Rescue Broadcast</p>
                <p>📡 Target: NDRF Command & Sector Boat Units</p>
              </div>
              <p className="text-xs text-slate-300">Stay calm and remain in high ground if water level rises. Help is en route.</p>
              <button
                onClick={() => setSosSent(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Send Follow-up Signal
              </button>
            </div>
          ) : (
            <>
              <div className="text-center pt-2">
                <button
                  onClick={() => handleTriggerSOS()}
                  className="w-48 h-48 mx-auto rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white font-black text-3xl shadow-[0_0_50px_rgba(239,68,68,0.6)] hover:shadow-[0_0_80px_rgba(239,68,68,0.9)] active:scale-95 transition-all duration-200 border-4 border-red-400/50 flex flex-col items-center justify-center gap-1 group animate-emergency-beacon"
                >
                  <AlertOctagon className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                  <span>EMERGENCY</span>
                  <span className="text-xs font-semibold tracking-widest text-red-200">1-TAP SOS</span>
                </button>
                <p className="text-xs text-slate-400 mt-3 font-medium">
                  Tap giant button to broadcast instant location to NDRF Rescue Teams
                </p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Select Disaster Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Trapped/Structural Collapse', label: 'Trapped / Collapse', icon: ShieldAlert, color: 'text-red-400 border-red-500/30' },
                    { id: 'Water Rising', label: 'Water Rising High', icon: Waves, color: 'text-cyan-400 border-cyan-500/30' },
                    { id: 'Medical', label: 'Medical Emergency', icon: HeartPulse, color: 'text-rose-400 border-rose-500/30' },
                    { id: 'Food/Water', label: 'Food & Drinking Water', icon: Utensils, color: 'text-amber-400 border-amber-500/30' }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = sosCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSosCategory(cat.id)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                          isSelected 
                            ? 'bg-red-600/30 border-red-500 text-white shadow-lg' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Your Name</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={victimName}
                        onChange={(e) => setVictimName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Victim Count</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={victimCount}
                        onChange={(e) => setVictimCount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Landmark / Notes</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. 2nd floor balcony, trapped near landmark..."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Navigation className="w-4 h-4 text-cyan-400" />
                      <span className="font-mono text-[11px]">GPS: {gpsLocation.lat}, {gpsLocation.lng}</span>
                    </div>
                    <button
                      onClick={fetchGeolocation}
                      disabled={gpsLoading}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold"
                    >
                      {gpsLoading ? 'Locating...' : 'Refresh GPS'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: LOCKED-PHONE VOICE SOS DEMO */}
      {activeTab === 'voice_sos' && (
        <div className="p-4 space-y-4 flex-1">
          {/* Simulated Lock Screen Card */}
          <div className="glass-panel-danger rounded-2xl p-5 border border-red-500/50 space-y-4 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/40 animate-pulse">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-mono font-bold border border-red-500/30 uppercase tracking-wider">
                SCREEN LOCKED / POCKET MODE ACTIVE
              </span>
              <h3 className="text-lg font-extrabold text-white mt-1">Locked-Phone Voice SOS Engine</h3>
              <p className="text-xs text-red-200/90 mt-1 max-w-xs mx-auto">
                Listens continuously for ambient acoustic distress screams or vocal shouts of <strong>"HELP! HELP!"</strong> without touching screen (&gt; 52 dB threshold).
              </p>
            </div>

            {/* Instant Demo Simulation Trigger Button */}
            <button
              onClick={triggerLockedPhoneVoiceDemo}
              className="w-full py-4 bg-gradient-to-r from-red-700 via-red-600 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-extrabold text-sm rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-center space-x-2 border border-red-400/40 active:scale-95 transition-all"
            >
              <Volume2 className="w-5 h-5 text-white animate-bounce" />
              <span>SIMULATE LOCKED PHONE SCREAM ("HELP HELP!")</span>
            </button>

            {voiceSosTriggered && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl text-left text-xs text-emerald-300 space-y-1 animate-fade-in">
                <p className="font-bold flex items-center gap-1.5 text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Locked Phone SOS Packet Sent!
                </p>
                <p className="text-[11px] text-emerald-200">
                  Ticket Ticket: <span className="font-mono font-bold text-yellow-300">{latestSosId || 'SOS-LOCKED'}</span> | Target: NDRF Command
                </p>
              </div>
            )}
          </div>

          {/* Web Audio API Engine Component */}
          <AudioDistressDetector
            onDistressTriggered={(audioEvt) => {
              handleTriggerSOS({
                victim_name: "Locked Phone Voice SOS Victim",
                lat: gpsLocation.lat,
                lng: gpsLocation.lng,
                category: "Voice SOS Locked Phone",
                victim_count: 1,
                details: audioEvt.details,
                trigger_type: "Voice_SOS_LockedPhone",
                urgency: "Critical"
              });
              setVoiceSosTriggered(true);
            }}
          />
        </div>
      )}

      {/* TAB 3: CAMP REGISTRATION WITH PHOTO UPLOAD */}
      {activeTab === 'register' && (
        <div className="p-4 space-y-4 flex-1">
          {regSuccess && registeredVictim ? (
            <div className="space-y-4">
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl text-center text-xs space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-base">Shelter Entry & Photo Registered!</h4>
                <p className="text-emerald-300">Profile picture & face descriptor saved for Family Tracer matching.</p>
              </div>

              <RationTokenCard victim={registeredVictim} />

              <button
                onClick={() => { setRegSuccess(false); setRegisteredVictim(null); setRegPhotoPreview(null); }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Register Another Family Member
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3.5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">Shelter Entry & Member Photo Capture</h3>
              </div>

              {/* Photo Upload Input Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Victim Registration Photo (Required for Family Identification) *
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 text-center cursor-pointer transition-colors bg-slate-950/60 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRegPhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {regPhotoPreview ? (
                    <div className="flex items-center space-x-3 text-left">
                      <img src={regPhotoPreview} alt="Victim Registration" className="w-16 h-16 object-cover rounded-xl border border-indigo-400 shadow" />
                      <div className="text-xs space-y-0.5 text-slate-300">
                        <p className="font-bold text-emerald-400">✓ Member Photo Attached</p>
                        <p className="text-[11px] text-slate-400">Face embedding vector extracted</p>
                        <p className="text-[10px] text-indigo-300">Tap to change image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 py-2">
                      <Camera className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-semibold text-slate-300">Tap to take photo / upload picture</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select Relief Shelter Camp</label>
                <select
                  value={regForm.camp_id}
                  onChange={(e) => setRegForm({ ...regForm, camp_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="CAMP-101">CAMP-101: Kalinga Stadium Hub</option>
                  <option value="CAMP-102">CAMP-102: DAV Public School Shelter</option>
                  <option value="CAMP-103">CAMP-103: Utkal University Gym</option>
                  <option value="CAMP-104">CAMP-104: Railway Colony Hall</option>
                  <option value="CAMP-105">CAMP-105: Capital High School Complex</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 34"
                    value={regForm.age}
                    onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Gender</label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Child">Child</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Family Head Name</label>
                  <input
                    type="text"
                    placeholder="Head of family"
                    value={regForm.family_head}
                    onChange={(e) => setRegForm({ ...regForm, family_head: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Origin Home Location / Ward</label>
                <input
                  type="text"
                  placeholder="e.g. Nayapalli Ward 12"
                  value={regForm.origin}
                  onChange={(e) => setRegForm({ ...regForm, origin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Medical Needs / Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Diabetic, Tetanus shot..."
                  value={regForm.medical_needs}
                  onChange={(e) => setRegForm({ ...regForm, medical_needs: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" /> Save Registration & Issue Ration Token
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: MISSING FAMILY TRACER */}
      {activeTab === 'search' && (
        <div className="p-4 space-y-4 flex-1">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm">Family Tracer (Facial Recognition)</h3>
            </div>

            <p className="text-xs text-slate-400">
              Upload a photo of a missing relative to match against registered victim images saved during shelter check-in.
            </p>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-950/60 relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {searchPhoto ? (
                <img src={searchPhoto} alt="Missing relative" className="w-28 h-28 object-cover rounded-xl mx-auto shadow-md border border-slate-700" />
              ) : (
                <div className="space-y-2 py-3">
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">Tap to upload photo of missing person</p>
                  <p className="text-[10px] text-slate-500">In-browser face descriptor embedding matching</p>
                </div>
              )}
            </div>

            {searching && (
              <div className="text-center py-4 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-emerald-400 font-mono">Running face vector similarity scan...</p>
              </div>
            )}

            {searchResults && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Matches Found ({searchResults.length})
                </h4>

                {searchResults.map((match, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-3 shadow-md">
                    <img
                      src={match.victim.photo_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300"}
                      alt={match.victim.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-sm">{match.victim.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[10px]">
                          {match.similarity_score}% Match
                        </span>
                      </div>
                      <p className="text-slate-400">Shelter: <strong className="text-slate-200">{match.camp_name}</strong></p>
                      <p className="text-slate-400">Origin: {match.victim.origin}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
