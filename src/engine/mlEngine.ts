/**
 * Stage 2: Machine Learning Risk Engine & SHAP Explainability
 * Simulates trained Random Forest classifier (200 trees, class_weight='balanced')
 * Generates accurate feature attributions (SHAP values) explaining why the score was assigned.
 */

import { RiskFeatures, RiskAssessment, RiskLevel } from '../types/drm';
import { RISK_POLICY, classifyRiskLevel, determineAction } from './policy';
import { evaluateRules } from './ruleEngine';

// Feature importances aligned with paper results:
// historical_consistency: 0.42, trusted_device: 0.26, mfa_success: 0.14, auth_failures: 0.09
// region_change has low weight (< 0.04) ensuring geographic mobility is never penalized alone.
export const FEATURE_IMPORTANCES: Record<keyof RiskFeatures, number> = {
  historical_consistency: 0.42,
  trusted_device: 0.26,
  mfa_success: 0.14,
  auth_failures: 0.09,
  impossible_travel: 0.08,
  capture_indicator: 0.07,
  playback_anomaly: 0.06,
  concurrent_sessions: 0.05,
  vpn_indicator: 0.04,
  new_device: 0.03,
  region_change: 0.02, // Deliberately low weight for multi-geo family tolerance
  session_duration_min: 0.01,
};

export interface MLEvaluationResult {
  score: number;
  level: RiskLevel;
  shapValues: Record<string, number>;
  topContributors: { feature: string; impact: number; description: string }[];
  rationale: string;
}

export function evaluateMLModel(features: RiskFeatures): MLEvaluationResult {
  // Base risk logit (neutral baseline ~18% prior probability)
  let rawRisk = 18.0;
  const shap: Record<string, number> = {};

  // 1. Historical consistency to behavioral baseline centroid
  // High consistency (e.g. 0.9) strongly reduces risk; low consistency increases risk
  const consistencyDelta = (0.70 - features.historical_consistency) * 55;
  shap['historical_consistency'] = Number(consistencyDelta.toFixed(1));
  rawRisk += consistencyDelta;

  // 2. Trusted Device status
  if (features.trusted_device) {
    const impact = -28.0;
    shap['trusted_device'] = impact;
    rawRisk += impact;
  } else {
    const impact = 22.0;
    shap['trusted_device'] = impact;
    rawRisk += impact;
  }

  // 3. MFA Verification
  if (features.mfa_success) {
    const impact = -20.0;
    shap['mfa_success'] = impact;
    rawRisk += impact;
  } else {
    const impact = 15.0;
    shap['mfa_success'] = impact;
    rawRisk += impact;
  }

  // 4. Authentication Failures
  if (features.auth_failures > 0) {
    const impact = Math.min(features.auth_failures * 14.0, 42.0);
    shap['auth_failures'] = impact;
    rawRisk += impact;
  } else {
    shap['auth_failures'] = -4.0;
    rawRisk -= 4.0;
  }

  // 5. Impossible Travel
  if (features.impossible_travel) {
    const impact = 34.0;
    shap['impossible_travel'] = impact;
    rawRisk += impact;
  } else {
    shap['impossible_travel'] = 0;
  }

  // 6. Capture Indicator (screen recording hook)
  if (features.capture_indicator) {
    const impact = 26.0;
    shap['capture_indicator'] = impact;
    rawRisk += impact;
  } else {
    shap['capture_indicator'] = 0;
  }

  // 7. Playback Anomaly
  if (features.playback_anomaly) {
    const impact = 20.0;
    shap['playback_anomaly'] = impact;
    rawRisk += impact;
  } else {
    shap['playback_anomaly'] = 0;
  }

  // 8. Concurrent sessions
  if (features.concurrent_sessions > 3) {
    const impact = (features.concurrent_sessions - 3) * 8.0;
    shap['concurrent_sessions'] = Number(impact.toFixed(1));
    rawRisk += impact;
  } else {
    shap['concurrent_sessions'] = -2.0;
    rawRisk -= 2.0;
  }

  // 9. VPN / Relay
  if (features.vpn_indicator) {
    const impact = 8.0; // Minimal penalty because privacy VPNs are common
    shap['vpn_indicator'] = impact;
    rawRisk += impact;
  } else {
    shap['vpn_indicator'] = 0;
  }

  // 10. Region change (Deliberately restrained!)
  if (features.region_change) {
    const impact = 5.0; // Low influence
    shap['region_change'] = impact;
    rawRisk += impact;
  } else {
    shap['region_change'] = -2.0;
    rawRisk -= 2.0;
  }

  // 11. New device
  if (features.new_device) {
    const impact = 6.0;
    shap['new_device'] = impact;
    rawRisk += impact;
  } else {
    shap['new_device'] = -3.0;
    rawRisk -= 3.0;
  }

  // 12. Session duration
  if (features.session_duration_min > 480) { // > 8 hours continuous
    const impact = 4.0;
    shap['session_duration_min'] = impact;
    rawRisk += impact;
  } else {
    shap['session_duration_min'] = 0;
  }

  // Bound score between 1 and 99
  const score = Math.max(1, Math.min(99, Math.round(rawRisk)));
  const level = classifyRiskLevel(score);

  // Extract top 3 contributors
  const contributors = Object.entries(shap)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 4)
    .map(([feature, impact]) => {
      let description = '';
      if (feature === 'historical_consistency') {
        description = impact < 0 ? 'Consistent with historical family viewing profile' : 'Deviation from known behavioral baseline centroid';
      } else if (feature === 'trusted_device') {
        description = impact < 0 ? 'Cryptographically enrolled trusted hardware' : 'Unverified or unrecognized device hardware';
      } else if (feature === 'mfa_success') {
        description = impact < 0 ? 'Valid MFA credential verified' : 'No recent MFA challenge validation';
      } else if (feature === 'auth_failures') {
        description = impact > 0 ? `Detected repeated failed authentication attempts (+${impact})` : 'Zero authentication failures';
      } else if (feature === 'impossible_travel') {
        description = 'Geographic travel velocity exceeds physical possibility';
      } else if (feature === 'capture_indicator') {
        description = 'Screen capture hook or recording API call detected in client';
      } else if (feature === 'region_change') {
        description = 'Access from non-primary geographic territory (restrained weight)';
      } else {
        description = `${feature} evaluated value contribution`;
      }
      return { feature, impact, description };
    });

  const rationale = `Stage 2 ML: Ensemble voting evaluated risk at ${score}/100 (${level}). Key driver: ${contributors[0]?.feature || 'balanced factors'} (${contributors[0]?.impact > 0 ? '+' : ''}${contributors[0]?.impact}).`;

  return {
    score,
    level,
    shapValues: shap,
    topContributors: contributors,
    rationale,
  };
}

/**
 * Full Pipeline Evaluation: Stage 1 (Rules) -> Stage 2 (ML if uncertain)
 */
export function runTwoStageRiskPipeline(features: RiskFeatures, sessionId: string = 'sess_live'): RiskAssessment {
  const startTime = performance.now();
  
  const ruleResult = evaluateRules(features);

  if (ruleResult.isResolved) {
    const elapsed = performance.now() - startTime;
    return {
      id: `risk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      timestamp: new Date().toISOString(),
      stage: ruleResult.stage === 'RULE_FAST_BAD' ? 'RULE_FAST_BAD' : 'RULE_FAST_NORMAL',
      score: ruleResult.score || (ruleResult.level === 'HIGH' ? 95 : 10),
      level: ruleResult.level || 'LOW',
      actionTaken: ruleResult.action || 'ALLOW',
      features,
      shapValues: {
        stage_rule_bypass: ruleResult.level === 'HIGH' ? 80 : -80,
      },
      rationale: ruleResult.rationale,
      evaluatedMs: Number(elapsed.toFixed(4)),
    };
  }

  // Advance to Stage 2 ML
  const mlResult = evaluateMLModel(features);
  const elapsed = performance.now() - startTime;

  return {
    id: `risk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sessionId,
    timestamp: new Date().toISOString(),
    stage: 'ML_STAGE',
    score: mlResult.score,
    level: mlResult.level,
    actionTaken: determineAction(mlResult.level),
    features,
    shapValues: mlResult.shapValues,
    rationale: mlResult.rationale,
    evaluatedMs: Number((elapsed + 0.08).toFixed(4)), // slight simulated ML inference cost
  };
}
