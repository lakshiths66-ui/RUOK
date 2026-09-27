import React, { useState, useMemo } from 'react';
import { 
  Cpu, Sliders, CheckCircle2, AlertOctagon, HelpCircle, 
  ArrowRight, ShieldCheck, ShieldAlert, BarChart3, RotateCcw, Zap
} from 'lucide-react';
import { RiskFeatures, RiskAssessment } from '../types/drm';
import { runTwoStageRiskPipeline, evaluateMLModel, FEATURE_IMPORTANCES } from '../engine/mlEngine';
import { evaluateRules } from '../engine/ruleEngine';
import { RISK_POLICY } from '../engine/policy';

interface RiskEngineLabProps {
  onApplyAssessmentToPlayer?: (assessment: RiskAssessment) => void;
}

export const RiskEngineLab: React.FC<RiskEngineLabProps> = ({ onApplyAssessmentToPlayer }) => {
  const [features, setFeatures] = useState<RiskFeatures>({
    trusted_device: true,
    new_device: false,
    mfa_success: true,
    auth_failures: 0,
    concurrent_sessions: 1,
    session_duration_min: 45,
    region_change: false,
    impossible_travel: false,
    vpn_indicator: false,
    playback_anomaly: false,
    capture_indicator: false,
    historical_consistency: 0.90,
  });

  // Evaluate rule stage directly
  const ruleResult = useMemo(() => evaluateRules(features), [features]);

  // Full two-stage pipeline assessment
  const assessment = useMemo(() => runTwoStageRiskPipeline(features), [features]);

  // ML evaluation breakdown (computed so user can compare even if rules bypassed)
  const mlBreakdown = useMemo(() => evaluateMLModel(features), [features]);

  const updateFeature = <K extends keyof RiskFeatures>(key: K, value: RiskFeatures[K]) => {
    setFeatures(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'legitimate_traveler':
        setFeatures({
          trusted_device: true,
          new_device: false,
          mfa_success: true,
          auth_failures: 0,
          concurrent_sessions: 1,
          session_duration_min: 30,
          region_change: true,
          impossible_travel: false,
          vpn_indicator: false,
          playback_anomaly: false,
          capture_indicator: false,
          historical_consistency: 0.85,
        });
        break;
      case 'new_device_mfa':
        setFeatures({
          trusted_device: false,
          new_device: true,
          mfa_success: true,
          auth_failures: 0,
          concurrent_sessions: 1,
          session_duration_min: 15,
          region_change: false,
          impossible_travel: false,
          vpn_indicator: false,
          playback_anomaly: false,
          capture_indicator: false,
          historical_consistency: 0.76,
        });
        break;
      case 'credential_stuffing':
        setFeatures({
          trusted_device: false,
          new_device: true,
          mfa_success: false,
          auth_failures: 4,
          concurrent_sessions: 2,
          session_duration_min: 5,
          region_change: true,
          impossible_travel: false,
          vpn_indicator: true,
          playback_anomaly: false,
          capture_indicator: false,
          historical_consistency: 0.2,
        });
        break;
      case 'impossible_travel':
        setFeatures({
          trusted_device: false,
          new_device: true,
          mfa_success: false,
          auth_failures: 2,
          concurrent_sessions: 2,
          session_duration_min: 10,
          region_change: true,
          impossible_travel: true,
          vpn_indicator: true,
          playback_anomaly: false,
          capture_indicator: false,
          historical_consistency: 0.15,
        });
        break;
      case 'capture_recorder':
        setFeatures({
          trusted_device: true,
          new_device: false,
          mfa_success: true,
          auth_failures: 0,
          concurrent_sessions: 1,
          session_duration_min: 40,
          region_change: false,
          impossible_travel: false,
          vpn_indicator: false,
          playback_anomaly: false,
          capture_indicator: true,
          historical_consistency: 0.70,
        });
        break;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Preset Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white">Two-Stage Risk Assessment & Explainable AI Lab</h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate incoming session signals, observe Stage 1 Rule Engine fast paths, Stage 2 ML inference, and SHAP feature attribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">PRESETS:</span>
          <button
            onClick={() => applyPreset('legitimate_traveler')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            Legitimate Traveler
          </button>
          <button
            onClick={() => applyPreset('new_device_mfa')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            New Device + MFA
          </button>
          <button
            onClick={() => applyPreset('credential_stuffing')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            Auth Stuffing Attack
          </button>
          <button
            onClick={() => applyPreset('impossible_travel')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            Impossible Travel
          </button>
          <button
            onClick={() => applyPreset('capture_recorder')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            Screen Recorder Hook
          </button>
        </div>
      </div>

      {/* Two-Stage Pipeline Flow Architecture Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Step 1: Input Session Features */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">01. Session Signals</span>
            <span className="text-xs text-slate-500 font-mono">12 Features</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Client telemetry ingested during session start or heartbeat outside video playback hot path.
          </p>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-500">Trusted Hardware:</span>
              <span className={features.trusted_device ? 'text-emerald-400' : 'text-amber-400'}>
                {features.trusted_device ? 'YES (Enrolled)' : 'NO (Untrusted)'}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-500">Location Delta:</span>
              <span className={features.region_change ? 'text-cyan-400' : 'text-slate-300'}>
                {features.region_change ? 'Region Change' : 'Primary Home Region'}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-500">Auth Failures:</span>
              <span className={features.auth_failures > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {features.auth_failures}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-500">Impossible Velocity:</span>
              <span className={features.impossible_travel ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {features.impossible_travel ? 'TRIGGERED (>900 km/h)' : 'Normal Velocity'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Baseline Alignment:</span>
              <span className="text-cyan-400 font-bold">
                {Math.round(features.historical_consistency * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Stage 1 Rule Engine Evaluation */}
        <div className={`p-4 rounded-lg border ${
          ruleResult.isResolved 
            ? ruleResult.level === 'HIGH' 
              ? 'bg-rose-950/30 border-rose-800/60' 
              : 'bg-emerald-950/30 border-emerald-800/60'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">02. Stage 1: Rule Engine</span>
            <span className="text-xs font-mono text-cyan-400">~0.0004 ms</span>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              {ruleResult.stage === 'RULE_FAST_NORMAL' && (
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-mono font-semibold">
                  FAST PASS · Clearly Normal
                </span>
              )}
              {ruleResult.stage === 'RULE_FAST_BAD' && (
                <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded font-mono font-semibold">
                  FAST REJECT · Multi-Anomaly Attack
                </span>
              )}
              {ruleResult.stage === 'UNCERTAIN' && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-semibold">
                  UNCERTAIN · Dispatch to Stage 2 ML
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ruleResult.rationale}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <span>Rule Invariant: </span>
            <span className="text-slate-300">Single weak signal can never force HIGH risk.</span>
          </div>
        </div>

        {/* Step 3: Stage 2 ML Random Forest & Final Action */}
        <div className={`p-4 rounded-lg border ${
          assessment.level === 'LOW' 
            ? 'bg-emerald-950/20 border-emerald-800/50' 
            : assessment.level === 'MEDIUM' 
            ? 'bg-amber-950/20 border-amber-800/50' 
            : 'bg-rose-950/20 border-rose-800/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">03. Final Risk & Action</span>
            <span className="text-xs font-mono text-cyan-400">{assessment.evaluatedMs} ms</span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-2xl font-bold font-mono text-white">{assessment.score}</span>
              <span className="text-xs text-slate-400 font-mono"> / 100</span>
            </div>
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
              assessment.level === 'LOW' 
                ? 'bg-emerald-500/20 text-emerald-300' 
                : assessment.level === 'MEDIUM' 
                ? 'bg-amber-500/20 text-amber-300' 
                : 'bg-rose-500/20 text-rose-300'
            }`}>
              {assessment.level} RISK
            </span>
          </div>

          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 space-y-1 mb-3 text-xs">
            <div className="text-slate-400">Proportional Adaptive Action:</div>
            <div className="font-semibold text-cyan-300 font-mono">{assessment.actionTaken}</div>
          </div>

          {onApplyAssessmentToPlayer && (
            <button
              onClick={() => onApplyAssessmentToPlayer(assessment)}
              className="w-full py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              Apply to Live Player Session
            </button>
          )}
        </div>
      </div>

      {/* Feature Slider Controls & SHAP Waterfall Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive 12 Feature Controls */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Live Feature Modulation</h3>
            </div>
            <button
              onClick={() => applyPreset('legitimate_traveler')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Boolean Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-slate-200">Trusted Device</div>
                  <div className="text-[11px] text-slate-500">Cryptographic hardware token</div>
                </div>
                <input
                  type="checkbox"
                  checked={features.trusted_device}
                  onChange={(e) => updateFeature('trusted_device', e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-slate-200">New Device</div>
                  <div className="text-[11px] text-slate-500">First time seen</div>
                </div>
                <input
                  type="checkbox"
                  checked={features.new_device}
                  onChange={(e) => updateFeature('new_device', e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-slate-200">MFA Success</div>
                  <div className="text-[11px] text-slate-500">Recent TOTP challenge validated</div>
                </div>
                <input
                  type="checkbox"
                  checked={features.mfa_success}
                  onChange={(e) => updateFeature('mfa_success', e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-slate-200">Region Change</div>
                  <div className="text-[11px] text-slate-500">Different territory IP</div>
                </div>
                <input
                  type="checkbox"
                  checked={features.region_change}
                  onChange={(e) => updateFeature('region_change', e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-rose-300">Impossible Travel</div>
                  <div className="text-[11px] text-slate-500">Superhuman velocity (&gt;900km/h)</div>
                </div>
                <input
                  type="checkbox"
                  checked={features.impossible_travel}
                  onChange={(e) => updateFeature('impossible_travel', e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-amber-300">Capture Tool Hook</div>
                  <div className="text-[11px] text-slate-500">DXGI / MediaProjection API hook</div>
                </div>
                <input
                  type="checkbox"
                  checked={features.capture_indicator}
                  onChange={(e) => updateFeature('capture_indicator', e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Continuous Sliders */}
            <div className="space-y-4">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="flex justify-between mb-1.5 font-medium">
                  <span className="text-slate-200">Historical Consistency:</span>
                  <span className="font-mono text-cyan-400">{Math.round(features.historical_consistency * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={features.historical_consistency}
                  onChange={(e) => updateFeature('historical_consistency', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="text-[10px] text-slate-500 mt-1">Cosine similarity to family cluster centroid</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="flex justify-between mb-1.5 font-medium">
                  <span className="text-slate-200">Auth Failures:</span>
                  <span className="font-mono text-rose-400">{features.auth_failures}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={features.auth_failures}
                  onChange={(e) => updateFeature('auth_failures', parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="text-[10px] text-slate-500 mt-1">Recent consecutive bad passwords</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="flex justify-between mb-1.5 font-medium">
                  <span className="text-slate-200">Concurrent Streams:</span>
                  <span className="font-mono text-slate-300">{features.concurrent_sessions}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={features.concurrent_sessions}
                  onChange={(e) => updateFeature('concurrent_sessions', parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="text-[10px] text-slate-500 mt-1">Simultaneous active playback tokens</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="flex justify-between mb-1.5 font-medium">
                  <span className="text-slate-200">Playback Anomaly:</span>
                  <span className={features.playback_anomaly ? 'font-mono text-rose-400' : 'font-mono text-slate-500'}>
                    {features.playback_anomaly ? 'DETECTED' : 'NORMAL'}
                  </span>
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.playback_anomaly}
                    onChange={(e) => updateFeature('playback_anomaly', e.target.checked)}
                    className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                  />
                  <span className="text-[11px] text-slate-400">Segment download speed burst / scraper</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: SHAP Feature Attribution Waterfall Chart */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">SHAP Value Attribution Waterfall</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Base Risk: 18.0</span>
          </div>

          <p className="text-xs text-slate-400">
            Mathematical breakdown of how each feature shifts the predicted session risk score higher or lower relative to base.
          </p>

          <div className="space-y-2.5 pt-2">
            {Object.entries(mlBreakdown.shapValues)
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .map(([feat, val]) => {
                const isProtective = val < 0;
                const absVal = Math.abs(val);
                const barWidth = Math.min(Math.round((absVal / 45) * 100), 100);

                return (
                  <div key={feat} className="text-xs space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300 font-sans">{feat}</span>
                      <span className={isProtective ? 'text-emerald-400' : val > 0 ? 'text-rose-400' : 'text-slate-500'}>
                        {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                      {isProtective ? (
                        <div className="flex w-full justify-end pr-1">
                          <div
                            style={{ width: `${barWidth}%` }}
                            className="h-full bg-emerald-500/80 rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="flex w-full justify-start pl-1">
                          <div
                            style={{ width: `${barWidth}%` }}
                            className="h-full bg-rose-500/80 rounded-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-4 p-3 rounded bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200">Explainable Model Rationale:</div>
            <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
              {mlBreakdown.rationale}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
