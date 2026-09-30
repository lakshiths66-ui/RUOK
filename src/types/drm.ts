export type TrustStatus = 'NEW' | 'PENDING_VERIFICATION' | 'TRUSTED' | 'SUSPICIOUS' | 'REVOKED';

export type SessionStatus = 'ACTIVE' | 'STEP_UP_REQUIRED' | 'RESTRICTED' | 'TERMINATED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type RiskAction = 
  | 'ALLOW' 
  | 'STEP_UP_MFA' 
  | 'WATERMARK_STRENGTHEN' 
  | 'RESTRICT_STREAM' 
  | 'TERMINATE_SESSION';

export interface Device {
  id: string;
  pseudonym: string; // Hash of device characteristics (never MAC/serial)
  name: string;
  deviceType: 'Smart TV' | 'Laptop' | 'Tablet' | 'Mobile Phone' | 'Desktop';
  trustStatus: TrustStatus;
  firstSeen: string;
  lastUsed: string;
  enrollmentMfaVerified: boolean;
  approxLocation: string; // Coarse region only (e.g. "Chennai, IN", "London, UK")
}

export interface UserProfile {
  id: string;
  pseudonym: string;
  emailMasked: string;
  mfaEnabled: boolean;
  mfaType: 'TOTP (Authenticator App)' | 'Passkey (FIDO2)';
  accountTier: 'Family OTT Premium (4 Streams)';
  createdDate: string;
}

export interface RiskFeatures {
  trusted_device: boolean;
  new_device: boolean;
  mfa_success: boolean;
  auth_failures: number;
  concurrent_sessions: number;
  session_duration_min: number;
  region_change: boolean;
  impossible_travel: boolean;
  vpn_indicator: boolean;
  playback_anomaly: boolean;
  capture_indicator: boolean;
  historical_consistency: number; // 0.0 to 1.0 (distance to nearest family baseline cluster)
}

export interface RiskAssessment {
  id: string;
  sessionId: string;
  timestamp: string;
  stage: 'RULE_FAST_NORMAL' | 'RULE_FAST_BAD' | 'ML_STAGE';
  score: number; // 0 to 100
  level: RiskLevel;
  actionTaken: RiskAction;
  features: RiskFeatures;
  shapValues: Record<string, number>; // Feature attribution weights
  rationale: string;
  evaluatedMs: number;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  devicePseudonym: string;
  approxRegion: string;
  status: SessionStatus;
  startedAt: string;
  lastHeartbeat: string;
  ipMasked: string; // 192.0.2.xx coarse
  streamQuality: '1080p FHD' | '720p HD' | '480p SD' | 'Muted/Halted';
  watermarkOpacity: number; // 0.10 to 0.70
  lastRiskScore: number;
  activeProfileName: string;
}

export interface BehavioralCluster {
  id: string;
  profileName: string;
  region: string;
  deviceType: string;
  typicalHours: string;
  centroid: {
    avgSessionDuration: number;
    avgConcurrency: number;
    historicalConsistency: number;
  };
  sampleCount: number;
  lastMatched: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  eventType: string;
  details: string;
  severity: 'info' | 'warn' | 'critical';
  tamperHash: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  category: 'Legitimate (False-Positive Validation)' | 'Suspicious (Attack Scenario)';
  expectedLabel: 'Normal (0)' | 'Suspicious (1)';
  description: string;
  familyContext?: string;
  features: RiskFeatures;
  expectedOutcome: {
    expectedLevel: RiskLevel;
    expectedAction: RiskAction;
    expectedStage: 'RULE_FAST_NORMAL' | 'RULE_FAST_BAD' | 'ML_STAGE';
  };
}

export interface AutomatedTestResult {
  id: string;
  title: string;
  category: 'Unit' | 'Security' | 'Integration';
  status: 'passed' | 'failed' | 'running';
  durationMs: number;
  assertionDescription: string;
  logOutput: string[];
}

export interface GeoFenceZone {
  homeName: string;
  establishedIsp: string;
  establishedAsn: string;
  centerCoordinates: { lat: number; lng: number };
  radiusKm: number;
  city: string;
  country: string;
}

export interface GeoFenceBreachEvent {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  establishedZone: GeoFenceZone;
  detectedSession: {
    ipMasked: string;
    isp: string;
    asn: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  distanceKm: number;
  breachSeverity: 'HIGH' | 'CRITICAL';
  suggestedAction: 'STEP_UP_MFA' | 'RESTRICT_STREAM' | 'TERMINATE_SESSION';
}

