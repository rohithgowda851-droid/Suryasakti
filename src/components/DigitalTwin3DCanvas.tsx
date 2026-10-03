import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, Layers, Maximize2, RotateCcw, Sparkles, Thermometer, Wind, Zap } from 'lucide-react';
import { PlantWithState } from '../services/api';

interface DigitalTwin3DCanvasProps {
  plant: PlantWithState;
}

export const DigitalTwin3DCanvas: React.FC<DigitalTwin3DCanvasProps> = ({ plant }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'REALISTIC' | 'THERMAL' | 'WIREFRAME'>('REALISTIC');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const isSolar = plant.plant_type === 'SOLAR';
  const reading = plant.latest_reading;
  const windSpeed = reading?.wind_speed || 8.5;
  const temp = reading?.panel_temperature || reading?.temperature || 38.5;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b14);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 7, isSolar ? 16 : 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0x0f2838, 2.0);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x38bdf8, 2.6);
    mainLight.position.set(15, 25, 15);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.8);
    rimLight.position.set(-15, 10, -10);
    scene.add(rimLight);

    // Model Root Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 3. Grid Platform
    const grid = new THREE.GridHelper(30, 20, 0x10b981, 0x1e293b);
    grid.position.y = 0;
    modelGroup.add(grid);

    // Reference variables for animation
    const rotators: THREE.Group[] = [];
    const thermalMeshes: THREE.Mesh[] = [];

    // Helper to get color based on mode
    const getMaterialColor = (baseColor: number, thermalColor: number) => {
      if (viewMode === 'THERMAL') return thermalColor;
      return baseColor;
    };

    if (isSolar) {
      // ----------------------------------------------------
      // SOLAR PHOTOVOLTAIC DIGITAL TWIN
      // ----------------------------------------------------
      const solarGroup = new THREE.Group();
      solarGroup.position.set(0, 0, 0);

      // 4 PV Tracker Tables
      const pvMat = new THREE.MeshStandardMaterial({
        color: getMaterialColor(0x032b45, 0xef4444),
        emissive: viewMode === 'THERMAL' ? 0xb91c1c : 0x0284c7,
        emissiveIntensity: 0.35,
        wireframe: viewMode === 'WIREFRAME',
        metalness: 0.85,
        roughness: 0.2,
      });

      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.8,
        wireframe: viewMode === 'WIREFRAME',
      });

      for (let row = -1; row <= 1; row += 2) {
        for (let col = -1; col <= 1; col += 2) {
          const tracker = new THREE.Group();
          tracker.position.set(col * 4.5, 0, row * 3.5);

          // Pylon Post
          const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.4, 12), frameMat);
          pylon.position.y = 1.2;
          tracker.add(pylon);

          // Torque Tube & Panel Table (Dual-Axis Tilting)
          const panelTable = new THREE.Group();
          panelTable.position.y = 2.4;
          panelTable.rotation.x = Math.PI * 0.16; // Tilted towards south sun

          const panel = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.08, 2.4), pvMat);
          panelTable.add(panel);
          thermalMeshes.push(panel);

          // Silicon Cell Substring Dividers
          const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const divider = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.1, 0.04), lineMat);
          divider.position.y = 0.04;
          panelTable.add(divider);

          tracker.add(panelTable);
          solarGroup.add(tracker);
        }
      }

      // Central Inverter Station & SCADA RTU Box
      const invGroup = new THREE.Group();
      invGroup.position.set(0, 0, 0);

      const invBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.2, 1.8),
        new THREE.MeshStandardMaterial({
          color: getMaterialColor(0x1e293b, 0xf59e0b),
          emissive: viewMode === 'THERMAL' ? 0xd97706 : 0x059669,
          emissiveIntensity: 0.25,
          wireframe: viewMode === 'WIREFRAME',
          metalness: 0.7,
        })
      );
      invBox.position.y = 1.1;
      invGroup.add(invBox);
      thermalMeshes.push(invBox);

      // Inverter Heat Sink Cooling Fans on back
      const fanGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12);
      const fanMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
      for (let f = -0.6; f <= 0.6; f += 1.2) {
        const fan = new THREE.Mesh(fanGeo, fanMat);
        fan.rotation.x = Math.PI / 2;
        fan.position.set(f, 1.5, 0.94);
        invGroup.add(fan);
      }

      // Active Inverter Status LED
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      led.position.set(0.7, 1.8, 0.92);
      invGroup.add(led);

      solarGroup.add(invGroup);
      modelGroup.add(solarGroup);
    } else {
      // ----------------------------------------------------
      // WIND TURBINE DIGITAL TWIN
      // ----------------------------------------------------
      const windGroup = new THREE.Group();
      windGroup.position.set(0, 0, 0);

      const metalMat = new THREE.MeshStandardMaterial({
        color: getMaterialColor(0xcfd8dc, 0x3b82f6),
        emissive: viewMode === 'THERMAL' ? 0x1d4ed8 : 0x0284c7,
        emissiveIntensity: 0.15,
        wireframe: viewMode === 'WIREFRAME',
        metalness: 0.6,
        roughness: 0.35,
      });

      // Tapered Steel Monopile Tower
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.85, 14, 16), metalMat);
      tower.position.y = 7;
      windGroup.add(tower);
      thermalMeshes.push(tower);

      // Nacelle (Main Bearing, Gearbox, Generator)
      const nacelle = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.4, 4.2),
        new THREE.MeshStandardMaterial({
          color: getMaterialColor(0x334155, 0xef4444),
          emissive: viewMode === 'THERMAL' ? 0xb91c1c : 0x000000,
          emissiveIntensity: 0.4,
          wireframe: viewMode === 'WIREFRAME',
          metalness: 0.8,
        })
      );
      nacelle.position.set(0, 14.5, 0.5);
      windGroup.add(nacelle);
      thermalMeshes.push(nacelle);

      // Anemometer & Wind Vane on Nacelle Roof
      const anemo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
      );
      anemo.position.set(0, 15.6, -1.0);
      windGroup.add(anemo);

      // Aviation Obstruction Beacon
      const redBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      redBeacon.position.set(0, 15.4, 2.0);
      windGroup.add(redBeacon);

      // Rotor Hub & 3 Pitch-Controlled Blades
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 14.5, 2.7);

      const hub = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 1.4, 16),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.7 })
      );
      hub.rotation.x = Math.PI / 2;
      rotorGroup.add(hub);

      // 3 Blades with Aerodynamic Taper
      const bladeGeo = new THREE.BoxGeometry(0.35, 8.5, 0.1);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: getMaterialColor(0xf8fafc, 0xf59e0b),
        emissive: viewMode === 'THERMAL' ? 0xb45309 : 0x000000,
        emissiveIntensity: 0.25,
        wireframe: viewMode === 'WIREFRAME',
        roughness: 0.25,
      });

      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 4.25;

        // Red high-visibility tip
        const tip = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 1.2, 0.12),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        tip.position.y = 7.9;

        const bladeHolder = new THREE.Group();
        bladeHolder.rotation.z = (b * Math.PI * 2) / 3;
        bladeHolder.add(blade, tip);

        rotorGroup.add(bladeHolder);
        thermalMeshes.push(blade);
      }

      windGroup.add(rotorGroup);
      rotators.push(rotorGroup);
      modelGroup.add(windGroup);
    }

    // Interactive Drag Orbit & Wheel Zoom
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      modelGroup.rotation.y += deltaX * 0.008;
      modelGroup.rotation.x = Math.max(-0.4, Math.min(0.8, modelGroup.rotation.x + deltaY * 0.005));
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(10, Math.min(32, camera.position.z + e.deltaY * 0.02));
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      // Auto rotation
      if (isRotating && !isMouseDown) {
        modelGroup.rotation.y += 0.004;
      }

      // Rotate wind blades based on real wind velocity
      const bladeSpeed = (Math.max(2, windSpeed) / 10) * 0.06;
      rotators.forEach((r) => {
        r.rotation.z -= bladeSpeed;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [plant.plant_id, isSolar, viewMode, isRotating, windSpeed]);

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col justify-between">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      />

      {/* Top HUD Controls Overlay */}
      <div className="relative z-10 p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900/90 border border-emerald-500/40 text-emerald-300 backdrop-blur-md flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            3D DIGITAL TWIN • {isSolar ? 'SOLAR TRACKER ARRAY' : 'AERODYNAMIC TURBINE'}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-950/80 border border-slate-800 text-slate-400 backdrop-blur-md">
            Drag to Rotate • Scroll to Zoom
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 pointer-events-auto backdrop-blur-md">
          <button
            type="button"
            onClick={() => setViewMode('REALISTIC')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'REALISTIC'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Realistic</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('THERMAL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'THERMAL'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Thermal IR</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('WIREFRAME')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'WIREFRAME'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>X-Ray Wireframe</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? 'Pause Orbit Rotation' : 'Resume Orbit Rotation'}
            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
              isRotating
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Telemetry Overlay */}
      <div className="relative z-10 p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[10px] block">SUBSYSTEM STATUS</span>
            <span className="text-emerald-400 font-bold">OPERATIONAL OPTIMAL</span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[10px] block">
              {isSolar ? 'PANEL TEMPERATURE' : 'GENERATOR TEMP'}
            </span>
            <span className="text-amber-400 font-bold">{temp.toFixed(1)} °C</span>
          </div>

          {!isSolar && (
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">ROTOR VELOCITY</span>
              <span className="text-cyan-400 font-bold">
                {((windSpeed * 60) / 35).toFixed(1)} RPM ({windSpeed.toFixed(1)} m/s)
              </span>
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
          SuryaSakti Physics-Informed Digital Twin Node
        </div>
      </div>
    </div>
  );
};
