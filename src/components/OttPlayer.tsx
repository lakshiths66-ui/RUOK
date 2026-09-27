import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, Pause, Shield, ShieldAlert, AlertTriangle, RefreshCw, Eye, 
  Lock, Key, Wifi, Video, Terminal, Crosshair, Sparkles 
} from 'lucide-react';
import { Session, RiskAssessment, RiskLevel } from '../types/drm';
import { simulateEncryptChunk, simulateDecryptChunk, EncryptedChunk, generateWatermarkPayload } from '../engine/cryptoSimulation';
import { RISK_POLICY } from '../engine/policy';

interface OttPlayerProps {
  currentSession: Session;
  currentRisk: RiskAssessment;
  onTriggerTamper: () => void;
  onTriggerCaptureSimulator: () => void;
  onRequestStepUpMfa: () => void;
  onResetStreamSecurity: () => void;
  isTampered: boolean;
  isCaptureHookActive: boolean;
}

export const OttPlayer: React.FC<OttPlayerProps> = ({
  currentSession,
  currentRisk,
  onTriggerTamper,
  onTriggerCaptureSimulator,
  onRequestStepUpMfa,
  onResetStreamSecurity,
  isTampered,
  isCaptureHookActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showStegoInspector, setShowStegoInspector] = useState(false);
  const [activeChunk, setActiveChunk] = useState<EncryptedChunk>(() => 
    simulateEncryptChunk(35, 'H264_SLICE_DATA_SEC_142')
  );
  const [leakTraceResult, setLeakTraceResult] = useState<string | null>(null);

  // Dynamic drift coordinates for forensic watermark
  const [watermarkPos, setWatermarkPos] = useState({ x: 30, y: 40 });

  // Refs for smooth canvas animation without re-render cascades
  const playbackTimeRef = useRef(142.4);
  const isPlayingRef = useRef(isPlaying);
  const isTamperedRef = useRef(isTampered);
  const showStegoInspectorRef = useRef(showStegoInspector);
  const currentSessionRef = useRef(currentSession);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isTamperedRef.current = isTampered;
  }, [isTampered]);

  useEffect(() => {
    showStegoInspectorRef.current = showStegoInspector;
  }, [showStegoInspector]);

  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  // Update dynamic watermark position periodically
  useEffect(() => {
    const updateWatermark = () => {
      const sess = currentSessionRef.current;
      const payload = generateWatermarkPayload(
        sess.id,
        sess.devicePseudonym,
        sess.approxRegion
      );
      setWatermarkPos({
        x: payload.renderCoordinate.xPercent,
        y: payload.renderCoordinate.yPercent,
      });
    };

    updateWatermark();
    const interval = setInterval(updateWatermark, 2500);
    return () => clearInterval(interval);
  }, []);

  // Update simulated AES chunk periodically at a safe human cadence (every 2.5s)
  useEffect(() => {
    const updateChunk = () => {
      const chunkIndex = Math.floor(playbackTimeRef.current / 4);
      const chunk = simulateEncryptChunk(
        chunkIndex,
        `H264_SLICE_DATA_SEC_${Math.floor(playbackTimeRef.current)}`
      );
      if (isTamperedRef.current) {
        chunk.tampered = true;
      }
      setActiveChunk(chunk);
    };

    updateChunk();
    const interval = setInterval(updateChunk, 2500);
    return () => clearInterval(interval);
  }, [isTampered]);

  // High-performance continuous canvas animation loop
  useEffect(() => {
    let animationFrameId: number;
    let t = 0;

    const render = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      const tampered = isTamperedRef.current;
      const playing = isPlayingRef.current;
      const session = currentSessionRef.current;
      const stegoActive = showStegoInspectorRef.current;

      // Clear frame
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      if (tampered) {
        // Render corrupted glitch static on AES tag mismatch
        ctx.fillStyle = '#1c0505';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        for (let i = 0; i < 40; i++) {
          const y = Math.random() * height;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y + (Math.random() * 20 - 10));
          ctx.stroke();
        }

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AES-256-GCM TAG MISMATCH: CIPHERTEXT REJECTED', width / 2, height / 2 - 20);
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('Payload integrity corrupted in transit. Playback halted to protect DRM key.', width / 2, height / 2 + 15);
      } else {
        // Draw synthetic cinematic video scene
        t += 0.02;
        if (playing) {
          playbackTimeRef.current += 0.03;
        }
        const time = playbackTimeRef.current;

        // Draw deep space horizon gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a1026');
        grad.addColorStop(0.6, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Perspective grid lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        const horizon = height * 0.65;
        for (let x = -width; x < width * 2; x += 60) {
          ctx.beginPath();
          ctx.moveTo(width / 2, horizon);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = horizon; y < height; y += (y - horizon) * 0.35 + 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Glowing sun/sphere
        const sunRadius = 50 + Math.sin(t) * 3;
        const sunGrad = ctx.createRadialGradient(width / 2, horizon - 20, 5, width / 2, horizon - 20, sunRadius * 1.8);
        sunGrad.addColorStop(0, '#38bdf8');
        sunGrad.addColorStop(0.4, 'rgba(14, 165, 233, 0.4)');
        sunGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(width / 2, horizon - 20, sunRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Audio frequency wave bars at bottom
        const barCount = 36;
        const barWidth = 4;
        const gap = (width - barCount * barWidth) / (barCount + 1);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.abs(Math.sin(t * 2 + i * 0.4) * Math.cos(i * 0.2)) * 40 + 4;
          ctx.fillRect(gap + i * (barWidth + gap), height - 20 - barHeight, barWidth, barHeight);
        }

        // On-screen timecode & DRM watermark status
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        const mins = Math.floor(time / 60).toString().padStart(2, '0');
        const secs = Math.floor(time % 60).toString().padStart(2, '0');
        const frames = Math.floor((time * 24) % 24).toString().padStart(2, '0');
        ctx.fillText(`TC 00:${mins}:${secs}:${frames} · 24.00 FPS · ${session.streamQuality}`, 24, 32);

        // Resolution label in corner
        ctx.textAlign = 'right';
        ctx.fillText(`STREAM: ${session.id} · KEY_ID: 0x4f8a`, width - 24, 32);

        // Steganographic visual pattern mode
        if (stegoActive) {
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
          ctx.strokeRect(10, 10, width - 20, height - 20);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.9)';
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`[STEGO EMBED PATTERN ACTIVE: PARITY_HASH=${session.devicePseudonym.substring(0, 10)}]`, 24, height - 35);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleSimulateForensicLeakExtraction = () => {
    const extractedString = `Extracted from video frame watermark:
• Target User Pseudonym: ${currentSession.userId} (${currentSession.devicePseudonym})
• Originating Session ID: ${currentSession.id}
• Forensic Timestamp: ${new Date().toISOString()}
• Coarse Geo Territory: ${currentSession.approxRegion}
• Recovery Confidence: 99.8% (Steganographic parity match)`;
    setLeakTraceResult(extractedString);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Risk is Elevated or Tampered */}
      {isTampered && (
        <div className="flex items-center justify-between p-4 bg-rose-950/80 border border-rose-800/80 rounded-lg text-rose-200 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-rose-100">Tamper Alert: AES-256-GCM Tag Mismatch Detected</p>
              <p className="text-rose-300/80 mt-0.5">Media segment ciphertext failed cryptographic authentication tag verification. Stream decryption blocked.</p>
            </div>
          </div>
          <button
            onClick={onResetStreamSecurity}
            className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 rounded-md font-medium border border-rose-700 transition-colors cursor-pointer"
          >
            Restore Authentic Key
          </button>
        </div>
      )}

      {currentRisk.level === 'HIGH' && !isTampered && (
        <div className="flex items-center justify-between p-4 bg-rose-950/80 border border-rose-800/80 rounded-lg text-rose-200 text-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-rose-100">High Risk Session State ({currentRisk.score}/100)</p>
              <p className="text-rose-300/80 mt-0.5">Stream restricted to 480p SD. Dynamic forensic watermark opacity intensified to 65%. Step-up verification required.</p>
            </div>
          </div>
          <button
            onClick={onRequestStepUpMfa}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-semibold transition-colors cursor-pointer"
          >
            Verify via Step-Up MFA
          </button>
        </div>
      )}

      {isCaptureHookActive && (
        <div className="flex items-center justify-between p-4 bg-amber-950/70 border border-amber-800/80 rounded-lg text-amber-200 text-xs">
          <div className="flex items-center gap-3">
            <Crosshair className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-amber-100">Screen Capture Tool Hook Detected (OBS / DXGI Surface)</p>
              <p className="text-amber-300/80 mt-0.5">Adaptive DRM response activated: High-visibility forensic watermark overlay applied to deter unauthorized distribution.</p>
            </div>
          </div>
          <button
            onClick={onResetStreamSecurity}
            className="px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800 text-amber-100 rounded-md font-medium border border-amber-700 transition-colors cursor-pointer"
          >
            Dismiss Hook
          </button>
        </div>
      )}

      {/* Main Video Player Canvas Container */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full aspect-video block bg-slate-950"
        />

        {/* Dynamic Forensic Watermark Overlay (Floating randomly across screen) */}
        {!isTampered && (
          <div
            style={{
              position: 'absolute',
              left: `${watermarkPos.x}%`,
              top: `${watermarkPos.y}%`,
              opacity: currentSession.watermarkOpacity,
              transition: 'left 2.5s ease-in-out, top 2.5s ease-in-out, opacity 0.5s ease',
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
            }}
            className="p-2.5 rounded bg-black/60 backdrop-blur-[2px] border border-white/20 text-white font-mono text-[10px] leading-tight select-none shadow-lg"
          >
            <div className="flex items-center gap-1.5 mb-1 font-semibold text-cyan-300">
              <Shield className="w-3 h-3" />
              <span>FORENSIC SESSION TRACE</span>
            </div>
            <div>UID: {currentSession.userId}</div>
            <div>DEV: {currentSession.devicePseudonym}</div>
            <div>SES: {currentSession.id}</div>
            <div>GEO: {currentSession.approxRegion}</div>
            <div>{new Date().toISOString().substring(0, 19)}Z</div>
            {showStegoInspector && (
              <div className="mt-1 pt-1 border-t border-white/20 text-amber-300">
                STEGO: #8f921_parity_valid
              </div>
            )}
          </div>
        )}

        {/* Video Player Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <div className="text-xs font-mono text-slate-300">
              <span className="font-semibold text-white">{currentSession.streamQuality}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>Bitrate: {currentSession.streamQuality === '1080p FHD' ? '5.8 Mbps' : currentSession.streamQuality === '720p HD' ? '2.9 Mbps' : '1.1 Mbps'}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>Watermark Opacity: {Math.round(currentSession.watermarkOpacity * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStegoInspector(!showStegoInspector)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                showStegoInspector 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/70'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showStegoInspector ? 'Hide Stego Pattern' : 'Inspect Stego Bits'}</span>
            </button>
            <button
              onClick={handleSimulateForensicLeakExtraction}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/60 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extract Forensic Trace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forensic Extraction Modal Result */}
      {leakTraceResult && (
        <div className="p-4 bg-slate-900 border border-cyan-800/50 rounded-lg text-xs font-mono text-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Forensic Leak Recovery Output</span>
            </div>
            <button
              onClick={() => setLeakTraceResult(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          <pre className="text-cyan-200/90 whitespace-pre-wrap leading-relaxed">
            {leakTraceResult}
          </pre>
        </div>
      )}

      {/* Controls & Security Injectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel 1: AES-256-GCM Cryptographic Integrity */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>AES-256-GCM Media Segments</span>
            </div>
            <span className="font-mono text-cyan-400">Authenticated</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Chunk:</span>
              <span className="text-slate-300">#{activeChunk?.chunkIndex ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IV (96-bit):</span>
              <span className="text-slate-300">{activeChunk?.ivHex.substring(0, 14)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tag (128-bit):</span>
              <span className="text-cyan-400">{activeChunk?.tagHex.substring(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className={isTampered ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                {isTampered ? 'TAG_MISMATCH_REJECTED' : 'AUTH_TAG_VERIFIED'}
              </span>
            </div>
          </div>

          <button
            onClick={onTriggerTamper}
            className={`w-full py-2 px-3 text-xs font-semibold rounded transition-colors cursor-pointer ${
              isTampered
                ? 'bg-rose-900/50 text-rose-200 border border-rose-700 hover:bg-rose-800/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isTampered ? 'Restore Untampered Chunk' : 'Inject Ciphertext Tamper (Bitflip)'}
          </button>
        </div>

        {/* Panel 2: Screen Recording / Capture Detector */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-amber-400" />
              <span>Capture & Screen Hooks</span>
            </div>
            <span className="font-mono text-amber-400">Integrity Hook</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Detects client-side window capture API usage (e.g., OBS, DXGI, MediaProjection). Triggers progressive adaptive deterrence instead of brittle instant disconnection.
          </p>

          <button
            onClick={onTriggerCaptureSimulator}
            className={`w-full py-2 px-3 text-xs font-semibold rounded transition-colors cursor-pointer ${
              isCaptureHookActive
                ? 'bg-amber-900/50 text-amber-200 border border-amber-700 hover:bg-amber-800/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isCaptureHookActive ? 'Stop Capture Hook Simulation' : 'Simulate Screen Recorder Tool (OBS)'}
          </button>
        </div>

        {/* Panel 3: Adaptive Security Controller Action */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Adaptive DRM Policy</span>
            </div>
            <span className={`font-mono text-xs font-bold ${
              currentRisk.level === 'LOW' ? 'text-emerald-400' : currentRisk.level === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {currentRisk.level} RISK ({currentRisk.score}/100)
            </span>
          </div>

          <div className="text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Pipeline Stage:</span>
              <span className="font-mono text-slate-200">{currentRisk.stage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Adaptive Action:</span>
              <span className="font-mono text-cyan-400">{currentRisk.actionTaken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Latency:</span>
              <span className="font-mono text-slate-200">{currentRisk.evaluatedMs} ms</span>
            </div>
          </div>

          <button
            onClick={onRequestStepUpMfa}
            className="w-full py-2 px-3 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
          >
            Trigger Step-Up MFA Challenge
          </button>
        </div>
      </div>
    </div>
  );
};
