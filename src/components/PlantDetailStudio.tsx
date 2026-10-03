import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Cpu,
  Flame,
  Globe,
  Info,
  Layers,
  Leaf,
  MapPin,
  RefreshCw,
  Sun,
  Thermometer,
  TreePine,
  Trees,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PlantWithState } from '../services/api';
import { SensorReading, SimulationScenario } from '../types';
import { InteractiveLeafletMap } from './InteractiveLeafletMap';

interface PlantDetailStudioProps {
  plant: PlantWithState;
  readings: SensorReading[];
  onBack: () => void;
  onTriggerFault: (scenario: SimulationScenario, plantId: string) => void;
}

export const PlantDetailStudio: React.FC<PlantDetailStudioProps> = ({
  plant,
  readings,
  onBack,
  onTriggerFault,
}) => {
  const reading = plant.latest_reading;
  const risk = plant.latest_risk;

  const plantReadings = readings
    .filter((r) => r.plant_id === plant.plant_id)
    .slice(-25)
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actualPower: r.power_generated,
      expectedPower: r.expected_power,
      coreTemp: r.equipment_temperature,
      vibration: r.vibration,
      voltage: r.voltage,
      current: r.current,
    }));

  return (
    <div className="space-y-6">
      {/* Back Button & Top Plant Overview Card */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet Dashboard Overview
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                {plant.plant_id}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                  plant.plant_type === 'SOLAR'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {plant.plant_type === 'SOLAR' ? <Sun className="w-3.5 h-3.5" /> : <Wind className="w-3.5 h-3.5" />}
                {plant.plant_type} GENERATION FACILITY
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  plant.operating_status === 'OPTIMAL'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                ● {plant.operating_status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                REAL SATELLITE TELEMETRY
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">{plant.plant_name}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {plant.region} ({plant.latitude.toFixed(3)}°, {plant.longitude.toFixed(3)}°)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Commissioned: {plant.installation_date}
              </span>
              <span>•</span>
              <span className="font-mono font-bold text-slate-300">{plant.capacity_mw} MW Nameplate</span>
            </p>
          </div>

          {/* Fault Simulation Shortcuts for this specific plant */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Inject Test Fault:</span>
            <button
              onClick={() => onTriggerFault('EQUIPMENT_FAILURE', plant.plant_id)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Fail Equipment
            </button>
            <button
              onClick={() => onTriggerFault('POWER_DROP', plant.plant_id)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Drop Output
            </button>
            <button
              onClick={() => onTriggerFault('NORMAL', plant.plant_id)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
            >
              Reset Normal
            </button>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Health Metric Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-xs">Current Generation</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {reading?.power_generated ?? 0} <span className="text-xs text-slate-500">MW</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Expected: {reading?.expected_power ?? 0} MW
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-xs">Calculated Risk</span>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              (risk?.risk_score || 0) > 60 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {risk?.risk_score ?? 15} <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Level: {risk?.risk_level ?? 'LOW'}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-xs">Operating Core Temp</span>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              (reading?.equipment_temperature || 0) > 70 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {reading?.equipment_temperature ?? 45}°C
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Thermal Safe Limit: 68°C</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-xs">Mechanical Vibration</span>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              (reading?.vibration || 0) > (plant.plant_type === 'SOLAR' ? 1.5 : 5.0)
                ? 'text-rose-400'
                : 'text-slate-200'
            }`}
          >
            {reading?.vibration ?? 1.1} <span className="text-xs text-slate-500">mm/s</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ISO Vibration Band</div>
        </div>
      </div>

      {/* Main Charts: Power Output & Equipment Stress Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Telemetry Stream Chart */}
        <div className="lg:col-span-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Power Generation Tracking
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Actual vs Expected theoretical yield over time</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Telemetry Resolution: 2.5s</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plantReadings} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="expectedPower"
                  name="Expected Model (MW)"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actualPower"
                  name="Actual Output (MW)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 4 Cols: Explainable Risk Reasons & Factors */}
        <div className="lg:col-span-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Explainable Risk Audit
              </h2>
              <span className="font-mono text-xs font-bold text-white">
                {risk?.risk_score} / 100
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Automated Diagnostic Reasons:
              </span>
              {risk?.reasons.map((r, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  {r}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Risk Weight Factor Distribution:
              </span>
              {risk?.factors.map((f, idx) => (
                <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">{f.factor}</span>
                    <span className="font-mono text-emerald-400 font-bold">{f.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        f.status === 'DANGER' ? 'bg-rose-500' : f.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, f.score)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Localized Plant Geospatial Site Survey Map & Regional Ecological Census */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Geographic Facility Location & Regional Tree Ecology
            </h2>
            <p className="text-slate-400 text-xs">
              Live GIS telemetry node: {plant.plant_name} ({plant.latitude.toFixed(4)}°, {plant.longitude.toFixed(4)}°) &bull; Capacity Buffer: {plant.capacity_mw} MW
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            {plant.region}
          </span>
        </div>

        {/* Regional Tree Census Summary Cards */}
        {plant.regional_ecology && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Trees className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Regional Tree Census</span>
                <span className="text-sm font-mono font-bold text-white">
                  {plant.regional_ecology.estimated_trees.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  {plant.regional_ecology.canopy_cover_pct}% canopy cover
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Clean Energy Offset</span>
                <span className="text-sm font-mono font-bold text-teal-300">
                  +{(plant.regional_ecology.trees_equivalent_co2_offset).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">trees preserved/yr</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <TreePine className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Protected Forest Zone</span>
                <span className="text-sm font-mono font-bold text-white">
                  {plant.regional_ecology.protected_forest_area_km2.toLocaleString()} km²
                </span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[140px]" title={plant.regional_ecology.biome_type}>
                  {plant.regional_ecology.biome_type}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Native Forest Canopy</span>
                <span className="text-xs text-slate-200 font-medium block truncate max-w-[150px]" title={plant.regional_ecology.dominant_species.join(', ')}>
                  {plant.regional_ecology.dominant_species.slice(0, 2).join(', ')}
                </span>
                <span className="text-[10px] text-amber-400/80 block">Key local flora</span>
              </div>
            </div>
          </div>
        )}

        <InteractiveLeafletMap
          plants={[plant]}
          selectedPlantId={plant.plant_id}
          height="340px"
          showControls={true}
        />
      </div>
    </div>
  );
};
