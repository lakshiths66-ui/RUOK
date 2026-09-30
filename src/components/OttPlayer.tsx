import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, Pause, Shield, ShieldAlert, AlertTriangle, RefreshCw, Eye, 
  Lock, Key, Wifi, Video, Terminal, Crosshair, Sparkles, Bot, Tv, Film, Compass, Radio
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
  onOpenForensicDecoder?: () => void;
  onTriggerGeofenceBreach?: (locationKey?: string) => void;
  onViewGeofenceModal?: () => void;
  geofenceBreachActive?: boolean;
  geofenceDistanceKm?: number;
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
  onOpenForensicDecoder,
  onTriggerGeofenceBreach,
  onViewGeofenceModal,
  geofenceBreachActive = false,
  geofenceDistanceKm = 6820,
  isTampered,
  isCaptureHookActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playerMode, setPlayerMode] = useState<'canvas' | 'live_video'>('canvas');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showStegoInspector, setShowStegoInspector] = useState(false);
  const [activeChunk, setActiveChunk] = useState<EncryptedChunk>(() => 
    simulateEncryptChunk(35, 'H264_SLICE_DATA_SEC_142')
  );
  const [leakTraceResult, setLeakTraceResult] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);

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
    if (videoRef.current) {
      if (isPlaying && !isTampered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isTampered]);

  useEffect(() => {
    isTamperedRef.current = isTampered;
    if (isTampered && videoRef.current) {
      videoRef.current.pause();
    }
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
      if (!canvasRef.current || playerMode !== 'canvas') return;
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
  }, [playerMode]);

  const handleSimulateForensicLeakExtraction = () => {
    const extractedString = `Extracted from video frame watermark:
• Target User Pseudonym: ${currentSession.userId} (${currentSession.devicePseudonym})
• Originating Session ID: ${currentSession.id}
• Forensic Timestamp: ${new Date().toISOString()}
• Coarse Geo Territory: ${currentSession.approxRegion}
• Recovery Confidence: 99.8% (Steganographic parity match)`;
    setLeakTraceResult(extractedString);
  };

  const handleCallGeminiIncidentCopilot = async () => {
    setIsGeneratingAiReport(true);
    try {
      const res = await fetch('/api/ai/investigate-threat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment: currentRisk,
          sessionDetails: currentSession,
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

  return (
    <div className="space-y-6">
      {/* Geofence Breach Critical Alert Banner */}
      {geofenceBreachActive && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-950/85 border border-rose-700/90 rounded-xl text-rose-200 text-xs shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-rose-100">Critical Geo-Fencing Alert: Established Home ISP Perimeter Breach</p>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/30 text-rose-200 rounded font-bold">
                  +{geofenceDistanceKm.toLocaleString()} KM DELTA
                </span>
              </div>
              <p className="text-rose-300/90 mt-0.5">
                Session IP coordinates fall outside established home residential ISP zone (Chennai ACT Fibernet AS133694). ASN mismatch detected.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onViewGeofenceModal && (
              <button
                onClick={onViewGeofenceModal}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>View Map Visualization</span>
              </button>
            )}
            <button
              onClick={onResetStreamSecurity}
              className="px-2.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-md font-medium border border-rose-700 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-2">
            <button
              onClick={handleCallGeminiIncidentCopilot}
              disabled={isGeneratingAiReport}
              className="px-3 py-1.5 bg-indigo-900/70 hover:bg-indigo-800 text-indigo-100 rounded-md font-medium border border-indigo-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{isGeneratingAiReport ? 'Analyzing...' : 'AI Threat Copilot'}</span>
            </button>
            <button
              onClick={onResetStreamSecurity}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 rounded-md font-medium border border-rose-700 transition-colors cursor-pointer"
            >
              Restore Authentic Key
            </button>
          </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleCallGeminiIncidentCopilot}
              disabled={isGeneratingAiReport}
              className="px-3 py-1.5 bg-indigo-900/70 hover:bg-indigo-800 text-indigo-100 rounded-md font-medium border border-indigo-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{isGeneratingAiReport ? 'Analyzing...' : 'AI Threat Copilot'}</span>
            </button>
            <button
              onClick={onRequestStepUpMfa}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-semibold transition-colors cursor-pointer"
            >
              Verify via Step-Up MFA
            </button>
          </div>
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

      {geofenceBreachActive && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-rose-950/85 border border-rose-700 rounded-lg text-rose-200 text-xs gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-rose-400 shrink-0 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-rose-100">Critical Geo-Fencing Alert: Residential ISP Perimeter Breached</p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  +{geofenceDistanceKm.toLocaleString()} KM OUT OF HOME ZONE
                </span>
              </div>
              <p className="text-rose-300/80 mt-0.5 font-mono">
                Session IP coordinates and ASN mismatch detected outside the established household boundary. Critical audit log event committed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {onViewGeofenceModal && (
              <button
                onClick={onViewGeofenceModal}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-cyan-900/70 hover:bg-cyan-800 text-cyan-100 rounded-md font-semibold border border-cyan-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Radar Map</span>
              </button>
            )}
            <button
              onClick={onRequestStepUpMfa}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-semibold transition-colors cursor-pointer text-center"
            >
              Verify via MFA
            </button>
          </div>
        </div>
      )}

      {/* Player Mode Switcher: Synthetic Canvas vs Real Video Stream */}
      <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Player Engine:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
            <button
              onClick={() => setPlayerMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                playerMode === 'canvas' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Synthetic Cinema Engine</span>
            </button>
            <button
              onClick={() => setPlayerMode('live_video')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                playerMode === 'live_video' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Live Real Video Stream (HTML5)</span>
            </button>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px] hidden sm:block">
          Active Profile: <span className="text-slate-200">{currentSession.activeProfileName}</span>
        </div>
      </div>

      {/* Main Video Player Canvas Container */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        {playerMode === 'canvas' ? (
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full aspect-video block bg-slate-950"
          />
        ) : (
          <div className="relative w-full aspect-video bg-black flex items-center justify-center">
            {isTampered ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-rose-950/90 text-rose-200 font-mono text-center p-6 space-y-2">
                <AlertTriangle className="w-10 h-10 text-rose-400 animate-pulse" />
                <h3 className="text-base font-bold">AES-256-GCM TAG VERIFICATION FAILED</h3>
                <p className="text-xs text-rose-300/80 max-w-md">Decrypted buffer discarded. Content Key 0x4f8a revoked to prevent unauthorized decryption.</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
                loop
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-contain ${
                  currentSession.streamQuality === '480p SD' ? 'blur-[1.5px] scale-[0.98]' : ''
                }`}
              />
            )}
          </div>
        )}

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
            className="p-2.5 rounded bg-black/60 backdrop-blur-[2px] border border-white/20 text-white font-mono text-[10px] leading-tight select-none shadow-lg z-10"
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
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between z-20">
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
            {onOpenForensicDecoder ? (
              <button
                onClick={onOpenForensicDecoder}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/60 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Forensic Decoder</span>
              </button>
            ) : (
              <button
                onClick={handleSimulateForensicLeakExtraction}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/60 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract Forensic Trace</span>
              </button>
            )}
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

      {/* Gemini AI Incident Investigation Dossier Drawer */}
      {aiReport && (
        <div className="p-5 bg-slate-900 border border-indigo-500/50 rounded-xl space-y-4 animate-in fade-in duration-300 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white">Gemini Threat Copilot Incident Analysis</h3>
            </div>
            <button
              onClick={() => setAiReport(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              Close Dossier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="font-semibold text-indigo-300">Incident Classification:</span>
              <p className="text-slate-200">{aiReport.incidentClassification}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="font-semibold text-indigo-300">Severity Level:</span>
              <p className="text-rose-300 font-bold font-mono">{aiReport.threatSeverity || 'HIGH'}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
            <span className="font-semibold text-indigo-300">Root-Cause Threat Analysis:</span>
            <p className="text-slate-300 leading-relaxed font-sans">{aiReport.rootCauseHypothesis}</p>
          </div>

          <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
            <span className="font-semibold text-emerald-400">Automated Containment Plan:</span>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 font-sans">
              {aiReport.recommendedContainment?.map((step: string, idx: number) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Controls & Security Injectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panel 1: AES-256-GCM Cryptographic Integrity */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>AES-256-GCM Segments</span>
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
            {isTampered ? 'Restore Untampered Chunk' : 'Inject Ciphertext Tamper'}
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
            Detects client-side window capture API usage (e.g., OBS, DXGI, MediaProjection). Triggers progressive adaptive deterrence.
          </p>

          <button
            onClick={onTriggerCaptureSimulator}
            className={`w-full py-2 px-3 text-xs font-semibold rounded transition-colors cursor-pointer ${
              isCaptureHookActive
                ? 'bg-amber-900/50 text-amber-200 border border-amber-700 hover:bg-amber-800/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isCaptureHookActive ? 'Stop Hook' : 'Simulate Screen Recorder (OBS)'}
          </button>
        </div>

        {/* Panel 3: Geo-Fencing & Home ISP Boundary Guardian */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-400" />
              <span>Geo-Fence Guardian</span>
            </div>
            <span className={`font-mono text-[11px] font-bold ${geofenceBreachActive ? 'text-rose-400' : 'text-emerald-400'}`}>
              {geofenceBreachActive ? 'OUT OF ZONE' : 'HOME ZONE OK'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluates session IP coordinates against the household&apos;s established residential ISP perimeter (Chennai ACT, 45km).
          </p>

          <div className="space-y-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => onTriggerGeofenceBreach?.('frankfurt')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                  geofenceBreachActive
                    ? 'bg-rose-900/60 text-rose-200 border border-rose-700 hover:bg-rose-800/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Simulate Frankfurt Data Center IP Anomaly"
              >
                <Radio className="w-3 h-3 text-rose-400" />
                <span>Frankfurt (+6,820km)</span>
              </button>
              <button
                onClick={() => onTriggerGeofenceBreach?.('san_francisco')}
                className="py-1.5 px-2 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                title="Simulate San Francisco IP Anomaly"
              >
                <span>SF (+13,440km)</span>
              </button>
            </div>

            {onViewGeofenceModal && (
              <button
                onClick={onViewGeofenceModal}
                className={`w-full py-1.5 px-3 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  geofenceBreachActive 
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white animate-pulse'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Open Tactical Radar Map Modal</span>
              </button>
            )}
          </div>
        </div>

        {/* Panel 4: Adaptive Security Controller Action */}
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

          <div className="flex gap-2">
            <button
              onClick={onRequestStepUpMfa}
              className="flex-1 py-2 px-2 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer text-center"
            >
              Step-Up MFA
            </button>
            <button
              onClick={handleCallGeminiIncidentCopilot}
              disabled={isGeneratingAiReport}
              className="py-2 px-3 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
              title="Run AI Incident Investigation"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
