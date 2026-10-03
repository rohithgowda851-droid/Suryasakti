import { MaintenancePrediction, MaintenanceStatus, Plant, SensorReading } from '../../src/types';

export class PredictiveMaintenanceEngine {
  public evaluateMaintenance(plant: Plant, reading: SensorReading): MaintenancePrediction {
    const isSolar = plant.plant_type === 'SOLAR';
    const equipName = isSolar ? 'Central Inverter & Step-Up Transformer' : 'Main Bearing & Planetary Gearbox';
    const equipId = `EQ-${plant.plant_id}-01`;

    let prediction: MaintenanceStatus = 'NORMAL';
    let healthScore = 95;
    let explanation = 'Equipment operating well within nominal OEM vibration and temperature envelope.';
    let recommendedAction = 'Routine telemetry polling active. Next scheduled visual inspection in 45 days.';

    const vibThresholdWarn = isSolar ? 1.2 : 4.5;
    const vibThresholdCrit = isSolar ? 2.5 : 8.0;
    const tempThresholdWarn = 68;
    const tempThresholdCrit = 82;

    const isHighVib = reading.vibration >= vibThresholdCrit;
    const isMedVib = reading.vibration >= vibThresholdWarn;
    const isHighTemp = reading.equipment_temperature >= tempThresholdCrit;
    const isMedTemp = reading.equipment_temperature >= tempThresholdWarn;
    const isPowerDeficit = reading.expected_power > 2 && reading.power_generated < reading.expected_power * 0.7;

    if (isHighVib || isHighTemp || reading.equipment_status === 'FAILED') {
      prediction = 'MAINTENANCE_REQUIRED';
      healthScore = Math.max(15, Math.round(100 - (reading.vibration * 6 + (reading.equipment_temperature - 50) * 1.1)));
      explanation = `Equipment vibration (${reading.vibration.toFixed(2)} mm/s RMS) has spiked critically while core temperature reached ${reading.equipment_temperature.toFixed(1)}°C, indicating severe mechanical/thermal stress.`;
      recommendedAction = 'Dispatch field technicians for immediate isolator shutdown and rotor/inverter harmonic diagnostic.';
    } else if (isMedVib || isMedTemp || isPowerDeficit || reading.equipment_status === 'DEGRADED') {
      prediction = 'ATTENTION';
      healthScore = Math.max(55, Math.round(90 - (reading.vibration * 4 + (reading.equipment_temperature - 50) * 0.6)));
      explanation = `Equipment vibration has increased progressively while power output efficiency decreased by ${reading.expected_power > 0 ? Math.round(((reading.expected_power - reading.power_generated) / reading.expected_power) * 100) : 15}%.`;
      recommendedAction = 'Schedule non-intrusive oil lubrication sampling and thermographic drone inspection within 7 days.';
    } else {
      healthScore = Math.min(100, Math.round(98 - reading.vibration * 2));
    }

    return {
      plant_id: plant.plant_id,
      equipment_id: equipId,
      equipment_name: equipName,
      prediction,
      health_score: Math.min(100, Math.max(10, healthScore)),
      vibration_rms: reading.vibration,
      temperature_c: reading.equipment_temperature,
      operating_hours: 14200 + Math.floor(Math.random() * 500),
      explanation,
      recommended_action: recommendedAction,
    };
  }
}
