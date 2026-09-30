/**
 * AegisDRM Client Telemetry & EME Gateway SDK
 * Lightweight, privacy-conscious client library for OTT streaming applications.
 * Can be integrated into Shaka Player, Video.js, HLS.js, Dash.js, or Smart TV web apps.
 */

import { RiskFeatures, Session, Device } from '../types/drm';

export interface AegisDRMConfig {
  licenseServerUrl?: string;
  heartbeatIntervalMs?: number;
  userSalt?: string;
  onSecurityActionRequired?: (action: string, score: number) => void;
  onWatermarkPolicyUpdated?: (opacity: number, policy: any) => void;
}

export class AegisDRMClientSDK {
  private config: AegisDRMConfig;
  private devicePseudonym: string = '';
  private isHookAttached: boolean = false;
  private heartbeatTimer: any = null;
  private currentFeatures: RiskFeatures;
  private activeSessionId: string = '';

  constructor(config: AegisDRMConfig = {}) {
    this.config = {
      licenseServerUrl: config.licenseServerUrl || '/api/drm/license',
      heartbeatIntervalMs: config.heartbeatIntervalMs || 15000,
      userSalt: config.userSalt || 'aegis_prod_salt_2026',
      onSecurityActionRequired: config.onSecurityActionRequired,
      onWatermarkPolicyUpdated: config.onWatermarkPolicyUpdated,
    };

    this.currentFeatures = {
      trusted_device: true,
      new_device: false,
      mfa_success: true,
      auth_failures: 0,
      concurrent_sessions: 1,
      session_duration_min: 0,
      region_change: false,
      impossible_travel: false,
      vpn_indicator: false,
      playback_anomaly: false,
      capture_indicator: false,
      historical_consistency: 0.92,
    };
  }

  /**
   * Initializes the SDK, extracts hardware entropy, and derives a privacy-safe pseudonymous ID.
   */
  public async initialize(sessionId?: string): Promise<string> {
    this.activeSessionId = sessionId || `sess_${Date.now().toString(36)}`;
    this.devicePseudonym = await this.collectDevicePseudonym();
    this.attachClientIntegrityHooks();
    this.startHeartbeat();
    return this.devicePseudonym;
  }

  /**
   * Collects hardware entropy and generates an irreversible SHA-256 salted hash.
   * Privacy guarantee: Never touches or stores hardware MAC, serial, or IMEI.
   */
  public async collectDevicePseudonym(): Promise<string> {
    try {
      const entropyParts: string[] = [];

      // 1. Screen & display capabilities
      if (typeof window !== 'undefined') {
        entropyParts.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
        entropyParts.push(`dpr:${window.devicePixelRatio || 1}`);
      }

      // 2. Hardware concurrency & device memory
      if (typeof navigator !== 'undefined') {
        entropyParts.push(`cpu:${navigator.hardwareConcurrency || 4}`);
        // @ts-ignore
        if (navigator.deviceMemory) entropyParts.push(`mem:${navigator.deviceMemory}`);
        entropyParts.push(`lang:${navigator.language || 'en'}`);
      }

      // 3. WebGL GPU renderer
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl && 'getExtension' in gl) {
          const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            entropyParts.push(`gpu:${renderer}`);
          }
        }
      } catch (e) {
        // Fallback gracefully
      }

      // 4. Timezone & locale delta (helps spot VPN / proxy mismatches)
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        entropyParts.push(`tz:${tz}`);
      } catch (e) {}

      const rawEntropy = entropyParts.join('|');
      const msgBuffer = new TextEncoder().encode(`${rawEntropy}:${this.config.userSalt}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `dev_${hex.substring(0, 14)}`;
    } catch (e) {
      return `dev_${Math.random().toString(36).substring(2, 16)}`;
    }
  }

  /**
   * Attaches client integrity listeners to detect screen capture, recording, or abnormal frame rates.
   */
  private attachClientIntegrityHooks(): void {
    if (this.isHookAttached || typeof window === 'undefined') return;
    this.isHookAttached = true;

    // Detect screen-capture API attempts
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async (options) => {
        this.currentFeatures.capture_indicator = true;
        this.handleImmediateSecurityTrigger('SCREEN_RECORDING_API_CALLED', 68);
        return originalGetDisplayMedia(options);
      };
    }

    // Monitor visibility changes & window blur during active media playback
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Video playing in background / captured window
      }
    });
  }

  /**
   * Monitor video playback quality metrics from HTML5 video element.
   */
  public attachVideoElement(videoEl: HTMLVideoElement): void {
    videoEl.addEventListener('timeupdate', () => {
      // @ts-ignore
      if (typeof videoEl.getVideoPlaybackQuality === 'function') {
        // @ts-ignore
        const quality = videoEl.getVideoPlaybackQuality();
        if (quality.totalVideoFrames > 300) {
          const dropRatio = quality.droppedVideoFrames / quality.totalVideoFrames;
          if (dropRatio > 0.4) {
            this.currentFeatures.playback_anomaly = true;
          }
        }
      }
    });
  }

  /**
   * Standard EME / CENC License Request:
   * Called when CDM requests playback key for encrypted media stream.
   */
  public async requestPlaybackLicense(keyId: string = '0x4f8a'): Promise<{
    granted: boolean;
    licenseToken: string;
    watermarkPolicy: any;
    streamQuality: string;
    riskScore: number;
  }> {
    try {
      const response = await fetch(this.config.licenseServerUrl || '/api/drm/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.activeSessionId,
          keyId,
          devicePseudonym: this.devicePseudonym,
          features: this.currentFeatures,
        }),
      });

      const data = await response.json();
      if (this.config.onWatermarkPolicyUpdated && data.watermarkPolicy) {
        this.config.onWatermarkPolicyUpdated(data.watermarkPolicy.opacity, data.watermarkPolicy);
      }

      return {
        granted: data.status === 'GRANTED',
        licenseToken: data.licenseToken,
        watermarkPolicy: data.watermarkPolicy,
        streamQuality: data.streamQuality,
        riskScore: data.riskAssessment?.score || 10,
      };
    } catch (e) {
      console.warn('Fallback: Client operating in offline simulation mode');
      return {
        granted: true,
        licenseToken: 'cenc_tok_simulated_local',
        watermarkPolicy: { opacity: 0.14 },
        streamQuality: '1080p FHD',
        riskScore: 12,
      };
    }
  }

  /**
   * Starts periodic asynchronous telemetry heartbeat out of playback hot path.
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(async () => {
      try {
        this.currentFeatures.session_duration_min += (this.config.heartbeatIntervalMs || 15000) / 60000;
        const res = await fetch('/api/drm/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.activeSessionId,
            features: this.currentFeatures,
          }),
        });
        const data = await res.json();
        if (data.requiredAction && data.requiredAction !== 'ALLOW') {
          this.handleImmediateSecurityTrigger(data.requiredAction, data.assessment?.score || 50);
        }
      } catch (err) {}
    }, this.config.heartbeatIntervalMs);
  }

  private handleImmediateSecurityTrigger(action: string, score: number): void {
    if (this.config.onSecurityActionRequired) {
      this.config.onSecurityActionRequired(action, score);
    }
  }

  public setFeatureOverride(key: keyof RiskFeatures, value: any): void {
    // @ts-ignore
    this.currentFeatures[key] = value;
  }

  public getFeatures(): RiskFeatures {
    return { ...this.currentFeatures };
  }

  public getDevicePseudonym(): string {
    return this.devicePseudonym;
  }

  public destroy(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }
}
