/**
 * Centralized Risk Policy Configuration
 * Single source of truth for risk boundaries, thresholds, and proportional actions.
 * No other module hard-codes risk score numbers or action decisions.
 */

import { RiskAction, RiskLevel } from '../types/drm';

export interface PolicyConfig {
  thresholds: {
    lowMax: number;     // <= 30 is LOW
    mediumMax: number;  // <= 70 is MEDIUM; > 70 is HIGH
  };
  actions: {
    low: RiskAction;
    medium: RiskAction;
    high: RiskAction;
  };
  watermarkOpacity: {
    low: number;        // 0.12 (subtle forensic imperceptible watermark)
    medium: number;     // 0.35 (elevated visibility for monitoring)
    high: number;       // 0.65 (prominent forensic tracking pattern)
  };
  streamQuality: {
    low: '1080p FHD';
    medium: '720p HD';
    high: '480p SD' | 'Muted/Halted';
  };
  guarantees: {
    singleWeakSignalMaxScore: number; // 30 (Hard rule: never push to HIGH on single weak signal)
  };
}

export const RISK_POLICY: PolicyConfig = {
  thresholds: {
    lowMax: 30,
    mediumMax: 70,
  },
  actions: {
    low: 'ALLOW',
    medium: 'STEP_UP_MFA',
    high: 'RESTRICT_STREAM', // First step-up MFA, if failed or confirmed attack -> restrict
  },
  watermarkOpacity: {
    low: 0.14,
    medium: 0.38,
    high: 0.65,
  },
  streamQuality: {
    low: '1080p FHD',
    medium: '720p HD',
    high: '480p SD',
  },
  guarantees: {
    singleWeakSignalMaxScore: 30,
  },
};

export function classifyRiskLevel(score: number): RiskLevel {
  if (score <= RISK_POLICY.thresholds.lowMax) {
    return 'LOW';
  }
  if (score <= RISK_POLICY.thresholds.mediumMax) {
    return 'MEDIUM';
  }
  return 'HIGH';
}

export function determineAction(level: RiskLevel, stepUpFailed: boolean = false): RiskAction {
  switch (level) {
    case 'LOW':
      return RISK_POLICY.actions.low;
    case 'MEDIUM':
      return RISK_POLICY.actions.medium;
    case 'HIGH':
      return stepUpFailed ? 'RESTRICT_STREAM' : 'STEP_UP_MFA';
  }
}
