export type PlantType = 'SOLAR' | 'WIND';
export type OperatingStatus = 'OPTIMAL' | 'DEGRADED' | 'MAINTENANCE' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
export type AnomalyType = 'POWER_DEFICIT' | 'THERMAL_OVERHEAT' | 'VIBRATION_SPIKE' | 'SENSOR_FREEZE' | 'VOLTAGE_FLUCTUATION' | 'SUDDEN_DROP';
export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type MaintenanceStatus = 'NORMAL' | 'ATTENTION' | 'MAINTENANCE_REQUIRED';
export type SimulationScenario =
  | 'NORMAL'
  | 'LOW_SUNLIGHT'
  | 'EXTREME_TEMPERATURE'
  | 'HIGH_WIND'
  | 'POWER_DROP'
  | 'EQUIPMENT_FAILURE'
  | 'SENSOR_FAILURE'
  | 'POWER_SPIKE'
  | 'PERFORMANCE_DEGRADATION';

export interface RegionalEcology {
  estimated_trees: number; // Estimated count of trees in the regional biome
  canopy_cover_pct: number; // Percentage forest canopy cover
  dominant_species: string[]; // Key native tree species
  biome_type: string; // Regional biome classification
  trees_equivalent_co2_offset: number; // Trees preserved per year by renewable generation
  protected_forest_area_km2: number; // Area of protected woodlands in square kilometers
}

export interface Plant {
  plant_id: string;
  plant_name: string;
  plant_type: PlantType;
  latitude: number;
  longitude: number;
  capacity_mw: number;
  installation_date: string;
  equipment_count: number;
  operating_status: OperatingStatus;
  region: string;
  regional_ecology?: RegionalEcology;
  // Site photo and compatibility fields
  id?: string;
  name?: string;
  type?: string;
  imageUrl?: string;
}

export interface SensorReading {
  reading_id: string;
  timestamp: string;
  plant_id: string;
  solar_irradiance: number; // W/m² (for solar)
  temperature: number; // °C ambient
  humidity: number; // %
  wind_speed: number; // m/s
  wind_direction: number; // degrees
  pressure: number; // hPa
  panel_temperature: number; // °C
  vibration: number; // mm/s RMS
  voltage: number; // V
  current: number; // A
  power_generated: number; // MW
  expected_power: number; // MW
  equipment_temperature: number; // °C
  equipment_status: 'OPTIMAL' | 'WARMING' | 'DEGRADED' | 'FAILED';
  sensor_status: 'ONLINE' | 'INTERMITTENT' | 'FROZEN' | 'ERROR';
  is_real_data?: boolean;
  data_source?: string;
  station_name?: string;
  cloud_cover?: number;
  direct_normal_irradiance?: number;
}

export interface RiskFactor {
  factor: string;
  score: number; // 0-100
  weight: number; // 0-1
  weightedScore: number;
  contributionPercent: number;
  status: 'SAFE' | 'WARNING' | 'DANGER';
}

export interface RiskAssessment {
  assessment_id: string;
  plant_id: string;
  timestamp: string;
  risk_score: number; // 0-100
  risk_level: RiskLevel;
  factors: RiskFactor[];
  reasons: string[];
  recommendations: string[];
}

export interface Anomaly {
  anomaly_id: string;
  plant_id: string;
  timestamp: string;
  anomaly_type: AnomalyType;
  severity: AlertSeverity;
  risk_score: number;
  detected_value: number;
  expected_value: number;
  unit: string;
  explanation: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface Alert {
  alert_id: string;
  plant_id: string;
  plant_name: string;
  timestamp: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  acknowledged: boolean;
  resolved: boolean;
  status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  description?: string;
  suggested_action?: string;
}

export type AlertItem = Alert;

export interface EnergyForecast {
  timestamp: string;
  hour_offset: number;
  actual_power?: number;
  expected_power: number;
  predicted_power: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface MLModelMetrics {
  model_name: string;
  algorithm: 'Random Forest' | 'Logistic Regression';
  trained_at: string;
  dataset_records: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: {
    classes: RiskLevel[];
    matrix: number[][];
  };
  feature_importance: { feature: string; importance: number }[];
}

export interface DataQualityReport {
  score: number; // 0-100
  total_records: number;
  valid_records: number;
  duplicates_removed: number;
  invalid_records: number;
  frozen_sensors: number;
  outliers_flagged: number;
  checks: {
    rule_name: string;
    description: string;
    passed: boolean;
    pass_rate: number;
  }[];
}

export interface MaintenancePrediction {
  plant_id: string;
  equipment_id: string;
  equipment_name: string;
  prediction: MaintenanceStatus;
  health_score: number; // 0-100
  vibration_rms: number;
  temperature_c: number;
  operating_hours: number;
  explanation: string;
  recommended_action: string;
  component?: string;
  confidence_pct?: number;
  likely_failure_type?: string;
  estimated_time_to_failure?: string;
  estimated_hours_remaining?: number;
}

export interface BigDataJobResult {
  job_id: string;
  record_count: number;
  partitions: number;
  execution_time_ms: number;
  throughput_records_sec: number;
  rdd_pipeline: {
    stage_id: number;
    stage_name: string;
    operation: string;
    input_records: number;
    output_records: number;
    time_ms: number;
  }[];
  memory_used_mb: number;
  comparison: {
    single_thread_time_ms: number;
    spark_distributed_time_ms: number;
    speedup_factor: number;
  };
}

export interface StreamingStatus {
  is_active: boolean;
  messages_per_sec: number;
  records_per_sec: number;
  processed_total: number;
  failed_records: number;
  average_latency_ms: number;
  current_scenario: SimulationScenario;
  last_batch_time: string;
  data_source_mode?: 'REAL_LIVE_SATELLITE' | 'HYBRID_SIMULATION';
  satellite_provider?: string;
  satellite_sync_time?: string;
  pipeline_stages: {
    name: string;
    status: 'ACTIVE' | 'IDLE' | 'BUSY';
    throughput: string;
  }[];
}

export interface DashboardSummary {
  total_plants: number;
  total_capacity_mw: number;
  current_generation_mw: number;
  expected_generation_mw: number;
  average_efficiency_pct: number;
  average_risk_score: number;
  high_risk_plants_count: number;
  active_alerts_count: number;
  anomalies_today_count: number;
  grid_frequency_hz?: number;
  scenario?: SimulationScenario;
  data_source_mode?: 'REAL_LIVE_SATELLITE' | 'HYBRID_SIMULATION';
  satellite_provider?: string;
  satellite_sync_time?: string;
  streaming: StreamingStatus;
  data_quality: DataQualityReport;
}

// BESS & Grid Frequency Regulation
export type BESSMode = 'AUTO' | 'CHARGE' | 'DISCHARGE' | 'IDLE' | 'SOLAR_SMOOTHING' | 'FREQUENCY_SUPPORT';

export interface BESSUnit {
  id: string;
  plant_id: string;
  plant_name: string;
  capacity_mwh: number;
  max_power_mw: number;
  current_soc_pct: number;
  current_power_mw: number; // positive = discharging to grid, negative = charging from renewables
  mode: BESSMode;
  cell_temp_c: number;
  health_soh_pct: number;
  cycle_count: number;
  round_trip_eff_pct: number;
  energy_stored_mwh: number;
}

export interface GridFrequencyMetrics {
  nominal_hz: number;
  current_hz: number;
  deviation_hz: number;
  grid_inertia_mva_s: number;
  rocos_hz_per_sec: number; // Rate of change of frequency
  pfr_status: 'STABLE' | 'UNDER_FREQ_SUPPORT' | 'OVER_FREQ_CURTAIL';
  curtailment_avoided_mwh: number;
  curtailment_avoided_revenue_inr: number;
  grid_status: 'NORMAL' | 'ALERT' | 'CRITICAL';
}

export interface IRECCertificate {
  cert_id: string;
  issue_time: string;
  plant_name: string;
  mwh_generated: number;
  co2_offset_t: number;
  hash: string;
  status: 'ISSUED' | 'VERIFIED' | 'REDEEMED';
}

export interface CarbonESGLedger {
  co2_avoided_tonnes_today: number;
  co2_rate_kg_per_sec: number;
  coal_saved_tonnes: number;
  trees_equivalent: number;
  vehicles_displaced: number;
  green_revenue_inr: number;
  tod_current_tariff_inr_kwh: number;
  tod_time_band: 'OFF_PEAK' | 'NORMAL' | 'PEAK_MORNING' | 'PEAK_EVENING';
  total_irec_generated: number;
  recent_certificates: IRECCertificate[];
}

export interface CustomAlertThreshold {
  id: string;
  metric: string;
  operator: '>' | '<' | '>=';
  threshold: number;
  unit: string;
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  description: string;
  is_triggered: boolean;
  current_value: number;
  last_triggered_time?: string;
}

