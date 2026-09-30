import React, { useMemo } from 'react';
import { ShieldAlert, Compass, Activity, ArrowUpRight, CheckCircle2, AlertTriangle, Zap, Network } from 'lucide-react';
import { GeoFenceBreachEvent } from '../types/drm';

interface ThreatSeverityMeterProps {
  breachEvent: GeoFenceBreachEvent;
}

export type SeverityTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ThreatAnalysisScore {
  totalScore: number; // 0 - 100
  tier: SeverityTier;
  tierColor: string;
  tierBg: string;
  tierBorder: string;
  distanceComponent: number; // out of 45
  asnDeviationComponent: number; // out of 30
  geoDeviationComponent: number; // out of 25
  baselineDeviationPct: number; // e.g. +94.2%
  radiusMultiple: number; // e.g. 116.4x
  summaryLabel: string;
}

export const ThreatSeverityMeter: React.FC<ThreatSeverityMeterProps> = ({ breachEvent }) => {
  const { establishedZone, detectedSession, distanceKm, breachSeverity } = breachEvent;

  const analysis: ThreatAnalysisScore = useMemo(() => {
    // 1. Distance Component (max 45 points)
    const radius = Math.max(10, establishedZone.radiusKm);
    const radiusMultiple = Number((distanceKm / radius).toFixed(1));
    let distanceScore = 0;
    if (distanceKm <= 50) {
      distanceScore = Math.min(15, (distanceKm / 50) * 15);
    } else if (distanceKm <= 300) {
      distanceScore = 15 + ((distanceKm - 50) / 250) * 15;
    } else if (distanceKm <= 2000) {
      distanceScore = 30 + ((distanceKm - 300) / 1700) * 10;
    } else {
      distanceScore = 40 + Math.min(5, ((distanceKm - 2000) / 8000) * 5);
    }

    // 2. ASN / ISP Deviation Component (max 30 points)
    const isAsnMismatch = establishedZone.establishedAsn !== detectedSession.asn;
    const isHostingOrVpnAsn = /hetzner|leaseweb|digitalocean|aws|amazon|m247|ovh|linode|vpn|proxy|datacenter/i.test(
      `${detectedSession.isp} ${detectedSession.asn}`
    );
    let asnScore = 0;
    if (isAsnMismatch) {
      asnScore = isHostingOrVpnAsn ? 30 : 22;
    } else {
      asnScore = 6;
    }

    // 3. Geopolitical / Country Deviation Component (max 25 points)
    const isCountryMismatch = establishedZone.country.toLowerCase() !== detectedSession.country.toLowerCase();
    const isCityMismatch = establishedZone.city.toLowerCase() !== detectedSession.city.toLowerCase();
    let geoScore = 0;
    if (isCountryMismatch) {
      geoScore = 25;
    } else if (isCityMismatch) {
      geoScore = 14;
    } else {
      geoScore = 5;
    }

    const totalRaw = Math.round(distanceScore + asnScore + geoScore);
    const totalScore = Math.max(10, Math.min(100, totalRaw));

    // Calculate behavioral baseline deviation percentage relative to nominal 15pt noise floor
    const baselineDeviationPct = Number((Math.min(99.9, ((totalScore - 12) / 88) * 100)).toFixed(1));

    // Color-coded Scale Mapping
    let tier: SeverityTier = 'LOW';
    let tierColor = '#10b981';
    let tierBg = 'bg-emerald-500/15';
    let tierBorder = 'border-emerald-500/40';
    let summaryLabel = 'Nominal Session Boundary';

    if (totalScore >= 80 || breachSeverity === 'CRITICAL') {
      tier = 'CRITICAL';
      tierColor = '#ef4444';
      tierBg = 'bg-rose-500/20';
      tierBorder = 'border-rose-500/50';
      summaryLabel = 'Critical Perimeter Breach · Immediate Revocation';
    } else if (totalScore >= 56) {
      tier = 'HIGH';
      tierColor = '#f97316';
      tierBg = 'bg-orange-500/20';
      tierBorder = 'border-orange-500/50';
      summaryLabel = 'High Behavioral Drift · Step-Up Challenge';
    } else if (totalScore >= 30) {
      tier = 'MEDIUM';
      tierColor = '#f59e0b';
      tierBg = 'bg-amber-500/20';
      tierBorder = 'border-amber-500/50';
      summaryLabel = 'Moderate Regional Departure · Monitoring';
    } else {
      tier = 'LOW';
      tierColor = '#10b981';
      tierBg = 'bg-emerald-500/15';
      tierBorder = 'border-emerald-500/40';
      summaryLabel = 'Within Permissible Perimeter Noise';
    }

    return {
      totalScore,
      tier,
      tierColor,
      tierBg,
      tierBorder,
      distanceComponent: Math.round(distanceScore),
      asnDeviationComponent: Math.round(asnScore),
      geoDeviationComponent: Math.round(geoScore),
      baselineDeviationPct,
      radiusMultiple,
      summaryLabel,
    };
  }, [establishedZone, detectedSession, distanceKm, breachSeverity]);

  // Semi-circular gauge geometry:
  // Center: (100, 90), Radius: 70
  // Angles: 180° (left, 0 score) to 0° (right, 100 score)
  const scoreRatio = analysis.totalScore / 100;
  // Needle rotation in degrees around (100, 90): -90deg is left (0 score), +90deg is right (100 score)
  const needleAngle = -90 + scoreRatio * 180;

  return (
    <div className="p-4 bg-slate-900/95 border border-slate-800 rounded-xl space-y-3.5 shadow-md">
      {/* Header with Title and Tier Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${analysis.tierBg} border ${analysis.tierBorder}`}>
            <Activity className="w-4 h-4" style={{ color: analysis.tierColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider">
                Threat Severity Meter
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${analysis.tierBg} ${analysis.tierBorder}`} style={{ color: analysis.tierColor }}>
                {analysis.tier} SEVERITY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Dynamically mapped from geodetic departure (+{distanceKm.toLocaleString()} km) & autonomous ISP baseline drift
            </p>
          </div>
        </div>

        {/* Real-time Composite Metric */}
        <div className="flex items-baseline gap-1.5 sm:self-center font-mono">
          <span className="text-2xl font-black tracking-tight" style={{ color: analysis.tierColor }}>
            {analysis.totalScore}
          </span>
          <span className="text-xs text-slate-500 font-semibold">/ 100</span>
          <span className="text-[10px] text-slate-400 ml-1.5 hidden md:inline">
            (Drift: +{analysis.baselineDeviationPct}%)
          </span>
        </div>
      </div>

      {/* Main Meter Grid: Visual Radial Gauge + Factor Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Visual Half-Circle SVG Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <div className="relative w-[210px] h-[115px] overflow-hidden select-none">
            <svg viewBox="0 0 200 115" className="w-full h-full block">
              <defs>
                {/* Multi-stop Gauge Color Gradient */}
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="30%" stopColor="#f59e0b" />
                  <stop offset="65%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>

                <filter id="gaugeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Inactive Arc Track */}
              <path
                d="M 22 92 A 78 78 0 0 1 178 92"
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Active Color-Coded Gradient Arc Track */}
              <path
                d="M 22 92 A 78 78 0 0 1 178 92"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Scale Tick Markers */}
              {/* 0 (Low) */}
              <line x1="22" y1="92" x2="14" y2="92" stroke="#64748b" strokeWidth="1.5" />
              {/* 33 (Medium) */}
              <line x1="48" y1="46" x2="42" y2="40" stroke="#64748b" strokeWidth="1.5" />
              {/* 66 (High) */}
              <line x1="152" y1="46" x2="158" y2="40" stroke="#64748b" strokeWidth="1.5" />
              {/* 100 (Critical) */}
              <line x1="178" y1="92" x2="186" y2="92" stroke="#64748b" strokeWidth="1.5" />

              {/* Dynamic Pivot Needle with Glow */}
              <g
                transform={`rotate(${needleAngle}, 100, 92)`}
                className="transition-transform duration-700 ease-out"
              >
                {/* Needle beam */}
                <polygon
                  points="98,92 100,24 102,92"
                  fill={analysis.tierColor}
                  filter="url(#gaugeGlow)"
                />
                <circle cx="100" cy="24" r="2.5" fill="#ffffff" />
              </g>

              {/* Central Pivot Hub */}
              <circle cx="100" cy="92" r="9" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <circle cx="100" cy="92" r="4.5" fill={analysis.tierColor} />
            </svg>

            {/* Bottom Scale Labels */}
            <div className="absolute bottom-0 inset-x-2 flex justify-between text-[9px] font-mono font-bold tracking-tight">
              <span className="text-emerald-400">LOW</span>
              <span className="text-amber-400 -ml-2">MED</span>
              <span className="text-orange-400 mr-2">HIGH</span>
              <span className="text-rose-400">CRIT</span>
            </div>
          </div>

          <div className="mt-2 text-center">
            <span
              className="text-[11px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded"
              style={{ backgroundColor: `${analysis.tierColor}20`, color: analysis.tierColor }}
            >
              {analysis.summaryLabel}
            </span>
          </div>
        </div>

        {/* Dynamic Behavioral Drift Breakdown Bars */}
        <div className="md:col-span-7 space-y-2.5 text-xs font-mono">
          {/* Factor 1: Geodetic Haversine Displacement */}
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geodetic Distance Deviation:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">{analysis.radiusMultiple}x Zone Radius</span>
                <span className="text-white font-bold">+{analysis.distanceComponent} / 45 pts</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(analysis.distanceComponent / 45) * 100}%`,
                  backgroundColor: analysis.distanceComponent > 35 ? '#ef4444' : '#f59e0b',
                }}
              />
            </div>
          </div>

          {/* Factor 2: Autonomous System (ASN) Drift */}
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Network className="w-3.5 h-3.5 text-amber-400" />
                <span>Transit ISP & ASN Mismatch:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px] truncate max-w-[130px]">
                  {detectedSession.asn} vs {establishedZone.establishedAsn}
                </span>
                <span className="text-white font-bold">+{analysis.asnDeviationComponent} / 30 pts</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(analysis.asnDeviationComponent / 30) * 100}%`,
                  backgroundColor: analysis.asnDeviationComponent >= 25 ? '#ef4444' : '#10b981',
                }}
              />
            </div>
          </div>

          {/* Factor 3: Geopolitical Boundary Breach */}
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Cross-Border Sovereign Ingress:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">
                  {detectedSession.country} vs {establishedZone.country}
                </span>
                <span className="text-white font-bold">+{analysis.geoDeviationComponent} / 25 pts</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(analysis.geoDeviationComponent / 25) * 100}%`,
                  backgroundColor: analysis.geoDeviationComponent >= 20 ? '#ef4444' : '#38bdf8',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
