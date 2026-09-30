import React, { useState } from 'react';
import { 
  Shield, Activity, Database, AlertTriangle, CheckCircle, 
  Trash2, RefreshCw, Search, Filter, Lock, Terminal, Compass
} from 'lucide-react';
import { AuditLogEntry, RiskAssessment } from '../types/drm';

interface AdminAuditDashboardProps {
  auditLogs: AuditLogEntry[];
  recentAssessments: RiskAssessment[];
  onPurgeExpiredLogs: () => void;
  onViewGeofenceModal?: () => void;
}

export const AdminAuditDashboard: React.FC<AdminAuditDashboardProps> = ({
  auditLogs,
  recentAssessments,
  onPurgeExpiredLogs,
  onViewGeofenceModal,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warn' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return log.eventType.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.actor.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePurge = () => {
    onPurgeExpiredLogs();
    setPurgeFeedback('Automated hard retention purge executed. Expired records (>30 days) removed.');
    setTimeout(() => setPurgeFeedback(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Central Security Operations & Audit Ledger</h2>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/60">
            Immutable Audit Trail · Tamper-Evident SHA-256
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Monitors end-to-end OTT license authorization, Stage 1 Rule Engine fast paths, Stage 2 ML evaluations, and tamper events.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
          <div className="text-xs font-mono text-slate-500 uppercase">Rule Fast-Path Ratio</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">84.2%</div>
          <p className="text-[11px] text-slate-400 mt-1">Sessions resolved in Stage 1 (&lt;0.001ms)</p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
          <div className="text-xs font-mono text-slate-500 uppercase">Stage 1 Latency</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">0.0004 ms</div>
          <p className="text-[11px] text-slate-400 mt-1">Negligible overhead on stream start</p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
          <div className="text-xs font-mono text-slate-500 uppercase">Stage 2 ML Inference</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">10.6 ms</div>
          <p className="text-[11px] text-slate-400 mt-1">Async background task execution</p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
          <div className="text-xs font-mono text-slate-500 uppercase">False-Positive Rate</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">0.00%</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 8 legitimate test scenarios</p>
        </div>
      </div>

      {/* Section: Live Risk Assessment Stream */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Live Stream Risk Assessment Stream</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Real-Time Ingestion</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Session & Target</th>
                <th className="py-2.5 px-3">Pipeline Stage</th>
                <th className="py-2.5 px-3">Score & Level</th>
                <th className="py-2.5 px-3">Adaptive Action</th>
                <th className="py-2.5 px-3">Execution Latency</th>
                <th className="py-2.5 px-3">Evaluation Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentAssessments.slice(0, 6).map((ass) => (
                <tr key={ass.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">{ass.sessionId}</div>
                    <div className="text-[10px] text-slate-500">{ass.timestamp.substring(11, 19)} UTC</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[11px] text-slate-300 font-mono">
                      {ass.stage}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                      ass.level === 'LOW' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : ass.level === 'MEDIUM' 
                        ? 'bg-amber-500/20 text-amber-300' 
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {ass.score}/100 · {ass.level}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-cyan-400 font-semibold font-mono">
                    {ass.actionTaken}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {ass.evaluatedMs} ms
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-400 max-w-xs truncate">
                    {ass.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Immutable Security Audit Log Ledger */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Immutable Security Audit Ledger</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only tamper-evident event log. Records authentication, device enrollment, step-up MFA, and DRM policy enforcement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePurge}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Simulate Retention Purge (&gt;30d)</span>
            </button>
          </div>
        </div>

        {purgeFeedback && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-200 text-xs">
            {purgeFeedback}
          </div>
        )}

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                severityFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setSeverityFilter('info')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                severityFilter === 'info' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setSeverityFilter('warn')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                severityFilter === 'warn' ? 'bg-amber-900/50 text-amber-200 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Warn
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                severityFilter === 'critical' ? 'bg-rose-900/50 text-rose-200 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="space-y-2 font-mono text-xs">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    log.severity === 'critical' 
                      ? 'bg-rose-500/20 text-rose-300' 
                      : log.severity === 'warn'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.severity}
                  </span>
                  <span className="font-semibold text-slate-200">{log.eventType}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 font-sans">{log.actor}</span>
                </div>
                <p className="text-slate-300 font-sans text-xs">{log.details}</p>
                {log.eventType.includes('GEOFENCE') && onViewGeofenceModal && (
                  <div className="pt-1">
                    <button
                      onClick={onViewGeofenceModal}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-rose-950/80 border border-rose-700/80 text-rose-300 hover:bg-rose-900/80 transition-colors cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open Geodetic Radar Map Visualizer</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0 text-[11px] text-slate-500">
                <div>{log.timestamp}</div>
                <div className="text-[10px] text-slate-600 truncate max-w-[180px]">
                  HASH: {log.tamperHash}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
