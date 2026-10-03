import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Compass,
  Filter,
  Globe,
  Layers,
  Leaf,
  MapPin,
  Maximize2,
  Navigation,
  Sun,
  TreePine,
  Trees,
  Wind,
  Zap,
} from 'lucide-react';
import { PlantWithState } from '../services/api';
import { InteractiveLeafletMap } from './InteractiveLeafletMap';
import { opsRoomBanner, digitalTwinInfra } from '../assets/images';

interface PlantMapViewProps {
  plants: PlantWithState[];
  selectedPlantId?: string;
  onSelectPlant: (plantId: string) => void;
  onInspectPlant?: (plantId: string) => void;
}

export const PlantMapView: React.FC<PlantMapViewProps> = ({
  plants,
  selectedPlantId,
  onSelectPlant,
  onInspectPlant,
}) => {
  const [selectedPinPlant, setSelectedPinPlant] = useState<PlantWithState | null>(() => {
    return plants.find((p) => p.plant_id === selectedPlantId) || plants[0] || null;
  });
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'schematic'>('leaflet');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SOLAR' | 'WIND'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  // Synchronize with external selectedPlantId
  React.useEffect(() => {
    if (selectedPlantId) {
      const match = plants.find((p) => p.plant_id === selectedPlantId);
      if (match) setSelectedPinPlant(match);
    } else if (!selectedPinPlant && plants.length > 0) {
      setSelectedPinPlant(plants[0]);
    }
  }, [plants, selectedPlantId]);

  const regions = useMemo(() => {
    const set = new Set(plants.map((p) => p.region.split('(')[0].trim()));
    return Array.from(set);
  }, [plants]);

  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const matchType = typeFilter === 'ALL' || p.plant_type === typeFilter;
      const matchRisk = riskFilter === 'ALL' || p.latest_risk?.risk_level === riskFilter;
      const matchRegion = regionFilter === 'ALL' || p.region.includes(regionFilter);
      return matchType && matchRisk && matchRegion;
    });
  }, [plants, typeFilter, riskFilter, regionFilter]);

  // Convert lat/long to SVG 2D coordinate space (Subcontinent India Geodetic projection)
  const mapCoords = (lat: number, lon: number) => {
    const x = ((lon - 67) / (98 - 67)) * 620 + 90;
    const y = ((37 - lat) / (37 - 7)) * 360 + 45;
    return { x, y };
  };

  return (
    <div className="space-y-6">
      {/* Top Map Filter Controls */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            India Renewable Generation Fleet Geospatial Radar
          </h2>
          <p className="text-slate-400 text-xs">National grid geospatial risk clustering, satellite telemetry, and regional forest ecology across India</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Map Engine Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                mapEngine === 'leaflet' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              GIS Satellite / Tiles
            </button>
            <button
              onClick={() => setMapEngine('schematic')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                mapEngine === 'schematic' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Geodetic SVG
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs ${typeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('SOLAR')}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 ${
                typeFilter === 'SOLAR' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
            >
              <Sun className="w-3 h-3" /> Solar
            </button>
            <button
              onClick={() => setTypeFilter('WIND')}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 ${
                typeFilter === 'WIND' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              <Wind className="w-3 h-3" /> Wind
            </button>
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none text-xs"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="ELEVATED">Elevated Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none text-xs"
          >
            <option value="ALL">All Indian Regions</option>
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Layout + Plant Dossier Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Geographic Canvas / Map */}
        <div className="lg:col-span-8 space-y-4">
          {mapEngine === 'leaflet' ? (
            <InteractiveLeafletMap
              plants={filteredPlants}
              selectedPlantId={selectedPinPlant?.plant_id}
              onSelectPlant={(id) => {
                const found = plants.find((p) => p.plant_id === id);
                if (found) setSelectedPinPlant(found);
                onSelectPlant(id);
              }}
              onInspectPlant={onInspectPlant}
              height="480px"
            />
          ) : (
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">INDIA GEODETIC GRID & SCADA TELEMETRY NODES</span>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Moderate
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Elevated
                  </span>
                  <span className="flex items-center gap-1 text-orange-400">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> High
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical
                  </span>
                </div>
              </div>

              <div className="relative w-full h-[420px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
                <svg viewBox="0 0 800 450" className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="800" height="450" fill="url(#grid)" />

                  {/* India Subcontinent Silhouette for Schematic Context */}
                  <path
                    d="M 280 50 L 330 65 L 355 95 L 385 110 L 450 120 L 530 145 L 610 140 L 680 155 L 660 190 L 590 195 L 535 220 L 485 220 L 440 260 L 385 295 L 335 375 L 305 410 L 290 395 L 260 325 L 215 285 L 175 255 L 140 230 L 125 210 L 160 195 L 205 185 L 220 145 L 255 105 Z"
                    fill="#0a1324"
                    stroke="#1e3a8a"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />

                  {/* Plant Markers */}
                  {filteredPlants.map((p) => {
                    const { x, y } = mapCoords(p.latitude, p.longitude);
                    const riskLevel = p.latest_risk?.risk_level || 'LOW';
                    const color =
                      riskLevel === 'CRITICAL'
                        ? '#ef4444'
                        : riskLevel === 'HIGH'
                        ? '#f97316'
                        : riskLevel === 'ELEVATED'
                        ? '#f59e0b'
                        : riskLevel === 'MODERATE'
                        ? '#3b82f6'
                        : '#10b981';
                    const isSelected = selectedPinPlant?.plant_id === p.plant_id;

                    return (
                      <g
                        key={p.plant_id}
                        transform={`translate(${x}, ${y})`}
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedPinPlant(p);
                          onSelectPlant(p.plant_id);
                        }}
                      >
                        <circle cx="0" cy="0" r={isSelected ? 18 : 12} fill={color} fillOpacity="0.25">
                          <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="0" cy="0" r={isSelected ? 10 : 8} fill={color} stroke="#ffffff" strokeWidth={isSelected ? 2.5 : 1.5} />
                        <rect x="-24" y={isSelected ? -32 : -26} width="48" height="16" rx="3" fill="#0f172a" stroke={color} strokeWidth="1" />
                        <text x="0" y={isSelected ? -21 : -15} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                          {p.plant_id}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono">
                  Active Geolocation Nodes: <span className="text-white font-bold">{filteredPlants.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 8.D: Small Renewable Plant Icons & Facility Badges Strip */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plant Types on Map:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              {/* Solar Plant Thumbnail Badge */}
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-amber-500/30">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 font-bold">Solar Photovoltaic</span>
                <span className="text-slate-500 text-[10px]">(Bhadla, Pavagada, Kurnool)</span>
              </div>

              {/* Wind Farm Thumbnail Badge */}
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-300 font-bold">Wind Farm</span>
                <span className="text-slate-500 text-[10px]">(Muppandal, Jaisalmer)</span>
              </div>

              {/* Hybrid Plant Thumbnail Badge */}
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Solar-Wind Hybrid</span>
                <span className="text-slate-500 text-[10px]">(Khavda)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Plant Dossier & Quick Inspector */}
        <div className="lg:col-span-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          {selectedPinPlant ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedPinPlant.plant_type === 'SOLAR'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {selectedPinPlant.plant_type === 'SOLAR' ? <Sun className="w-3 h-3" /> : <Wind className="w-3 h-3" />}
                    {selectedPinPlant.plant_type} FACILITY
                  </span>

                  {selectedPinPlant.latest_risk && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        selectedPinPlant.latest_risk.risk_level === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : selectedPinPlant.latest_risk.risk_level === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : selectedPinPlant.latest_risk.risk_level === 'ELEVATED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : selectedPinPlant.latest_risk.risk_level === 'MODERATE'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      RISK: {selectedPinPlant.latest_risk.risk_score} / 100
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mt-2">{selectedPinPlant.plant_name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedPinPlant.region} ({selectedPinPlant.latitude.toFixed(3)}°, {selectedPinPlant.longitude.toFixed(3)}°)
                </p>
              </div>

              {/* Site Real Photograph Thumbnail */}
              <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <img
                  key={selectedPinPlant.plant_id}
                  src={selectedPinPlant.imageUrl || `/site-images/${selectedPinPlant.plant_id}.jpg`}
                  alt={`${selectedPinPlant.plant_name} (${selectedPinPlant.plant_id})`}
                  className="w-full h-full object-cover object-center brightness-90 contrast-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                  {selectedPinPlant.plant_id} SCADA TELEMETRY
                </span>
              </div>

              {/* Telemetry Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Nameplate Capacity</span>
                  <div className="font-mono font-bold text-slate-200 mt-0.5">{selectedPinPlant.capacity_mw} MW</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Current Generation</span>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">
                    {selectedPinPlant.latest_reading?.power_generated ?? 0} MW
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Equipment Units</span>
                  <div className="font-mono font-bold text-slate-200 mt-0.5">{selectedPinPlant.equipment_count} Sub-units</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Commission Date</span>
                  <div className="font-mono font-bold text-slate-200 mt-0.5">{selectedPinPlant.installation_date}</div>
                </div>
              </div>

              {/* Regional Tree Census & Biomass Information */}
              {selectedPinPlant.regional_ecology && (
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5 text-[11px]">
                      <Trees className="w-3.5 h-3.5 text-emerald-400" />
                      Regional Tree Census
                    </span>
                    <span className="bg-emerald-900/80 text-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded-md border border-emerald-500/40">
                      {selectedPinPlant.regional_ecology.canopy_cover_pct}% Canopy
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Estimated Trees</span>
                      <div className="font-mono font-bold text-white text-xs">
                        {(selectedPinPlant.regional_ecology.estimated_trees ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Clean Energy Offset</span>
                      <div className="font-mono font-bold text-emerald-400 text-xs">
                        +{((selectedPinPlant.regional_ecology.trees_equivalent_co2_offset ?? 0)).toLocaleString()} trees/yr
                      </div>
                    </div>
                  </div>

                  {/* Canopy coverage progress visual bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Forest Canopy Density</span>
                      <span className="text-emerald-300 font-mono">{selectedPinPlant.regional_ecology.canopy_cover_pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, selectedPinPlant.regional_ecology.canopy_cover_pct * 2.5)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-300 pt-1 border-t border-emerald-900/60">
                    <span className="text-emerald-400 font-semibold">Key Native Species: </span>
                    {selectedPinPlant.regional_ecology.dominant_species.join(', ')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-semibold">Protected Habitat: </span>
                    {selectedPinPlant.regional_ecology.protected_forest_area_km2} km² ({selectedPinPlant.regional_ecology.biome_type})
                  </div>
                </div>
              )}

              {/* Reasons if elevated risk */}
              {selectedPinPlant.latest_risk && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 font-semibold block mb-1">Risk Assessment & Diagnostics:</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {selectedPinPlant.latest_risk.reasons[0] || 'Nominal operational behavior recorded.'}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  if (onInspectPlant) onInspectPlant(selectedPinPlant.plant_id);
                  else onSelectPlant(selectedPinPlant.plant_id);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Launch Full Plant Analytics Studio
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Click a plant marker on the map to inspect telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
