import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Navigation, Clock, UserCheck, Send } from 'lucide-react';

// Custom Marker Icons generator with CSS pulsating beacons
const createPulseIcon = (urgency, triggerType) => {
  let color = '#f59e0b'; // Moderate Yellow
  let pulseClass = '';

  if (urgency === 'Critical' || triggerType === 'Audio_AI') {
    color = '#ef4444'; // Red
    pulseClass = 'animate-emergency-beacon';
  } else if (urgency === 'High') {
    color = '#f97316'; // Orange
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="34" height="34" style="filter: drop-shadow(0 0 8px ${color});">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divAnchor = L.divIcon({
    className: `custom-map-marker ${pulseClass}`,
    html: `<div style="display: flex; align-items: center; justify-content: center;">${svg}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

// Component to handle pan & zoom when alerts update
function MapFocusController({ alerts }) {
  const map = useMap();
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const bounds = L.latLngBounds(alerts.map(a => [a.lat, a.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [alerts, map]);
  return null;
}

export default function IncidentMap({ alerts, onDispatchUpdate }) {
  const centerLat = 20.2961;
  const centerLng = 85.8245;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      >
        {/* OpenStreetMap Dark Carto Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFocusController alerts={alerts} />

        {alerts.map((alert) => (
          <Marker
            key={alert.id}
            position={[alert.lat, alert.lng]}
            icon={createPulseIcon(alert.urgency, alert.trigger_type)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 space-y-2 max-w-xs text-slate-900">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${
                    alert.urgency === 'Critical' ? 'bg-red-600' : alert.urgency === 'High' ? 'bg-orange-500' : 'bg-amber-500'
                  }`}>
                    {alert.urgency} Urgency
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {alert.id}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{alert.victim_name || 'Unidentified Victim'}</h4>
                  <p className="text-xs text-slate-600 font-semibold">{alert.category}</p>
                </div>

                <p className="text-xs text-slate-700 bg-slate-100 p-2 rounded border border-slate-200">
                  {alert.details}
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                  <p>👥 Victims: {alert.victim_count || 1} Person(s)</p>
                  <p>📍 GPS: {alert.lat}, {alert.lng}</p>
                  <p>🕒 Signal: {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>

                {alert.dispatch_team && (
                  <div className="bg-emerald-100 text-emerald-800 text-[11px] font-bold p-1.5 rounded flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Dispatched: {alert.dispatch_team}
                  </div>
                )}

                {/* Quick Status Action Button inside Popup */}
                <div className="pt-1 flex gap-1">
                  {alert.status === 'Pending' && (
                    <button
                      onClick={() => onDispatchUpdate(alert.id, 'Dispatched', 'NDRF Rapid Unit 1')}
                      className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch NDRF Rapid Team
                    </button>
                  )}
                  {alert.status === 'Dispatched' && (
                    <button
                      onClick={() => onDispatchUpdate(alert.id, 'Resolved', alert.dispatch_team)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Mark Evacuated / Resolved
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
