import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertCircle,
  Compass,
  Layers,
  Leaf,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  RefreshCw,
  Sun,
  TreeDeciduous,
  TreePine,
  Trees,
  Wind,
  Zap,
} from 'lucide-react';
import { PlantWithState } from '../services/api';

// Fix Leaflet's default icon URLs for Vite/bundlers
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
} catch {
  // Ignore in non-browser environments
}

interface InteractiveLeafletMapProps {
  plants: PlantWithState[];
  selectedPlantId?: string;
  onSelectPlant?: (plantId: string) => void;
  onInspectPlant?: (plantId: string) => void;
  height?: string;
  showControls?: boolean;
}

export const InteractiveLeafletMap: React.FC<InteractiveLeafletMapProps> = ({
  plants,
  selectedPlantId,
  onSelectPlant,
  onInspectPlant,
  height = '520px',
  showControls = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const circlesRef = useRef<Map<string, L.Circle>>(new Map());
  const treeCirclesRef = useRef<Map<string, L.Circle>>(new Map());
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapEngine, setMapEngine] = useState<'leaflet' | 'vector'>('leaflet');
  const [activeLayer, setActiveLayer] = useState<'dark' | 'satellite' | 'street' | 'voyager'>('dark');
  const [showRadiusCircles, setShowRadiusCircles] = useState<boolean>(true);
  const [showTreeCover, setShowTreeCover] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tileError, setTileError] = useState<boolean>(false);
  const [hoveredPlant, setHoveredPlant] = useState<PlantWithState | null>(null);

  // Helper for formatting tree counts safely
  const formatTreeCount = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M trees`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K trees`;
    return `${num.toLocaleString()} trees`;
  };

  // Aggregated fleet regional tree metrics
  const totalFleetTrees = useMemo(() => {
    return plants.reduce((acc, p) => acc + (p.regional_ecology?.estimated_trees || 0), 0);
  }, [plants]);

  const totalTreesOffset = useMemo(() => {
    return plants.reduce((acc, p) => acc + (p.regional_ecology?.trees_equivalent_co2_offset || 0), 0);
  }, [plants]);

  const avgCanopy = useMemo(() => {
    if (plants.length === 0) return '0.0';
    return (plants.reduce((acc, p) => acc + (p.regional_ecology?.canopy_cover_pct || 0), 0) / plants.length).toFixed(1);
  }, [plants]);

  // Tile provider configurations (100% Free Public GIS Providers - No API Key Required)
  const tileProviders = {
    dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      subdomains: 'abc',
      maxZoom: 16,
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Earthstar Geographics',
      subdomains: 'abc',
      maxZoom: 18,
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: 'abc',
      maxZoom: 19,
    },
    voyager: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ',
      subdomains: 'abc',
      maxZoom: 19,
    },
  };

  // Helper for risk-based color
  const getRiskColor = (riskScore: number = 0) => {
    if (riskScore >= 80) return '#f43f5e'; // rose-500
    if (riskScore >= 60) return '#f97316'; // orange-500
    if (riskScore >= 40) return '#f59e0b'; // amber-500
    if (riskScore >= 20) return '#3b82f6'; // blue-500
    return '#10b981'; // emerald-500
  };

  // Create custom pulsing Leaflet DivIcon
  const createPlantDivIcon = (plant: PlantWithState, isSelected: boolean, displayTreeBadge: boolean) => {
    const riskScore = plant.latest_risk?.risk_score ?? 15;
    const color = getRiskColor(riskScore);
    const isSolar = plant.plant_type === 'SOLAR';
    const isCritical = riskScore >= 70;
    const treeCount = plant.regional_ecology?.estimated_trees;
    const treeText = treeCount ? `${(treeCount / 1_000_000).toFixed(1)}M` : '';

    const iconHtml = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${
          displayTreeBadge && treeCount
            ? `<div style="
                position: absolute;
                top: -16px;
                left: 50%;
                transform: translateX(-50%);
                background: #064e3b;
                border: 1px solid #10b981;
                color: #6ee7b7;
                font-size: 9px;
                font-weight: 700;
                font-family: monospace;
                white-space: nowrap;
                padding: 1px 5px;
                border-radius: 9999px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.6);
                display: flex;
                align-items: center;
                gap: 2px;
                z-index: 10;
              ">
                🌲 ${treeText}
              </div>`
            : ''
        }
        ${
          isCritical
            ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: ${color}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: #090d16;
          border: 2px solid ${color};
          box-shadow: 0 0 ${isSelected ? '14px' : '8px'} ${color}88, 0 4px 6px -1px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color};
          font-weight: bold;
          font-size: 13px;
          transition: transform 0.2s ease;
          ${isSelected ? 'transform: scale(1.2); border-width: 3px;' : ''}
        ">
          ${
            isSolar
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`
          }
        </div>
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          padding: 1px 4px;
          border-radius: 4px;
          background: ${color};
          color: #020617;
          font-family: monospace;
          font-weight: 800;
          font-size: 9px;
          line-height: 1;
        ">
          ${riskScore}
        </div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-plant-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24],
    });
  };

  // Convert lat/long to SVG 2D coordinate space for Indian subcontinent
  const mapCoords = (lat: number, lon: number, width = 800, height = 450) => {
    // India subcontinent bounding box: approx Lon 68 to 97.5, Lat 8 to 36
    const x = ((lon - 68) / (97.5 - 68)) * (width * 0.74) + (width * 0.13);
    const y = ((36 - lat) / (36 - 8)) * (height * 0.78) + (height * 0.11);
    return { x, y };
  };

  // Initialize and manage Leaflet Map safely (handling React StrictMode & unmounts)
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;

    const container = mapContainerRef.current;
    if (!container) return;

    // Safety: if container was previously stamped with _leaflet_id by an orphaned instance
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    // Clean up any stale map instance before creating a new one
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('Map cleanup notice:', err);
      }
      mapInstanceRef.current = null;
    }

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [21.5, 78.9], // Centered directly over India
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
        tapHold: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
      });

      // Add zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution control in bottom right
      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      // Default tile layer
      const config = tileProviders[activeLayer] || tileProviders.dark;
      const tileLayer = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: config.maxZoom,
        subdomains: config.subdomains || 'abc',
      });

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Failed to initialize Leaflet map, switching to vector radar:', err);
      setMapEngine('vector');
      return;
    }

    // Handle container resize & layout settling
    const t1 = setTimeout(() => {
      map?.invalidateSize();
    }, 150);

    const t2 = setTimeout(() => {
      map?.invalidateSize();
      if (plants.length > 0) {
        try {
          const bounds = L.latLngBounds(plants.map((p) => [p.latitude, p.longitude]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
        } catch {
          // ignore
        }
      }
    }, 400);

    const handleWindowResize = () => {
      map?.invalidateSize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleWindowResize);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      markersRef.current.clear();
      circlesRef.current.clear();
      treeCirclesRef.current.clear();
    };
  }, [mapEngine]);

  // Switch Tile Layer when activeLayer changes
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch {
        // ignore
      }
    }

    const config = tileProviders[activeLayer] || tileProviders.dark;
    const newTile = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || 'abc',
    });

    newTile.on('tileerror', () => {
      setTileError(true);
    });

    newTile.addTo(map);
    tileLayerRef.current = newTile;
  }, [activeLayer, mapEngine]);

  // Update Markers, Capacity Circles & Regional Forest Canopy Zones
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentPlantIds = new Set(plants.map((p) => p.plant_id));

    // 1. Remove markers/circles for plants that were filtered out
    markersRef.current.forEach((marker, id) => {
      if (!currentPlantIds.has(id)) {
        try {
          map.removeLayer(marker);
        } catch {}
        markersRef.current.delete(id);
      }
    });

    circlesRef.current.forEach((circle, id) => {
      if (!currentPlantIds.has(id)) {
        try {
          map.removeLayer(circle);
        } catch {}
        circlesRef.current.delete(id);
      }
    });

    treeCirclesRef.current.forEach((circle, id) => {
      if (!currentPlantIds.has(id)) {
        try {
          map.removeLayer(circle);
        } catch {}
        treeCirclesRef.current.delete(id);
      }
    });

    // 2. Add or update current plants
    plants.forEach((plant) => {
      const isSelected = selectedPlantId === plant.plant_id;
      const risk = plant.latest_risk;
      const reading = plant.latest_reading;
      const color = getRiskColor(risk?.risk_score);
      const icon = createPlantDivIcon(plant, isSelected, showTreeCover);
      const eco = plant.regional_ecology;

      // Marker
      let marker = markersRef.current.get(plant.plant_id);
      if (!marker) {
        marker = L.marker([plant.latitude, plant.longitude], { icon });
        marker.addTo(map);
        markersRef.current.set(plant.plant_id, marker);

        marker.on('click', () => {
          if (onSelectPlant) {
            onSelectPlant(plant.plant_id);
          }
        });
      } else {
        marker.setIcon(icon);
        marker.setLatLng([plant.latitude, plant.longitude]);
      }

      // Capacity Radius Circle (proportional to capacity MW)
      let circle = circlesRef.current.get(plant.plant_id);
      const radiusMeters = plant.capacity_mw * 450;

      if (!circle) {
        circle = L.circle([plant.latitude, plant.longitude], {
          radius: radiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 4',
        });
        if (showRadiusCircles) circle.addTo(map);
        circlesRef.current.set(plant.plant_id, circle);
      } else {
        circle.setLatLng([plant.latitude, plant.longitude]);
        circle.setRadius(radiusMeters);
        circle.setStyle({
          color: color,
          fillColor: color,
          fillOpacity: isSelected ? 0.2 : 0.08,
          weight: isSelected ? 2.5 : 1.5,
        });
        if (showRadiusCircles && !map.hasLayer(circle)) {
          circle.addTo(map);
        } else if (!showRadiusCircles && map.hasLayer(circle)) {
          map.removeLayer(circle);
        }
      }

      // Regional Forest Canopy & Tree Census Zone
      let treeCircle = treeCirclesRef.current.get(plant.plant_id);
      const treeZoneRadius = eco?.protected_forest_area_km2 
        ? Math.min(220000, Math.max(80000, Math.sqrt(eco.protected_forest_area_km2 / Math.PI) * 2200))
        : 90000;

      if (!treeCircle) {
        treeCircle = L.circle([plant.latitude, plant.longitude], {
          radius: treeZoneRadius,
          color: '#10b981',
          fillColor: '#059669',
          fillOpacity: 0.12,
          weight: 1.8,
          dashArray: '6, 6',
        });

        if (eco) {
          treeCircle.bindTooltip(
            `<strong>🌲 ${plant.region} Tree Census</strong><br/>
             • Estimated Trees: <b>${formatTreeCount(eco.estimated_trees)}</b><br/>
             • Forest Canopy: <b>${eco.canopy_cover_pct}% cover</b><br/>
             • Clean Energy Offset: <b>+${(eco.trees_equivalent_co2_offset ?? 0).toLocaleString()} trees/yr</b>`,
            { className: 'scada-tree-tooltip', direction: 'top' }
          );
        }

        if (showTreeCover) treeCircle.addTo(map);
        treeCirclesRef.current.set(plant.plant_id, treeCircle);
      } else {
        treeCircle.setLatLng([plant.latitude, plant.longitude]);
        treeCircle.setRadius(treeZoneRadius);
        treeCircle.setStyle({
          color: '#10b981',
          fillColor: '#059669',
          fillOpacity: isSelected ? 0.22 : 0.12,
          weight: isSelected ? 2.5 : 1.8,
        });

        if (showTreeCover && !map.hasLayer(treeCircle)) {
          treeCircle.addTo(map);
        } else if (!showTreeCover && map.hasLayer(treeCircle)) {
          map.removeLayer(treeCircle);
        }
      }

      // SCADA Popup with Regional Tree & Ecosystem Census
      const popupContent = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; min-width: 260px; color: #f1f5f9; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="background: #1e293b; color: #94a3b8; font-family: monospace; font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 4px;">
                ${plant.plant_id}
              </span>
              <span style="font-size: 10px; font-weight: bold; color: ${plant.plant_type === 'SOLAR' ? '#f59e0b' : '#06b6d4'};">
                ${plant.plant_type}
              </span>
            </div>
            <span style="font-size: 11px; font-weight: bold; color: ${color};">
              Risk: ${risk?.risk_score ?? 15}/100
            </span>
          </div>

          <h4 style="font-size: 13px; font-weight: 700; margin: 0 0 4px 0; color: #ffffff;">
            ${plant.plant_name}
          </h4>
          <p style="font-size: 10px; color: #94a3b8; margin: 0 0 8px 0;">
            ${plant.region} (${plant.latitude.toFixed(2)}°, ${plant.longitude.toFixed(2)}°)
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #0b1220; padding: 8px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 10px; font-size: 11px;">
            <div>
              <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">Generation</span>
              <span style="font-weight: bold; color: #10b981; font-family: monospace;">
                ${reading?.power_generated ?? 0} MW
              </span>
            </div>
            <div>
              <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">Nameplate Cap</span>
              <span style="font-weight: bold; color: #cbd5e1; font-family: monospace;">
                ${plant.capacity_mw} MW
              </span>
            </div>
            <div>
              <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">Core Temp</span>
              <span style="font-weight: bold; color: ${(reading?.equipment_temperature || 0) > 70 ? '#f43f5e' : '#cbd5e1'}; font-family: monospace;">
                ${reading?.equipment_temperature ?? 45}°C
              </span>
            </div>
            <div>
              <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">Status</span>
              <span style="font-weight: bold; color: ${plant.operating_status === 'OPTIMAL' ? '#10b981' : '#f43f5e'};">
                ${plant.operating_status}
              </span>
            </div>
          </div>

          ${
            eco
              ? `
            <div style="background: #032014; border: 1px solid #059669; border-radius: 8px; padding: 8px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="display: flex; align-items: center; gap: 4px; color: #34d399; font-size: 11px; font-weight: bold;">
                  🌲 Regional Tree & Forest Census
                </span>
                <span style="background: #064e3b; color: #a7f3d0; font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 4px; font-family: monospace;">
                  ${eco.canopy_cover_pct}% Canopy
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; margin-bottom: 6px;">
                <div>
                  <span style="color: #6ee7b7; font-size: 9px; display: block;">Trees in Region</span>
                  <span style="font-weight: bold; color: #ffffff; font-family: monospace; font-size: 11px;">
                    ${(eco.estimated_trees ?? 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span style="color: #6ee7b7; font-size: 9px; display: block;">Annual Forest Offset</span>
                  <span style="font-weight: bold; color: #6ee7b7; font-family: monospace; font-size: 11px;">
                    +${(eco.trees_equivalent_co2_offset ?? 0).toLocaleString()} trees/yr
                  </span>
                </div>
              </div>
              <div style="font-size: 9px; color: #94a3b8; line-height: 1.3;">
                <strong style="color: #a7f3d0;">Native Species:</strong> ${(eco.dominant_species || []).join(', ')}
              </div>
              <div style="font-size: 9px; color: #94a3b8; margin-top: 3px;">
                <strong style="color: #a7f3d0;">Biome:</strong> ${eco.biome_type || 'Regional Ecosystem'} (${eco.protected_forest_area_km2 || 0} km² reserve)
              </div>
            </div>
            `
              : ''
          }

          <button
            id="popup-btn-${plant.plant_id}"
            style="
              width: 100%;
              background: #10b981;
              color: #020617;
              border: none;
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
            "
          >
            Launch SCADA Digital Twin &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'scada-leaflet-popup',
        closeButton: true,
      });

      marker.off('popupopen');
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${plant.plant_id}`);
        if (btn && onSelectPlant) {
          btn.onclick = () => {
            onSelectPlant(plant.plant_id);
          };
        }
      });
    });
  }, [plants, selectedPlantId, showRadiusCircles, showTreeCover, onSelectPlant, mapEngine]);

  // Fit bounds to all fleet plants
  const fitAllFleet = () => {
    if (mapEngine === 'leaflet') {
      const map = mapInstanceRef.current;
      if (!map || plants.length === 0) return;
      const bounds = L.latLngBounds(plants.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });
    }
  };

  // Fly to specific plant
  const flyToPlant = (plant: PlantWithState) => {
    if (onSelectPlant) {
      onSelectPlant(plant.plant_id);
    }

    if (mapEngine === 'leaflet') {
      const map = mapInstanceRef.current;
      if (!map) return;

      map.flyTo([plant.latitude, plant.longitude], 9, {
        duration: 1.5,
      });

      const marker = markersRef.current.get(plant.plant_id);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 1600);
      }
    } else {
      setHoveredPlant(plant);
    }
  };

  return (
    <div className={`relative bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Map SCADA Controls Bar */}
      {showControls && (
        <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-white tracking-wide uppercase font-mono text-[11px]">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>India Geospatial Radar</span>
            </div>

            <span className="hidden sm:inline-block text-slate-600">|</span>

            {/* Map Engine Switcher: Leaflet GIS vs High-Precision Vector SVG */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setMapEngine('leaflet')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  mapEngine === 'leaflet' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Leaflet Dynamic Tile Engine (Carto, Satellite, OSM)"
              >
                <Layers className="w-3 h-3" />
                <span>GIS Tiles</span>
              </button>
              <button
                onClick={() => setMapEngine('vector')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  mapEngine === 'vector' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Instant Vector Radar (Works in all networks without tile latency)"
              >
                <Compass className="w-3 h-3" />
                <span>Vector Radar</span>
              </button>
            </div>

            {/* Layer Switcher (Visible on both mobile & desktop Windows) */}
            {mapEngine === 'leaflet' && (
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 overflow-x-auto max-w-[280px] sm:max-w-none scrollbar-none">
                <button
                  onClick={() => {
                    setActiveLayer('dark');
                    setTileError(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${
                    activeLayer === 'dark' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dark Enterprise GIS Basemap (No API key needed)"
                >
                  Dark
                </button>
                <button
                  onClick={() => {
                    setActiveLayer('satellite');
                    setTileError(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${
                    activeLayer === 'satellite' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Satellite Aerial Imagery (No API key needed)"
                >
                  Satellite
                </button>
                <button
                  onClick={() => {
                    setActiveLayer('street');
                    setTileError(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${
                    activeLayer === 'street' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="OpenStreetMap Standard (Free Open GIS)"
                >
                  Street
                </button>
                <button
                  onClick={() => {
                    setActiveLayer('voyager');
                    setTileError(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${
                    activeLayer === 'voyager' ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Topo & Terrain Basemap (Free Public GIS, No API key needed)"
                >
                  Topo / Voyager
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Regional Tree Census Layer */}
            <button
              onClick={() => setShowTreeCover(!showTreeCover)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                showTreeCover
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-900/30 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Regional Tree Census & Forest Canopy Overlay"
            >
              <Trees className="w-3.5 h-3.5 text-emerald-400" />
              <span>Regional Tree Canopy</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-300">
                {showTreeCover ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Toggle Radius Buffer Circles */}
            <button
              onClick={() => setShowRadiusCircles(!showRadiusCircles)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                showRadiusCircles
                  ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>MW Footprint</span>
            </button>

            {/* Fit All Fleet */}
            {mapEngine === 'leaflet' && (
              <button
                onClick={fitAllFleet}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fit India</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setTimeout(() => {
                  mapInstanceRef.current?.invalidateSize();
                }, 120);
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Regional Tree & Ecological Census Quick Teleportation Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-emerald-400 font-mono shrink-0 uppercase font-bold text-[10px] flex items-center gap-1">
            <TreePine className="w-3.5 h-3.5" />
            Tree Census:
          </span>
          {plants.map((p) => {
            const isSelected = selectedPlantId === p.plant_id;
            const treeCount = p.regional_ecology?.estimated_trees;
            const canopy = p.regional_ecology?.canopy_cover_pct;

            return (
              <button
                key={p.plant_id}
                onClick={() => flyToPlant(p)}
                className={`px-2 py-0.5 rounded-lg border flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={`Click to inspect ${p.region}: ${formatTreeCount(treeCount)} (${canopy}% forest canopy)`}
              >
                <span className="font-semibold text-[10px] text-white">
                  {p.region.split('(')[1]?.replace(')', '') || p.region}:
                </span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">
                  {treeCount ? `${(treeCount / 1_000_000).toFixed(1)}M` : 'N/A'}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">({canopy}%)</span>
              </button>
            );
          })}
        </div>

        {/* Global Fleet Forest Metrics Summary */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Total Trees: <strong className="text-white">{(totalFleetTrees / 1_000_000).toFixed(1)}M</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            Avg Canopy: <strong className="text-white">{avgCanopy}%</strong>
          </span>
          <span className="flex items-center gap-1 text-emerald-300 font-bold">
            <Leaf className="w-3 h-3 text-emerald-400" />
            +{(totalTreesOffset / 1_000_000).toFixed(2)}M/yr offset
          </span>
        </div>
      </div>

      {/* Tile loading fallback banner if external tiles fail */}
      {tileError && mapEngine === 'leaflet' && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Tile latency detected. Switch to "Street (OSM)" or click "Vector Radar" for instantaneous high-precision rendering.
          </span>
          <button
            onClick={() => setMapEngine('vector')}
            className="px-2 py-0.5 rounded bg-amber-800 hover:bg-amber-700 text-white text-[10px] font-bold font-mono uppercase"
          >
            Switch to Vector Radar
          </button>
        </div>
      )}

      {/* 1. Leaflet GIS Engine */}
      {mapEngine === 'leaflet' && (
        <div
          ref={mapContainerRef}
          style={{ height: isFullscreen ? 'calc(100vh - 120px)' : height }}
          className="w-full relative z-0 bg-slate-950"
        />
      )}

      {/* 2. Resilient Vector SVG Radar Engine (Instant load, 100% reliable across all browsers & firewalls) */}
      {mapEngine === 'vector' && (
        <div
          style={{ height: isFullscreen ? 'calc(100vh - 120px)' : height }}
          className="w-full relative z-0 bg-slate-950 overflow-hidden flex flex-col justify-between"
        >
          <svg viewBox="0 0 800 450" className="w-full h-full select-none">
            <defs>
              <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>

              {/* Radial gradient for regional tree zones */}
              <radialGradient id="tree-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#059669" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Grid pattern background */}
            <rect width="800" height="450" fill="url(#radar-grid)" />

            {/* Concentric telemetry radar rings centered on central India */}
            <circle cx="340" cy="225" r="90" fill="none" stroke="#1e3a8a" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
            <circle cx="340" cy="225" r="170" fill="none" stroke="#1e3a8a" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
            <circle cx="340" cy="225" r="250" fill="none" stroke="#1e3a8a" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.2" />

            {/* Indian Subcontinent Boundary Silhouette */}
            <path
              d="M 270 48 L 320 62 L 350 92 L 380 108 L 440 118 L 520 142 L 600 138 L 670 152 L 650 188 L 580 192 L 525 218 L 475 218 L 430 258 L 375 292 L 325 372 L 295 408 L 280 392 L 250 322 L 205 282 L 165 252 L 130 228 L 115 208 L 150 192 L 195 182 L 210 142 L 245 102 Z"
              fill="#081020"
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />

            {/* Coordinate latitude lines */}
            <line x1="80" y1="110" x2="720" y2="110" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 4" />
            <text x="85" y="106" fill="#475569" fontSize="9" fontFamily="monospace">28° N (North India)</text>

            <line x1="80" y1="210" x2="720" y2="210" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 4" />
            <text x="85" y="206" fill="#475569" fontSize="9" fontFamily="monospace">20° N (Central India)</text>

            <line x1="80" y1="310" x2="720" y2="310" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 4" />
            <text x="85" y="306" fill="#475569" fontSize="9" fontFamily="monospace">12° N (South India)</text>

            {/* Regional Tree Canopy Ecological Circles */}
            {showTreeCover &&
              plants.map((p) => {
                const { x, y } = mapCoords(p.latitude, p.longitude);
                const eco = p.regional_ecology;
                if (!eco) return null;
                const radius = Math.min(55, Math.max(26, Math.sqrt(eco.protected_forest_area_km2 / Math.PI) * 0.7));

                return (
                  <g key={`tree-zone-${p.plant_id}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill="url(#tree-glow)"
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={x}
                      y={y + radius + 10}
                      textAnchor="middle"
                      fill="#6ee7b7"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      🌲 {(eco.estimated_trees / 1_000_000).toFixed(1)}M trees ({eco.canopy_cover_pct}%)
                    </text>
                  </g>
                );
              })}

            {/* Plant Capacity Footprint Rings */}
            {showRadiusCircles &&
              plants.map((p) => {
                const { x, y } = mapCoords(p.latitude, p.longitude);
                const color = getRiskColor(p.latest_risk?.risk_score ?? 15);
                const r = (p.capacity_mw / 350) * 36;
                const isSelected = selectedPlantId === p.plant_id;

                return (
                  <circle
                    key={`footprint-${p.plant_id}`}
                    cx={x}
                    cy={y}
                    r={r}
                    fill={color}
                    fillOpacity={isSelected ? 0.2 : 0.07}
                    stroke={color}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    strokeDasharray="3 3"
                  />
                );
              })}

            {/* Plant Node Markers */}
            {plants.map((p) => {
              const { x, y } = mapCoords(p.latitude, p.longitude);
              const riskScore = p.latest_risk?.risk_score ?? 15;
              const color = getRiskColor(riskScore);
              const isSelected = selectedPlantId === p.plant_id;
              const isSolar = p.plant_type === 'SOLAR';

              return (
                <g
                  key={`node-${p.plant_id}`}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => {
                    if (onSelectPlant) onSelectPlant(p.plant_id);
                    setHoveredPlant(p);
                  }}
                  onMouseEnter={() => setHoveredPlant(p)}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle r="22" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 2" className="animate-spin" />
                  )}

                  {/* Outer circle */}
                  <circle r="15" fill="#090d16" stroke={color} strokeWidth={isSelected ? 3 : 2} />

                  {/* Core icon */}
                  {isSolar ? (
                    <circle r="5" fill={color} />
                  ) : (
                    <polygon points="0,-6 6,5 -6,5" fill={color} />
                  )}

                  {/* Risk Badge */}
                  <rect x="8" y="-14" width="18" height="12" rx="3" fill={color} />
                  <text x="17" y="-5" textAnchor="middle" fill="#020617" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    {riskScore}
                  </text>

                  {/* Plant ID Tag */}
                  <text x="0" y="24" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {p.plant_id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Plant Dossier floating card when hovered/selected in Vector mode */}
          {hoveredPlant && (
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/95 border border-slate-800 p-3 rounded-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: getRiskColor(hoveredPlant.latest_risk?.risk_score) }}
                >
                  {hoveredPlant.plant_type === 'SOLAR' ? <Sun className="w-4 h-4 text-slate-950" /> : <Wind className="w-4 h-4 text-slate-950" />}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">{hoveredPlant.plant_name}</h4>
                  <p className="text-slate-400 text-[11px]">
                    {hoveredPlant.region} • Cap: {hoveredPlant.capacity_mw} MW • Gen: {hoveredPlant.latest_reading?.power_generated ?? 0} MW
                  </p>
                </div>
              </div>

              {hoveredPlant.regional_ecology && (
                <div className="flex items-center gap-3 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-[11px] font-mono">
                  <span className="text-emerald-300">
                    🌲 {formatTreeCount(hoveredPlant.regional_ecology.estimated_trees)}
                  </span>
                  <span className="text-emerald-400">
                    {hoveredPlant.regional_ecology.canopy_cover_pct}% canopy
                  </span>
                  <span className="text-emerald-200 hidden sm:inline">
                    +{((hoveredPlant.regional_ecology.trees_equivalent_co2_offset ?? 0) / 1000).toFixed(0)}K trees/yr offset
                  </span>
                </div>
              )}

              <button
                onClick={() => {
                  if (onInspectPlant) onInspectPlant(hoveredPlant.plant_id);
                  else if (onSelectPlant) onSelectPlant(hoveredPlant.plant_id);
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                Inspect Telemetry &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Injected custom styles for Leaflet popups & tooltips */}
      <style>{`
        .scada-leaflet-popup .leaflet-popup-content-wrapper {
          background-color: #090d16 !important;
          border: 1px solid #334155 !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7) !important;
          padding: 4px !important;
        }
        .scada-leaflet-popup .leaflet-popup-tip {
          background-color: #090d16 !important;
          border: 1px solid #334155 !important;
        }
        .scada-leaflet-popup .leaflet-popup-content {
          margin: 10px !important;
          line-height: 1.4 !important;
        }
        .scada-leaflet-popup a.leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 6px !important;
        }
        .scada-leaflet-popup a.leaflet-popup-close-button:hover {
          color: #f8fafc !important;
        }
        .scada-tree-tooltip {
          background-color: #032014 !important;
          border: 1px solid #059669 !important;
          color: #ecfdf5 !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
          font-size: 11px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5) !important;
          padding: 6px 8px !important;
        }
      `}</style>
    </div>
  );
};
