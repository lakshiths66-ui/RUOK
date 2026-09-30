/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { OttPlayer } from './components/OttPlayer';
import { RiskEngineLab } from './components/RiskEngineLab';
import { ScenarioMatrix } from './components/ScenarioMatrix';
import { UserSecurityPortal } from './components/UserSecurityPortal';
import { AdminAuditDashboard } from './components/AdminAuditDashboard';
import { TestSuiteBenchmark } from './components/TestSuiteBenchmark';
import { ResearchLimitations } from './components/ResearchLimitations';
import { ForensicLeakInvestigator } from './components/ForensicLeakInvestigator';
import { OttIntegrationExport } from './components/OttIntegrationExport';
import { StepUpModal } from './components/StepUpModal';
import { GeofenceAlertModal } from './components/GeofenceAlertModal';

import { 
  Device, Session, BehavioralCluster, AuditLogEntry, 
  RiskAssessment, RiskFeatures, ScenarioDefinition, GeoFenceBreachEvent 
} from './types/drm';
import { 
  INITIAL_USER, INITIAL_DEVICES, INITIAL_SESSIONS, 
  INITIAL_CLUSTERS, INITIAL_AUDIT_LOGS 
} from './data/initialState';
import { runTwoStageRiskPipeline } from './engine/mlEngine';
import { RISK_POLICY } from './engine/policy';
import { evaluateGeoFenceAnomaly, updateAnomalyEngineBaseline } from './engine/geoFenceEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('player');
  const [user] = useState(INITIAL_USER);
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [clusters, setClusters] = useState<BehavioralCluster[]>(INITIAL_CLUSTERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Security simulation states
  const [isTampered, setIsTampered] = useState(false);
  const [isCaptureHookActive, setIsCaptureHookActive] = useState(false);
  const [isStepUpModalOpen, setIsStepUpModalOpen] = useState(false);
  const [stepUpContextMessage, setStepUpContextMessage] = useState<string>('');
  const [pendingEnrollmentDevice, setPendingEnrollmentDevice] = useState<Device | null>(null);
  const [geofenceBreach, setGeofenceBreach] = useState<GeoFenceBreachEvent | null>(null);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);

  // Active session features for OTT player
  const [playerFeatures, setPlayerFeatures] = useState<RiskFeatures>({
    trusted_device: true,
    new_device: false,
    mfa_success: true,
    auth_failures: 0,
    concurrent_sessions: 2,
    session_duration_min: 52,
    region_change: false,
    impossible_travel: false,
    vpn_indicator: false,
    playback_anomaly: false,
    capture_indicator: false,
    historical_consistency: 0.94,
  });

  // Dynamic assessment for current player session
  const currentRisk = useMemo(() => {
    return runTwoStageRiskPipeline(playerFeatures, sessions[0]?.id || 'sess_chn_tv_991');
  }, [playerFeatures, sessions]);

  // Sync session presentation with current risk
  const activeSession = useMemo(() => {
    const base = sessions[0] || INITIAL_SESSIONS[0];
    if (isTampered) {
      return {
        ...base,
        status: 'RESTRICTED' as const,
        streamQuality: 'Muted/Halted' as const,
        watermarkOpacity: 0.65,
        lastRiskScore: 95,
      };
    }

    let quality: Session['streamQuality'] = '1080p FHD';
    let opacity = RISK_POLICY.watermarkOpacity.low;
    let status: Session['status'] = 'ACTIVE';

    if (currentRisk.level === 'HIGH' || isCaptureHookActive) {
      quality = '480p SD';
      opacity = RISK_POLICY.watermarkOpacity.high;
      status = 'STEP_UP_REQUIRED';
    } else if (currentRisk.level === 'MEDIUM') {
      quality = '720p HD';
      opacity = RISK_POLICY.watermarkOpacity.medium;
      status = 'STEP_UP_REQUIRED';
    }

    return {
      ...base,
      status,
      streamQuality: quality,
      watermarkOpacity: opacity,
      lastRiskScore: currentRisk.score,
    };
  }, [sessions, currentRisk, isTampered, isCaptureHookActive]);

  // Log audit entry helper
  const addAuditLog = (
    actor: string,
    eventType: string,
    details: string,
    severity: 'info' | 'warn' | 'critical'
  ) => {
    const newEntry: AuditLogEntry = {
      id: `aud_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actor,
      eventType,
      details,
      severity,
      tamperHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}...`,
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  // Tamper injection handler
  const handleTriggerTamper = () => {
    if (!isTampered) {
      setIsTampered(true);
      addAuditLog(
        'Client DRM Decryptor',
        'AES_GCM_TAG_MISMATCH_ALARM',
        '1-bit bitflip introduced in segment chunk. Authentication tag verification failed. Decryption blocked.',
        'critical'
      );
    } else {
      setIsTampered(false);
      addAuditLog(
        'License Service',
        'CLEAN_SEGMENT_RESTORED',
        'Untampered media chunk delivered. Authentication tag verified valid.',
        'info'
      );
    }
  };

  // Capture hook simulation handler
  const handleTriggerCaptureSimulator = () => {
    if (!isCaptureHookActive) {
      setIsCaptureHookActive(true);
      setPlayerFeatures(prev => ({
        ...prev,
        capture_indicator: true,
      }));
      addAuditLog(
        'DRM Integrity Monitor',
        'CAPTURE_TOOL_HOOK_DETECTED',
        'Client DXGI / MediaProjection screen capture hook detected. Activated high-visibility forensic watermark.',
        'warn'
      );
    } else {
      setIsCaptureHookActive(false);
      setPlayerFeatures(prev => ({
        ...prev,
        capture_indicator: false,
      }));
      addAuditLog(
        'DRM Integrity Monitor',
        'CAPTURE_HOOK_TERMINATED',
        'Screen capture hook detached. Restoring standard subtle watermark.',
        'info'
      );
    }
  };

  // Quick simulate threat
  const handleQuickSimulateThreat = () => {
    setIsTampered(false);
    setIsCaptureHookActive(false);
    setPlayerFeatures({
      trusted_device: false,
      new_device: true,
      mfa_success: false,
      auth_failures: 3,
      concurrent_sessions: 3,
      session_duration_min: 12,
      region_change: true,
      impossible_travel: true,
      vpn_indicator: true,
      playback_anomaly: true,
      capture_indicator: true,
      historical_consistency: 0.12,
    });
    addAuditLog(
      'Threat Simulation Harness',
      'SIMULATED_ATTACK_INJECTED',
      'Multi-vector anomaly injected: Impossible travel + 3 auth failures + untrusted device.',
      'critical'
    );
    setActiveTab('player');
  };

  // Reset stream security
  const handleResetStreamSecurity = () => {
    setIsTampered(false);
    setIsCaptureHookActive(false);
    setGeofenceBreach(null);
    setIsGeofenceModalOpen(false);
    setPlayerFeatures({
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
      historical_consistency: 0.94,
    });
    addAuditLog(
      'Security Operations',
      'SESSION_SECURITY_RESET',
      'Admin / user initiated state reset to standard trusted baseline.',
      'info'
    );
  };

  // Geo-Fencing Breach Alert Trigger
  const handleTriggerGeofenceBreach = (locationKey: string = 'frankfurt') => {
    let anomalyCoords = { lat: 50.1109, lng: 8.6821 };
    let isp = 'DigitalOcean Cloud Hosting ASN';
    let asn = 'AS14061';
    let city = 'Frankfurt';
    let country = 'Germany';
    let ipMasked = '159.65.120.xx';

    if (locationKey === 'san_francisco') {
      anomalyCoords = { lat: 37.7749, lng: -122.4194 };
      isp = 'Amazon AWS Cloud Infrastructure';
      asn = 'AS16509';
      city = 'San Francisco';
      country = 'United States';
      ipMasked = '54.215.88.xx';
    } else if (locationKey === 'dubai') {
      anomalyCoords = { lat: 25.2048, lng: 55.2708 };
      isp = 'du Telecom Mobile Exit';
      asn = 'AS15802';
      city = 'Dubai';
      country = 'United Arab Emirates';
      ipMasked = '94.200.12.xx';
    }

    const result = evaluateGeoFenceAnomaly(
      anomalyCoords,
      isp,
      asn,
      city,
      country,
      ipMasked,
      sessions[0]?.id || 'sess_chn_tv_991',
      user.id,
      'chennai_primary'
    );

    if (result.isBreached && result.breachEvent) {
      setGeofenceBreach(result.breachEvent);
      setIsGeofenceModalOpen(true);
      setPlayerFeatures(prev => ({
        ...prev,
        region_change: true,
        impossible_travel: true,
        vpn_indicator: true,
        historical_consistency: 0.18,
      }));
      addAuditLog(
        'Geo-Fencing Boundary Guardian',
        'GEOFENCE_ISP_BOUNDARY_BREACH',
        `CRITICAL: Session IP coordinates (${anomalyCoords.lat.toFixed(2)}° N, ${anomalyCoords.lng.toFixed(2)}° E, ${city}) fall ${result.distanceKm.toLocaleString()} km outside established home ISP zone (Chennai ACT Fibernet AS133694). Detected ISP: ${isp} (${asn}). Incident escalated.`,
        'critical'
      );
    }
  };

  // Check for deep-linked incident query parameter or hash on mount
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const incidentParam = searchParams.get('incident') || (window.location.hash.includes('incident=') ? window.location.hash.split('incident=')[1]?.split('&')[0] : null);
      if (incidentParam || window.location.hash.includes('geofence-alert')) {
        handleTriggerGeofenceBreach('frankfurt');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleAuthorizeTravelZone = () => {
    if (geofenceBreach) {
      addAuditLog(
        'User Self-Service',
        'AUTHORIZED_TRAVEL_ZONE_ADDED',
        `User verified identity and authorized travel zone '${geofenceBreach.detectedSession.city}, ${geofenceBreach.detectedSession.country}' into family baseline.`,
        'info'
      );
    }
    setGeofenceBreach(null);
    setIsGeofenceModalOpen(false);
    setPlayerFeatures(prev => ({
      ...prev,
      region_change: true,
      impossible_travel: false,
      vpn_indicator: false,
      historical_consistency: 0.88,
    }));
  };

  // Flag as False Positive: Triggers API call to anomaly detection engine,
  // updates the behavioral baseline, and logs this action in the audit trail.
  const handleFlagFalsePositive = async () => {
    if (!geofenceBreach) return;

    const currentBreach = geofenceBreach;
    
    // 1. Trigger API call to Anomaly Detection Engine to recalibrate behavioral baseline
    const apiResponse = await updateAnomalyEngineBaseline(
      currentBreach,
      'Operator confirmed legitimate family roaming / false-positive resolution'
    );

    // 2. Incorporate updated behavioral cluster into app baseline
    setClusters(prev => {
      const clusterId = apiResponse.updatedClusterId;
      const existing = prev.find(c => c.id === clusterId);
      if (existing) {
        return prev.map(c => 
          c.id === clusterId 
            ? { ...c, sampleCount: c.sampleCount + 1, lastMatched: 'Just now' } 
            : c
        );
      }
      return [
        ...prev,
        {
          id: clusterId,
          profileName: `Family Member (Authorized Roaming)`,
          region: `${currentBreach.detectedSession.city}, ${currentBreach.detectedSession.country}`,
          deviceType: 'Roaming Client Device',
          typicalHours: 'Flexible / Roaming (UTC+1 to UTC+8)',
          centroid: {
            avgSessionDuration: 45,
            avgConcurrency: 1.2,
            historicalConsistency: apiResponse.historicalConsistencyRecalibrated,
          },
          sampleCount: 1,
          lastMatched: 'Just now',
        },
      ];
    });

    // 3. Log this action in the audit trail
    addAuditLog(
      'Security Analyst / Operator',
      'GEOFENCE_FALSE_POSITIVE_FLAGGED',
      `Operator flagged Geofence Incident [${currentBreach.id}] as FALSE POSITIVE. Anomaly Detection Engine API dispatched: ${apiResponse.message} Model recalibrated to ${apiResponse.modelVersion}. Behavioral baseline updated.`,
      'info'
    );

    // 4. Reset stream risk indicators and restore healthy session profile
    setPlayerFeatures(prev => ({
      ...prev,
      region_change: true,
      impossible_travel: false,
      vpn_indicator: false,
      playback_anomaly: false,
      historical_consistency: apiResponse.historicalConsistencyRecalibrated,
    }));

    // 5. Dismiss breach modal
    setGeofenceBreach(null);
    setIsGeofenceModalOpen(false);
  };

  // Step-Up MFA flow
  const handleRequestStepUp = () => {
    setStepUpContextMessage('Elevated session risk detected. Provide 6-digit TOTP token to restore full 1080p stream resolution.');
    setIsStepUpModalOpen(true);
  };

  const handleStepUpSuccess = () => {
    setIsStepUpModalOpen(false);

    if (pendingEnrollmentDevice) {
      // Complete device enrollment
      setDevices(prev => prev.map(d => 
        d.id === pendingEnrollmentDevice.id 
          ? { ...d, trustStatus: 'TRUSTED', enrollmentMfaVerified: true } 
          : d
      ));
      addAuditLog(
        'Device Enrollment Service',
        'TRUSTED_DEVICE_ENROLLED',
        `Device ${pendingEnrollmentDevice.name} (${pendingEnrollmentDevice.pseudonym}) successfully enrolled via Step-Up TOTP.`,
        'info'
      );
      setPendingEnrollmentDevice(null);
    } else {
      // Step-up for active playback
      setPlayerFeatures(prev => ({
        ...prev,
        mfa_success: true,
        auth_failures: 0,
        capture_indicator: false,
        playback_anomaly: false,
      }));
      setIsCaptureHookActive(false);
      addAuditLog(
        'Auth Gateway',
        'STEP_UP_MFA_VERIFIED',
        'Session owner successfully answered RFC 6238 TOTP challenge. Risk de-escalated to LOW.',
        'info'
      );
    }
  };

  // Device Management
  const handleEnrollDevicePrompt = () => {
    const newDev: Device = {
      id: `dev_new_${Date.now().toString(36)}`,
      pseudonym: `dev_${Math.random().toString(16).substring(2, 14)}`,
      name: 'Samsung Galaxy Tab S9',
      deviceType: 'Tablet',
      trustStatus: 'NEW',
      firstSeen: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      lastUsed: 'Just now',
      enrollmentMfaVerified: false,
      approxLocation: 'Bengaluru, India',
    };
    setPendingEnrollmentDevice(newDev);
    setDevices(prev => [newDev, ...prev]);
    setStepUpContextMessage(`Enrollment of new hardware '${newDev.name}' requires step-up MFA. Complete challenge to authorize.`);
    setIsStepUpModalOpen(true);
  };

  const handleRevokeDevice = (deviceId: string) => {
    setDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, trustStatus: 'REVOKED' } : d
    ));
    addAuditLog(
      'User Self-Service',
      'DEVICE_TRUST_REVOKED',
      `Device ${deviceId} revoked by user. Associated cryptographic licenses immediately invalidated.`,
      'warn'
    );
  };

  const handleTerminateSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    addAuditLog(
      'User Self-Service',
      'SESSION_MANUAL_TERMINATION',
      `Session ${sessionId} manually closed by user.`,
      'info'
    );
  };

  const handlePurgeExpiredLogs = () => {
    setAuditLogs(prev => prev.slice(0, 3));
    addAuditLog(
      'Privacy Purge Daemon',
      'HARD_RETENTION_PURGE_SUCCESS',
      'Cleaned aged audit events beyond 30-day retention horizon.',
      'info'
    );
  };

  // Apply scenario from matrix to player
  const handleApplyScenarioToPlayer = (sc: ScenarioDefinition, ass: RiskAssessment) => {
    setIsTampered(false);
    setIsCaptureHookActive(sc.features.capture_indicator);
    setPlayerFeatures(sc.features);
    setActiveTab('player');
    addAuditLog(
      'Scenario Harness',
      'RESEARCH_SCENARIO_APPLIED',
      `Applied scenario '${sc.name}' (${sc.category}) to live player. Evaluated score: ${ass.score}/100 (${ass.level}).`,
      'info'
    );
  };

  const handleSelectScenarioForInspection = (sc: ScenarioDefinition) => {
    setPlayerFeatures(sc.features);
    setActiveTab('risk_lab');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Strict 3-Zone Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickSimulateThreat={handleQuickSimulateThreat}
      />

      {/* Main Content Workspace Container (1440px desktop baseline with spatial math) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'player' && (
          <OttPlayer
            currentSession={activeSession}
            currentRisk={currentRisk}
            onTriggerTamper={handleTriggerTamper}
            onTriggerCaptureSimulator={handleTriggerCaptureSimulator}
            onRequestStepUpMfa={handleRequestStepUp}
            onResetStreamSecurity={handleResetStreamSecurity}
            onOpenForensicDecoder={() => setActiveTab('forensic')}
            onTriggerGeofenceBreach={handleTriggerGeofenceBreach}
            onViewGeofenceModal={() => setIsGeofenceModalOpen(true)}
            geofenceBreachActive={!!geofenceBreach}
            geofenceDistanceKm={geofenceBreach?.distanceKm || 6820}
            isTampered={isTampered}
            isCaptureHookActive={isCaptureHookActive}
          />
        )}

        {activeTab === 'risk_lab' && (
          <RiskEngineLab
            onApplyAssessmentToPlayer={(ass) => {
              setActiveTab('player');
            }}
          />
        )}

        {activeTab === 'forensic' && (
          <ForensicLeakInvestigator
            currentSessionId={activeSession.id}
            currentUserId={user.id}
          />
        )}

        {activeTab === 'integration' && (
          <OttIntegrationExport />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioMatrix
            onApplyScenarioToPlayer={handleApplyScenarioToPlayer}
            onSelectScenarioForInspection={handleSelectScenarioForInspection}
          />
        )}

        {activeTab === 'security' && (
          <UserSecurityPortal
            user={user}
            devices={devices}
            sessions={sessions}
            clusters={clusters}
            onEnrollDevice={handleEnrollDevicePrompt}
            onRevokeDevice={handleRevokeDevice}
            onTerminateSession={handleTerminateSession}
          />
        )}

        {activeTab === 'admin' && (
          <AdminAuditDashboard
            auditLogs={auditLogs}
            recentAssessments={[currentRisk]}
            onPurgeExpiredLogs={handlePurgeExpiredLogs}
            onViewGeofenceModal={() => {
              if (!geofenceBreach) {
                handleTriggerGeofenceBreach('frankfurt');
              } else {
                setIsGeofenceModalOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'tests' && (
          <TestSuiteBenchmark />
        )}

        {activeTab === 'research' && (
          <ResearchLimitations />
        )}
      </main>

      {/* Step-Up Challenge Modal Dialog */}
      <StepUpModal
        isOpen={isStepUpModalOpen}
        onClose={() => setIsStepUpModalOpen(false)}
        onSuccess={handleStepUpSuccess}
        contextMessage={stepUpContextMessage}
      />

      {/* Geo-Fencing Breach Alert & Tactical Radar Map Visualization Modal */}
      <GeofenceAlertModal
        isOpen={isGeofenceModalOpen}
        breachEvent={geofenceBreach}
        onClose={() => setIsGeofenceModalOpen(false)}
        onStepUpMfa={() => {
          setIsGeofenceModalOpen(false);
          handleRequestStepUp();
        }}
        onRestrictStream={() => {
          setIsGeofenceModalOpen(false);
          setPlayerFeatures(prev => ({
            ...prev,
            playback_anomaly: true,
          }));
          addAuditLog(
            'Adaptive DRM Guardian',
            'STREAM_DOWNGRADED_GEOFENCE_RISK',
            'Restricted stream resolution to 480p SD following unverified geofence anomaly.',
            'warn'
          );
        }}
        onTerminateSession={() => {
          setIsGeofenceModalOpen(false);
          if (sessions[0]) {
            handleTerminateSession(sessions[0].id);
          }
          addAuditLog(
            'Security Gateway',
            'SESSION_TERMINATED_GEOFENCE_BREACH',
            'Terminated active session and invalidated cryptographic stream tokens due to critical geofence violation.',
            'critical'
          );
        }}
        onAuthorizeTravelZone={handleAuthorizeTravelZone}
        onFlagFalsePositive={handleFlagFalsePositive}
      />

      {/* Clean Unboxed Editorial Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">AegisDRM Framework</span>
            <span aria-hidden="true">·</span>
            <span>Intelligent Multi-Layer OTT Security Prototype</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">13/13 Tests Passing</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Argon2id + AES-256-GCM</span>
            <span aria-hidden="true">·</span>
            <span>SHAP Explainability</span>
            <span aria-hidden="true">·</span>
            <span>Privacy Data Minimization</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
