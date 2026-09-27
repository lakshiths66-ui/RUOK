import React, { useState } from 'react';
import { 
  AlertTriangle, BookOpen, Scale, ShieldCheck, 
  HelpCircle, ChevronRight, CheckCircle2, FileText, Cpu, EyeOff 
} from 'lucide-react';

export const ResearchLimitations: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'limitations' | 'methodology' | 'framing'>('limitations');

  const limitationsList = [
    {
      index: '01',
      title: 'Session Trust Score vs Human Identity',
      summary: 'The AI never decides "who" the human is; it strictly evaluates session behavioral signals.',
      detail: 'Machine learning models cannot discern biometric human identity through network stream telemetry. Attempting to classify individuals directly leads to discrimination and high error rates. The framework only scores whether the authenticated session still behaves consistently with trusted parameters.',
    },
    {
      index: '02',
      title: 'Behavioral Analysis False-Positive Risk',
      summary: 'Anomalies naturally occur in human viewing habits (e.g. sickness, holidays, guest visits).',
      detail: 'Real-world human behavior is stochastic. A family member watching a 14-hour marathon during convalescence or a sudden change in household routines can look anomalous. Hence, the framework requires step-up MFA challenge rather than instant punitive disconnections.',
    },
    {
      index: '03',
      title: 'Geographic Distribution of Modern Households',
      summary: 'Multi-country family accounts are standard, not attacks.',
      detail: 'Households with members in Chennai, London, Dubai, and the US are common legitimate subscriptions. Treating geographic dispersion as prima facie piracy guarantees false positives. The framework utilizes multi-cluster baselines to recognize each member independently.',
    },
    {
      index: '04',
      title: 'Analog Hole / External Camera Screen Capture',
      summary: 'External cameras recording a physical display cannot be detected in-app.',
      detail: 'No client-side software DRM can detect an analog camera tripod pointed at a television screen. In such instances, forensic dynamic watermarking remains the sole mechanism for post-leak source attribution and legal discovery.',
    },
    {
      index: '05',
      title: 'Irreversibility of Already Leaked Footage',
      summary: 'Forensic DRM traces and deters, but cannot un-distribute leaked media.',
      detail: 'Once a pirated rip is uploaded to public torrent trackers or decentralized networks, software cannot claw it back. The forensic watermark identifies the leak source to terminate ongoing credentials and support civil/criminal enforcement.',
    },
    {
      index: '06',
      title: 'Adversarial Evasion & Behavioral Poisoning',
      summary: 'Sophisticated attackers may slowly drift their traffic to mimic legitimate centroids.',
      detail: 'An adversary with persistent access could deliberately space out requests, employ localized residential proxies, and mimic cluster viewing schedules to stay below anomaly thresholds.',
    },
    {
      index: '07',
      title: 'Synthetic Training Dataset vs Real Commercial OTT Logs',
      summary: 'Held-out test set accuracy (100%) is an artifact of clean synthetic scenario generation.',
      detail: 'The prototype was evaluated against 3,750 synthetic rows generated across 15 structured scenarios. In production, telemetry is noisy, packets drop, and edge cases blur boundaries. 100% scores in synthetic tests demonstrate mathematical consistency, not real-world perfection.',
    },
    {
      index: '08',
      title: 'Privacy and Regulatory Exposure (GDPR & DPDP)',
      summary: 'Collecting behavioral telemetry incurs regulatory compliance obligations.',
      detail: 'Even with pseudonymous hashes and coarse region data, continuous telemetry collection falls under GDPR (EU) and India’s DPDP Act. Production deployment requires explicit user consent, strict retention schedules, and guaranteed data export/deletion rights.',
    },
    {
      index: '09',
      title: 'Complement to, Not Replacement for Hardware DRM',
      summary: 'AegisDRM wraps Widevine/PlayReady/FairPlay; it does not replace hardware TEEs.',
      detail: 'Hardware roots of trust (Widevine L1, Apple FairPlay, Microsoft PlayReady SL3000) are indispensable for protecting decrypted video memory in hardware. AegisDRM operates as an intelligent policy and risk layer above the CDM license exchange.',
    },
    {
      index: '10',
      title: 'Client Integrity & Capture Hooks are Best-Effort',
      summary: 'Desktop OS capture hooks can be bypassed in root/kernel environments.',
      detail: 'Client-side capture detection relies on OS-level APIs (e.g. DXGI desktop duplication interception, MediaProjection flags). On rooted Android or custom Linux kernels, compromised clients can spoof these hooks.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <h2 className="text-base font-semibold text-white">Research Methodology & Scientific Integrity</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Academic transparency: Clear documentation of the 10 mandatory limitations, research framing, and why the synthetic dataset’s perfect accuracy numbers must not be quoted out of context.
        </p>

        {/* Tab selection */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveSection('limitations')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSection === 'limitations' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-white'
            }`}
          >
            The 10 Known Limitations
          </button>
          <button
            onClick={() => setActiveSection('methodology')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSection === 'methodology' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dataset & 100% Score Caveat
          </button>
          <button
            onClick={() => setActiveSection('framing')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSection === 'framing' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-white'
            }`}
          >
            Research Contribution & Framing
          </button>
        </div>
      </div>

      {/* View 1: The 10 Limitations */}
      {activeSection === 'limitations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {limitationsList.map((lim) => (
              <div
                key={lim.index}
                className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    LIMITATION #{lim.index}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Documented</span>
                </div>
                <h4 className="text-xs font-bold text-white">
                  {lim.title}
                </h4>
                <p className="text-xs text-amber-300/90 font-medium">
                  {lim.summary}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {lim.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 2: Synthetic Dataset & 100% Score Caveat */}
      {activeSection === 'methodology' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white">
              The 1.00 Precision / 1.00 Recall Scientific Caveat
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Why synthetic benchmark results must never be conflated with commercial operational metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500">Synthetic Samples:</span>
              <div className="text-xl font-bold text-white mt-1">3,750 Rows</div>
              <div className="text-[10px] text-slate-500 mt-1">15 discrete handcrafted scenarios</div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500">Held-Out Test Split:</span>
              <div className="text-xl font-bold text-cyan-400 mt-1">1.00 ROC-AUC</div>
              <div className="text-[10px] text-slate-500 mt-1">Clean mathematical feature separation</div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500">Real-World Transferability:</span>
              <div className="text-xl font-bold text-amber-400 mt-1">Requires Field Data</div>
              <div className="text-[10px] text-slate-500 mt-1">Telemetric noise in production</div>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
            <p>
              In our held-out test split, the Random Forest model achieved <span className="font-mono text-cyan-300">Accuracy: 1.00, Precision: 1.00, Recall: 1.00, F1: 1.00</span>.
            </p>
            <p className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200">
              <strong>CRITICAL RESEARCH INTEGRITY NOTE:</strong> These numbers do not indicate a flawless DRM system. The synthetic scenarios were designed with distinct multivariate separations (e.g. impossible travel velocity is physically impossible; repeated brute-force attacks have 4+ failures). Any competent ensemble classifier naturally separates these clusters.
            </p>
            <p>
              In real-world OTT deployments, user travel schedules, cellular tower handovers, residential proxy usage, and device churn create overlapping ambiguous boundaries where false positive rates will be greater than zero. The contribution of this framework is the <em>architecture</em>: two-stage gating, single-signal safety guarantees, multi-cluster baseline matching, and proportional step-up escalation rather than immediate punitive bans.
            </p>
          </div>
        </div>
      )}

      {/* View 3: Research Framing */}
      {activeSection === 'framing' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white">
              Novelty Claim & Research Framing
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Positioning within the computer science and security research landscape.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <h4 className="font-bold text-white mb-1">Central Research Question</h4>
              <p className="text-cyan-300 italic font-mono text-[11px]">
                &quot;How can continuous, multi-signal session-risk assessment improve detection of suspicious OTT sessions while minimizing false positives and performance impact for legitimate geographically distributed users?&quot;
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white">Core Research Novelty</h4>
              <p>
                The novelty does not lie in inventing new cryptography or replacing Widevine. Instead, it demonstrates an integrated multi-layer framework that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>Decouples initial identity authentication from continuous session risk scoring.</li>
                <li>Introduces multi-pattern behavioral clustering so multi-national households do not trigger false alerts.</li>
                <li>Guarantees that no single weak signal (new device or geographic move) can ever force a session to HIGH risk.</li>
                <li>Separates the evaluation into an instantaneous (&lt;0.001ms) rule filter and an out-of-path asynchronous ML evaluation to ensure zero impact on video stream startup latency.</li>
                <li>Deploys dynamic, shifting forensic watermarks whose opacity and steganographic features scale adaptively with evaluated session risk.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
