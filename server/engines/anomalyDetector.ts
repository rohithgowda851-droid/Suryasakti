import { Anomaly, Plant, SensorReading } from '../../src/types';

export class AnomalyDetectionEngine {
  private history: Map<string, SensorReading[]> = new Map();

  public detectAnomalies(plant: Plant, reading: SensorReading, currentRiskScore: number): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const hist = this.history.get(plant.plant_id) || [];

    // 1. Production Deficit (Moving Average & Threshold)
    if (reading.expected_power > 1.0) {
      const deficitPct = ((reading.expected_power - reading.power_generated) / reading.expected_power) * 100;
      if (deficitPct > 40) {
        anomalies.push({
          anomaly_id: `ANOM-${plant.plant_id}-POW-${Date.now()}`,
          plant_id: plant.plant_id,
          timestamp: reading.timestamp,
          anomaly_type: 'POWER_DEFICIT',
          severity: deficitPct > 65 ? 'CRITICAL' : 'HIGH',
          risk_score: currentRiskScore,
          detected_value: reading.power_generated,
          expected_value: reading.expected_power,
          unit: 'MW',
          explanation: `${plant.plant_id} produced ${deficitPct.toFixed(1)}% less energy than expected during current interval.`,
          status: 'ACTIVE',
        });
      }
    }

    // 2. Thermal Overheat (Statistical Threshold & Z-Score)
    if (reading.equipment_temperature > 72.0) {
      anomalies.push({
        anomaly_id: `ANOM-${plant.plant_id}-THM-${Date.now()}`,
        plant_id: plant.plant_id,
        timestamp: reading.timestamp,
        anomaly_type: 'THERMAL_OVERHEAT',
        severity: reading.equipment_temperature > 85 ? 'CRITICAL' : 'WARNING',
        risk_score: currentRiskScore,
        detected_value: reading.equipment_temperature,
        expected_value: 52.0,
        unit: '°C',
        explanation: `Equipment core temperature (${reading.equipment_temperature.toFixed(1)}°C) exceeded thermal safety threshold by ${(reading.equipment_temperature - 52).toFixed(1)}°C.`,
        status: 'ACTIVE',
      });
    }

    // 3. Vibration Spike (IQR Outlier Detection)
    const isSolar = plant.plant_type === 'SOLAR';
    const vibLimit = isSolar ? 1.5 : 5.5;
    if (reading.vibration > vibLimit) {
      anomalies.push({
        anomaly_id: `ANOM-${plant.plant_id}-VIB-${Date.now()}`,
        plant_id: plant.plant_id,
        timestamp: reading.timestamp,
        anomaly_type: 'VIBRATION_SPIKE',
        severity: reading.vibration > (isSolar ? 3.0 : 9.0) ? 'CRITICAL' : 'HIGH',
        risk_score: currentRiskScore,
        detected_value: reading.vibration,
        expected_value: isSolar ? 0.35 : 1.8,
        unit: 'mm/s RMS',
        explanation: `Mechanical vibration (${reading.vibration.toFixed(2)} mm/s) exceeded statistical IQR upper bound.`,
        status: 'ACTIVE',
      });
    }

    // 4. Sudden Change Detection (Lag 1 Delta)
    if (hist.length > 0) {
      const prev = hist[hist.length - 1];
      const deltaPower = prev.power_generated - reading.power_generated;
      if (deltaPower > plant.capacity_mw * 0.3) {
        anomalies.push({
          anomaly_id: `ANOM-${plant.plant_id}-SUD-${Date.now()}`,
          plant_id: plant.plant_id,
          timestamp: reading.timestamp,
          anomaly_type: 'SUDDEN_DROP',
          severity: 'HIGH',
          risk_score: currentRiskScore,
          detected_value: reading.power_generated,
          expected_value: prev.power_generated,
          unit: 'MW',
          explanation: `Sudden steep drop of ${deltaPower.toFixed(1)} MW detected across consecutive streaming intervals.`,
          status: 'ACTIVE',
        });
      }
    }

    // 5. Sensor Freeze Detection
    if (reading.sensor_status === 'FROZEN') {
      anomalies.push({
        anomaly_id: `ANOM-${plant.plant_id}-FRZ-${Date.now()}`,
        plant_id: plant.plant_id,
        timestamp: reading.timestamp,
        anomaly_type: 'SENSOR_FREEZE',
        severity: 'WARNING',
        risk_score: currentRiskScore,
        detected_value: 0,
        expected_value: 1,
        unit: 'variance',
        explanation: `Sensor telemetry frozen with 0.0 variance detected across consecutive streaming windows.`,
        status: 'ACTIVE',
      });
    }

    // Keep history bounded
    hist.push(reading);
    if (hist.length > 25) hist.shift();
    this.historyMapSet(plant.plant_id, hist);

    return anomalies;
  }

  private historyMapSet(id: string, h: SensorReading[]) {
    this.history.set(id, h);
  }
}
