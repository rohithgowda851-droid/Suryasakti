import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Flame,
  Globe,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  Maximize2,
  Search,
  Sun,
  TrendingUp,
  Wind,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { PlantWithState } from '../services/api';
import { DashboardSummary, SensorReading } from '../types';
import { InteractiveLeafletMap } from './InteractiveLeafletMap';

interface DashboardOverviewProps {
  summary: DashboardSummary | null;
  plants: PlantWithState[];
  readings: SensorReading[];
  selectedPlantId?: string;
  onSelectPlant: (plantId: string) => void;
  onInspectPlant?: (plantId: string) => void;
  onOpenExport?: () => void;
}

const RISK_COLORS = {
  LOW: '#10b981',
  MODERATE: '#3b82f6',
  ELEVATED: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  summary,
  plants,
  readings,
  selectedPlantId,
  onSelectPlant,
  onInspectPlant,
  onOpenExport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [plantTypeFilter, setPlantTypeFilter] = useState<'ALL' | 'SOLAR' | 'WIND'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'>('ALL');

  // Single source of truth for selected site
  const currentPlantId = selectedPlantId || plants[0]?.plant_id || 'PL-S001';
  const selectedSite = useMemo<PlantWithState>(() => {
    const found = plants.find((p) => p.plant_id === currentPlantId);
    if (found) return found;
    if (plants[0]) return plants[0];
    return {
      plant_id: 'PL-S001',
      id: 'PL-S001',
      plant_name: 'Bhadla Solar Park Complex',
      name: 'PL-S001',
      plant_type: 'SOLAR',
      type: 'Solar',
      capacity_mw: 350,
      region: 'North-West India (Rajasthan - Thar Desert)',
      operating_status: 'OPTIMAL',
      installation_date: '2020-03-15',
      equipment_count: 140,
      latitude: 27.539,
      longitude: 71.916,
      imageUrl: '/site-images/PL-S001.jpg',
      latest_reading: undefined,
      latest_risk: undefined,
      history: [],
    };
  }, [plants, currentPlantId]);

  // Image error state & smooth transition fade
  const [imageError, setImageError] = useState<boolean>(false);
  const [isFading, setIsFading] = useState<boolean>(false);

  // Requirements 10 & 14: Reset image error and trigger smooth fade on site change
  useEffect(() => {
    setImageError(false);
    setIsFading(true);
    const timer = setTimeout(() => setIsFading(false), 220);
    return () => clearTimeout(timer);
  }, [currentPlantId]);

  // Filtered plants
  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const matchSearch =
        p.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.plant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.region.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = plantTypeFilter === 'ALL' || p.plant_type === plantTypeFilter;
      const matchRisk = riskFilter === 'ALL' || p.latest_risk?.risk_level === riskFilter;
      return matchSearch && matchType && matchRisk;
    });
  }, [plants, searchTerm, plantTypeFilter, riskFilter]);

  // Chart 1 & 2 data: Real-time Power & Expected vs Actual
  const timelineData = useMemo(() => {
    const recent = readings.slice(-20);
    return recent.map((r, i) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actual: r.power_generated,
      expected: r.expected_power,
      plant: r.plant_id,
      irradiance: r.solar_irradiance,
      windSpeed: r.wind_speed,
      temp: r.temperature,
      equipTemp: r.equipment_temperature,
    }));
  }, [readings]);

  // Chart 3: Risk Trend per plant
  const riskTrendData = useMemo(() => {
    return plants.map((p) => ({
      name: p.plant_id,
      risk: p.latest_risk?.risk_score || 10,
      level: p.latest_risk?.risk_level || 'LOW',
      capacity: p.capacity_mw,
    }));
  }, [plants]);

  // Chart 4: Risk Distribution Data
  const riskDistributionData = useMemo(() => {
    const counts = { LOW: 0, MODERATE: 0, ELEVATED: 0, HIGH: 0, CRITICAL: 0 };
    plants.forEach((p) => {
      const level = p.latest_risk?.risk_level || 'LOW';
      counts[level] = (counts[level] || 0) + 1;
    });
    return [
      { name: 'Low (0-20)', value: counts.LOW, color: RISK_COLORS.LOW },
      { name: 'Moderate (21-40)', value: counts.MODERATE, color: RISK_COLORS.MODERATE },
      { name: 'Elevated (41-60)', value: counts.ELEVATED, color: RISK_COLORS.ELEVATED },
      { name: 'High (61-80)', value: counts.HIGH, color: RISK_COLORS.HIGH },
      { name: 'Critical (81-100)', value: counts.CRITICAL, color: RISK_COLORS.CRITICAL },
    ];
  }, [plants]);

  // Chart 5: Plant Performance (Generation vs Capacity)
  const performanceData = useMemo(() => {
    return plants.map((p) => {
      const gen = p.latest_reading?.power_generated || 0;
      const cap = p.capacity_mw;
      const eff = cap > 0 ? +((gen / cap) * 100).toFixed(1) : 0;
      return {
        name: p.plant_id,
        fullName: p.plant_name,
        generation: gen,
        capacity: cap,
        efficiency: eff,
        type: p.plant_type,
      };
    });
  }, [plants]);

  // Chart 6: Energy Production Breakdown (Solar vs Wind Total)
  const energyProductionBreakdown = useMemo(() => {
    let solarGen = 0;
    let windGen = 0;
    plants.forEach((p) => {
      const gen = p.latest_reading?.power_generated || 0;
      if (p.plant_type === 'SOLAR') solarGen += gen;
      else windGen += gen;
    });
    return [
      { name: 'Solar PV Fleet', value: +solarGen.toFixed(1), color: '#f59e0b' },
      { name: 'Wind Turbines Fleet', value: +windGen.toFixed(1), color: '#06b6d4' },
    ];
  }, [plants]);

  // Chart 7: Temperature vs Production (Scatter)
  const tempVsProdData = useMemo(() => {
    return readings.slice(-30).map((r) => ({
      temp: r.temperature,
      power: r.power_generated,
      plant: r.plant_id,
    }));
  }, [readings]);

  // Chart 8: Wind Speed vs Production (Scatter)
  const windVsProdData = useMemo(() => {
    return readings
      .filter((r) => r.plant_id.startsWith('PL-W'))
      .slice(-30)
      .map((r) => ({
        windSpeed: r.wind_speed,
        power: r.power_generated,
        plant: r.plant_id,
      }));
  }, [readings]);

  // Chart 9: Solar Irradiance vs Production (Scatter)
  const solarVsProdData = useMemo(() => {
    return readings
      .filter((r) => r.plant_id.startsWith('PL-S'))
      .slice(-30)
      .map((r) => ({
        irradiance: r.solar_irradiance,
        power: r.power_generated,
        plant: r.plant_id,
      }));
  }, [readings]);

  return (
    <div className="space-y-6 bg-slate-950 text-slate-100">
      {/* ============================================================== */}
      {/* SECTIONS 7, 8, 9, 10, 15: OPERATIONS ROOM SITE SELECTOR & REAL SITE PHOTO */}
      {/* ============================================================== */}
      <div className="space-y-3">
        {/* Top Control Bar with 6 Site Selector Buttons */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-black text-white tracking-wide uppercase">
                Operations Room
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                SCADA ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any of the 6 national sites to inspect real facility photography &amp; live telemetry
            </p>
          </div>

          {/* 6 Site Selector Buttons: PL-S001, PL-S002, PL-S003, PL-W001, PL-W002, PL-W003 */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline mr-1">
              SITE SELECTOR:
            </span>
            {plants.map((p) => {
              const isSelected = p.plant_id === currentPlantId;
              const isSolar = p.plant_type === 'SOLAR';
              return (
                <button
                  key={p.plant_id}
                  type="button"
                  onClick={() => onSelectPlant(p.plant_id)}
                  title={`Select ${p.plant_name} (${p.plant_id})`}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-sm ${
                    isSelected
                      ? isSolar
                        ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 transform scale-105'
                        : 'bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300 transform scale-105'
                      : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {isSolar ? (
                    <Sun className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                  ) : (
                    <Wind className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`} />
                  )}
                  <span>{p.plant_id}</span>
                </button>
              );
            })}

            {/* Quick Export SCADA Report Button */}
            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                title="Export SCADA Telemetry & Maintenance Report (CSV / PDF)"
                className="ml-1 sm:ml-2 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white transition cursor-pointer shadow-sm shadow-emerald-950/40 text-xs font-mono"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Large Professional Site Photograph Card (Sections 8, 9, 10, 13, 15, 16) */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 min-h-[260px] sm:min-h-[300px] md:min-h-[340px] flex items-end">
          {/* Photograph Container with Smooth Fade Transition */}
          <div className="absolute inset-0 overflow-hidden">
            {!imageError ? (
              <img
                key={selectedSite.plant_id}
                src={selectedSite.imageUrl || `/site-images/${selectedSite.plant_id}.jpg`}
                alt={`${selectedSite.plant_name} (${selectedSite.plant_id})`}
                className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                  isFading ? 'opacity-20' : 'opacity-85'
                } brightness-95 contrast-105 filter`}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  setImageError(true);
                }}
              />
            ) : (
              /* High-tech Dark SCADA Fallback Placeholder (Requirement 13) */
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                  {selectedSite.plant_type === 'SOLAR' ? (
                    <Sun className="w-8 h-8 text-amber-400/50" />
                  ) : (
                    <Wind className="w-8 h-8 text-cyan-400/50" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-200 font-mono tracking-widest uppercase">
                    SITE IMAGE NOT AVAILABLE
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Awaiting Site Photograph for {selectedSite.plant_id}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                  Target: /site-images/{selectedSite.plant_id}.jpg
                </span>
              </div>
            )}

            {/* Subtle dark gradient scrims ensuring high text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-slate-950/20 pointer-events-none" />
          </div>

          {/* Top Info Badges */}
          <div className="absolute top-4 inset-x-5 sm:inset-x-7 z-10 flex items-center justify-between gap-3 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/90 border border-emerald-500/40 text-emerald-300 backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SELECTED SITE SCADA CAMERA FEED
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-900/80 border border-slate-700/80 text-slate-300 backdrop-blur-md">
                Telemetry Synchronized
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-950/90 border border-slate-700/80 text-white backdrop-blur-md">
                6/6 SITES ONLINE
              </span>
            </div>
          </div>

          {/* Bottom Overlay: Site Information as specified in Sections 8, 9, 15 */}
          <div className="relative z-10 w-full p-5 sm:p-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${
                  selectedSite.plant_type === 'SOLAR'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}>
                  {selectedSite.plant_id}
                </span>

                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase text-slate-200 bg-slate-900/80 border border-slate-700/80 backdrop-blur-md">
                  {selectedSite.plant_type === 'SOLAR' ? 'SOLAR ENERGY PLANT' : 'WIND POWER FACILITY'}
                </span>

                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide uppercase drop-shadow-md">
                  {selectedSite.plant_name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium flex flex-wrap items-center gap-2 mt-1 drop-shadow">
                  <span>{selectedSite.region}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-300 font-mono font-bold">{selectedSite.capacity_mw} MW Capacity</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-mono">Commissioned {selectedSite.installation_date}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics right on the photo */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 block text-[10px]">CURRENT GENERATION</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {selectedSite.latest_reading?.power_generated ?? '0.00'} MW
                </span>
              </div>

              <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 block text-[10px]">EFFICIENCY FACTOR</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {selectedSite.capacity_mw > 0
                    ? (((selectedSite.latest_reading?.power_generated || 0) / selectedSite.capacity_mw) * 100).toFixed(1)
                    : '0.0'}%
                </span>
              </div>

              <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 block text-[10px]">GRID FREQUENCY</span>
                <span className="text-teal-300 font-bold text-sm">
                  {summary?.grid_frequency_hz ? `${summary.grid_frequency_hz.toFixed(2)} Hz` : '50.02 Hz'}
                </span>
              </div>

              {/* Inspect Facility Button */}
              <button
                type="button"
                onClick={() => {
                  if (onInspectPlant) onInspectPlant(selectedSite.plant_id);
                  else onSelectPlant(selectedSite.plant_id);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/50 hover:scale-105 active:scale-95 shrink-0"
                title={`Launch dedicated telemetry & diagnostics studio for ${selectedSite.plant_name}`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Inspect Facility</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Top Cards Row (8 Required Metrics) - High Contrast Opaque Dark */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Card 1: Total Plants */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
            <span>Total Plants</span>
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {summary?.total_plants || plants.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">3 Solar • 3 Wind</div>
        </div>

        {/* Card 2: Total Capacity */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
            <span>Total Capacity</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {summary?.total_capacity_mw || 1650} <span className="text-xs text-slate-400">MW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Peak Nameplate</div>
        </div>

        {/* Card 3: Current Generation */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
            <span>Current Power</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {summary?.current_generation_mw || 0} <span className="text-xs text-slate-300">MW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Expected: {summary?.expected_generation_mw || 0} MW
          </div>
        </div>

        {/* Card 4: Average Efficiency */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
            <span>Avg Efficiency</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {summary?.average_efficiency_pct || 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Actual vs Expected</div>
        </div>

        {/* Card 5: Average Risk */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
            <span>Average Risk</span>
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              (summary?.average_risk_score || 0) > 50 ? 'text-rose-400' : 'text-slate-100'
            }`}
          >
            {summary?.average_risk_score || 0} <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Fleet Composite</div>
        </div>

        {/* Card 6: High-Risk Plants */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
            <span>High-Risk Plants</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              (summary?.high_risk_plants_count || 0) > 0 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {summary?.high_risk_plants_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Score &gt; 60 (High/Crit)</div>
        </div>

        {/* Card 7: Active Alerts */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
            <span>Active Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {summary?.active_alerts_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Unresolved Warnings</div>
        </div>

        {/* Card 8: Anomalies Today */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
            <span>Anomalies Logged</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
            {summary?.anomalies_today_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Z-Score & IQR Outliers</div>
        </div>
      </div>

      {/* 2. Global Filter & Search Bar */}
      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search plants by ID, name, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Solar/Wind filter */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => setPlantTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                plantTypeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setPlantTypeFilter('SOLAR')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                plantTypeFilter === 'SOLAR' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" /> Solar
            </button>
            <button
              onClick={() => setPlantTypeFilter('WIND')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                plantTypeFilter === 'WIND' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind className="w-3 h-3 text-cyan-400" /> Wind
            </button>
          </div>

          {/* Risk Level filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 text-xs">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Risk Levels</option>
              <option value="LOW" className="bg-slate-900 text-emerald-400">Low (0-20)</option>
              <option value="MODERATE" className="bg-slate-900 text-blue-400">Moderate (21-40)</option>
              <option value="ELEVATED" className="bg-slate-900 text-amber-400">Elevated (41-60)</option>
              <option value="HIGH" className="bg-slate-900 text-orange-400">High (61-80)</option>
              <option value="CRITICAL" className="bg-slate-900 text-rose-400">Critical (81-100)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Primary Charts Grid (Charts 1, 2, 3, 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Real-time Power Generation Trend */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                1. Real-Time Power Generation Stream
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Streaming rolling power output (MW) across time</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Feed
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="actual" name="Actual Power (MW)" stroke="#10b981" fillOpacity={1} fill="url(#powerGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expected vs Actual Power */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                2. Expected vs. Actual Generation
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Theoretical physics model vs measured sensor output</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="expected" name="Expected Model (MW)" stroke="#94a3b8" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="actual" name="Actual Sensor (MW)" stroke="#38bdf8" dot={false} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Risk Score Distribution across Plants */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                3. Plant Risk Score Evaluation
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Calculated 0-100 explainable risk score per facility</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="risk" name="Risk Score (0-100)" radius={[4, 4, 0, 0]}>
                  {riskTrendData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.risk > 80
                          ? RISK_COLORS.CRITICAL
                          : entry.risk > 60
                          ? RISK_COLORS.HIGH
                          : entry.risk > 40
                          ? RISK_COLORS.ELEVATED
                          : entry.risk > 20
                          ? RISK_COLORS.MODERATE
                          : RISK_COLORS.LOW
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Risk Tier Distribution Breakdown */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                4. Fleet Risk Tier Categorization
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Categorized breakdown of plant risk classifications</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                  labelLine={false}
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Secondary Analytical Correlation Charts (Charts 5, 6, 7, 8, 9) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart 5: Plant Performance vs Capacity */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            5. Plant Capacity Utilization (%)
          </h3>
          <p className="text-slate-400 text-xs mb-3">Actual generation as % of rated nameplate capacity</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val}%`, 'Utilization']}
                />
                <Bar dataKey="efficiency" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Energy Production Breakdown (Solar vs Wind) */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-400" />
            6. Solar vs Wind Total Generation (MW)
          </h3>
          <p className="text-slate-400 text-xs mb-3">Generation aggregate by renewable technology type</p>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={energyProductionBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="value" label>
                  {energyProductionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: Temperature vs Production */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-400" />
            7. Temperature vs. Output Power
          </h3>
          <p className="text-slate-400 text-xs mb-3">Verifies thermal derating curve at elevated temperatures</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="temp" name="Temperature" unit="°C" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="power" name="Power" unit="MW" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Scatter name="Telemetry Samples" data={tempVsProdData} fill="#f43f5e" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 8: Wind Speed vs Production */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Wind className="w-4 h-4 text-cyan-400" />
            8. Wind Speed vs. Turbine Power
          </h3>
          <p className="text-slate-400 text-xs mb-3">Demonstrating cubic wind power curve and cut-out behavior</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="windSpeed" name="Wind Speed" unit="m/s" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="power" name="Power" unit="MW" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Scatter name="Wind Turbines" data={windVsProdData} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 9: Solar Irradiance vs Production */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-400" />
            9. Solar Irradiance vs. PV Power
          </h3>
          <p className="text-slate-400 text-xs mb-3">Solar irradiance (W/m²) direct linear response curve</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="irradiance" name="Irradiance" unit="W/m²" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="power" name="Power" unit="MW" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Scatter name="Solar Arrays" data={solarVsProdData} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 10: Equipment Core Temp vs Vibration */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-400" />
            10. Equipment Thermal & Vibration Track
          </h3>
          <p className="text-slate-400 text-xs mb-3">Correlation between core temp (°C) and mechanical vibration</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="equipTemp" name="Equip Temp (°C)" stroke="#ec4899" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4b. India Geospatial Fleet Radar & Real-Time GIS Heatmap */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              India Geospatial Fleet Radar & Real-Time GIS Map
            </h3>
            <p className="text-slate-400 text-xs">
              Live geographic plant nodes across India, interactive risk clustering, satellite telemetry, and dynamic generation buffer zones
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {plants.filter((p) => (p.latest_risk?.risk_score ?? 0) < 40).length} Optimal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {plants.filter((p) => (p.latest_risk?.risk_score ?? 0) >= 40 && (p.latest_risk?.risk_score ?? 0) < 70).length} Elevated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              {plants.filter((p) => (p.latest_risk?.risk_score ?? 0) >= 70).length} Critical
            </span>
          </div>
        </div>

        <InteractiveLeafletMap
          plants={filteredPlants.length > 0 ? filteredPlants : plants}
          onSelectPlant={onSelectPlant}
          height="440px"
          showControls={true}
        />
      </div>

      {/* 5. Renewable Fleet Inventory Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Fleet Plant Directory & Live Telemetry Tele-Matrix
            </h3>
            <p className="text-slate-400 text-xs">Click on any plant row to open its dedicated analytics studio</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredPlants.length} of {plants.length} Plants
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 uppercase font-mono text-[11px] text-slate-200 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Plant ID</th>
                <th className="px-4 py-3">Name & Region</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Current Power</th>
                <th className="px-4 py-3">Efficiency</th>
                <th className="px-4 py-3">Core Temp</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPlants.map((plant) => {
                const reading = plant.latest_reading;
                const risk = plant.latest_risk;
                const eff =
                  reading && reading.expected_power > 0
                    ? +((reading.power_generated / reading.expected_power) * 100).toFixed(1)
                    : 0;

                return (
                  <tr
                    key={plant.plant_id}
                    onClick={() => onSelectPlant(plant.plant_id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-white">{plant.plant_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{plant.plant_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{plant.region}</span>
                        {plant.regional_ecology && (
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            🌲 {(plant.regional_ecology.estimated_trees / 1_000_000).toFixed(1)}M trees
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          plant.plant_type === 'SOLAR'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {plant.plant_type === 'SOLAR' ? <Sun className="w-3 h-3" /> : <Wind className="w-3 h-3" />}
                        {plant.plant_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{plant.capacity_mw} MW</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {reading?.power_generated ?? '0.00'} MW
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className={eff < 70 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{eff}%</span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span
                        className={
                          (reading?.equipment_temperature || 0) > 70 ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }
                      >
                        {reading?.equipment_temperature ?? '45.0'}°C
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {risk ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            risk.risk_level === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : risk.risk_level === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                              : risk.risk_level === 'ELEVATED'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : risk.risk_level === 'MODERATE'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {risk.risk_score} ({risk.risk_level})
                        </span>
                      ) : (
                        <span className="text-slate-500">Evaluating...</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          plant.operating_status === 'OPTIMAL'
                            ? 'text-emerald-400'
                            : plant.operating_status === 'DEGRADED'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {plant.operating_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectPlant) {
                            onInspectPlant(plant.plant_id);
                          } else {
                            onSelectPlant(plant.plant_id);
                          }
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                        title={`Inspect telemetry and diagnostics for ${plant.plant_name}`}
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
