import React from 'react';
import {
  Activity,
  AlertTriangle,
  Download,
  Globe,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Monitor,
  Sparkles,
  Wind,
} from 'lucide-react';
import { DashboardSummary, SimulationScenario } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { ThemeId } from '../types/theme';
import suryasaktiLogo from '../assets/images/suryasakti_logo_1790515775771.jpg';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  summary: DashboardSummary | null;
  activeScenario: SimulationScenario;
  onSelectScenario: (scenario: SimulationScenario) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefreshNow: () => void;
  isLoading: boolean;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  isFullWidth: boolean;
  onToggleFullWidth: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  hasEnteredOperations?: boolean;
  onEnterOperations?: () => void;
  onExitToLanding?: () => void;
  onOpenExport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  summary,
  currentTheme,
  onSelectTheme,
  isFullWidth,
  onToggleFullWidth,
  isFullscreen,
  onToggleFullscreen,
  hasEnteredOperations = true,
  onExitToLanding,
  onOpenExport,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Operations Room', icon: LayoutDashboard },
    { id: 'telemetry', label: 'Satellite Telemetry', icon: Globe },
    { id: 'digital-twin', label: 'Plant Digital Twin', icon: Wind },
    { id: 'map', label: 'Geo Fleet Map', icon: Globe },
    { id: 'ml', label: 'ML Risk & Forecast', icon: Activity },
    { id: 'maintenance', label: 'Maintenance & Alerts', icon: AlertTriangle },
  ];

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
      {/* Top Telemetry & Control Bar */}
      <div className={`${isFullWidth ? 'w-full px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6'} py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 text-xs`}>
        {/* Title Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="relative group cursor-pointer"
            title="Suryasakti Renewable Energy Intelligence Platform"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 shadow-md shadow-emerald-950/40 flex items-center justify-center ring-1 ring-white/10 group-hover:border-emerald-400 group-hover:shadow-emerald-500/30 transition-all duration-300">
              <img
                src={suryasaktiLogo}
                alt="Suryasakti Renewable Energy Intelligence Logo"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-white uppercase bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                SURYASAKTI
              </span>
              <span className="hidden sm:inline-block text-slate-500 font-light">|</span>
              <span className="font-semibold text-xs text-slate-200 hidden md:inline-block">
                Renewable Energy Intelligence
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                1,650 MW FLEET
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              National Renewable Fleet Operations &amp; SCADA Telemetry Platform
            </p>
          </div>
        </div>

        {/* Operational Status (Shown once entered into operations) */}
        <div className="flex items-center gap-3">
          {hasEnteredOperations && (
            <div className="hidden md:flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-slate-400">STATUS:</span>
              <span className="text-emerald-400 font-semibold">6/6 SITES ONLINE</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">GRID FREQUENCY:</span>
              <span className="text-cyan-400 font-semibold">
                {summary?.grid_frequency_hz ? `${summary.grid_frequency_hz.toFixed(2)} Hz` : '50.02 Hz'}
              </span>
            </div>
          )}

          {/* Theme Selector, Full Width & Fullscreen Controls */}
          <div className="flex items-center gap-1.5">
            <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />

            {/* Full Width Layout Toggle */}
            <button
              type="button"
              onClick={onToggleFullWidth}
              title={isFullWidth ? 'Switch to Contained Layout (1280px)' : 'Switch to Edge-to-Edge Full Width (100%)'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-sm ${
                isFullWidth
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              {isFullWidth ? <Minimize2 className="w-3.5 h-3.5 text-indigo-400" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />}
              <span className="hidden lg:inline text-[11px] font-mono">
                {isFullWidth ? 'Full Width' : 'Contained'}
              </span>
            </button>

            {/* Export Telemetry & Maintenance Report */}
            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                title="Export Telemetry Data & Maintenance Logs (CSV / PDF Report)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-sm shadow-emerald-950/40"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export Report</span>
              </button>
            )}

            {/* Native Fullscreen Display Toggle */}
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen Display (Esc)' : 'Enter Fullscreen Display Mode'}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer shadow-sm ${
                isFullscreen
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              <Monitor className={`w-3.5 h-3.5 ${isFullscreen ? 'text-emerald-400' : 'text-slate-400'}`} />
            </button>

            {/* Optional Exit to 3D Landing Portal */}
            {onExitToLanding && (
              <button
                type="button"
                onClick={onExitToLanding}
                title="Return to 3D Landing Page"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline text-[11px]">Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs - ONLY shown after user enters the main dashboard */}
      {hasEnteredOperations && (
        <div className={isFullWidth ? 'w-full px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6'}>
          <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* SCADA Status Badge */}
            <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] font-mono text-emerald-400/90 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>SCADA OPERATIONS ACTIVE</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
