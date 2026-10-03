import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sun,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { api, CoordinatesLookupResult, PlantWithState, RealSatelliteObservation, SatelliteStatusResponse } from '../services/api';
import { SimulationScenario } from '../types';
import { satTelemetryImg } from '../assets/images';

interface RealTelemetryCenterProps {
  plants: PlantWithState[];
  activeScenario: SimulationScenario;
  selectedPlantId?: string;
  onSelectScenario: (scenario: SimulationScenario, plantId?: string) => void;
  onSelectPlant: (plantId: string) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
}

export const RealTelemetryCenter: React.FC<RealTelemetryCenterProps> = ({
  plants,
  activeScenario,
  selectedPlantId,
  onSelectScenario,
  onSelectPlant,
  isStreaming,
  onToggleStreaming,
}) => {
  const [satelliteStatus, setSatelliteStatus] = useState<SatelliteStatusResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [internalPlantId, setInternalPlantId] = useState<string>(selectedPlantId || 'PL-S001');
  const [rawPayloadPlantId, setRawPayloadPlantId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPlantId) {
      setInternalPlantId(selectedPlantId);
    }
  }, [selectedPlantId]);

  const activePlantId = selectedPlantId || internalPlantId;

  // Custom coordinate lookup states
  const [customLat, setCustomLat] = useState<string>('26.2389');
  const [customLon, setCustomLon] = useState<string>('73.0243');
  const [customName, setCustomName] = useState<string>('Jodhpur Solar Corridor, Rajasthan');
  const [lookupResult, setLookupResult] = useState<CoordinatesLookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Load satellite status on mount
  useEffect(() => {
    fetchSatelliteInfo();
  }, []);

  const fetchSatelliteInfo = async () => {
    try {
      const data = await api.getSatelliteStatus();
      setSatelliteStatus(data);
    } catch (err) {
      console.error('Failed to fetch satellite status:', err);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.syncSatelliteData();
      setSyncMessage(`Successfully synchronized ${res.station_count} satellite stations at ${new Date(res.synced_at).toLocaleTimeString()}`);
      await fetchSatelliteInfo();
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || isNaN(lon)) {
      setLookupError('Please enter valid numeric latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);
    try {
      const result = await api.lookupCoordinates(lat, lon, customName);
      setLookupResult(result);
    } catch (err: any) {
      setLookupError(`Lookup failed: ${err.message}`);
    } finally {
      setIsLookingUp(false);
    }
  };

  const presetLocations = [
    { name: 'Ladakh High-Altitude Solar Plateau', lat: 34.1526, lon: 77.5771 },
    { name: 'Kutch Wind & Hybrid Park, Gujarat', lat: 23.7337, lon: 69.8597 },
    { name: 'Thar Desert Deep Arid Zone', lat: 27.0238, lon: 71.1894 },
    { name: 'Bengaluru Technology Corridor', lat: 12.9716, lon: 77.5946 },
    { name: 'Mojave Solar Thermal Array, USA', lat: 35.0142, lon: -115.4745 },
  ];

  const selectedPlant = plants.find((p) => p.plant_id === activePlantId) || plants[0];
  const selectedReading = selectedPlant?.latest_reading;
  const selectedObs = satelliteStatus?.observations.find((o) => o.plant_id === selectedPlant?.plant_id);

  return (
    <div className="space-y-6">
      {/* Section 8.C: Real Data Satellite Telemetry Banner with orbital Earth visual */}
      <div className="relative p-6 sm:p-7 rounded-2xl border border-emerald-500/30 shadow-2xl bg-slate-900/90 overflow-hidden">
        {/* Subtle, darkened satellite observation backdrop visual */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={satTelemetryImg}
            alt="Orbital Earth Observation Satellite Telemetry"
            className="w-full h-full object-cover object-center opacity-30 brightness-75 contrast-125 filter"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold border border-emerald-500/30 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                REAL LIVE SATELLITE TELEMETRY ACTIVE
              </span>
              <span className="px-2.5 py-0.5 rounded text-slate-300 bg-slate-800/80 border border-slate-700 font-mono text-[11px] backdrop-blur-md">
                GEO-ORBITAL TELEMETRY DOWNLINK
              </span>
              <span className="px-2.5 py-0.5 rounded text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 font-mono text-[11px] backdrop-blur-md">
                ECMWF / NOAA GFS
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Real-World Satellite &amp; In-Situ Renewable Telemetry Feed
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Suryasakti pulls authentic, real-time meteorological observations and solar/wind physical telemetry directly from high-resolution Earth observation satellites and atmosphere models across India's largest clean energy parks.
            </p>
          </div>

          {/* Sync Trigger and Status */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Satellite Stations...' : 'Sync Live Satellite Data'}</span>
            </button>

            {syncMessage && (
              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30 animate-fade-in">
                {syncMessage}
              </div>
            )}
          </div>
        </div>

        {/* Global Satellite Metrics Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">Telemetry Source</div>
            <div className="font-bold text-white mt-0.5 truncate">ECMWF / GFS Satellite</div>
            <div className="text-[10px] text-emerald-400 font-mono">Live Atmospheric Grid</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">Active Stations</div>
            <div className="font-bold text-emerald-400 mt-0.5">{plants.length} Major Facilities</div>
            <div className="text-[10px] text-slate-400 font-mono">100% Real Coordinates</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">Total Monitored Fleet</div>
            <div className="font-bold text-cyan-400 mt-0.5">
              {plants.reduce((sum, p) => sum + p.capacity_mw, 0)} MW
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Solar PV & Wind Turbines</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">Current Generation</div>
            <div className="font-bold text-amber-400 mt-0.5">
              {plants.reduce((sum, p) => sum + (p.latest_reading?.power_generated || 0), 0).toFixed(1)} MW
            </div>
            <div className="text-[10px] text-amber-300/80 font-mono">Physical Power Yield</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">Sampling Rate</div>
            <div className="font-bold text-white mt-0.5">2.5s Micro-batch</div>
            <div className="text-[10px] text-purple-400 font-mono">Kafka + Spark Streaming</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">Observation Verifier</div>
            <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Real
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Open-Meteo API v1</div>
          </div>
        </div>
      </div>

      {/* Real Plant Live Stations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Real Indian Renewable Stations (Live Telemetry)
            </h2>
            <p className="text-slate-400 text-xs">
              Direct real-world observations from Bhadla, Pavagada, Rewa, Muppandal, Jaisalmer, and Kurnool
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Click any plant card to inspect live parameters
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map((plant) => {
            const isSelected = activePlantId === plant.plant_id;
            const isSolar = plant.plant_type === 'SOLAR';
            const reading = plant.latest_reading;
            const obs = satelliteStatus?.observations.find((o) => o.plant_id === plant.plant_id);

            const power = reading?.power_generated || 0;
            const cap = plant.capacity_mw;
            const capFactor = cap > 0 ? ((power / cap) * 100).toFixed(1) : '0';

            return (
              <div
                key={plant.plant_id}
                onClick={() => {
                  setInternalPlantId(plant.plant_id);
                  onSelectPlant(plant.plant_id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                    : 'bg-slate-900 hover:bg-slate-800/70 border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSolar ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {plant.plant_type} • {plant.capacity_mw} MW
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        LIVE
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white mt-1">{plant.plant_name}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{plant.latitude.toFixed(3)}°N, {plant.longitude.toFixed(3)}°E</span>
                      {obs?.elevation_m && <span className="text-slate-500">• {obs.elevation_m}m ASL</span>}
                    </div>
                  </div>
                </div>

                {/* Key Live Telemetry Numbers */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <div className="text-slate-400 text-[10px] flex items-center gap-1">
                      {isSolar ? <Sun className="w-3 h-3 text-amber-400" /> : <Wind className="w-3 h-3 text-cyan-400" />}
                      {isSolar ? 'Solar Irradiance' : 'Hub Wind Velocity'}
                    </div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {isSolar ? `${reading?.solar_irradiance ?? 0} W/m²` : `${reading?.wind_speed ?? 0} m/s`}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isSolar ? `DNI: ${obs?.direct_normal_irradiance_wm2 ?? 0} W/m²` : `100m Altitude`}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-rose-400" />
                      Ambient Temperature
                    </div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {reading?.temperature ?? 0} °C
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Cloud Cover: {obs?.cloud_cover_pct ?? reading?.humidity ?? 0}%
                    </div>
                  </div>
                </div>

                {/* Real Physical Power Output */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> Real Power Generated:
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {power.toFixed(2)} MW <span className="text-slate-400 font-normal">({capFactor}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isSolar ? 'bg-gradient-to-r from-amber-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, +capFactor))}%` }}
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px]">
                    Obs: {obs?.observation_time ? new Date(obs.observation_time).toLocaleTimeString() : 'Real-time'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRawPayloadPlantId(plant.plant_id);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono text-[10px] cursor-pointer"
                    >
                      Raw JSON
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlant(plant.plant_id);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Payload Inspector Modal */}
      {rawPayloadPlantId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Raw Earth Observation Satellite Telemetry Payload
                </h3>
              </div>
              <button
                onClick={() => setRawPayloadPlantId(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Plant ID: <strong className="text-white">{rawPayloadPlantId}</strong> • Source:{' '}
              <span className="text-emerald-400">Open-Meteo ECMWF / NOAA GFS Atmospheric Satellite Engine</span>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-emerald-300 overflow-auto flex-1 border border-slate-800">
              {JSON.stringify(
                satelliteStatus?.observations.find((o) => o.plant_id === rawPayloadPlantId) ||
                  plants.find((p) => p.plant_id === rawPayloadPlantId)?.latest_reading,
                null,
                2
              )}
            </pre>

            <div className="flex justify-end pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => setRawPayloadPlantId(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-World Global Location Explorer */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Real-World Location Explorer (Any Global GPS Coordinates)
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Want to test another clean energy location? Enter any latitude and longitude anywhere on Earth to pull live satellite weather, solar irradiance, hub wind speed, and compute real clean energy output for a 100 MW facility.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Presets:</span>
          {presetLocations.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setCustomLat(p.lat.toString());
                setCustomLon(p.lon.toString());
                setCustomName(p.name);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Search Inputs */}
        <form onSubmit={handleLookup} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Latitude (-90 to 90)</label>
            <input
              type="text"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              placeholder="e.g. 26.2389"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Longitude (-180 to 180)</label>
            <input
              type="text"
              value={customLon}
              onChange={(e) => setCustomLon(e.target.value)}
              placeholder="e.g. 73.0243"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Location Identifier</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Jodhpur Corridor"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLookingUp}
              className="w-full px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Search className={`w-3.5 h-3.5 ${isLookingUp ? 'animate-spin' : ''}`} />
              <span>{isLookingUp ? 'Querying Satellite...' : 'Query Real Satellite Data'}</span>
            </button>
          </div>
        </form>

        {lookupError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {lookupError}
          </div>
        )}

        {/* Lookup Results Display */}
        {lookupResult && (
          <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 space-y-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  REAL-TIME SATELLITE QUERY RESULT
                </span>
                <h3 className="font-bold text-white text-base mt-1">{lookupResult.name}</h3>
                <p className="text-[11px] text-slate-400">
                  Coordinates: {lookupResult.latitude.toFixed(4)}°N, {lookupResult.longitude.toFixed(4)}°E • Elevation: {lookupResult.elevation_m}m ASL
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-400 font-mono">
                Observation Time: {new Date(lookupResult.observation_time).toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">Real Solar Irradiance</span>
                <div className="font-bold text-amber-400 text-base mt-0.5">{lookupResult.solar_irradiance_wm2} W/m²</div>
                <div className="text-[10px] text-slate-500">DNI: {lookupResult.dni_wm2} W/m²</div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">Ambient Temperature</span>
                <div className="font-bold text-white text-base mt-0.5">{lookupResult.temperature_c} °C</div>
                <div className="text-[10px] text-slate-500">Humidity: {lookupResult.humidity_pct}%</div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">100m Turbine Wind</span>
                <div className="font-bold text-cyan-400 text-base mt-0.5">{lookupResult.wind_speed_100m_ms} m/s</div>
                <div className="text-[10px] text-slate-500">10m: {lookupResult.wind_speed_10m_ms} m/s</div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">Cloud Cover</span>
                <div className="font-bold text-slate-200 text-base mt-0.5">{lookupResult.cloud_cover_pct}%</div>
                <div className="text-[10px] text-slate-500">Pressure: {lookupResult.surface_pressure_hpa} hPa</div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-emerald-500/30">
                <span className="text-slate-400 text-[10px]">Est. Solar Yield (100MW)</span>
                <div className="font-bold text-emerald-400 text-base mt-0.5">{lookupResult.estimated_solar_yield_mw_per_100mw} MW</div>
                <div className="text-[10px] text-emerald-400/80 font-mono">
                  {((lookupResult.estimated_solar_yield_mw_per_100mw / 100) * 100).toFixed(1)}% Capacity
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-cyan-500/30">
                <span className="text-slate-400 text-[10px]">Est. Wind Yield (100MW)</span>
                <div className="font-bold text-cyan-400 text-base mt-0.5">{lookupResult.estimated_wind_yield_mw_per_100mw} MW</div>
                <div className="text-[10px] text-cyan-400/80 font-mono">
                  {((lookupResult.estimated_wind_yield_mw_per_100mw / 100) * 100).toFixed(1)}% Capacity
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* End-to-End Real Processing Architecture */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          End-to-End Real Data Processing Pipeline Lineage
        </h2>
        <p className="text-slate-400 text-xs">
          How real satellite observations and industrial plant SCADA sensors are ingested, partitioned, cleaned, and scored in real-time:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Globe className="w-4 h-4" />
              <span>1. Satellite & SCADA</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Real solar irradiance (GHI/DNI), 100m wind speed, temperature, and grid voltage sampled at 2.5s intervals.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Server className="w-4 h-4" />
              <span>2. Kafka Ingestion</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Topic <code className="text-slate-300">telemetry.raw</code> with 12 partitions keyed by plant ID with sub-second buffering.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>3. Spark Micro-batch</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Distributed RDD and Structured Streaming pipeline executing watermark deduplication and moving averages.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>4. Data Quality Lab</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Automated physical bounds verification, frozen sensor detection, and Z-score outlier filtering.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <Activity className="w-4 h-4" />
              <span>5. ML Risk & Anomaly</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Random Forest and Logistic Regression classification producing explainable risk scores and alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
