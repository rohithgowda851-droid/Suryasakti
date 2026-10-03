import {
  Alert,
  Anomaly,
  BESSMode,
  BESSUnit,
  BigDataJobResult,
  CarbonESGLedger,
  CustomAlertThreshold,
  DashboardSummary,
  DataQualityReport,
  EnergyForecast,
  GridFrequencyMetrics,
  MaintenancePrediction,
  MLModelMetrics,
  Plant,
  RiskAssessment,
  SensorReading,
  SimulationScenario,
  StreamingStatus,
} from '../types';

export interface PlantWithState extends Plant {
  latest_reading: SensorReading | null;
  latest_risk: RiskAssessment | null;
}

export interface PlantDetailResponse {
  plant: Plant;
  latest_reading: SensorReading | null;
  latest_risk: RiskAssessment | null;
  history: SensorReading[];
  forecast: EnergyForecast[];
  anomalies: Anomaly[];
  maintenance: MaintenancePrediction | null;
  satellite_observation?: RealSatelliteObservation | null;
}

export interface RealSatelliteObservation {
  plant_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  observation_time: string;
  temperature_c: number;
  relative_humidity_pct: number;
  surface_pressure_hpa: number;
  wind_speed_10m_ms: number;
  wind_speed_100m_ms: number;
  wind_direction_deg: number;
  shortwave_radiation_wm2: number;
  direct_normal_irradiance_wm2: number;
  cloud_cover_pct: number;
  last_updated: string;
  source: string;
}

export interface SatelliteStatusResponse {
  status: string;
  provider: string;
  is_live_real: boolean;
  station_count: number;
  last_sync: string;
  observations: RealSatelliteObservation[];
}

export interface CoordinatesLookupResult {
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  temperature_c: number;
  humidity_pct: number;
  solar_irradiance_wm2: number;
  dni_wm2: number;
  wind_speed_10m_ms: number;
  wind_speed_100m_ms: number;
  wind_direction_deg: number;
  cloud_cover_pct: number;
  surface_pressure_hpa: number;
  estimated_solar_yield_mw_per_100mw: number;
  estimated_wind_yield_mw_per_100mw: number;
  observation_time: string;
  source: string;
}

/**
 * Robust JSON fetch helper that safely validates Content-Type and HTTP status
 * Prevents "Unexpected token '<', <!doctype... is not valid JSON" errors
 */
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      if (contentType.includes('application/json')) {
        const data = await res.json();
        errorDetail = data.error || errorDetail;
      } else {
        const text = await res.text();
        errorDetail = text.slice(0, 100);
      }
    } catch {
      // ignore parsing error
    }
    throw new Error(`API error (${url}): ${errorDetail}`);
  }

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(
      `Invalid response from ${url}: expected application/json but received ${contentType || 'non-JSON'} (${text.slice(0, 50)})`
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  async getDashboard(): Promise<DashboardSummary> {
    return safeFetchJson<DashboardSummary>('/api/dashboard');
  },

  async getPlants(): Promise<PlantWithState[]> {
    return safeFetchJson<PlantWithState[]>('/api/plants');
  },

  async getPlantDetail(id: string): Promise<PlantDetailResponse> {
    return safeFetchJson<PlantDetailResponse>(`/api/plants/${id}`);
  },

  async getReadings(plantId?: string, limit = 60): Promise<SensorReading[]> {
    const url = plantId ? `/api/readings?plant_id=${plantId}&limit=${limit}` : `/api/readings?limit=${limit}`;
    return safeFetchJson<SensorReading[]>(url);
  },

  async getRisk(): Promise<{ plant: Plant; assessment: RiskAssessment }[]> {
    return safeFetchJson<{ plant: Plant; assessment: RiskAssessment }[]>('/api/risk');
  },

  async getAnomalies(limit = 50): Promise<Anomaly[]> {
    return safeFetchJson<Anomaly[]>(`/api/anomalies?limit=${limit}`);
  },

  async getAlerts(): Promise<Alert[]> {
    return safeFetchJson<Alert[]>('/api/alerts');
  },

  async acknowledgeAlert(id: string): Promise<void> {
    await safeFetchJson<{ success: boolean }>(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
  },

  async resolveAlert(id: string): Promise<void> {
    await safeFetchJson<{ success: boolean }>(`/api/alerts/${id}/resolve`, { method: 'POST' });
  },

  async getForecast(plantId = 'PL-S001'): Promise<{ plant: Plant; forecast: EnergyForecast[] }> {
    return safeFetchJson<{ plant: Plant; forecast: EnergyForecast[] }>(`/api/forecast?plant_id=${plantId}`);
  },

  async getAnalytics(): Promise<{
    solar: { capacity_mw: number; current_generation_mw: number };
    wind: { capacity_mw: number; current_generation_mw: number };
    risk_distribution: Record<string, number>;
  }> {
    return safeFetchJson<{
      solar: { capacity_mw: number; current_generation_mw: number };
      wind: { capacity_mw: number; current_generation_mw: number };
      risk_distribution: Record<string, number>;
    }>('/api/analytics');
  },

  async getMaintenance(): Promise<MaintenancePrediction[]> {
    return safeFetchJson<MaintenancePrediction[]>('/api/maintenance');
  },

  async getBigDataJobs(): Promise<BigDataJobResult[]> {
    return safeFetchJson<BigDataJobResult[]>('/api/processing/jobs');
  },

  async runBigDataJob(records: number): Promise<BigDataJobResult> {
    return safeFetchJson<BigDataJobResult>('/api/processing/run-bigdata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
  },

  async setScenario(scenario: SimulationScenario, plantId?: string): Promise<void> {
    await safeFetchJson<{ success: boolean }>('/api/simulator/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, plant_id: plantId }),
    });
  },

  async startStreaming(): Promise<void> {
    await safeFetchJson<{ success: boolean }>('/api/simulator/start', { method: 'POST' });
  },

  async stopStreaming(): Promise<void> {
    await safeFetchJson<{ success: boolean }>('/api/simulator/stop', { method: 'POST' });
  },

  async getMLMetrics(): Promise<{
    randomForest: MLModelMetrics;
    logisticRegression: MLModelMetrics;
    activeModel: string;
  }> {
    return safeFetchJson<{
      randomForest: MLModelMetrics;
      logisticRegression: MLModelMetrics;
      activeModel: string;
    }>('/api/model/metrics');
  },

  async getDataQuality(): Promise<DataQualityReport> {
    try {
      return await safeFetchJson<DataQualityReport>('/api/data-quality');
    } catch {
      const dash = await this.getDashboard();
      return dash.data_quality;
    }
  },

  async triggerScenario(scenario: SimulationScenario, plantId?: string): Promise<void> {
    return this.setScenario(scenario, plantId);
  },

  async toggleStreaming(start: boolean): Promise<{ streaming: boolean }> {
    if (start) {
      await this.startStreaming();
      return { streaming: true };
    } else {
      await this.stopStreaming();
      return { streaming: false };
    }
  },

  async trainMLModel(datasetSize: number): Promise<any> {
    return safeFetchJson<any>('/api/model/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_size: datasetSize }),
    });
  },

  async getSatelliteStatus(): Promise<SatelliteStatusResponse> {
    return safeFetchJson<SatelliteStatusResponse>('/api/real-telemetry/status');
  },

  async syncSatelliteData(): Promise<{ success: boolean; message: string; station_count: number; synced_at: string }> {
    return safeFetchJson<{ success: boolean; message: string; station_count: number; synced_at: string }>('/api/real-telemetry/sync', { method: 'POST' });
  },

  async lookupCoordinates(lat: number, lon: number, name?: string): Promise<CoordinatesLookupResult> {
    const url = `/api/real-telemetry/lookup?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name || '')}`;
    return safeFetchJson<CoordinatesLookupResult>(url);
  },

  async getBESSUnits(): Promise<BESSUnit[]> {
    return safeFetchJson<BESSUnit[]>('/api/bess');
  },

  async setBESSMode(id: string, mode: BESSMode): Promise<BESSUnit> {
    return safeFetchJson<BESSUnit>(`/api/bess/${id}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
  },

  async getGridMetrics(): Promise<GridFrequencyMetrics> {
    return safeFetchJson<GridFrequencyMetrics>('/api/grid-frequency');
  },

  async getCarbonLedger(): Promise<CarbonESGLedger> {
    return safeFetchJson<CarbonESGLedger>('/api/esg-carbon');
  },

  async getThresholds(): Promise<CustomAlertThreshold[]> {
    return safeFetchJson<CustomAlertThreshold[]>('/api/thresholds');
  },

  async updateThreshold(id: string, threshold: number): Promise<CustomAlertThreshold> {
    return safeFetchJson<CustomAlertThreshold>(`/api/thresholds/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold }),
    });
  },
};
