/**
 * Stage 1: Fast Rule Engine
 * Execution latency: ~0.0004 - 0.001 ms
 * Evaluates obvious clean sessions (Fast Path Normal) and blatant multi-anomaly attacks (Fast Path Bad).
 * All ambiguous sessions return 'UNCERTAIN' and advance to Stage 2 ML model.
 */

import { RiskFeatures, RiskLevel, RiskAction } from '../types/drm';
import { RISK_POLICY } from './policy';

export interface RuleEvaluationResult {
  isResolved: boolean;
  stage: 'RULE_FAST_NORMAL' | 'RULE_FAST_BAD' | 'UNCERTAIN';
  score?: number;
  level?: RiskLevel;
  action?: RiskAction;
  rationale: string;
}

export function evaluateRules(features: RiskFeatures): RuleEvaluationResult {
  // 1. Check for single weak signal constraint enforcement
  const isOnlyRegionChange = features.region_change && 
    features.trusted_device && 
    features.auth_failures === 0 && 
    !features.impossible_travel && 
    !features.capture_indicator && 
    !features.playback_anomaly;

  const isOnlyNewDevice = features.new_device && 
    features.mfa_success && 
    features.auth_failures === 0 && 
    !features.impossible_travel && 
    !features.capture_indicator && 
    !features.playback_anomaly;

  // Single weak signal fast-path: Legitimate traveler / new phone with valid MFA
  if (isOnlyRegionChange) {
    return {
      isResolved: true,
      stage: 'RULE_FAST_NORMAL',
      score: 18,
      level: 'LOW',
      action: 'ALLOW',
      rationale: 'Legitimate geographical mobility on enrolled trusted device; single weak signal invariant satisfied.',
    };
  }

  if (isOnlyNewDevice) {
    return {
      isResolved: true,
      stage: 'RULE_FAST_NORMAL',
      score: 22,
      level: 'LOW',
      action: 'ALLOW',
      rationale: 'New device enrolled with successful MFA verification; low baseline suspicion.',
    };
  }

  // 2. Fast Path: Clearly Normal Session
  // Clean device, zero auth failures, no impossible travel, no capture tools, high historical consistency
  if (
    features.trusted_device &&
    !features.new_device &&
    features.mfa_success &&
    features.auth_failures === 0 &&
    !features.impossible_travel &&
    !features.vpn_indicator &&
    !features.playback_anomaly &&
    !features.capture_indicator &&
    features.historical_consistency >= 0.75
  ) {
    return {
      isResolved: true,
      stage: 'RULE_FAST_NORMAL',
      score: 6,
      level: 'LOW',
      action: 'ALLOW',
      rationale: 'Stage 1 Fast-Pass: Enrolled trusted device, strong authentication history, baseline alignment > 0.75.',
    };
  }

  // 3. Fast Path: Clearly Bad (Multiple strong malicious indicators simultaneously)
  // Hard rule: MUST be multiple severe signals, never a single indicator alone.
  const severeSignals: string[] = [];
  if (features.impossible_travel) severeSignals.push('impossible travel physics anomaly');
  if (features.auth_failures >= 3) severeSignals.push(`${features.auth_failures} repeated auth failures`);
  if (!features.trusted_device && features.new_device) severeSignals.push('untrusted unknown device');
  if (features.capture_indicator) severeSignals.push('active DRM surface hook / screen grabber');
  if (features.playback_anomaly) severeSignals.push('abnormal frame decryption requests');
  if (features.concurrent_sessions >= 5) severeSignals.push('massive concurrent stream multiplexing');

  // Multi-signal critical attack rule
  if (severeSignals.length >= 3 || (features.impossible_travel && features.auth_failures >= 2 && !features.trusted_device)) {
    return {
      isResolved: true,
      stage: 'RULE_FAST_BAD',
      score: 94,
      level: 'HIGH',
      action: 'RESTRICT_STREAM',
      rationale: `Stage 1 Fast-Reject: Multiple simultaneous severe signals (${severeSignals.join(', ')}). Immediate security escalation.`,
    };
  }

  // 4. Otherwise: UNCERTAIN -> Dispatch to Stage 2 Machine Learning Model
  return {
    isResolved: false,
    stage: 'UNCERTAIN',
    rationale: 'Uncertain session state. Forwarding to Stage 2 Random Forest ML Classifier for deep multi-variate assessment.',
  };
}
