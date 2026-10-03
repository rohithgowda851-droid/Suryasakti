import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { RealTelemetryCenter } from './components/RealTelemetryCenter';
import { DigitalTwinView } from './components/DigitalTwinView';
import { PlantMapView } from './components/PlantMapView';
import { MLAnalyticsView } from './components/MLAnalyticsView';
import { AlertsMaintenanceView } from './components/AlertsMaintenanceView';
import { PlantDetailStudio } from './components/PlantDetailStudio';
import { LandingPage } from './components/LandingPage';
import { ExportReportModal } from './components/ExportReportModal';
import welcomeBg from './assets/images/suryasakti_welcome_bg_1790748677279.jpg';
import { api, PlantWithState } from './services/api';
import { ThemeId } from './types/theme';
import {
  AlertItem,
  DashboardSummary,
  MaintenancePrediction,
  SensorReading,
  SimulationScenario,
} from './types';

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('suryasakti_operations_unlocked') !== 'true';
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('PL-S001');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const [hasEnteredOperations, setHasEnteredOperations] = useState<boolean>(() => {
    try {
      return localStorage.getItem('suryasakti_operations_unlocked') === 'true' ||
             sessionStorage.getItem('suryasakti_operations_unlocked') === 'true';
    } catch {
      return true;
    }
  });

  const [summary, setSummary] = useState<DashboardSummary | null>(() => {
    try {
      const saved = localStorage.getItem('suryasakti_cached_summary');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [plants, setPlants] = useState<PlantWithState[]>(() => {
    try {
      const saved = localStorage.getItem('suryasakti_cached_plants');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [readings, setReadings] = useState<SensorReading[]>(() => {
    try {
      const saved = localStorage.getItem('suryasakti_cached_readings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);

  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('NORMAL');
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('suryasakti_theme') as ThemeId) || 'obsidian';
  });
  const [isFullWidth, setIsFullWidth] = useState<boolean>(() => {
    const saved = localStorage.getItem('suryasakti_full_width');
    return saved === null ? true : saved === 'true';
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
  });
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync theme with DOM root and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('suryasakti_theme', currentTheme);
  }, [currentTheme]);

  // Sync Fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleToggleFullWidth = () => {
    setIsFullWidth((prev) => {
      const next = !prev;
      localStorage.setItem('suryasakti_full_width', String(next));
      return next;
    });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Fetch Core State with resilient fault tolerance
  const fetchState = useCallback(async () => {
    try {
      const [dashSummaryRes, plantsDataRes, readingsDataRes, alertsDataRes, maintDataRes] =
        await Promise.allSettled([
          api.getDashboard(),
          api.getPlants(),
          api.getReadings(undefined, 60),
          api.getAlerts(),
          api.getMaintenance(),
        ]);

      if (dashSummaryRes.status === 'fulfilled' && dashSummaryRes.value) {
        setSummary(dashSummaryRes.value);
        if (dashSummaryRes.value.streaming?.current_scenario) {
          setActiveScenario(dashSummaryRes.value.streaming.current_scenario);
        }
        try { localStorage.setItem('suryasakti_cached_summary', JSON.stringify(dashSummaryRes.value)); } catch {}
      }

      if (plantsDataRes.status === 'fulfilled' && plantsDataRes.value) {
        setPlants(plantsDataRes.value);
        try { localStorage.setItem('suryasakti_cached_plants', JSON.stringify(plantsDataRes.value)); } catch {}
      }

      if (readingsDataRes.status === 'fulfilled' && readingsDataRes.value) {
        setReadings(readingsDataRes.value);
        try { localStorage.setItem('suryasakti_cached_readings', JSON.stringify(readingsDataRes.value)); } catch {}
      }

      if (alertsDataRes.status === 'fulfilled' && alertsDataRes.value) {
        setAlerts(alertsDataRes.value);
      }

      if (maintDataRes.status === 'fulfilled' && maintDataRes.value) {
        setPredictions(maintDataRes.value);
      }
    } catch (err) {
      console.warn('Non-blocking telemetry sync notice:', err);
    }
  }, []);

  // Fetch initial telemetry state
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Real-time polling ticker (every 3 seconds when autoRefresh is enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchState();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchState]);

  // Handlers
  const handleScenarioChange = async (scenario: SimulationScenario, plantId?: string) => {
    try {
      await api.triggerScenario(scenario, plantId);
      setActiveScenario(scenario);
      await fetchState();
    } catch (err) {
      console.error('Error changing scenario:', err);
    }
  };

  const handleToggleStreaming = async () => {
    try {
      const res = await api.toggleStreaming(!isStreaming);
      setIsStreaming(res.streaming);
    } catch (err) {
      console.error('Error toggling streaming:', err);
    }
  };

  const handleStartStreaming = async () => {
    if (!isStreaming) {
      try {
        const res = await api.toggleStreaming(true);
        setIsStreaming(res.streaming);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await api.resolveAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === id ? { ...a, status: 'RESOLVED' } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPlant = (plantId: string) => {
    setSelectedPlantId(plantId);
  };

  const handleOpenPlantStudio = (plantId: string) => {
    setSelectedPlantId(plantId);
    setActiveTab('plant-detail');
  };

  const handleEnterOperations = () => {
    setHasEnteredOperations(true);
    sessionStorage.setItem('suryasakti_operations_unlocked', 'true');
    setActiveTab('dashboard');
  };

  const handleEnterCommandCenter = () => {
    try {
      localStorage.setItem('suryasakti_operations_unlocked', 'true');
      sessionStorage.setItem('suryasakti_operations_unlocked', 'true');
    } catch {}
    setShowLanding(false);
    setHasEnteredOperations(true);
    setActiveTab('dashboard');
  };

  const handleExitToLanding = () => {
    try {
      localStorage.removeItem('suryasakti_operations_unlocked');
      sessionStorage.removeItem('suryasakti_operations_unlocked');
    } catch {}
    setShowLanding(true);
  };

  const currentPlant = plants.find((p) => p.plant_id === selectedPlantId) || plants[0];

  // SECTION 1 & 2: Before user clicks ENTER, show ONLY the full-screen 3D landing page.
  // The dashboard, headers, navigation, widgets, and status bars are completely NOT rendered.
  if (showLanding) {
    return <LandingPage onEnter={handleEnterCommandCenter} />;
  }

  return (
    <div
      data-theme={currentTheme}
      className="theme-root min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 relative"
    >
      {/* Cinematic App-Wide Renewable Energy Plant Background with Subtle Zooming (Shown on other views, not home which has 3D scene) */}
      {activeTab !== 'dashboard' && activeTab !== 'home' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            src={welcomeBg}
            alt="Suryasakti Renewable Energy Landscape"
            className="w-full h-full object-cover object-center animate-subtle-zoom opacity-30 brightness-85 contrast-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(2,6,23,0.75)_100%)]" />
        </div>
      )}

      {/* Universal Header & Telemetry Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summary={summary}
        activeScenario={activeScenario}
        onSelectScenario={handleScenarioChange}
        isStreaming={isStreaming}
        onToggleStreaming={handleToggleStreaming}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onRefreshNow={async () => {
          setIsLoading(true);
          await fetchState();
          setIsLoading(false);
        }}
        isLoading={isLoading}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        isFullWidth={isFullWidth}
        onToggleFullWidth={handleToggleFullWidth}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        hasEnteredOperations={true}
        onEnterOperations={handleEnterOperations}
        onExitToLanding={handleExitToLanding}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${isFullWidth ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6'} py-6 transition-all duration-200 relative z-10`}>
        {/* 1. OPERATIONS ROOM / DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            summary={summary}
            plants={plants}
            readings={readings}
            selectedPlantId={selectedPlantId}
            onSelectPlant={handleSelectPlant}
            onInspectPlant={handleOpenPlantStudio}
            onOpenExport={() => setIsExportModalOpen(true)}
          />
        )}

        {/* 2. REAL SATELLITE & SENSOR TELEMETRY CENTER */}
        {(activeTab === 'telemetry' || activeTab === 'demo') && (
          <RealTelemetryCenter
            plants={plants}
            activeScenario={activeScenario}
            selectedPlantId={selectedPlantId}
            onSelectScenario={handleScenarioChange}
            onSelectPlant={handleSelectPlant}
            isStreaming={isStreaming}
            onToggleStreaming={handleToggleStreaming}
          />
        )}

        {/* 3. DIGITAL TWIN SCADA VIEW */}
        {activeTab === 'digital-twin' && (
          <DigitalTwinView
            plants={plants}
            selectedPlantId={selectedPlantId}
            onSelectPlant={handleSelectPlant}
            onInspectPlant={handleOpenPlantStudio}
          />
        )}

        {/* 4. GEOGRAPHIC PLANT MAP */}
        {activeTab === 'map' && (
          <PlantMapView
            plants={plants}
            selectedPlantId={selectedPlantId}
            onSelectPlant={handleSelectPlant}
            onInspectPlant={handleOpenPlantStudio}
          />
        )}

        {/* 5. MACHINE LEARNING & 24H FORECASTING */}
        {activeTab === 'ml' && (
          <MLAnalyticsView
            plants={plants}
            selectedPlantId={selectedPlantId}
            onSelectPlant={handleSelectPlant}
          />
        )}

        {/* 6. INCIDENT ALERTS & PREDICTIVE MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <AlertsMaintenanceView
            alerts={alerts}
            predictions={predictions}
            selectedPlantId={selectedPlantId}
            onSelectPlant={handleSelectPlant}
            onOpenExport={() => setIsExportModalOpen(true)}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onResolveAlert={handleResolveAlert}
          />
        )}

        {/* 7. DEDICATED PLANT ANALYTICS STUDIO */}
        {activeTab === 'plant-detail' && currentPlant && (
          <PlantDetailStudio
            plant={currentPlant}
            readings={readings}
            onBack={() => setActiveTab('dashboard')}
            onTriggerFault={handleScenarioChange}
          />
        )}
      </main>

      {/* Industrial SCADA Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-4 text-slate-400 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <span>
            SURYASAKTI • RENEWABLE FLEET TELEMETRY &amp; GRID INTELLIGENCE © 2026
          </span>
          <span className="text-slate-400">
            6 Operating Megaprojects • Bhadla • Pavagada • Muppandal • Jaisalmer • Kurnool • Khavda
          </span>
        </div>
      </footer>

      {/* SCADA Telemetry & Maintenance Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        summary={summary}
        plants={plants}
        readings={readings}
        alerts={alerts}
        predictions={predictions}
        currentSelectedPlantId={selectedPlantId}
      />
    </div>
  );
}
