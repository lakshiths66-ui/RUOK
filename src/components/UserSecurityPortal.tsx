import React, { useState } from 'react';
import { 
  ShieldCheck, Smartphone, Laptop, Tv, Tablet, Trash2, 
  Plus, KeyRound, Download, RefreshCw, CheckCircle, AlertTriangle, Users, MapPin
} from 'lucide-react';
import { Device, Session, BehavioralCluster, UserProfile } from '../types/drm';

interface UserSecurityPortalProps {
  user: UserProfile;
  devices: Device[];
  sessions: Session[];
  clusters: BehavioralCluster[];
  onEnrollDevice: () => void;
  onRevokeDevice: (deviceId: string) => void;
  onTerminateSession: (sessionId: string) => void;
}

export const UserSecurityPortal: React.FC<UserSecurityPortalProps> = ({
  user,
  devices,
  sessions,
  clusters,
  onEnrollDevice,
  onRevokeDevice,
  onTerminateSession,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const getDeviceIcon = (type: Device['deviceType']) => {
    switch (type) {
      case 'Smart TV': return <Tv className="w-4 h-4 text-cyan-400" />;
      case 'Laptop': return <Laptop className="w-4 h-4 text-cyan-400" />;
      case 'Tablet': return <Tablet className="w-4 h-4 text-cyan-400" />;
      case 'Mobile Phone': return <Smartphone className="w-4 h-4 text-cyan-400" />;
      default: return <Laptop className="w-4 h-4 text-cyan-400" />;
    }
  };

  const handleExportData = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      regulationCompliance: ['GDPR Article 15 (Right of Access)', 'Digital Personal Data Protection Act (DPDP India)'],
      userProfile: {
        pseudonym: user.pseudonym,
        emailMasked: user.emailMasked,
        accountTier: user.accountTier,
      },
      enrolledDevices: devices.map(d => ({
        devicePseudonym: d.pseudonym,
        name: d.name,
        deviceType: d.deviceType,
        trustStatus: d.trustStatus,
        approxLocation: d.approxLocation,
        firstSeen: d.firstSeen,
      })),
      activeSessions: sessions.map(s => ({
        sessionId: s.id,
        devicePseudonym: s.devicePseudonym,
        approxRegion: s.approxRegion,
        startedAt: s.startedAt,
        status: s.status,
      })),
      privacyGuarantees: [
        'No exact GPS coordinates logged (coarse territory only)',
        'No raw hardware MAC or IMEI stored (pseudonymous SHA-256 salted hashes only)',
        'No keystroke or mouse movement telemetry captured',
        'Behavioral baselines store feature centroids rather than raw session video history',
      ],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis_privacy_export_${user.pseudonym}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Principle Callout */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <h2 className="text-base font-semibold text-white">Identity Verification & Trusted Device Management</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Core architectural separation: <span className="text-slate-200 font-semibold">Identity Verification</span> (Password + TOTP MFA + Device Enrollment) establishes who is authorized. <span className="text-slate-200 font-semibold">Continuous Risk Assessment</span> independently monitors ongoing stream trust without conflating location changes with identity attacks.
        </p>
      </div>

      {/* Grid: Account Security & Multi-Cluster Family Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Auth & MFA Status */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 font-mono uppercase">Primary Auth</span>
            <span className="text-xs font-mono text-emerald-400">Argon2id Salted</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Account ID:</span>
              <span className="font-mono text-slate-200">{user.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Pseudonym:</span>
              <span className="font-mono text-slate-200">{user.pseudonym}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Masked Email:</span>
              <span className="font-mono text-slate-200">{user.emailMasked}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Second Factor:</span>
              <span className="font-mono text-cyan-400">{user.mfaType}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Household Plan & Streams */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 font-mono uppercase">Household Quota</span>
            <span className="text-xs font-mono text-cyan-400">4 Active Slots</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Plan Tier:</span>
              <span className="font-medium text-slate-200">Family OTT Premium</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Enrolled Devices:</span>
              <span className="font-mono text-slate-200">{devices.length} Devices</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Concurrent Streams:</span>
              <span className="font-mono text-cyan-400">{sessions.length} / 4 Active</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Geo Flexibility:</span>
              <span className="text-emerald-400 font-mono">Multi-Territory Enabled</span>
            </div>
          </div>
        </div>

        {/* Card 3: Privacy & Data Export */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 font-mono uppercase">Privacy Compliance</span>
              <span className="text-xs font-mono text-emerald-400">DPDP / GDPR</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export all stored pseudonymous tokens, cluster centroids, and session audit logs. Hard purge retention policy applies.
            </p>
          </div>

          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadSuccess ? 'Export Downloaded!' : 'Export My Data (JSON)'}</span>
          </button>
        </div>
      </div>

      {/* Section: Enrolled Trusted Devices Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Cryptographically Enrolled Devices</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Devices are identified by salted SHA-256 hashes of client entropy. Hardware serials are never stored.
            </p>
          </div>
          <button
            onClick={onEnrollDevice}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll New Device (Step-Up MFA)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Device Name & Type</th>
                <th className="py-2.5 px-3">Pseudonymous ID</th>
                <th className="py-2.5 px-3">Trust Status</th>
                <th className="py-2.5 px-3">Coarse Location</th>
                <th className="py-2.5 px-3">Last Active</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {devices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-sans">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-slate-800 border border-slate-700">
                        {getDeviceIcon(dev.deviceType)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{dev.name}</div>
                        <div className="text-[11px] text-slate-500">{dev.deviceType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {dev.pseudonym}
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                      dev.trustStatus === 'TRUSTED' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : dev.trustStatus === 'NEW'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {dev.trustStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dev.approxLocation}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {dev.lastUsed}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onRevokeDevice(dev.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Revoke Trust & Invalidate Tokens"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Multi-Pattern Family Behavioral Baseline Clusters */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Multi-Pattern Family Behavioral Clusters</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instead of forcing a single rigid profile, the framework maintains distinct feature centroids for legitimate household members.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">3 Active Baselines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clusters.map((cl) => (
            <div key={cl.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{cl.profileName}</h4>
                  <div className="text-[11px] text-cyan-400 mt-0.5 font-mono">{cl.region}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Hardware Type:</span>
                  <span className="text-slate-300 font-sans">{cl.deviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Habitual Schedule:</span>
                  <span className="text-slate-300">{cl.typicalHours}</span>
                </div>
                <div className="flex justify-between">
                  <span>Baseline Samples:</span>
                  <span className="text-slate-300">{cl.sampleCount} Sessions</span>
                </div>
                <div className="flex justify-between">
                  <span>Historical Consistency:</span>
                  <span className="text-emerald-400 font-bold">{Math.round(cl.centroid.historicalConsistency * 100)}%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                Last matched session: {cl.lastMatched}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
