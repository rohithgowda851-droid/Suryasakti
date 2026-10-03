import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Landing3DSceneProps {
  onEnter?: () => void;
  onSelectPlant?: (plantId: string) => void;
}

interface PlantBeacon {
  id: string;
  name: string;
  type: 'SOLAR' | 'WIND';
  mw: number;
  lat: number;
  lng: number;
  mesh?: THREE.Group;
  pos?: THREE.Vector3;
}

const PLANT_BEACONS: PlantBeacon[] = [
  { id: 'PL-S001', name: 'Bhadla Solar Park', type: 'SOLAR', mw: 350, lat: 27.539, lng: 71.916 },
  { id: 'PL-S002', name: 'Pavagada Solar Park', type: 'SOLAR', mw: 300, lat: 14.281, lng: 77.279 },
  { id: 'PL-W001', name: 'Muppandal Wind Farm', type: 'WIND', mw: 250, lat: 8.257, lng: 77.545 },
  { id: 'PL-W002', name: 'Jaisalmer Wind Park', type: 'WIND', mw: 250, lat: 26.915, lng: 70.908 },
  { id: 'PL-S003', name: 'Kurnool Ultra Mega Solar', type: 'SOLAR', mw: 250, lat: 15.682, lng: 78.286 },
  { id: 'PL-W003', name: 'Khavda Renewable Energy Park', type: 'WIND', mw: 250, lat: 23.852, lng: 69.721 },
];

export const Landing3DScene: React.FC<Landing3DSceneProps> = ({ onEnter, onSelectPlant }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPlant, setHoveredPlant] = useState<PlantBeacon | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.014);

    const isMobile = window.innerWidth < 768;
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, isMobile ? 44 : 36);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 2. Cosmic Background Starfield
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 220;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 140;
      starPositions[i * 3 + 2] = -50 - Math.random() * 80;

      // Color tints: Cyan, Emerald, Warm Solar
      const r = Math.random();
      if (r < 0.4) {
        starColors[i * 3] = 0.2;
        starColors[i * 3 + 1] = 0.8;
        starColors[i * 3 + 2] = 0.9;
      } else if (r < 0.7) {
        starColors[i * 3] = 0.1;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 0.5;
      } else {
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.75;
        starColors[i * 3 + 2] = 0.3;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starSystem = new THREE.Points(starGeo, starMat);
    scene.add(starSystem);

    // 3. Multi-Spectrum SCADA Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x061e2b, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
    sunLight.position.set(30, 40, 20);
    scene.add(sunLight);

    const emeraldCore = new THREE.PointLight(0x10b981, 4.0, 70);
    emeraldCore.position.set(-15, 8, -5);
    scene.add(emeraldCore);

    const solarGold = new THREE.PointLight(0xf59e0b, 3.2, 50);
    solarGold.position.set(18, 12, 12);
    scene.add(solarGold);

    // 4. Holographic Indian Renewable Energy Globe
    const globeRadius = isMobile ? 6.2 : 7.6;
    const globeGroup = new THREE.Group();
    globeGroup.position.set(isMobile ? 0 : 9.5, isMobile ? 4.5 : 6.0, isMobile ? -12 : -8);
    worldGroup.add(globeGroup);

    // Earth Sphere Core
    const globeGeo = new THREE.SphereGeometry(globeRadius, 36, 36);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x021727,
      emissive: 0x043828,
      emissiveIntensity: 0.45,
      roughness: 0.4,
      metalness: 0.7,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globe);

    // Cyber Latitude / Longitude Mesh Lines
    const wireGeo = new THREE.SphereGeometry(globeRadius * 1.003, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // Atmospheric Plasma Halo
    const haloGeo = new THREE.SphereGeometry(globeRadius * 1.07, 24, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereHalo = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(atmosphereHalo);

    // Orbital Energy Rings
    const ringGeo1 = new THREE.TorusGeometry(globeRadius * 1.28, 0.05, 8, 48);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
    });
    const orbitalRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    orbitalRing1.rotation.x = Math.PI * 0.35;
    orbitalRing1.rotation.y = Math.PI * 0.15;
    globeGroup.add(orbitalRing1);

    const ringGeo2 = new THREE.TorusGeometry(globeRadius * 1.42, 0.04, 8, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    const orbitalRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    orbitalRing2.rotation.x = -Math.PI * 0.25;
    orbitalRing2.rotation.y = Math.PI * 0.4;
    globeGroup.add(orbitalRing2);

    // Orbiting SCADA Telemetry Satellite
    const satGroup = new THREE.Group();
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
    );
    const solarWingMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      emissive: 0x2563eb,
      emissiveIntensity: 0.6,
      metalness: 0.8,
    });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.5), solarWingMat);
    wingL.position.x = -0.9;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.5), solarWingMat);
    wingR.position.x = 0.9;
    satGroup.add(satBody, wingL, wingR);
    globeGroup.add(satGroup);

    // Laser Beam from Satellite to Earth
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.65,
    });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    globeGroup.add(laserLine);

    // 5. 3D Megaproject Location Beacons on Globe
    const beaconMeshes: THREE.Group[] = [];
    const interactiveMeshes: THREE.Object3D[] = [];

    const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    PLANT_BEACONS.forEach((plant) => {
      const bGroup = new THREE.Group();
      const pos = latLngToVector3(plant.lat, plant.lng, globeRadius);
      bGroup.position.copy(pos);
      bGroup.lookAt(pos.clone().multiplyScalar(2));

      // Color: Solar = Gold/Amber, Wind = Cyan/Emerald
      const isSolar = plant.type === 'SOLAR';
      const colorHex = isSolar ? 0xf59e0b : 0x06b6d4;

      // Base Pillar
      const pinMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.04, 1.2, 8),
        new THREE.MeshBasicMaterial({ color: colorHex })
      );
      pinMesh.position.z = 0.6;
      pinMesh.rotation.x = Math.PI / 2;

      // Glowing Core Sphere
      const sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 12, 12),
        new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.9,
        })
      );
      sphereMesh.position.z = 1.3;
      sphereMesh.userData = { plant };

      // Pulsing Radar Ring
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.45, 16),
        new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        })
      );
      ringMesh.position.z = 1.3;

      bGroup.add(pinMesh, sphereMesh, ringMesh);
      bGroup.userData = { plant, ring: ringMesh };
      globeGroup.add(bGroup);

      beaconMeshes.push(bGroup);
      interactiveMeshes.push(sphereMesh);
      plant.mesh = bGroup;
      plant.pos = pos;
    });

    // 6. Cybernetic Ground SCADA Energy Matrix (Terrain)
    const groundMatrix = new THREE.Group();
    groundMatrix.position.set(0, -9, 0);
    worldGroup.add(groundMatrix);

    // Glowing Hexagonal / Grid Floor
    const gridHelper = new THREE.GridHelper(90, 45, 0x10b981, 0x092b3a);
    gridHelper.position.y = 0;
    groundMatrix.add(gridHelper);

    // 7. 3D Procedural Wind Turbines (Tapered Mast + 3 Rotating Blades)
    interface TurbineInstance {
      rotor: THREE.Group;
      speed: number;
    }
    const turbineInstances: TurbineInstance[] = [];

    const createWindTurbine = (x: number, z: number, scale = 1.0, speed = 0.035) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(x, 0, z);
      tGroup.scale.set(scale, scale, scale);

      // Tower
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.5, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 })
      );
      tower.position.y = 7;
      tGroup.add(tower);

      // Nacelle (Generator Housing)
      const nacelle = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.7, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 })
      );
      nacelle.position.set(0, 14.2, 0);
      tGroup.add(nacelle);

      // Blinking Aviation Beacon on top of Nacelle
      const beaconLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beaconLight.position.set(0, 14.7, -0.6);
      tGroup.add(beaconLight);

      // Rotor Hub & 3 Aerodynamic Blades
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 14.2, 1.2);

      const hub = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 0.9, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5 })
      );
      hub.rotation.x = Math.PI / 2;
      rotorGroup.add(hub);

      const bladeGeo = new THREE.BoxGeometry(0.22, 6.2, 0.06);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 3.1;
        const bladeHolder = new THREE.Group();
        bladeHolder.rotation.z = (i * Math.PI * 2) / 3;
        bladeHolder.add(blade);

        // Red tip marker
        const tip = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.8, 0.07),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        tip.position.y = 5.7;
        bladeHolder.add(tip);

        rotorGroup.add(bladeHolder);
      }

      tGroup.add(rotorGroup);
      groundMatrix.add(tGroup);
      turbineInstances.push({ rotor: rotorGroup, speed });
    };

    // Spawn 5 Wind Turbines across landscape
    createWindTurbine(-18, -12, 0.9, 0.038);
    createWindTurbine(-26, -5, 0.8, 0.032);
    createWindTurbine(-12, -22, 0.75, 0.042);
    createWindTurbine(-32, -18, 0.65, 0.029);
    createWindTurbine(-22, -28, 0.7, 0.035);

    // 8. 3D Solar Photovoltaic Tracker Arrays
    const solarArrayGroup = new THREE.Group();
    const panelGeo = new THREE.BoxGeometry(3.2, 0.06, 1.8);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x032840,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.25,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });

    const createSolarTrackerRow = (startX: number, startZ: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const tracker = new THREE.Group();
        tracker.position.set(startX + i * 4.2, 0, startZ);

        // Mounting Post
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8), frameMat);
        post.position.y = 0.9;
        tracker.add(post);

        // Tilted PV Panel Table (tilted ~25 degrees towards sun)
        const table = new THREE.Group();
        table.position.y = 1.8;
        table.rotation.x = Math.PI * 0.14;

        const panel = new THREE.Mesh(panelGeo, panelMat);
        table.add(panel);

        // Glowing Silicon Busbar Lines
        const busbar = new THREE.Mesh(
          new THREE.BoxGeometry(3.1, 0.08, 0.04),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        busbar.position.y = 0.04;
        table.add(busbar);

        tracker.add(table);
        solarArrayGroup.add(tracker);
      }
    };

    // Spawn 4 parallel solar field strings
    createSolarTrackerRow(6, -6, 5);
    createSolarTrackerRow(7, -11, 5);
    createSolarTrackerRow(5, -16, 5);
    createSolarTrackerRow(6, -21, 5);
    groundMatrix.add(solarArrayGroup);

    // 9. Central BESS Substation & Energy Transmission Core
    const bessGroup = new THREE.Group();
    bessGroup.position.set(-3, 0, -8);

    // Battery Storage Container Units
    const containerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x059669,
      emissiveIntensity: 0.25,
      metalness: 0.8,
    });
    for (let c = 0; c < 3; c++) {
      const batt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 1.4), containerMat);
      batt.position.set(c * 3.8 - 3.8, 0.8, 0);
      bessGroup.add(batt);

      // Status indicator on each battery unit
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.1, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      led.position.set(c * 3.8 - 3.8, 1.2, 0.72);
      bessGroup.add(led);
    }

    // Power Inverter Transformer with Glowing Coil
    const transformer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.9, 2.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    transformer.position.set(0, 1.2, 3);
    bessGroup.add(transformer);

    const coilGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.08, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    coilGlow.rotation.x = Math.PI / 2;
    coilGlow.position.set(0, 1.5, 3);
    bessGroup.add(coilGlow);

    groundMatrix.add(bessGroup);

    // 10. Glowing SCADA Energy Flux Lines (Connecting Solar & Wind to Substation)
    const fluxLines: { curve: THREE.CatmullRomCurve3; packets: THREE.Mesh[] }[] = [];
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const packetGeo = new THREE.SphereGeometry(0.18, 8, 8);

    const createEnergyFlux = (start: THREE.Vector3, end: THREE.Vector3) => {
      const mid = start.clone().lerp(end, 0.5);
      mid.y += 1.8;

      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x059669,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      groundMatrix.add(line);

      const packetList: THREE.Mesh[] = [];
      for (let p = 0; p < 2; p++) {
        const packet = new THREE.Mesh(packetGeo, packetMat);
        packet.userData = { t: p * 0.5, speed: 0.008 + Math.random() * 0.005 };
        groundMatrix.add(packet);
        packetList.push(packet);
      }

      fluxLines.push({ curve, packets: packetList });
    };

    createEnergyFlux(new THREE.Vector3(-18, 0, -12), new THREE.Vector3(-3, 1.2, -8));
    createEnergyFlux(new THREE.Vector3(-26, 0, -5), new THREE.Vector3(-3, 1.2, -8));
    createEnergyFlux(new THREE.Vector3(14, 0, -11), new THREE.Vector3(-3, 1.2, -8));
    createEnergyFlux(new THREE.Vector3(12, 0, -21), new THREE.Vector3(-3, 1.2, -8));

    // 11. Rising Photon Energy Particles
    const photonCount = 75;
    const photonGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonCount * 3);
    const photonSpeeds = new Float32Array(photonCount);

    for (let i = 0; i < photonCount; i++) {
      photonPos[i * 3] = (Math.random() - 0.5) * 50;
      photonPos[i * 3 + 1] = Math.random() * 22;
      photonPos[i * 3 + 2] = (Math.random() - 0.5) * 45;
      photonSpeeds[i] = 0.04 + Math.random() * 0.06;
    }
    photonGeo.setAttribute('position', new THREE.BufferAttribute(photonPos, 3));
    const photonMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.45,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const photonSystem = new THREE.Points(photonGeo, photonMat);
    worldGroup.add(photonSystem);

    // 12. Interactive Mouse Raycasting & Orbit
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationY = 0;
    let isMouseDown = false;
    let prevMouseX = 0;

    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouseCoord.x = x;
      mouseCoord.y = y;

      if (isMouseDown) {
        const deltaX = e.clientX - prevMouseX;
        targetRotationY += deltaX * 0.005;
        prevMouseX = e.clientX;
      } else {
        mouseX = x * 0.2;
        mouseY = y * 0.12;
      }

      // Check raycast over beacons
      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const plant = intersects[0].object.userData.plant as PlantBeacon;
        setHoveredPlant(plant);
        container.style.cursor = 'pointer';
      } else {
        setHoveredPlant(null);
        container.style.cursor = isMouseDown ? 'grabbing' : 'grab';
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const plant = intersects[0].object.userData.plant as PlantBeacon;
        if (onSelectPlant) {
          onSelectPlant(plant.id);
        } else if (onEnter) {
          onEnter();
        }
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 13. High-Performance Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let satAngle = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();

      // Ambient slow world drift
      if (!isMouseDown) {
        targetRotationY += 0.0014;
      }
      worldGroup.rotation.y += (targetRotationY + mouseX - worldGroup.rotation.y) * 0.05;
      worldGroup.rotation.x += (mouseY * 0.12 - worldGroup.rotation.x) * 0.05;

      // Rotate Globe & Atmospheric rings
      globeGroup.rotation.y += 0.0028;
      orbitalRing1.rotation.z += 0.0025;
      orbitalRing2.rotation.z -= 0.0018;

      // Animate Orbiting Satellite
      satAngle += 0.016;
      const satDist = globeRadius * 1.35;
      const satX = Math.cos(satAngle) * satDist;
      const satZ = Math.sin(satAngle) * satDist;
      const satY = Math.sin(satAngle * 1.5) * (globeRadius * 0.45);
      satGroup.position.set(satX, satY, satZ);
      satGroup.lookAt(0, 0, 0);

      // Update Laser Beam to ground
      const laserPositions = laserGeo.attributes.position.array as Float32Array;
      laserPositions[0] = satX;
      laserPositions[1] = satY;
      laserPositions[2] = satZ;
      laserPositions[3] = satX * 0.74;
      laserPositions[4] = satY * 0.74;
      laserPositions[5] = satZ * 0.74;
      laserGeo.attributes.position.needsUpdate = true;

      // Pulse Plant Beacons
      beaconMeshes.forEach((bm, i) => {
        const ring = bm.userData.ring as THREE.Mesh;
        const scale = 1 + Math.sin(elapsed * 3.5 + i) * 0.25;
        ring.scale.set(scale, scale, 1);
      });

      // Spin Wind Turbine Rotors
      turbineInstances.forEach((t) => {
        t.rotor.rotation.z -= t.speed;
      });

      // Animate Solar PV Busbar Pulse
      panelMat.emissiveIntensity = 0.25 + Math.sin(elapsed * 2.2) * 0.15;

      // Flow Energy Flux Packets
      fluxLines.forEach((fl) => {
        fl.packets.forEach((p) => {
          p.userData.t += p.userData.speed;
          if (p.userData.t > 1) p.userData.t = 0;
          const pos = fl.curve.getPoint(p.userData.t);
          p.position.copy(pos);
        });
      });

      // Elevate Rising Photons
      const photonArray = photonGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < photonCount; i++) {
        photonArray[i * 3 + 1] += photonSpeeds[i];
        if (photonArray[i * 3 + 1] > 22) {
          photonArray[i * 3 + 1] = 0;
        }
      }
      photonGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('click', handleClick);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [onEnter, onSelectPlant]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Floating Holographic Plant Tooltip on 3D Beacon Hover */}
      {hoveredPlant && (
        <div className="absolute top-1/4 right-8 z-30 pointer-events-none bg-slate-900/90 border border-emerald-500/50 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 font-mono text-xs max-w-xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-white tracking-wide">{hoveredPlant.name}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                hoveredPlant.type === 'SOLAR'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}
            >
              {hoveredPlant.type}
            </span>
          </div>
          <div className="space-y-1 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Plant ID:</span>
              <span className="text-emerald-400 font-bold">{hoveredPlant.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Capacity:</span>
              <span className="text-white font-bold">{hoveredPlant.mw} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Coordinates:</span>
              <span className="text-slate-300">
                {hoveredPlant.lat.toFixed(2)}°N, {hoveredPlant.lng.toFixed(2)}°E
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
            <span>Click node to inspect operations</span>
            <span>&rarr;</span>
          </div>
        </div>
      )}
    </div>
  );
};
