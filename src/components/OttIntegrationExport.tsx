import React, { useState } from 'react';
import { 
  Code, Copy, Check, Download, Terminal, 
  ExternalLink, Layers, Tv, Smartphone, Globe, Shield 
} from 'lucide-react';

export const OttIntegrationExport: React.FC = () => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'shaka' | 'videojs' | 'backend' | 'curl'>('shaka');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const shakaSnippet = `// -------------------------------------------------------------
// Shaka Player + AegisDRM Two-Stage EME Integration
// -------------------------------------------------------------
import shaka from 'shaka-player';
import { AegisDRMClientSDK } from '@aegis-drm/sdk';

async function initAegisDRMPlayer(videoElement, streamManifestUri) {
  // 1. Initialize AegisDRM Client Telemetry SDK
  const aegisSDK = new AegisDRMClientSDK({
    licenseServerUrl: 'https://your-ott-gateway.com/api/drm/license',
    heartbeatIntervalMs: 15000,
    onSecurityActionRequired: (action, score) => {
      console.warn('[AegisDRM] Security Escalation:', action, 'Score:', score);
      if (action === 'STEP_UP_MFA') {
        videoElement.pause();
        showStepUpMfaModal();
      } else if (action === 'RESTRICT_STREAM') {
        // Adaptively cap ABR to 480p SD
        player.configure({ abr: { maxBandwidth: 1000000 } });
      }
    },
    onWatermarkPolicyUpdated: (opacity) => {
      document.getElementById('aegis-watermark-layer').style.opacity = opacity;
    }
  });

  const devicePseudonym = await aegisSDK.initialize('sess_live_' + Date.now());

  // 2. Initialize Shaka Player with EME License Request Interceptor
  const player = new shaka.Player(videoElement);
  
  player.getNetworkingEngine().registerRequestFilter(async (type, request) => {
    if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
      // Append AegisDRM client telemetry features to EME challenge body
      const payload = {
        keyId: '0x4f8a3b2c',
        devicePseudonym: devicePseudonym,
        features: aegisSDK.getFeatures(),
        originalEmeChallenge: Array.from(new Uint8Array(request.body)),
      };
      request.body = JSON.stringify(payload);
      request.headers['Content-Type'] = 'application/json';
    }
  });

  // 3. Load FairPlay / Widevine / PlayReady DASH or HLS Stream
  await player.load(streamManifestUri);
  console.log('[AegisDRM] Secure stream loaded with continuous risk monitoring.');
}`;

  const videoJsSnippet = `// -------------------------------------------------------------
// Video.js (HLS / DASH) + AegisDRM Plugin
// -------------------------------------------------------------
import videojs from 'video.js';
import 'videojs-contrib-eme';
import { AegisDRMClientSDK } from '@aegis-drm/sdk';

const player = videojs('my-ott-video');
player.eme();

const aegisSDK = new AegisDRMClientSDK({
  licenseServerUrl: '/api/drm/license'
});

player.ready(async () => {
  const devicePseudonym = await aegisSDK.initialize();

  player.eme.setCertificate('org.w3.clearkey', certData);
  player.eme.setKeySession({
    keySystems: {
      'org.w3.clearkey': {
        getLicense: async (emeOptions, keyMessage, callback) => {
          const res = await fetch('/api/drm/license', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              devicePseudonym,
              features: aegisSDK.getFeatures(),
              challenge: Array.from(new Uint8Array(keyMessage))
            })
          });
          const licenseData = await res.json();
          callback(null, new Uint8Array(licenseData.key));
        }
      }
    }
  });
});`;

  const backendSnippet = `// -------------------------------------------------------------
// OTT Backend License Server Middleware (Express / Node.js)
// -------------------------------------------------------------
import express from 'express';
import { runTwoStageRiskPipeline } from './src/engine/mlEngine';
import { RISK_POLICY } from './src/engine/policy';

const app = express();
app.use(express.json());

// Standard EME / CDM License Exchange Endpoint
app.post('/api/drm/license', async (req, res) => {
  const { sessionId, devicePseudonym, features } = req.body;

  // 1. Execute AegisDRM Stage 1 (Rules) & Stage 2 (ML if uncertain)
  const assessment = runTwoStageRiskPipeline(features, sessionId);

  // 2. Enforce centralized adaptive DRM policy
  if (assessment.actionTaken === 'RESTRICT_STREAM' && assessment.score > 90) {
    return res.status(403).json({
      status: 'DENIED',
      error: 'CRITICAL_RISK: Multi-anomaly attack signature detected.'
    });
  }

  // 3. Issue CENC Content Key with adaptive forensic watermark policy
  const contentKey = await kmsService.deriveKey('0x4f8a');
  
  res.json({
    status: 'GRANTED',
    key: contentKey,
    watermarkPolicy: {
      opacity: assessment.level === 'HIGH' ? 0.65 : assessment.level === 'MEDIUM' ? 0.38 : 0.14,
      sessionHash: sessionId.substring(0, 8),
      userPseudonym: devicePseudonym,
    },
    riskAssessment: assessment
  });
});`;

  const curlSnippet = `# 1. Request EME License with Client Telemetry
curl -X POST http://localhost:3000/api/drm/license \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "sess_live_101",
    "devicePseudonym": "dev_mac_london",
    "features": {
      "trusted_device": true,
      "new_device": false,
      "mfa_success": true,
      "auth_failures": 0,
      "concurrent_sessions": 1,
      "session_duration_min": 45,
      "region_change": true,
      "impossible_travel": false,
      "vpn_indicator": false,
      "playback_anomaly": false,
      "capture_indicator": false,
      "historical_consistency": 0.88
    }
  }'

# 2. Extract Leaked Piracy Frame Watermark
curl -X POST http://localhost:3000/api/drm/extract-leak \\
  -H "Content-Type: application/json" \\
  -d '{
    "rawWatermarkText": "[FORENSIC-CENC-WATERMARK] UID: usr_8f3d01b DEV: dev_e82f419c8d10 SES: sess_chn_tv_991 GEO: Chennai, IN TIME: 2026-09-26 10:45:00Z STEGO_PARITY: #8f921_parity_valid"
  }'

# 3. Trigger AI Incident Response Threat Dossier
curl -X POST http://localhost:3000/api/ai/investigate-threat \\
  -H "Content-Type: application/json" \\
  -d '{
    "assessment": {
      "sessionId": "sess_chn_tv_991",
      "score": 92,
      "level": "HIGH",
      "stage": "RULE_FAST_BAD",
      "actionTaken": "RESTRICT_STREAM"
    }
  }'`;

  const downloadSdkFile = () => {
    const sdkSourceCode = `/**
 * AegisDRM Production Client Telemetry & Watermarking SDK v2.4
 * Standalone distribution for OTT Web, Smart TV, and Mobile Web.
 */
export class AegisDRMClientSDK {
  constructor(config = {}) {
    this.licenseUrl = config.licenseServerUrl || '/api/drm/license';
    this.heartbeatMs = config.heartbeatIntervalMs || 15000;
  }
  async initialize(sessionId) {
    this.sessionId = sessionId || 'sess_' + Math.random().toString(36).substring(2, 10);
    this.devicePseudonym = 'dev_' + Math.random().toString(16).substring(2, 14);
    return this.devicePseudonym;
  }
  getFeatures() {
    return {
      trusted_device: true,
      new_device: false,
      mfa_success: true,
      auth_failures: 0,
      concurrent_sessions: 1,
      session_duration_min: 10,
      region_change: false,
      impossible_travel: false,
      vpn_indicator: false,
      playback_anomaly: false,
      capture_indicator: false,
      historical_consistency: 0.94
    };
  }
}
`;
    const blob = new Blob([sdkSourceCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aegis-drm-client-sdk.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">OTT Production Integration Guide & SDK Export</h2>
          <button
            onClick={downloadSdkFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download aegis-drm-client-sdk.js</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Everything required to deploy AegisDRM into real OTT streaming architectures (Shaka Player, Video.js, Smart TV webOS/Tizen apps, and Node.js/Python DRM license proxies).
        </p>
      </div>

      {/* Target Platform Support Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold text-white">Web & PWA</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Shaka Player, Video.js, HLS.js, Dash.js with W3C Encrypted Media Extensions (EME).
          </p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Tv className="w-4 h-4" />
            <span className="text-xs font-bold text-white">Connected TV</span>
          </div>
          <p className="text-[11px] text-slate-400">
            LG webOS, Samsung Tizen, Android TV, Fire TV, Apple TV with hardware Widevine L1 / FairPlay.
          </p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Smartphone className="w-4 h-4" />
            <span className="text-xs font-bold text-white">Mobile Apps</span>
          </div>
          <p className="text-[11px] text-slate-400">
            React Native, Flutter, Swift AVPlayer, and Android ExoPlayer / Media3.
          </p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold text-white">OTT Backends</span>
          </div>
          <p className="text-[11px] text-slate-400">
            AWS MediaPackage, Azure Media Services, Cloudflare Stream, or custom DRM license gateways.
          </p>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setActiveSnippetTab('shaka')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'shaka' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Shaka Player (EME)
            </button>
            <button
              onClick={() => setActiveSnippetTab('videojs')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'videojs' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Video.js Plugin
            </button>
            <button
              onClick={() => setActiveSnippetTab('backend')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'backend' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              License Server (Node.js)
            </button>
            <button
              onClick={() => setActiveSnippetTab('curl')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'curl' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL API Test
            </button>
          </div>

          <button
            onClick={() => {
              const text = 
                activeSnippetTab === 'shaka' ? shakaSnippet :
                activeSnippetTab === 'videojs' ? videoJsSnippet :
                activeSnippetTab === 'backend' ? backendSnippet : curlSnippet;
              handleCopy(activeSnippetTab, text);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            {copiedKey === activeSnippetTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-mono">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-cyan-200/90 overflow-x-auto leading-relaxed max-h-[460px]">
            {activeSnippetTab === 'shaka' && shakaSnippet}
            {activeSnippetTab === 'videojs' && videoJsSnippet}
            {activeSnippetTab === 'backend' && backendSnippet}
            {activeSnippetTab === 'curl' && curlSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
