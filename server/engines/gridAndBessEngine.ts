import { BESSMode, BESSUnit, CarbonESGLedger, CustomAlertThreshold, GridFrequencyMetrics, IRECCertificate, Plant, SensorReading } from '../../src/types';

export class GridAndBESSEngine {
  private bessUnits: BESSUnit[] = [];
  private gridMetrics: GridFrequencyMetrics;
  private carbonLedger: CarbonESGLedger;
  private customThresholds: CustomAlertThreshold[] = [];
  private accumulatedGenerationKWh: number = 0;
  private lastTickTime: number = Date.now();

  constructor(plants: Plant[]) {
    // Initialize 4 Major BESS Battery Storage Systems co-located at key renewable sites
    this.bessUnits = [
      {
        id: 'BESS-BHA-01',
        plant_id: 'PL-S001',
        plant_name: 'Bhadla Mega Solar BESS',
        capacity_mwh: 250,
        max_power_mw: 60,
        current_soc_pct: 78.4,
        current_power_mw: -24.5, // -ve = absorbing excess solar
        mode: 'AUTO',
        cell_temp_c: 28.5,
        health_soh_pct: 98.6,
        cycle_count: 342,
        round_trip_eff_pct: 89.4,
        energy_stored_mwh: 196.0,
      },
      {
        id: 'BESS-PAV-02',
        plant_id: 'PL-S002',
        plant_name: 'Pavagada Shakti BESS',
        capacity_mwh: 150,
        max_power_mw: 40,
        current_soc_pct: 64.2,
        current_power_mw: -16.2,
        mode: 'SOLAR_SMOOTHING',
        cell_temp_c: 30.1,
        health_soh_pct: 97.9,
        cycle_count: 418,
        round_trip_eff_pct: 88.8,
        energy_stored_mwh: 96.3,
      },
      {
        id: 'BESS-KUR-03',
        plant_id: 'PL-S006',
        plant_name: 'Kurnool Ultra Storage Hub',
        capacity_mwh: 100,
        max_power_mw: 25,
        current_soc_pct: 82.0,
        current_power_mw: -8.0,
        mode: 'FREQUENCY_SUPPORT',
        cell_temp_c: 27.8,
        health_soh_pct: 99.1,
        cycle_count: 220,
        round_trip_eff_pct: 90.2,
        energy_stored_mwh: 82.0,
      },
      {
        id: 'BESS-MUP-04',
        plant_id: 'PL-W001',
        plant_name: 'Muppandal Wind Stabilizer BESS',
        capacity_mwh: 80,
        max_power_mw: 20,
        current_soc_pct: 55.6,
        current_power_mw: 5.4, // discharging to stabilize gust drops
        mode: 'AUTO',
        cell_temp_c: 26.4,
        health_soh_pct: 98.2,
        cycle_count: 512,
        round_trip_eff_pct: 87.5,
        energy_stored_mwh: 44.5,
      },
    ];

    // Realistic National Grid Frequency initialized around 50.00 Hz
    this.gridMetrics = {
      nominal_hz: 50.0,
      current_hz: 50.015,
      deviation_hz: 0.015,
      grid_inertia_mva_s: 4.8,
      rocos_hz_per_sec: 0.002,
      pfr_status: 'STABLE',
      curtailment_avoided_mwh: 342.8,
      curtailment_avoided_revenue_inr: 1474040, // ₹14.74 Lakhs saved from curtailment
      grid_status: 'NORMAL',
    };

    // ESG Carbon Ledger initialization with realistic day-to-date base
    this.carbonLedger = {
      co2_avoided_tonnes_today: 4892.4,
      co2_rate_kg_per_sec: 248.5,
      coal_saved_tonnes: 2690.8,
      trees_equivalent: 222380,
      vehicles_displaced: 1063,
      green_revenue_inr: 21548000, // ₹2.15 Cr today
      tod_current_tariff_inr_kwh: 4.25,
      tod_time_band: 'NORMAL',
      total_irec_generated: 4890,
      recent_certificates: this.generateInitialCertificates(),
    };

    // Standard Industrial SCADA Alert Threshold Rules
    this.customThresholds = [
      {
        id: 'TH-001',
        metric: 'Equipment Temperature',
        operator: '>=',
        threshold: 75.0,
        unit: '°C',
        severity: 'CRITICAL',
        description: 'Triggers active cooling and derates inverter output if IGBT core exceeds 75°C',
        is_triggered: false,
        current_value: 48.2,
      },
      {
        id: 'TH-002',
        metric: 'Wind Speed Cut-Out',
        operator: '>=',
        threshold: 25.0,
        unit: 'm/s',
        severity: 'CRITICAL',
        description: 'Automatic aerodynamic feathering & emergency mechanical brake engagement',
        is_triggered: false,
        current_value: 11.4,
      },
      {
        id: 'TH-003',
        metric: 'Grid Voltage Deviation',
        operator: '>=',
        threshold: 6.0,
        unit: '%',
        severity: 'WARNING',
        description: 'Automatic tap changer (OLTC) adjustment and reactive power (VAR) compensation',
        is_triggered: false,
        current_value: 1.8,
      },
      {
        id: 'TH-004',
        metric: 'Bearing Mechanical Vibration',
        operator: '>=',
        threshold: 2.5,
        unit: 'mm/s',
        severity: 'WARNING',
        description: 'Premature spalling warning and automated lube pump pulse injection',
        is_triggered: false,
        current_value: 0.85,
      },
      {
        id: 'TH-005',
        metric: 'Solar Soiling Loss Index',
        operator: '>=',
        threshold: 8.5,
        unit: '%',
        severity: 'INFO',
        description: 'Schedules robotic dry-brush cleaning cycle for high-dust sub-arrays',
        is_triggered: false,
        current_value: 3.2,
      },
    ];
  }

  private generateInitialCertificates(): IRECCertificate[] {
    const certs: IRECCertificate[] = [];
    const names = [
      'Bhadla Solar Park Ph-IV',
      'Pavagada Shakti Array',
      'Rewa Ultra Mega Solar',
      'Muppandal Wind Complex',
      'Jaisalmer Wind Farm',
      'Kurnool Ultra Array',
    ];

    for (let i = 0; i < 5; i++) {
      const plantName = names[i % names.length];
      const mwh = 150 + i * 40;
      const co2 = +(mwh * 0.82).toFixed(1);
      const hash = '0x' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
      const time = new Date(Date.now() - (5 - i) * 3600000).toISOString();

      certs.push({
        cert_id: `IREC-IND-2026-${(1000 + i).toString()}`,
        issue_time: time,
        plant_name: plantName,
        mwh_generated: mwh,
        co2_offset_t: co2,
        hash,
        status: i === 4 ? 'ISSUED' : 'VERIFIED',
      });
    }
    return certs;
  }

  public updateTick(totalCurrentMW: number, readings: SensorReading[]): void {
    const now = Date.now();
    const dtSeconds = Math.max(1, (now - this.lastTickTime) / 1000);
    this.lastTickTime = now;

    // 1. Grid Frequency Simulation with Droop Response
    const hour = (new Date().getUTCHours() + 5.5) % 24; // Indian Standard Time
    // Grid frequency wanders slightly around 50.00 Hz
    const freqNoise = (Math.sin(now / 15000) * 0.035 + (Math.random() - 0.5) * 0.015);
    const simulatedHz = +(50.0 + freqNoise).toFixed(3);
    const deviation = +(simulatedHz - 50.0).toFixed(3);

    let pfrStatus: 'STABLE' | 'UNDER_FREQ_SUPPORT' | 'OVER_FREQ_CURTAIL' = 'STABLE';
    if (deviation < -0.05) {
      pfrStatus = 'UNDER_FREQ_SUPPORT';
    } else if (deviation > 0.05) {
      pfrStatus = 'OVER_FREQ_CURTAIL';
    }

    this.gridMetrics = {
      nominal_hz: 50.0,
      current_hz: simulatedHz,
      deviation_hz: deviation,
      grid_inertia_mva_s: +(4.8 + Math.sin(now / 30000) * 0.3).toFixed(2),
      rocos_hz_per_sec: +(deviation / 10).toFixed(4),
      pfr_status: pfrStatus,
      curtailment_avoided_mwh: +(this.gridMetrics.curtailment_avoided_mwh + 0.012).toFixed(2),
      curtailment_avoided_revenue_inr: Math.round(this.gridMetrics.curtailment_avoided_revenue_inr + 0.012 * 4300),
      grid_status: Math.abs(deviation) > 0.08 ? 'ALERT' : 'NORMAL',
    };

    // 2. BESS Physics Simulation
    this.bessUnits.forEach((bess) => {
      // Dynamic power dispatch based on mode & frequency
      if (bess.mode === 'AUTO') {
        if (pfrStatus === 'UNDER_FREQ_SUPPORT') {
          // Discharge to assist grid
          bess.current_power_mw = +(bess.max_power_mw * 0.6).toFixed(1);
        } else if (pfrStatus === 'OVER_FREQ_CURTAIL') {
          // Charge to absorb excess
          bess.current_power_mw = -+(bess.max_power_mw * 0.7).toFixed(1);
        } else {
          // Normal solar daytime charging / evening discharge
          if (hour >= 9 && hour <= 16) {
            bess.current_power_mw = -+(bess.max_power_mw * 0.45).toFixed(1); // Charging
          } else if (hour >= 18 && hour <= 22) {
            bess.current_power_mw = +(bess.max_power_mw * 0.55).toFixed(1); // Discharging
          } else {
            bess.current_power_mw = +(Math.sin(now / 20000) * 4).toFixed(1);
          }
        }
      } else if (bess.mode === 'CHARGE') {
        bess.current_power_mw = -+(bess.max_power_mw * 0.75).toFixed(1);
      } else if (bess.mode === 'DISCHARGE') {
        bess.current_power_mw = +(bess.max_power_mw * 0.8).toFixed(1);
      } else if (bess.mode === 'IDLE') {
        bess.current_power_mw = 0;
      }

      // Update SoC (%)
      // Power (MW) * dt (hours) = MWh
      const deltaMWh = (bess.current_power_mw * (dtSeconds / 3600));
      // if discharging, energy stored decreases. If charging (-ve power), energy stored increases
      bess.energy_stored_mwh = Math.max(5, Math.min(bess.capacity_mwh, bess.energy_stored_mwh - deltaMWh));
      bess.current_soc_pct = +((bess.energy_stored_mwh / bess.capacity_mwh) * 100).toFixed(1);

      // Temperature changes with charge/discharge intensity
      const heatLoad = Math.abs(bess.current_power_mw) / bess.max_power_mw;
      bess.cell_temp_c = +(26.0 + heatLoad * 9.5 + Math.sin(now / 25000) * 0.8).toFixed(1);
    });

    // 3. Carbon ESG & Tariff Calculations
    // 1 MW = 1000 kW. Energy generated in dtSeconds = (totalCurrentMW * 1000) * (dtSeconds / 3600) kWh
    const genKWh = (totalCurrentMW * 1000) * (dtSeconds / 3600);
    this.accumulatedGenerationKWh += genKWh;

    // Time-of-Day Tariff Band
    let todTariff = 3.85;
    let todBand: 'OFF_PEAK' | 'NORMAL' | 'PEAK_MORNING' | 'PEAK_EVENING' = 'NORMAL';
    if (hour >= 6 && hour < 10) {
      todBand = 'PEAK_MORNING';
      todTariff = 4.85;
    } else if (hour >= 18 && hour < 22) {
      todBand = 'PEAK_EVENING';
      todTariff = 5.40;
    } else if (hour >= 23 || hour < 6) {
      todBand = 'OFF_PEAK';
      todTariff = 2.65;
    }

    // Rate of CO2 avoided: 0.82 kg/kWh * generation in kW = 0.82 * (totalCurrentMW * 1000) / 3600 kg/sec
    const co2Rate = +((0.82 * totalCurrentMW * 1000) / 3600).toFixed(1);
    const addedCO2Tonnes = (genKWh * 0.82) / 1000;
    const addedCoalTonnes = (genKWh * 0.45) / 1000;
    const addedRevenue = genKWh * todTariff;

    this.carbonLedger.co2_rate_kg_per_sec = Math.max(0, co2Rate);
    this.carbonLedger.co2_avoided_tonnes_today = +(this.carbonLedger.co2_avoided_tonnes_today + addedCO2Tonnes).toFixed(2);
    this.carbonLedger.coal_saved_tonnes = +(this.carbonLedger.coal_saved_tonnes + addedCoalTonnes).toFixed(2);
    this.carbonLedger.trees_equivalent = Math.round(this.carbonLedger.co2_avoided_tonnes_today * 45.45);
    this.carbonLedger.vehicles_displaced = Math.round(this.carbonLedger.co2_avoided_tonnes_today * 0.217);
    this.carbonLedger.green_revenue_inr = Math.round(this.carbonLedger.green_revenue_inr + addedRevenue);
    this.carbonLedger.tod_current_tariff_inr_kwh = todTariff;
    this.carbonLedger.tod_time_band = todBand;

    // Check if new I-REC certificate milestone is reached (every ~50 MWh)
    if (this.accumulatedGenerationKWh >= 50000) {
      this.accumulatedGenerationKWh = 0;
      const certCount = this.carbonLedger.recent_certificates.length;
      const newCert: IRECCertificate = {
        cert_id: `IREC-IND-2026-${(1005 + certCount).toString()}`,
        issue_time: new Date().toISOString(),
        plant_name: 'Suryasakti Renewable Pool',
        mwh_generated: 50,
        co2_offset_t: 41.0,
        hash: '0x' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10),
        status: 'VERIFIED',
      };
      this.carbonLedger.recent_certificates.unshift(newCert);
      if (this.carbonLedger.recent_certificates.length > 15) {
        this.carbonLedger.recent_certificates.pop();
      }
      this.carbonLedger.total_irec_generated += 50;
    }

    // 4. Update Custom Alert Threshold triggers against live sensor readings
    const maxTemp = readings.length > 0 ? Math.max(...readings.map((r) => r.equipment_temperature || 0)) : 48;
    const maxWind = readings.length > 0 ? Math.max(...readings.map((r) => r.wind_speed || 0)) : 11;
    const maxVibr = readings.length > 0 ? Math.max(...readings.map((r) => r.vibration || 0)) : 0.8;

    this.customThresholds.forEach((th) => {
      if (th.metric === 'Equipment Temperature') {
        th.current_value = +maxTemp.toFixed(1);
        th.is_triggered = maxTemp >= th.threshold;
      } else if (th.metric === 'Wind Speed Cut-Out') {
        th.current_value = +maxWind.toFixed(1);
        th.is_triggered = maxWind >= th.threshold;
      } else if (th.metric === 'Bearing Mechanical Vibration') {
        th.current_value = +maxVibr.toFixed(2);
        th.is_triggered = maxVibr >= th.threshold;
      } else if (th.metric === 'Grid Voltage Deviation') {
        th.current_value = Math.abs(deviation * 100);
        th.is_triggered = th.current_value >= th.threshold;
      }

      if (th.is_triggered && !th.last_triggered_time) {
        th.last_triggered_time = new Date().toISOString();
      }
    });
  }

  // Getters & Mutation Methods
  public getBESSUnits(): BESSUnit[] {
    return this.bessUnits;
  }

  public setBESSMode(unitId: string, mode: BESSMode): BESSUnit | undefined {
    const unit = this.bessUnits.find((u) => u.id === unitId);
    if (unit) {
      unit.mode = mode;
    }
    return unit;
  }

  public getGridMetrics(): GridFrequencyMetrics {
    return this.gridMetrics;
  }

  public getCarbonLedger(): CarbonESGLedger {
    return this.carbonLedger;
  }

  public getCustomThresholds(): CustomAlertThreshold[] {
    return this.customThresholds;
  }

  public updateThresholdValue(id: string, threshold: number): CustomAlertThreshold | undefined {
    const item = this.customThresholds.find((t) => t.id === id);
    if (item) {
      item.threshold = threshold;
    }
    return item;
  }
}
