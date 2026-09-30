import React from 'react';
import { ShieldCheck, Play, Activity, Cpu, Database, CheckSquare, BookOpen, AlertTriangle, Fingerprint, Code } from 'lucide-react';

export type NavTab = 
  | 'player' 
  | 'risk_lab' 
  | 'forensic'
  | 'integration'
  | 'scenarios' 
  | 'security' 
  | 'admin' 
  | 'tests' 
  | 'research';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeAlertCount?: number;
  onQuickSimulateThreat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  activeAlertCount = 0,
  onQuickSimulateThreat,
}) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Single text element wordmark in display face */}
      <div className="flex items-center gap-3">
        <a 
          href="#player" 
          onClick={(e) => { e.preventDefault(); onTabChange('player'); }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap"
        >
          AegisDRM
        </a>
        <span className="hidden sm:inline text-xs text-slate-500 font-mono tracking-wider">
          v2.4-PROD
        </span>
      </div>

      {/* Zone 2: Clean text navigation links with active state */}
      <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-400">
        <button
          onClick={() => onTabChange('player')}
          className={`transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'player' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          OTT Player & DRM
        </button>
        <button
          onClick={() => onTabChange('risk_lab')}
          className={`transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'risk_lab' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          Risk Engine & SHAP
        </button>
        <button
          onClick={() => onTabChange('forensic')}
          className={`transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'forensic' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          Forensic Decoder
        </button>
        <button
          onClick={() => onTabChange('integration')}
          className={`transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'integration' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          OTT SDK & EME
        </button>
        <button
          onClick={() => onTabChange('scenarios')}
          className={`hidden xl:block transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'scenarios' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          Scenarios (15)
        </button>
        <button
          onClick={() => onTabChange('security')}
          className={`hidden xl:block transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'security' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          User Security
        </button>
        <button
          onClick={() => onTabChange('admin')}
          className={`transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'admin' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          Admin & Audit
        </button>
        <button
          onClick={() => onTabChange('tests')}
          className={`hidden 2xl:block transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'tests' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          Test Suite (12)
        </button>
        <button
          onClick={() => onTabChange('research')}
          className={`hidden 2xl:block transition-colors hover:text-white whitespace-nowrap cursor-pointer ${
            activeTab === 'research' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : ''
          }`}
        >
          Research & Limits
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {onQuickSimulateThreat && (
          <button
            onClick={onQuickSimulateThreat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-700/50 rounded-md hover:bg-amber-900/50 hover:border-amber-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Threat</span>
          </button>
        )}
        <button
          onClick={() => onTabChange('player')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Stream</span>
        </button>
      </div>
    </header>
  );
};
