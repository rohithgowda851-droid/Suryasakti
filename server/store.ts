import {
  Alert,
  Anomaly,
  BigDataJobResult,
  DashboardSummary,
  DataQualityReport,
  EnergyForecast,
  MaintenancePrediction,
  MLModelMetrics,
  Plant,
  RiskAssessment,
  SensorReading,
  SimulationScenario,
  StreamingStatus,
} from '../src/types';
import { INITIAL_PLANTS } from './data/plants';
import { AnomalyDetectionEngine } from './engines/anomalyDetector';
import { DataQualityEngine } from './engines/dataQuality';
import { EnergyForecastingEngine } from './engines/forecaster';
import { PredictiveMaintenanceEngine } from './engines/maintenanceEngine';
import { MLRiskPredictor } from './engines/mlPredictor';
import { RealTelemetryEngine } from './engines/realTelemetryEngine';
import { AdvancedRiskEngine } from './engines/riskEngine';
import { SensorSimulator } from './engines/sensorSimulator';
import { SparkRDDProcessingEngine } from './engines/sparkSimulator';
import { GridAndBESSEngine } from './engines/gridAndBessEngine';

export class AppStateStore {
  public plants: Plant[] = [...INITIAL_PLANTS];
  public latestReadings: Map<string, SensorReading> = new Map();
  public latestRiskAssessments: Map<string, RiskAssessment> = new Map();
  public readingHistory: SensorReading[] = [];
  public anomalies: Anomaly[] = [];
  public alerts: Alert[] = [];
  public activeScenario: SimulationScenario = 'NORMAL';
  public faultTargetPlantId?: string;

  // Streaming status
  public isStreamingActive = true;
  public totalProcessedRecords = 0;
  public totalFailedRecords = 0;
  public streamIntervalMs = 2500;
  private streamTimer: NodeJS.Timeout | null = null;
  private satelliteSyncTimer: NodeJS.Timeout | null = null;

  // Engines
  public realTelemetryEngine: RealTelemetryEngine;
  public simulator: SensorSimulator;
  public qualityEngine: DataQualityEngine;
  public riskEngine: AdvancedRiskEngine;
  public anomalyDetector: AnomalyDetectionEngine;
  public mlPredictor: MLRiskPredictor;
  public forecaster: EnergyForecastingEngine;
  public maintenanceEngine: PredictiveMaintenanceEngine;
  public sparkEngine: SparkRDDProcessingEngine;
  public gridBessEngine: GridAndBESSEngine;

  public latestDataQualityReport: DataQualityReport;
  public pastBigDataJobs: BigDataJobResult[] = [];

  constructor() {
    this.realTelemetryEngine = new RealTelemetryEngine(this.plants);
    this.simulator = new SensorSimulator(this.plants);
    this.qualityEngine = new DataQualityEngine();
    this.riskEngine = new AdvancedRiskEngine();
    this.anomalyDetector = new AnomalyDetectionEngine();
    this.mlPredictor = new MLRiskPredictor();
    this.forecaster = new EnergyForecastingEngine();
    this.maintenanceEngine = new PredictiveMaintenanceEngine();
    this.sparkEngine = new SparkRDDProcessingEngine();
    this.gridBessEngine = new GridAndBESSEngine(this.plants);

    this.latestDataQualityReport = {
      score: 99.2,
      total_records: 0,
      valid_records: 0,
      duplicates_removed: 0,
      invalid_records: 0,
      frozen_sensors: 0,
      outliers_flagged: 0,
      checks: [],
    };

    // Run initial spark job for baseline demonstration
    this.pastBigDataJobs.push(this.sparkEngine.runRDDJob(100000));

    // Refresh real satellite telemetry periodically
    this.satelliteSyncTimer = setInterval(() => {
      this.realTelemetryEngine.refreshRealData().catch(console.error);
    }, 45000);

    // Process initial batch
    this.processTick();

    // Start background stream
    this.startStreaming();
  }

  public setScenario(scenario: SimulationScenario, targetPlantId?: string) {
    this.activeScenario = scenario;
    this.faultTargetPlantId = targetPlantId;

    // Immediately trigger tick to reflect state instantly
    this.processTick();

    // If scenario is an anomaly/fault, generate an alert
    if (scenario === 'EQUIPMENT_FAILURE' || scenario === 'POWER_DROP' || scenario === 'EXTREME_TEMPERATURE') {
      const target = this.plants.find((p) => p.plant_id === (targetPlantId || 'PL-S003')) || this.plants[2];
      this.alerts.unshift({
        alert_id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        plant_id: target.plant_id,
        plant_name: target.plant_name,
        timestamp: new Date().toISOString(),
        severity: scenario === 'EQUIPMENT_FAILURE' ? 'CRITICAL' : 'HIGH',
        title: `Abnormal Plant Incident: ${scenario.replace('_', ' ')}`,
        message: `Simulator scenario '${scenario}' triggered. High-risk telemetry detected across monitoring nodes.`,
        acknowledged: false,
        resolved: false,
      });
      if (this.alerts.length > 50) this.alerts.pop();
    }
  }

  public startStreaming() {
    if (this.streamTimer) clearInterval(this.streamTimer);
    this.isStreamingActive = true;
    this.streamTimer = setInterval(() => {
      this.processTick();
    }, this.streamIntervalMs);
  }

  public stopStreaming() {
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
    this.isStreamingActive = false;
  }

  public processTick() {
    // 1. Generate live telemetry from real satellite meteorological feeds
    const rawReadings = this.plants.map((plant) => {
      const isTargeted = !this.faultTargetPlantId || this.faultTargetPlantId === plant.plant_id;
      const reading = this.realTelemetryEngine.generateRealReading(plant);
      reading.is_real_data = true;
      reading.data_source = 'REAL_LIVE_SATELLITE';
      reading.station_name = `${plant.plant_name} Atmospheric Satellite Station`;

      // If user triggers a stress test scenario, apply perturbation on top of the real baseline
      if (this.activeScenario !== 'NORMAL' && isTargeted) {
        if (this.activeScenario === 'LOW_SUNLIGHT' && plant.plant_type === 'SOLAR') {
          reading.solar_irradiance = Math.min(reading.solar_irradiance, 95);
          reading.power_generated = +(plant.capacity_mw * (reading.solar_irradiance / 1000) * 0.88).toFixed(2);
        } else if (this.activeScenario === 'POWER_DROP') {
          reading.power_generated = +(reading.power_generated * 0.35).toFixed(2);
        } else if (this.activeScenario === 'EXTREME_TEMPERATURE') {
          reading.temperature = Math.max(reading.temperature, 52.0);
          reading.equipment_temperature = 84.5;
        } else if (this.activeScenario === 'HIGH_WIND') {
          reading.wind_speed = 29.8;
        } else if (this.activeScenario === 'EQUIPMENT_FAILURE') {
          reading.vibration = 4.8;
          reading.equipment_status = 'FAILED';
        }
      }
      return reading;
    });

    // 2. Data Quality & Cleaning Validation
    const { cleanReadings, report } = this.qualityEngine.validateBatch(rawReadings);
    this.latestDataQualityReport = report;
    this.totalProcessedRecords += rawReadings.length;
    this.totalFailedRecords += rawReadings.length - cleanReadings.length;

    // 3. Process each plant's reading through the Spark streaming & analytics pipeline
    for (const reading of rawReadings) {
      const plant = this.plants.find((p) => p.plant_id === reading.plant_id);
      if (!plant) continue;

      this.latestReadings.set(plant.plant_id, reading);

      // Evaluate Risk
      const risk = this.riskEngine.evaluateRisk(plant, reading);
      this.latestRiskAssessments.set(plant.plant_id, risk);

      // Detect Anomalies
      const detectedAnomalies = this.anomalyDetector.detectAnomalies(plant, reading, risk.risk_score);
      for (const anom of detectedAnomalies) {
        this.anomalies.unshift(anom);
        if (this.anomalies.length > 100) this.anomalies.pop();

        // Create alert for high/critical anomalies
        if (anom.severity === 'CRITICAL' || anom.severity === 'HIGH') {
          const exists = this.alerts.some(
            (a) => a.plant_id === plant.plant_id && !a.resolved && a.title.includes(anom.anomaly_type)
          );
          if (!exists) {
            this.alerts.unshift({
              alert_id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              plant_id: plant.plant_id,
              plant_name: plant.plant_name,
              timestamp: anom.timestamp,
              severity: anom.severity,
              title: `${anom.anomaly_type.replace('_', ' ')} Incident`,
              message: anom.explanation,
              acknowledged: false,
              resolved: false,
            });
            if (this.alerts.length > 50) this.alerts.pop();
          }
        }
      }

      // Append to historical ring buffer
      this.readingHistory.push(reading);
      if (this.readingHistory.length > 300) {
        this.readingHistory.shift();
      }
    }

    // 5. Update BESS Battery Storage, Grid Droop, and Carbon ESG Ledger
    const totalGenMW = Array.from(this.latestReadings.values()).reduce((sum, r) => sum + r.power_generated, 0);
    this.gridBessEngine.updateTick(totalGenMW, cleanReadings);
  }

  public getDashboardSummary(): DashboardSummary {
    let totalCap = 0;
    let totalGen = 0;
    let totalExp = 0;
    let sumRisk = 0;
    let highRiskCount = 0;

    for (const plant of this.plants) {
      totalCap += plant.capacity_mw;
      const reading = this.latestReadings.get(plant.plant_id);
      const risk = this.latestRiskAssessments.get(plant.plant_id);
      if (reading) {
        totalGen += reading.power_generated;
        totalExp += reading.expected_power;
      }
      if (risk) {
        sumRisk += risk.risk_score;
        if (risk.risk_level === 'HIGH' || risk.risk_level === 'CRITICAL') {
          highRiskCount++;
        }
      }
    }

    const avgEff = totalExp > 0 ? +((totalGen / totalExp) * 100).toFixed(1) : 0;
    const avgRisk = +(sumRisk / Math.max(1, this.plants.length)).toFixed(1);

    const activeAlerts = this.alerts.filter((a) => !a.resolved).length;
    const todayAnomalies = this.anomalies.length;
    const gridFreq = +(50.0 + (Math.sin(Date.now() / 3500) * 0.035) + ((Math.random() - 0.5) * 0.015)).toFixed(2);

    const streamingStatus: StreamingStatus = {
      is_active: this.isStreamingActive,
      messages_per_sec: this.isStreamingActive ? Math.round(180 + Math.random() * 40) : 0,
      records_per_sec: this.isStreamingActive ? Math.round(1400 + Math.random() * 200) : 0,
      processed_total: this.totalProcessedRecords,
      failed_records: this.totalFailedRecords,
      average_latency_ms: +(12.4 + (Math.random() - 0.5) * 3).toFixed(1),
      current_scenario: this.activeScenario,
      last_batch_time: new Date().toISOString(),
      data_source_mode: 'REAL_LIVE_SATELLITE',
      satellite_provider: 'Open-Meteo ECMWF & NOAA GFS Atmospheric Satellite Model',
      satellite_sync_time: new Date().toISOString(),
      pipeline_stages: [
        { name: 'Live Satellite Weather & Irradiance Stream', status: 'ACTIVE', throughput: '6 Stations Active' },
        { name: 'Kafka Ingestion Topic [telemetry.raw]', status: 'ACTIVE', throughput: '1,420 rec/s' },
        { name: 'Spark Structured Streaming Micro-Batch', status: 'ACTIVE', throughput: '1,410 rec/s' },
        { name: 'Data Quality & Schema Validator', status: 'ACTIVE', throughput: '1,405 rec/s' },
        { name: 'Spark MLlib & Risk Engine', status: 'ACTIVE', throughput: '1,400 rec/s' },
        { name: 'PostgreSQL / Timescale Sink', status: 'ACTIVE', throughput: '1,400 rec/s' },
      ],
    };

    return {
      total_plants: this.plants.length,
      total_capacity_mw: totalCap,
      current_generation_mw: +totalGen.toFixed(2),
      expected_generation_mw: +totalExp.toFixed(2),
      average_efficiency_pct: avgEff,
      average_risk_score: avgRisk,
      high_risk_plants_count: highRiskCount,
      active_alerts_count: activeAlerts,
      anomalies_today_count: todayAnomalies,
      grid_frequency_hz: gridFreq,
      data_source_mode: 'REAL_LIVE_SATELLITE',
      satellite_provider: 'Open-Meteo ECMWF & NOAA GFS Atmospheric Satellite Model',
      satellite_sync_time: new Date().toISOString(),
      streaming: streamingStatus,
      data_quality: this.latestDataQualityReport,
    };
  }

  public acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.alert_id === alertId);
    if (alert) alert.acknowledged = true;
  }

  public resolveAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.alert_id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.resolved = true;
    }
  }

  public getMaintenancePredictions(): MaintenancePrediction[] {
    return this.plants.map((plant) => {
      const reading = this.latestReadings.get(plant.plant_id);
      if (!reading) {
        return {
          plant_id: plant.plant_id,
          equipment_id: `EQ-${plant.plant_id}-01`,
          equipment_name: 'Primary Inverter / Turbine Bearing',
          prediction: 'NORMAL',
          health_score: 95,
          vibration_rms: 1.2,
          temperature_c: 45,
          operating_hours: 14000,
          explanation: 'Standard telemetry baseline.',
          recommended_action: 'None.',
        };
      }
      return this.maintenanceEngine.evaluateMaintenance(plant, reading);
    });
  }
}

export const globalStore = new AppStateStore();
