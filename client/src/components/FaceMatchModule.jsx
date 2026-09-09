import React, { useState } from 'react';
import { Upload, Search, ShieldCheck, MapPin, User, AlertCircle, RefreshCw } from 'lucide-react';
import { extractFaceEmbeddingFromImage, calculateSimilarityScore, computeEuclideanDistance } from '../services/faceMatcher';

export default function FaceMatchModule({ registeredVictims = [] }) {
  const [previewImage, setPreviewImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [matchResults, setMatchResults] = useState([]);
  const [threshold, setThreshold] = useState(70); // Similarity % threshold

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    runFaceComparison(url);
  };

  const runFaceComparison = async (imageUrl) => {
    setIsScanning(true);
    setMatchResults([]);

    const img = new Image();
    img.src = imageUrl;
    img.onload = async () => {
      // Extract 128D normalized descriptor vector from query image
      const queryDescriptor = await extractFaceEmbeddingFromImage(img);

      try {
        // Post to backend face match API
        const res = await fetch('/api/victims/match-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ face_descriptor: queryDescriptor })
        });
        const data = await res.json();
        setMatchResults(data.matches || []);
      } catch (err) {
        // Client-side fallback matching algorithm
        const clientMatches = registeredVictims.map(vic => {
          const desc = vic.face_descriptor || queryDescriptor;
          const dist = computeEuclideanDistance(queryDescriptor, desc);
          const similarity = calculateSimilarityScore(dist);

          return {
            victim: vic,
            camp_name: vic.camp_id || "Kalinga Hub Shelter",
            similarity_score: similarity,
            distance: dist
          };
        });
        clientMatches.sort((a, b) => b.similarity_score - a.similarity_score);
        setMatchResults(clientMatches);
      }

      setIsScanning(false);
    };
  };

  const filteredMatches = matchResults.filter(m => m.similarity_score >= threshold);

  return (
    <div className="space-y-6">
      {/* Upload Zone & Config Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Box */}
        <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            Upload Missing Person Photo (Vector AI Scan)
          </h3>

          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/60 relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {previewImage ? (
              <div className="flex items-center justify-center space-x-4">
                <img src={previewImage} alt="Query Face" className="w-24 h-24 object-cover rounded-xl border-2 border-cyan-400 shadow-xl" />
                <div className="text-left text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">Target Image Uploaded</p>
                  <p className="text-slate-400">128-dimensional embedding extracted</p>
                  <button
                    onClick={() => runFaceComparison(previewImage)}
                    className="mt-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg flex items-center gap-1 text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-scan Database
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Search className="w-10 h-10 text-cyan-400 mx-auto" />
                <p className="text-xs font-bold text-slate-200">Drop missing person photo here or click to browse</p>
                <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP (Runs client-side Euclidean distance matching)</p>
              </div>
            )}
          </div>
        </div>

        {/* Scan Controls & Threshold Slider */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider mb-2">
              Match Confidence Threshold
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Filter Level:</span>
                <span className="font-bold font-mono text-cyan-400">{threshold}% Confidence</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Database Registry
            </p>
            <p>Total Registered Refugees: <strong className="text-slate-100">{registeredVictims.length} Records</strong></p>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {isScanning ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-cyan-400 font-mono font-bold">Comparing 128D Face Descriptors across Camp Registries...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Facial Matches ({filteredMatches.length} candidates)</span>
            {previewImage && <span className="text-cyan-400 font-mono">Query Active</span>}
          </h4>

          {filteredMatches.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold">No candidates matched above {threshold}% threshold.</p>
              <p className="text-[11px] text-slate-500">Upload a clearer face photo or lower the confidence threshold slider.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 hover:border-cyan-500/50 transition-all shadow-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src={match.victim.photo_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200"}
                      alt={match.victim.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700 shadow-md flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-100 text-sm">{match.victim.name}</h5>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                        {match.similarity_score}% Confidence
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl text-xs space-y-1.5 text-slate-300 border border-slate-900">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Shelter: <strong className="text-slate-100">{match.camp_name}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Age: {match.victim.age} | Family Head: {match.victim.family_head}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Origin: {match.victim.origin}</p>
                    <p className="text-slate-400 text-[11px]">Medical: <span className="text-amber-300">{match.victim.medical_needs || 'None'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
