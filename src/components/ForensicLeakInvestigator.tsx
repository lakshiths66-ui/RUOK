import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, AlertTriangle, FileText, CheckCircle2, 
  Upload, Search, Fingerprint, Lock, Scale, Bot, RefreshCw
} from 'lucide-react';
import { extractForensicLeakMetadata } from '../engine/cryptoSimulation';

interface ForensicLeakInvestigatorProps {
  currentSessionId?: string;
  currentUserId?: string;
  onSelectSession?: (sessionId: string) => void;
}

export const ForensicLeakInvestigator: React.FC<ForensicLeakInvestigatorProps> = ({
  currentSessionId = 'sess_chn_tv_991',
  currentUserId = 'usr_8f3d01b',
}) => {
  const [inputWatermarkText, setInputWatermarkText] = useState(
    `[FORENSIC-CENC-WATERMARK]\nUID: ${currentUserId}\nDEV: dev_e82f419c8d10\nSES: ${currentSessionId}\nGEO: Chennai, IN\nTIME: 2026-09-26 10:45:00Z\nSTEGO_PARITY: #8f921_parity_valid`
  );

  const [decoderResult, setDecoderResult] = useState<any>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);

  const handleDecode = async () => {
    setIsDecoding(true);
    setAiReport(null);

    // Call server API or fallback
    try {
      const res = await fetch('/api/drm/extract-leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawWatermarkText: inputWatermarkText }),
      });
      const data = await res.json();
      setDecoderResult(data.data || extractForensicLeakMetadata(inputWatermarkText));
    } catch (e) {
      setDecoderResult(extractForensicLeakMetadata(inputWatermarkText));
    } finally {
      setIsDecoding(false);
    }
  };

  const handleGenerateAiDossier = async () => {
    if (!decoderResult) return;
    setIsGeneratingAiReport(true);

    try {
      const res = await fetch('/api/ai/investigate-threat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leakMetadata: decoderResult,
          sessionDetails: {
            id: decoderResult.identifiedSession,
            userId: decoderResult.identifiedUser,
          },
          assessment: {
            score: 92,
            level: 'HIGH',
            stage: 'FORENSIC_LEAK_CONFIRMED',
            actionTaken: 'TERMINATE_SESSION',
          },
        }),
      });
      const data = await res.json();
      setAiReport(data.investigation);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  const loadPresetSample = (type: 'telegram' | 'discord' | 'hdmi') => {
    if (type === 'telegram') {
      setInputWatermarkText(
        `[FORENSIC-CENC-WATERMARK]\nUID: usr_8f3d01b\nDEV: dev_3b91a0c4f812\nSES: sess_ldn_mac_402\nGEO: London, UK\nTIME: 2026-09-26 10:15:00Z\nSTEGO_PARITY: #3b91a_parity_valid`
      );
    } else if (type === 'discord') {
      setInputWatermarkText(
        `[FORENSIC-CENC-WATERMARK]\nUID: usr_8f3d01b\nDEV: dev_e82f419c8d10\nSES: sess_chn_tv_991\nGEO: Chennai, IN\nTIME: 2026-09-26 09:50:00Z\nSTEGO_PARITY: #e82f4_parity_valid`
      );
    } else {
      setInputWatermarkText(
        `[FORENSIC-CENC-WATERMARK]\nUID: usr_pirate_node_99\nDEV: dev_9f88c12a4b03\nSES: sess_tokyo_rip_01\nGEO: Tokyo, JP\nTIME: 2026-09-26 09:12:00Z\nSTEGO_PARITY: #9f88c_parity_valid`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Forensic Watermark Leak Decoder & Piracy Attribution</h2>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/60">
            DWT/DCT Stego Parity · 99.8% Attribution Confidence
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          When pirated screen captures, cam recordings, or restream rips appear on external platforms (Telegram, Discord, Torrent trackers), ingest the watermarked frame to mathematically trace the leak back to the originating subscriber account and license session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Frame / Watermark String (6 cols) */}
        <div className="lg:col-span-6 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Leaked Footage Ingestion</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-mono">Samples:</span>
              <button
                onClick={() => loadPresetSample('telegram')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Telegram Cam
              </button>
              <button
                onClick={() => loadPresetSample('discord')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Discord Stream
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Optical / Steganographic Payload Extracted from Video Frame
            </label>
            <textarea
              rows={8}
              value={inputWatermarkText}
              onChange={(e) => setInputWatermarkText(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed"
              placeholder="Paste extracted OCR watermark metadata or frame parity data..."
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-500 font-mono">
              Parity Algorithm: Reed-Solomon Error Correction Code
            </div>
            <button
              onClick={handleDecode}
              disabled={isDecoding}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isDecoding ? 'Scanning Stego Bits...' : 'Extract Subscriber Identity'}</span>
            </button>
          </div>
        </div>

        {/* Right: Extracted Evidence & Chain of Custody (6 cols) */}
        <div className="lg:col-span-6 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Attributed Account Dossier</h3>
            </div>
            {decoderResult && (
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {Math.round(decoderResult.confidence * 100)}% Matched
              </span>
            )}
          </div>

          {decoderResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Identified User Pseudonym:</span>
                  <span className="text-white font-bold">{decoderResult.identifiedUser}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Originating Playback Session:</span>
                  <span className="text-cyan-300 font-bold">{decoderResult.identifiedSession}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Forensic Extraction Confidence:</span>
                  <span className="text-emerald-400 font-bold">{(decoderResult.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Steganographic Parity Check:</span>
                  <span className="text-emerald-400">PARITY_VERIFIED (Checksum OK)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Anti-Cropping Drift Verification:</span>
                  <span className="text-slate-300">Trajectory Coordinates Reconstructed</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleGenerateAiDossier}
                  disabled={isGeneratingAiReport}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{isGeneratingAiReport ? 'Generating AI Legal Dossier...' : 'AI Forensic Threat Investigation (Gemini)'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-500">
              Click &quot;Extract Subscriber Identity&quot; on the left to reconstruct the responsible account from the watermark payload.
            </div>
          )}
        </div>
      </div>

      {/* AI Security Copilot Incident Dossier */}
      {aiReport && (
        <div className="p-6 bg-slate-900 border border-indigo-500/50 rounded-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Gemini Anti-Piracy Threat & Legal Dossier</h3>
                <p className="text-[11px] text-slate-400 font-mono">Automated CISO Security Operations Report</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
              SEVERITY: {aiReport.threatSeverity || 'HIGH'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-semibold text-indigo-300">Incident Classification:</span>
              <p className="text-slate-200">{aiReport.incidentClassification}</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-semibold text-indigo-300">False-Positive Differential Analysis:</span>
              <p className="text-slate-200">{aiReport.falsePositiveAssessment}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-indigo-300">Adversary Root-Cause Hypothesis:</span>
            <p className="text-slate-300 leading-relaxed font-sans">{aiReport.rootCauseHypothesis}</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-emerald-400">Immediate Recommended Containment Actions:</span>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 font-sans">
              {aiReport.recommendedContainment?.map((step: string, idx: number) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Scale className="w-4 h-4" />
              <span>Forensic Evidentiary & Legal Traceability Summary (DMCA Section 512):</span>
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">{aiReport.forensicEvidentiarySummary}</p>
          </div>
        </div>
      )}
    </div>
  );
};
