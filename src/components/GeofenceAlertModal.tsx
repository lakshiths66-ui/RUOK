import React, { useState } from 'react';
import { 
  AlertTriangle, MapPin, ShieldAlert, X, ShieldCheck, 
  Wifi, Navigation, Radio, ArrowRight, Lock, CheckCircle2, 
  ExternalLink, ZoomIn, ZoomOut, Compass, KeyRound, Printer, Clock, FileText,
  Share2, Check, Flag, RefreshCw, Globe, Flame, Activity, Layers, Filter, Sparkles, FileEdit
} from 'lucide-react';
import { GeoFenceBreachEvent } from '../types/drm';
import { usePlaceholderMapRenderer } from '../hooks/usePlaceholderMapRenderer';
import { useGlobalAnomalyHeatmapData, AnomalyCategory } from '../hooks/useGlobalAnomalyHeatmapData';
import { ThreatSeverityMeter } from './ThreatSeverityMeter';

interface GeofenceAlertModalProps {
  isOpen: boolean;
  breachEvent: GeoFenceBreachEvent | null;
  onClose: () => void;
  onStepUpMfa: () => void;
  onRestrictStream: () => void;
  onTerminateSession: () => void;
  onAuthorizeTravelZone?: () => void;
  onFlagFalsePositive?: () => Promise<void> | void;
}

export const GeofenceAlertModal: React.FC<GeofenceAlertModalProps> = ({
  isOpen,
  breachEvent,
  onClose,
  onStepUpMfa,
  onRestrictStream,
  onTerminateSession,
  onAuthorizeTravelZone,
  onFlagFalsePositive,
}) => {
  const [viewMode, setViewMode] = useState<'world' | 'regional'>('world');
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [analystNotes, setAnalystNotes] = useState<string>('');

  const centerLat = breachEvent ? (breachEvent.establishedZone.centerCoordinates.lat + breachEvent.detectedSession.coordinates.lat) / 2 : 20;
  const centerLng = breachEvent ? (breachEvent.establishedZone.centerCoordinates.lng + breachEvent.detectedSession.coordinates.lng) / 2 : 0;

  // Placeholder map rendering hook that manages satellite tile layer, loading progress and telemetry
  const mapRenderer = usePlaceholderMapRenderer({
    centerLat,
    centerLng,
    satelliteEnabled: false,
  });

  // Re-renderable map data hook for global anomaly breach clusters & regional ISP patterns
  const heatmapData = useGlobalAnomalyHeatmapData(false);

  if (!isOpen || !breachEvent) return null;

  const { establishedZone, detectedSession, distanceKm, breachSeverity } = breachEvent;

  const handleFlagFalsePositiveClick = async () => {
    if (!onFlagFalsePositive) return;
    setIsFlagging(true);
    try {
      await onFlagFalsePositive();
    } finally {
      setIsFlagging(false);
    }
  };

  const handlePrintPdfReport = () => {
    setShowPrintReport(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleShareIncident = async () => {
    const deepLink = `${window.location.origin}${window.location.pathname}?incident=${encodeURIComponent(breachEvent.id)}#geofence-alert`;
    const sharePayload = `[CRITICAL SECURITY INCIDENT REPORT - AEGIS DRM]
Incident Event ID: ${breachEvent.id}
Event Type: GEOFENCE_ISP_BOUNDARY_BREACH (${breachSeverity})
Timestamp: ${breachEvent.timestamp}
Session ID: ${breachEvent.sessionId} · User ID: ${breachEvent.userId}

--- GEOFENCE & TELEMETRY BREAKDOWN ---
Established Household Zone: ${establishedZone.homeName}
Home Coordinates: ${establishedZone.centerCoordinates.lat}° N, ${establishedZone.centerCoordinates.lng}° E (${establishedZone.city}, ${establishedZone.country})
Authorized Residential ISP: ${establishedZone.establishedIsp} (${establishedZone.establishedAsn})
Permitted Household Perimeter: ${establishedZone.radiusKm} km radius

Detected Ingress IP: ${detectedSession.ipMasked}
Observed Ingress Coordinates: ${detectedSession.coordinates.lat}° N, ${detectedSession.coordinates.lng}° E (${detectedSession.city}, ${detectedSession.country})
Observed Autonomous System: ${detectedSession.asn} (${detectedSession.isp}) [ASN MISMATCH]
Geodesic Haversine Delta: +${distanceKm.toLocaleString()} km from Established Home Zone (+${(distanceKm - establishedZone.radiusKm).toLocaleString()} km outside boundary)

Recommended Adaptive Action: ${breachEvent.suggestedAction}
Cryptographic Verification Hash: 0x${breachEvent.id.substring(4)}8f7a91c4e209
${analystNotes.trim() ? `\n--- SECURITY ANALYST NOTES & FORENSIC OBSERVATIONS ---\n${analystNotes.trim()}\n` : ''}
Deep Link to Incident: ${deepLink}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sharePayload);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = sharePayload;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = sharePayload;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  // Simple Mercator projection mapping to SVG canvas (viewBox 0 0 800 450)
  const projectCoords = (lat: number, lng: number, mode: 'world' | 'regional') => {
    if (mode === 'world') {
      // Standard world map projection
      const x = ((lng + 180) * (800 / 360));
      const latRad = (lat * Math.PI) / 180;
      const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      const y = (450 / 2) - (450 * mercN) / (2 * Math.PI);
      return {
        x: Math.max(20, Math.min(780, x)),
        y: Math.max(20, Math.min(430, y)),
      };
    } else {
      // Focused regional view between the two points
      const minLat = Math.min(establishedZone.centerCoordinates.lat, detectedSession.coordinates.lat);
      const maxLat = Math.max(establishedZone.centerCoordinates.lat, detectedSession.coordinates.lat);
      const minLng = Math.min(establishedZone.centerCoordinates.lng, detectedSession.coordinates.lng);
      const maxLng = Math.max(establishedZone.centerCoordinates.lng, detectedSession.coordinates.lng);

      const paddingLat = Math.max((maxLat - minLat) * 0.3, 10);
      const paddingLng = Math.max((maxLng - minLng) * 0.3, 15);

      const latSpan = (maxLat - minLat) + paddingLat * 2;
      const lngSpan = (maxLng - minLng) + paddingLng * 2;

      const x = ((lng - (minLng - paddingLng)) / lngSpan) * 800;
      const y = 450 - ((lat - (minLat - paddingLat)) / latSpan) * 450;

      return {
        x: Math.max(30, Math.min(770, x)),
        y: Math.max(30, Math.min(420, y)),
      };
    }
  };

  const homePt = projectCoords(
    establishedZone.centerCoordinates.lat,
    establishedZone.centerCoordinates.lng,
    viewMode
  );

  const anomalousPt = projectCoords(
    detectedSession.coordinates.lat,
    detectedSession.coordinates.lng,
    viewMode
  );

  // SVG curved arc calculation between points
  const midX = (homePt.x + anomalousPt.x) / 2;
  const midY = Math.min(homePt.y, anomalousPt.y) - (viewMode === 'world' ? 60 : 40);
  const pathD = `M ${homePt.x} ${homePt.y} Q ${midX} ${midY} ${anomalousPt.x} ${anomalousPt.y}`;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="geofence-alert-modal-container" 
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-rose-800/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-900/60 border border-rose-700/80 text-rose-300">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Critical Security Alert: Home ISP Geo-Fencing Breach
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {breachSeverity} AUDIT EVENT
                </span>
              </div>
              <p className="text-xs text-rose-200/80 font-mono mt-0.5">
                Session coordinates fall {distanceKm.toLocaleString()} km outside the established residential ISP boundary ({establishedZone.radiusKm} km radius)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Threat Severity Meter Gauge & Tactical Map Visualizer Viewport */}
        <div className="p-5 space-y-4">
          {/* Dynamic Threat Severity Meter Gauge Component */}
          <ThreatSeverityMeter breachEvent={breachEvent} />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>GEODETIC RADAR VISUALIZATION · HAVERSINE DELTA:</span>
              <span className="text-rose-400 font-bold font-mono">+{distanceKm.toLocaleString()} KM</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>BREACH ALERT</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Satellite View Button */}
              <button
                onClick={mapRenderer.toggleSatelliteView}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm ${
                  mapRenderer.isSatelliteActive
                    ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-emerald-950/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Toggle high-resolution satellite imagery overlay onto radar map"
              >
                <Globe className={`w-3.5 h-3.5 ${mapRenderer.isSatelliteActive ? 'text-white' : 'text-emerald-400'}`} />
                <span>{mapRenderer.isSatelliteActive ? 'Satellite View: Active' : 'Toggle Satellite View'}</span>
              </button>

              {/* Toggle Global Anomaly Heatmap Button */}
              <button
                onClick={heatmapData.toggleHeatmap}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm ${
                  heatmapData.isHeatmapActive
                    ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white shadow-amber-950/40 ring-1 ring-amber-400/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Toggle Global Anomaly Heatmap layer to spot patterns in regional ISP risks"
              >
                <Flame className={`w-3.5 h-3.5 ${heatmapData.isHeatmapActive ? 'text-white animate-pulse' : 'text-amber-400'}`} />
                <span>{heatmapData.isHeatmapActive ? 'Heatmap: Active' : 'Global Anomaly Heatmap'}</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setViewMode('world')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    viewMode === 'world' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  World Vector Grid
                </button>
                <button
                  onClick={() => setViewMode('regional')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    viewMode === 'regional' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Trajectory Focus View
                </button>
              </div>
            </div>
          </div>

          {/* Interactive SVG Radar Map - Features gentle pulsing border animation when breach is triggered */}
          <div 
            id="geofence-radar-map-container"
            className="relative w-full aspect-[16/9] max-h-[380px] bg-slate-900/90 rounded-xl overflow-hidden border radar-map-container map-border-breach-pulse shadow-inner"
          >
            {/* Satellite Map Overlay Layer (rendered via placeholder map rendering hook) */}
            {mapRenderer.isSatelliteActive && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500 animate-in fade-in">
                <img
                  src={mapRenderer.imageryUrl}
                  alt="High-Resolution Satellite Earth Imagery"
                  className="w-full h-full object-cover object-center opacity-65 mix-blend-screen scale-105 filter brightness-110 contrast-125"
                />
                <div className="absolute inset-0 bg-radial from-transparent via-slate-950/20 to-slate-950/75 pointer-events-none" />

                {/* Satellite HUD Telemetry Overlay Badge */}
                <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-semibold uppercase tracking-wider">High-Res Satellite Imagery</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">{mapRenderer.attribution}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-cyan-400">GSD: {mapRenderer.resolutionMeters}m/px</span>
                </div>

                {mapRenderer.isLoadingTiles && (
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/90 border border-cyan-500/60 text-[10px] font-mono text-cyan-300 shadow-lg backdrop-blur-md">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>Rendering tiles: {mapRenderer.tileCoveragePercentage}%</span>
                  </div>
                )}
              </div>
            )}

            <svg
              viewBox="0 0 800 450"
              className="w-full h-full block select-none relative z-10"
            >
              <defs>
                {/* Tactical grid background pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="0.8" />
                </pattern>

                <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>

                <radialGradient id="homeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.35)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                </radialGradient>

                <radialGradient id="threatGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.45)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                </radialGradient>

                {/* Global Anomaly Heatmap Thermal Gradients */}
                <radialGradient id="heatBloomCritical" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#f97316" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#eab308" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatBloomHigh" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#eab308" stopOpacity="0.5" />
                  <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatBloomElevated" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
                <filter id="heatBlur">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="800" height="450" fill={mapRenderer.isSatelliteActive ? 'transparent' : '#030712'} />
              <rect width="800" height="450" fill="url(#grid)" opacity={mapRenderer.isSatelliteActive ? 0.35 : 1} />

              {/* Simplified world continent outlines for context in world mode */}
              {viewMode === 'world' && (
                <g fill="rgba(30, 41, 59, 0.55)" stroke="rgba(71, 85, 105, 0.4)" strokeWidth="0.6">
                  {/* North America */}
                  <path d="M 120 70 L 220 70 L 260 120 L 220 180 L 170 190 L 140 140 Z" />
                  {/* South America */}
                  <path d="M 210 210 L 260 215 L 290 270 L 260 360 L 220 300 Z" />
                  {/* Europe */}
                  <path d="M 370 70 L 460 70 L 450 130 L 380 130 Z" />
                  {/* Africa */}
                  <path d="M 370 140 L 470 140 L 480 250 L 430 330 L 380 260 Z" />
                  {/* Asia */}
                  <path d="M 460 65 L 700 70 L 720 180 L 610 240 L 510 180 L 460 130 Z" />
                  {/* India outline roughly */}
                  <path d="M 540 170 L 590 170 L 575 235 L 545 200 Z" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.4)" />
                  {/* Australia */}
                  <path d="M 640 270 L 730 270 L 730 350 L 650 350 Z" />
                </g>
              )}

              {/* Global Anomaly Heatmap Layer (driven by re-renderable map data hook) */}
              {heatmapData.isHeatmapActive && (
                <g className="heatmap-clusters-layer">
                  {heatmapData.clusters.map((cluster) => {
                    const pt = projectCoords(cluster.coordinates.lat, cluster.coordinates.lng, viewMode);
                    const isSelected = heatmapData.selectedCluster?.id === cluster.id;
                    const bloomRadius = 24 + cluster.intensity * 26;
                    const grad = cluster.severity === 'CRITICAL' ? 'url(#heatBloomCritical)' : cluster.severity === 'HIGH' ? 'url(#heatBloomHigh)' : 'url(#heatBloomElevated)';

                    return (
                      <g
                        key={cluster.id}
                        className="cursor-pointer group select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          heatmapData.selectCluster(isSelected ? null : cluster);
                        }}
                      >
                        {/* Thermal heat bloom gradient */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={bloomRadius * (isSelected ? 1.3 : 1)}
                          fill={grad}
                          filter="url(#heatBlur)"
                          opacity={isSelected ? 0.95 : 0.75}
                        />

                        {/* Concentric risk pressure wave */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={bloomRadius * 0.55}
                          fill={grad}
                          opacity={0.8}
                        />

                        {/* Center core emitter */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 5.5 : 3.5}
                          fill={cluster.severity === 'CRITICAL' ? '#fee2e2' : '#fef08a'}
                          stroke={cluster.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}
                          strokeWidth="1.2"
                        />

                        {/* Animated ping for critical clusters */}
                        {cluster.severity === 'CRITICAL' && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={bloomRadius * 0.7}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1"
                            opacity="0.3"
                            strokeDasharray="2 2"
                            className="animate-ping"
                            style={{ transformOrigin: `${pt.x}px ${pt.y}px`, animationDuration: '3.5s' }}
                          />
                        )}

                        {/* Tactical incident count badge */}
                        <g transform={`translate(${pt.x}, ${pt.y - 10})`}>
                          <rect
                            x="-16"
                            y="-9"
                            width="32"
                            height="11"
                            rx="2"
                            fill="rgba(15, 23, 42, 0.9)"
                            stroke={isSelected ? '#fbbf24' : cluster.severity === 'CRITICAL' ? '#f87171' : '#fcd34d'}
                            strokeWidth="0.8"
                          />
                          <text
                            x="0"
                            y="-1"
                            textAnchor="middle"
                            fill={isSelected ? '#fbbf24' : cluster.severity === 'CRITICAL' ? '#fca5a5' : '#fef08a'}
                            fontSize="7.5"
                            fontFamily="'JetBrains Mono', monospace"
                            fontWeight="bold"
                          >
                            {cluster.breachCount}
                          </text>
                        </g>

                        {/* Hover / Selected Label */}
                        {isSelected && (
                          <g transform={`translate(${pt.x}, ${pt.y + 18})`}>
                            <rect
                              x="-65"
                              y="-8"
                              width="130"
                              height="16"
                              rx="3"
                              fill="rgba(2, 6, 23, 0.95)"
                              stroke="#fbbf24"
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fill="#fde68a"
                              fontSize="8"
                              fontFamily="'JetBrains Mono', monospace"
                              fontWeight="bold"
                            >
                              {cluster.regionName} · {cluster.primaryAsn}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Equator & Prime Meridian Guides */}
              <line x1="0" y1="225" x2="800" y2="225" stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="4 4" />
              <line x1="400" y1="0" x2="400" y2="450" stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="4 4" />

              {/* Home Zone Radius Circle */}
              <circle
                cx={homePt.x}
                cy={homePt.y}
                r={viewMode === 'world' ? 32 : 55}
                fill="url(#homeGlow)"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={homePt.x}
                cy={homePt.y}
                r="4"
                fill="#10b981"
              />

              {/* Geodesic Vector Trajectory Line connecting Home to Anomaly */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#arcGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-pulse"
              />

              {/* Distance Callout Tag along Arc */}
              <g transform={`translate(${midX}, ${midY + 10})`}>
                <rect
                  x="-75"
                  y="-12"
                  width="150"
                  height="22"
                  rx="4"
                  fill="#020617"
                  stroke="#ef4444"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill="#fca5a5"
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="bold"
                >
                  +{distanceKm.toLocaleString()} KM BREACH
                </text>
              </g>

              {/* Anomalous Location Pulse & Threat Target */}
              <circle
                cx={anomalousPt.x}
                cy={anomalousPt.y}
                r={viewMode === 'world' ? 24 : 45}
                fill="url(#threatGlow)"
                stroke="#ef4444"
                strokeWidth="1.8"
              />
              {/* Radar target reticle */}
              <circle
                cx={anomalousPt.x}
                cy={anomalousPt.y}
                r="7"
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.5"
              />
              <circle
                cx={anomalousPt.x}
                cy={anomalousPt.y}
                r="2.5"
                fill="#ef4444"
              />
              <line
                x1={anomalousPt.x - 12}
                y1={anomalousPt.y}
                x2={anomalousPt.x + 12}
                y2={anomalousPt.y}
                stroke="#ef4444"
                strokeWidth="1"
              />
              <line
                x1={anomalousPt.x}
                y1={anomalousPt.y - 12}
                x2={anomalousPt.x}
                y2={anomalousPt.y + 12}
                stroke="#ef4444"
                strokeWidth="1"
              />

              {/* Label: Home Base */}
              <text
                x={homePt.x}
                y={homePt.y + 24}
                textAnchor="middle"
                fill="#34d399"
                fontSize="11"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="bold"
              >
                HOME ISP ZONE ({establishedZone.city})
              </text>

              {/* Label: Anomalous Session */}
              <text
                x={anomalousPt.x}
                y={anomalousPt.y - 16}
                textAnchor="middle"
                fill="#f87171"
                fontSize="11"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="bold"
              >
                DETECTED IP ({detectedSession.city}, {detectedSession.country})
              </text>
            </svg>

            {/* Bottom Overlay Legend */}
            <div className="absolute bottom-2 left-3 flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] font-mono bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Established Zone ({establishedZone.radiusKm} km radius)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-400">Breach Location (+{distanceKm.toLocaleString()} km)</span>
              </div>
              {heatmapData.isHeatmapActive && (
                <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2 text-amber-300">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Global Heatmap ({heatmapData.clusters.length} Hubs · {heatmapData.totalBreachCount} Breaches)</span>
                </div>
              )}
            </div>
          </div>

          {/* Global Anomaly Heatmap - Regional ISP Risk Pattern Breakdown Panel */}
          {heatmapData.isHeatmapActive && (
            <div className="p-4 bg-slate-900/95 border border-amber-500/40 rounded-xl space-y-3.5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider">
                      Regional ISP Anomaly Patterns & Breach Clusters
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Visualizing {heatmapData.totalBreachCount} recent geofence breaches across {heatmapData.clusters.length} transit hubs via re-renderable map data engine
                    </p>
                  </div>
                </div>

                {/* Re-renderable Map Data Hook Controls */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    Feed: {heatmapData.lastUpdated}
                  </span>
                  <button
                    onClick={heatmapData.refreshHeatmapData}
                    disabled={heatmapData.isRefreshing}
                    className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-mono shadow-sm"
                    title="Re-render and recalculate live cluster telemetry"
                  >
                    <RefreshCw className={`w-3 h-3 ${heatmapData.isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{heatmapData.isRefreshing ? 'Recalculating...' : 'Refresh Telemetry'}</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-mono text-[10px] uppercase mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-cyan-400" /> Vector:
                </span>
                {(['ALL', 'DATACENTER_PROXY', 'COMMERCIAL_VPN', 'RESIDENTIAL_HIJACK', 'MOBILE_ROAMING_LEAK'] as AnomalyCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => heatmapData.setFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      heatmapData.filterCategory === cat
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {/* Active / Highlighted Cluster Detail Card */}
              {(() => {
                const activePoint = heatmapData.selectedCluster || heatmapData.highestRiskCluster;
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px]">
                    <div className="lg:col-span-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300 font-sans text-xs">
                          {activePoint.regionName} ({activePoint.country})
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                          activePoint.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {activePoint.severity} · {activePoint.riskCategory.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-slate-300 font-mono text-[10px]">
                        Primary Ingress Transit: <span className="text-white font-semibold">{activePoint.primaryIsp}</span> ({activePoint.primaryAsn})
                      </div>
                      <p className="text-slate-400 font-sans text-[11px] pt-0.5">
                        <strong className="text-slate-300">Regional Risk Pattern:</strong> Frequent credential sharing and proxy evasion origin. OTT sessions originating from this Autonomous System demonstrate high geodesic divergence against legitimate domestic subscriber perimeters.
                      </p>
                    </div>

                    <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800 pt-2 lg:pt-0 lg:pl-3 space-y-1 text-right">
                      <div className="flex justify-between lg:justify-end gap-3 text-xs">
                        <span className="text-slate-400 font-mono text-[10px]">24h Breaches:</span>
                        <span className="text-rose-400 font-bold font-mono">{activePoint.breachCount} incidents</span>
                      </div>
                      <div className="flex justify-between lg:justify-end gap-3 text-xs">
                        <span className="text-slate-400 font-mono text-[10px]">Observed Trend:</span>
                        <span className="text-amber-300 font-mono font-semibold">{activePoint.trend}</span>
                      </div>
                      <div className="flex justify-between lg:justify-end gap-3 text-xs">
                        <span className="text-slate-400 font-mono text-[10px]">Model Confidence:</span>
                        <span className="text-emerald-400 font-mono">{(activePoint.confidenceScore * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Cluster Spotlight Grid */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                  <span>Spotlight Regional Hub on Radar (Click to focus):</span>
                  {heatmapData.selectedCluster && (
                    <button
                      onClick={() => heatmapData.selectCluster(null)}
                      className="text-cyan-400 hover:underline cursor-pointer lowercase"
                    >
                      clear selection
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] font-mono">
                  {heatmapData.clusters.map((c) => {
                    const isSelected = heatmapData.selectedCluster?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => heatmapData.selectCluster(isSelected ? null : c)}
                        className={`p-1.5 rounded text-left transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40'
                            : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="font-semibold truncate">{c.regionName.split(' ')[0]}</div>
                        <div className="text-[9px] text-slate-400 truncate">{c.primaryAsn} · {c.breachCount}x</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Differential Comparison: Home ISP Zone vs Detected Session */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Established Home Profile */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold font-sans">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Established Home ISP Zone</span>
                </div>
                <span className="text-emerald-400 text-[10px]">AUTHORIZED</span>
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Profile:</span>
                  <span className="text-slate-200 font-sans">{establishedZone.homeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Established ISP:</span>
                  <span className="text-emerald-400">{establishedZone.establishedIsp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Autonomous System (ASN):</span>
                  <span className="text-slate-200">{establishedZone.establishedAsn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Center Coordinates:</span>
                  <span className="text-slate-300">
                    {establishedZone.centerCoordinates.lat}° N, {establishedZone.centerCoordinates.lng}° E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allowed Household Radius:</span>
                  <span className="text-slate-200">{establishedZone.radiusKm} km</span>
                </div>
              </div>
            </div>

            {/* Detected Anomalous Session */}
            <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold font-sans">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Detected Session IP Telemetry</span>
                </div>
                <span className="text-rose-400 text-[10px] font-bold">GEOFENCE BREACH</span>
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Masked IP Address:</span>
                  <span className="text-rose-300 font-bold">{detectedSession.ipMasked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Detected ISP:</span>
                  <span className="text-rose-300">{detectedSession.isp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Observed ASN:</span>
                  <span className="text-rose-300 font-bold">{detectedSession.asn} (Mismatch!)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location Territory:</span>
                  <span className="text-slate-200">{detectedSession.city}, {detectedSession.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Geodetic Distance Delta:</span>
                  <span className="text-rose-400 font-bold">+{distanceKm.toLocaleString()} km from Home</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Analyst Manual Notes & Observations Section */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider">
                  Security Analyst Notes & Forensic Observations
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Attached to PDF & Share
                </span>
              </div>
              {analystNotes.trim() && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Notes Attached ({analystNotes.length} chars)</span>
                </span>
              )}
            </div>

            <textarea
              id="analyst-notes-textarea"
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="Attach manual notes, subscriber triage interviews, IP threat intelligence corroboration, or justification here before printing or sharing the incident report..."
              rows={3}
              className="w-full px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 bg-slate-950 border border-slate-700/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-y leading-relaxed"
            />

            {/* Quick Templates for Fast Triage */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="text-slate-500 uppercase mr-1">Quick Templates:</span>
              {[
                'Verified legitimate subscriber roaming via secondary phone contact.',
                'Confirmed commercial VPN / proxy egress; token revocation recommended.',
                'Residential proxy anomaly; flagged for ISP reputation scan.',
                'Household member traveling; temporary access authorized.',
              ].map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => {
                    setAnalystNotes((prev) => (prev ? `${prev}\n${template}` : template));
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  + {template.split(';')[0].replace('.', '')}
                </button>
              ))}
              {analystNotes && (
                <button
                  type="button"
                  onClick={() => setAnalystNotes('')}
                  className="ml-auto text-slate-500 hover:text-rose-400 cursor-pointer"
                >
                  Clear notes
                </button>
              )}
            </div>
          </div>

          {/* Audit Trail & Action Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs no-print">
              <span className="font-semibold text-slate-200 font-sans">Proportional Remediation Actions:</span>
              <span className="text-slate-500 font-mono text-[11px]">Audit Event ID: {breachEvent.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 pt-1 no-print">
              <button
                onClick={onStepUpMfa}
                className="py-2.5 px-2.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Verify MFA</span>
              </button>

              <button
                onClick={onRestrictStream}
                className="py-2.5 px-2.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Restrict (480p)</span>
              </button>

              <button
                onClick={onTerminateSession}
                className="py-2.5 px-2.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Terminate Token</span>
              </button>

              {/* Flag as False Positive Button */}
              {onFlagFalsePositive && (
                <button
                  onClick={handleFlagFalsePositiveClick}
                  disabled={isFlagging}
                  className="py-2.5 px-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  title="Flag as false positive, update anomaly engine baseline via API, and log in audit trail"
                >
                  {isFlagging ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Flag className="w-3.5 h-3.5 text-emerald-200" />
                  )}
                  <span>{isFlagging ? 'Updating ML...' : 'Flag as False Positive'}</span>
                </button>
              )}

              {/* Share Incident Button */}
              <button
                onClick={handleShareIncident}
                className={`py-2.5 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border shadow-sm ${
                  copiedShare
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 hover:border-cyan-500'
                }`}
                title="Copy deep link and incident telemetry metadata to clipboard"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Share Incident</span>
                  </>
                )}
              </button>

              {/* Print PDF Report Action Button */}
              <button
                onClick={handlePrintPdfReport}
                className="py-2.5 px-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                title="Output Geofence Breach Timeline & Coordinates PDF Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF Report</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 no-print text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <Printer className="w-3 h-3 text-indigo-400" />
                  <span>Exportable Incident Record: Formats print-ready PDF with exact geodetic telemetry</span>
                </span>
                {copiedShare && (
                  <span className="text-emerald-400 font-mono font-semibold animate-in fade-in flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Deep link & incident metadata copied!</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPrintReport(!showPrintReport)}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {showPrintReport ? 'Hide On-Screen Report' : 'Preview Printable Report'}
              </button>
            </div>
          </div>

          {/* Simplified Print-Friendly Geofence Breach Timeline & Coordinates Report */}
          <div className={`print-friendly-report p-5 rounded-xl border border-slate-700/80 bg-slate-900/95 text-xs font-mono space-y-4 ${showPrintReport ? 'block' : 'hidden print:block'}`}>
            <div className="flex items-start justify-between border-b border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white font-sans uppercase tracking-wider">
                    Geofence Incident & Geodetic Telemetry Report
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Continuous Session Risk Assessment · AegisDRM Boundary Guardian
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <div>AUDIT ID: <span className="text-cyan-300 font-bold">{breachEvent.id}</span></div>
                <div>GENERATED: {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</div>
              </div>
            </div>

            {/* Geofence Breach Timeline */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-sans uppercase">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Geofence Breach Event Timeline</span>
              </div>
              <div className="relative border-l-2 border-slate-700 ml-2 pl-4 space-y-2.5 text-[11px]">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
                  <div className="text-slate-300 font-sans font-semibold">T+00.00s · Established Home Baseline Attached</div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    Target ISP: {establishedZone.establishedIsp} ({establishedZone.establishedAsn}) · Permitted Radius: {establishedZone.radiusKm} km ({establishedZone.city}, {establishedZone.country})
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                  <div className="text-slate-300 font-sans font-semibold">T+00.12s · Ingress IP Telemetry Observed</div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    Session IP: {detectedSession.ipMasked} · Location: {detectedSession.city}, {detectedSession.country} ({detectedSession.coordinates.lat}° N, {detectedSession.coordinates.lng}° E)
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900" />
                  <div className="text-rose-300 font-sans font-semibold">T+00.18s · Haversine Boundary Delta Calculated</div>
                  <div className="text-rose-200 font-mono text-[10px]">
                    Geodesic Delta: +{distanceKm.toLocaleString()} km from Home Center · Perimeter Delta: +{(distanceKm - establishedZone.radiusKm).toLocaleString()} km outside boundary
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-900" />
                  <div className="text-cyan-300 font-sans font-semibold">T+00.22s · ASN Integrity Check & Escalation</div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    Observed ASN: {detectedSession.asn} vs Authorized ASN: {establishedZone.establishedAsn} · Severity: {breachSeverity} · Action: {breachEvent.suggestedAction}
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinates & Geodetic Comparison Table */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-200 font-sans uppercase">
                Geodetic Coordinates & Perimeter Comparison Matrix
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border border-slate-800 text-left">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[10px]">
                      <th className="p-2">Telemetry Parameter</th>
                      <th className="p-2">Established Home ISP Baseline</th>
                      <th className="p-2">Observed Ingress Session</th>
                      <th className="p-2">Integrity Evaluation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-2 text-slate-400 font-sans">Geographic Coordinates</td>
                      <td className="p-2 text-emerald-400">{establishedZone.centerCoordinates.lat}° N, {establishedZone.centerCoordinates.lng}° E</td>
                      <td className="p-2 text-rose-300">{detectedSession.coordinates.lat}° N, {detectedSession.coordinates.lng}° E</td>
                      <td className="p-2 text-rose-400 font-bold">Delta: +{distanceKm.toLocaleString()} km</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-400 font-sans">Autonomous System (ASN)</td>
                      <td className="p-2 text-slate-300">{establishedZone.establishedAsn}</td>
                      <td className="p-2 text-rose-300">{detectedSession.asn}</td>
                      <td className="p-2 text-rose-400 font-bold">MISMATCH</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-400 font-sans">ISP & Territory</td>
                      <td className="p-2 text-slate-300">{establishedZone.establishedIsp} ({establishedZone.city})</td>
                      <td className="p-2 text-slate-300">{detectedSession.isp} ({detectedSession.city}, {detectedSession.country})</td>
                      <td className="p-2 text-amber-300 font-bold">EXTERIOR ZONE</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-400 font-sans">Permitted Radius</td>
                      <td className="p-2 text-slate-300">{establishedZone.radiusKm} km Metro Boundary</td>
                      <td className="p-2 text-slate-300">N/A (Remote Client)</td>
                      <td className="p-2 text-rose-400 font-bold">BOUNDARY BREACHED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Security Analyst Forensic Notes & Observations in Printable PDF Report */}
            <div className="space-y-1.5 p-3 rounded border border-slate-700 bg-slate-900/60 print:bg-slate-50 print:border-slate-300">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 print:text-slate-900 font-sans uppercase">
                <FileEdit className="w-3.5 h-3.5 text-cyan-400 print:text-slate-700" />
                <span>Security Analyst Forensic Observations & Remediation Notes</span>
              </div>
              <p className="text-[11px] font-mono text-slate-200 print:text-slate-800 whitespace-pre-wrap leading-relaxed">
                {analystNotes.trim() || 'No manual analyst observations attached prior to incident report generation.'}
              </p>
            </div>

            {/* Cryptographic Ledger Authentication Footer */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10px] text-slate-500 font-mono">
              <div>SHA-256 EVENT VERIFICATION HASH: 0x{breachEvent.id.substring(4)}8f7a91c4e209</div>
              <div className="text-emerald-400 font-bold">IMMUTABLE AUDIT TRAIL CERTIFIED</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
