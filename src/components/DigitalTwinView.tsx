import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Compass,
  Cpu,
  Droplets,
  Eye,
  Flame,
  ImageIcon,
  Layers,
  MapPin,
  Maximize2,
  RefreshCw,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { PlantWithState } from '../services/api';
import { digitalTwinInfra } from '../assets/images';
import { DigitalTwin3DCanvas } from './DigitalTwin3DCanvas';

interface DigitalTwinViewProps {
  plants: PlantWithState[];
  selectedPlantId?: string;
  onSelectPlant: (id: string) => void;
  onInspectPlant?: (id: string) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  plants,
  selectedPlantId,
  onSelectPlant,
  onInspectPlant,
}) => {
  const [displayMode, setDisplayMode] = useState<'3D_MODEL' | 'INFRA_PHOTO'>('3D_MODEL');
  const activeId = selectedPlantId || plants[0]?.plant_id || 'PL-S001';
  const plant = plants.find((p) => p.plant_id === activeId) || plants[0];
  const reading = plant?.latest_reading;
  const risk = plant?.latest_risk;

  const isSolar = plant?.plant_type === 'SOLAR';

  // Wind rotor rotation duration based on actual wind speed (faster when wind speed is higher)
  const windRpmDuration = reading ? Math.max(1.2, 28 / Math.max(2, reading.wind_speed)) : 3;

  return (
    <div className="space-y-6">
      {/* Top Header & Plant Switcher */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SCADA DIGITAL TWIN
            </span>
            <span className="text-xs text-slate-400">Physics-Informed Real-Time Asset Simulation</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            {plant?.plant_name} <span className="text-slate-400 font-mono">({plant?.plant_id})</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {plant?.region} • {plant?.capacity_mw} MW Nameplate Capacity • Installed {plant?.installation_date}
          </p>
        </div>

        {/* Plant Switcher Tabs & Inspect Button */}
        <div className="flex flex-wrap items-center gap-2">
          {onInspectPlant && (
            <button
              type="button"
              onClick={() => onInspectPlant(plant?.plant_id || activeId)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950/40"
              title={`Open deep telemetry studio for ${plant?.plant_name}`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inspect Studio</span>
            </button>
          )}

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {plants.map((p) => (
              <button
                key={p.plant_id}
                onClick={() => onSelectPlant(p.plant_id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  p.plant_id === plant?.plant_id
                    ? 'bg-emerald-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {p.plant_type === 'SOLAR' ? <Sun className="w-3 h-3 text-amber-400" /> : <Wind className="w-3 h-3 text-cyan-400" />}
                <span>{p.plant_id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode Toggle: Interactive 3D Digital Twin vs Photo CAD Infographic */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Visualization Engine:
          </span>
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDisplayMode('3D_MODEL')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                displayMode === '3D_MODEL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive 3D Simulation</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('INFRA_PHOTO')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                displayMode === 'INFRA_PHOTO'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Substation Infra Photo</span>
            </button>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Asset ID: <strong className="text-emerald-400">{plant?.plant_id}</strong> • Status: <strong className="text-slate-300">{plant?.operating_status}</strong>
        </span>
      </div>

      {/* Main Digital Twin Showcase: Interactive 3D Model or Photo View */}
      {displayMode === '3D_MODEL' ? (
        <DigitalTwin3DCanvas plant={plant} />
      ) : (
        /* Section 8.B: Digital Twin of Renewable Energy Plant - 3D Technical Visualization */
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-xl group">
          <div className="relative h-64 sm:h-72 w-full overflow-hidden">
            <img
              src={digitalTwinInfra}
              alt="Digital Twin of Renewable Energy Plant Infrastructure"
              className="w-full h-full object-cover object-center brightness-90 contrast-110 group-hover:scale-102 transition-transform duration-700"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />

            {/* Overlay Badge & Telemetry Hotspots */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/90 border border-emerald-500/40 text-emerald-300 backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                DIGITAL TWIN OF RENEWABLE ENERGY PLANT
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-900/80 border border-slate-700/80 text-slate-300 backdrop-blur-md">
                High-Fidelity CAD &amp; Thermal Mesh Synchronized
              </span>
            </div>

            {/* Interactive Sub-System Tags Overlaid */}
            <div className="absolute bottom-4 inset-x-4 z-10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-500/30 text-amber-300 backdrop-blur-md">
                  Solar PV Arrays: 4 Strings Active
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-500/30 text-cyan-300 backdrop-blur-md">
                  Wind Turbines: Aerodynamic Pitch Synchronized
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-emerald-500/30 text-emerald-300 backdrop-blur-md">
                  Inverters &amp; Substation: 33kV / 400kV Grid Interconnect
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-purple-500/30 text-purple-300 backdrop-blur-md">
                  BESS Battery Storage: 94% SoH
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400 hidden lg:block">
                Latency: <span className="text-emerald-400 font-bold">&lt;14ms</span> (SCADA Modbus TCP)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Digital Twin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Physical Digital Twin 3D/2D Rendering */}
        <div className="lg:col-span-7 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {isSolar ? 'Photovoltaic Array & Central Inverter Model' : 'Aerodynamic Nacelle & 3-Blade Rotor Model'}
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Live State: {plant?.operating_status}
            </span>
          </div>

          {/* SVG Canvas Area */}
          <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden p-4">
            {isSolar ? (
              /* SOLAR PV DIGITAL TWIN */
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Sun and Sky Ray Simulation */}
                <div className="absolute top-3 right-6 flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                  <Sun className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '40s' }} />
                  <span className="text-[11px] font-mono font-bold text-amber-300">
                    {reading?.solar_irradiance ?? 850} W/m²
                  </span>
                </div>

                {/* SVG Solar Field Diagram */}
                <svg viewBox="0 0 500 240" className="w-full h-full max-h-64">
                  {/* Grid Lines */}
                  <line x1="20" y1="200" x2="480" y2="200" stroke="#334155" strokeWidth="2" />

                  {/* PV Strings: 4 Rows of Tilted Arrays */}
                  {[0, 1, 2, 3].map((row) => (
                    <g key={row} transform={`translate(${40 + row * 110}, 60)`}>
                      {/* Mount Structure */}
                      <line x1="45" y1="50" x2="45" y2="135" stroke="#475569" strokeWidth="4" />
                      <line x1="15" y1="135" x2="75" y2="135" stroke="#334155" strokeWidth="3" />

                      {/* PV Tilted Surface */}
                      <polygon
                        points="5,70 85,35 85,95 5,130"
                        fill={
                          reading && reading.panel_temperature > 75
                            ? '#7f1d1d'
                            : reading && reading.panel_temperature > 60
                            ? '#854d0e'
                            : '#0f3a5d'
                        }
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                      />

                      {/* Cells Texture */}
                      <line x1="25" y1="62" x2="25" y2="122" stroke="#1e293b" strokeWidth="1" />
                      <line x1="45" y1="53" x2="45" y2="113" stroke="#1e293b" strokeWidth="1" />
                      <line x1="65" y1="44" x2="65" y2="104" stroke="#1e293b" strokeWidth="1" />

                      {/* String Label */}
                      <text x="45" y="152" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        STR-0{row + 1}
                      </text>
                      <text x="45" y="165" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        {reading ? +(reading.power_generated / 4).toFixed(1) : 12} MW
                      </text>
                    </g>
                  ))}

                  {/* Central Inverter Skid */}
                  <g transform="translate(380, 120)">
                    <rect x="0" y="0" width="80" height="75" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                    <text x="40" y="25" fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="bold">
                      INVERTER
                    </text>
                    <text x="40" y="42" fill="#e2e8f0" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {reading?.voltage ?? 1500} V DC
                    </text>
                    <text x="40" y="58" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {reading?.current ?? 850} A
                    </text>
                  </g>

                  {/* Conduit Bus */}
                  <path d="M 120 180 L 380 180" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
                </svg>

                <div className="absolute bottom-2 left-4 text-[11px] text-slate-400 font-mono">
                  Panel Surface Temp: <span className="text-amber-300 font-bold">{reading?.panel_temperature ?? 42}°C</span>
                </div>
              </div>
            ) : (
              /* WIND TURBINE DIGITAL TWIN */
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Wind Vectors */}
                <div className="absolute top-3 left-6 flex items-center gap-2 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20">
                  <Wind className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-cyan-300">
                    {reading?.wind_speed ?? 11.2} m/s ({reading?.wind_direction ?? 215}°)
                  </span>
                </div>

                {/* SVG Wind Turbine */}
                <svg viewBox="0 0 500 240" className="w-full h-full max-h-64">
                  {/* Ground Foundation */}
                  <rect x="190" y="210" width="120" height="15" rx="3" fill="#334155" />

                  {/* Tubular Tower */}
                  <polygon points="238,70 262,70 270,210 230,210" fill="#475569" stroke="#64748b" strokeWidth="1.5" />

                  {/* Nacelle Box */}
                  <rect x="225" y="55" width="60" height="25" rx="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                  <text x="255" y="71" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    GEARBOX
                  </text>

                  {/* Rotating 3-Blade Rotor Hub */}
                  <g transform="translate(225, 67)">
                    <g
                      style={{
                        transformOrigin: '0 0',
                        animation: `spin ${windRpmDuration}s linear infinite`,
                      }}
                    >
                      {/* Hub Core */}
                      <circle cx="0" cy="0" r="8" fill="#e2e8f0" stroke="#0284c7" strokeWidth="2" />

                      {/* Blade 1 (0 deg) */}
                      <path d="M 0 -8 C 6 -40, 5 -75, 0 -95 C -5 -75, -6 -40, 0 -8 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />

                      {/* Blade 2 (120 deg) */}
                      <g transform="rotate(120)">
                        <path d="M 0 -8 C 6 -40, 5 -75, 0 -95 C -5 -75, -6 -40, 0 -8 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                      </g>

                      {/* Blade 3 (240 deg) */}
                      <g transform="rotate(240)">
                        <path d="M 0 -8 C 6 -40, 5 -75, 0 -95 C -5 -75, -6 -40, 0 -8 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                      </g>
                    </g>
                  </g>
                </svg>

                <div className="absolute bottom-2 right-4 text-[11px] text-slate-400 font-mono">
                  Bearing Vibration: <span className="text-cyan-300 font-bold">{reading?.vibration ?? 1.8} mm/s RMS</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>SCADA Sampling Rate: 2.5s Micro-batch</span>
            <span className="font-mono text-emerald-400">Modbus/TCP & OPC-UA Protocol Emulation</span>
          </div>
        </div>

        {/* Right 5 Columns: Live Telemetry Gauges & Health Diagnostics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Key Metrics Grid */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Power & Conversion Efficiency
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Active Power</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  {reading?.power_generated ?? 0} <span className="text-xs text-slate-500">MW</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Rated: {plant?.capacity_mw} MW
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Expected Yield</div>
                <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                  {reading?.expected_power ?? 0} <span className="text-xs text-slate-500">MW</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Theoretical Physics
                </div>
              </div>
            </div>

            {/* Performance Ratio Progress */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Performance Ratio (PR)</span>
                <span className="font-bold font-mono text-cyan-400">
                  {reading && reading.expected_power > 0
                    ? +((reading.power_generated / reading.expected_power) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      reading && reading.expected_power > 0
                        ? (reading.power_generated / reading.expected_power) * 100
                        : 0
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Thermal & Mechanical Telemetry */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              Thermal & Vibration Stress Indicators
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Core Temp</div>
                <div
                  className={`text-lg font-bold font-mono mt-0.5 ${
                    (reading?.equipment_temperature || 0) > 70 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {reading?.equipment_temperature ?? 45}°C
                </div>
                <div className="text-[10px] text-slate-500">Trip Limit: 85°C</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Vibration Amplitude</div>
                <div
                  className={`text-lg font-bold font-mono mt-0.5 ${
                    (reading?.vibration || 0) > 4.5 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {reading?.vibration ?? 0.8} <span className="text-xs text-slate-500">mm/s</span>
                </div>
                <div className="text-[10px] text-slate-500">ISO 10816 Standard</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Ambient</div>
                <div className="font-mono font-bold text-slate-300">{reading?.temperature ?? 28}°C</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Humidity</div>
                <div className="font-mono font-bold text-slate-300">{reading?.humidity ?? 45}%</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Pressure</div>
                <div className="font-mono font-bold text-slate-300">{reading?.pressure ?? 1013} hPa</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
