import { Plant, RiskAssessment, RiskFactor, RiskLevel, SensorReading } from '../../src/types';

export class AdvancedRiskEngine {
  private historyMap: Map<string, SensorReading[]> = new Map();

  public evaluateRisk(plant: Plant, reading: SensorReading): RiskAssessment {
    const history = this.historyMap.get(plant.plant_id) || [];
    const prev = history[history.length - 1];

    // 1. Factor 1: Production Deviation (Weight: 0.28)
    // Measures deficit between Expected Power and Actual Power
    let prodDeviationRatio = 0;
    if (reading.expected_power > 0.5) {
      const diff = reading.expected_power - reading.power_generated;
      prodDeviationRatio = Math.max(0, diff / reading.expected_power);
    }
    const prodScore = Math.min(100, Math.round(prodDeviationRatio * 115));

    // 2. Factor 2: Equipment Temperature & Heat Index (Weight: 0.20)
    // Normal equipment temp is ~40-50°C. 70°C+ is elevated, 85°C+ is critical.
    let tempScore = 0;
    if (reading.equipment_temperature > 50) {
      tempScore = Math.min(100, Math.round(((reading.equipment_temperature - 50) / 40) * 100));
    }
    if (reading.panel_temperature > 70) {
      tempScore = Math.max(tempScore, Math.min(100, Math.round(((reading.panel_temperature - 70) / 25) * 100)));
    }

    // 3. Factor 3: Mechanical Vibration & Stress (Weight: 0.16)
    // Normal solar vibration < 0.8 mm/s, wind < 3.0 mm/s. Spikes > 6 mm/s indicate mechanical wear
    const isSolar = plant.plant_type === 'SOLAR';
    const vibThresh = isSolar ? 1.0 : 4.0;
    const vibMax = isSolar ? 4.0 : 12.0;
    let vibScore = 0;
    if (reading.vibration > vibThresh) {
      vibScore = Math.min(100, Math.round(((reading.vibration - vibThresh) / (vibMax - vibThresh)) * 100));
    }

    // 4. Factor 4: Environmental Extreme Stress (Weight: 0.14)
    // Wind gusts near cutout (25m/s), extreme ambient heat (>45°C), or severe drop
    let envScore = 0;
    if (reading.wind_speed > 20) {
      envScore = Math.max(envScore, Math.min(100, Math.round(((reading.wind_speed - 20) / 15) * 100)));
    }
    if (reading.temperature > 42) {
      envScore = Math.max(envScore, Math.min(100, Math.round(((reading.temperature - 42) / 15) * 100)));
    }

    // 5. Factor 5: Sensor Health & Telemetry Reliability (Weight: 0.12)
    let sensorScore = 0;
    if (reading.sensor_status === 'FROZEN') sensorScore = 85;
    else if (reading.sensor_status === 'ERROR') sensorScore = 95;
    else if (reading.sensor_status === 'INTERMITTENT') sensorScore = 45;

    // 6. Factor 6: Sudden Rate of Change (Temporal delta) (Weight: 0.10)
    let suddenChangeScore = 0;
    if (prev) {
      const deltaPower = Math.abs(prev.power_generated - reading.power_generated);
      const deltaRatio = plant.capacity_mw > 0 ? deltaPower / plant.capacity_mw : 0;
      if (deltaRatio > 0.2) {
        suddenChangeScore = Math.min(100, Math.round(deltaRatio * 200));
      }
    }

    // Weights formulation
    const weights = [
      { name: 'Production Deviation', score: prodScore, weight: 0.28 },
      { name: 'Equipment Temperature', score: tempScore, weight: 0.20 },
      { name: 'Mechanical Vibration', score: vibScore, weight: 0.16 },
      { name: 'Environmental Stress', score: envScore, weight: 0.14 },
      { name: 'Sensor Reliability', score: sensorScore, weight: 0.12 },
      { name: 'Sudden Delta Rate', score: suddenChangeScore, weight: 0.10 },
    ];

    let totalWeightedScore = 0;
    for (const w of weights) {
      totalWeightedScore += w.score * w.weight;
    }

    // Round total score 0 - 100
    const finalScore = Math.min(100, Math.max(0, Math.round(totalWeightedScore)));

    // Categorize Risk Level
    let riskLevel: RiskLevel = 'LOW';
    if (finalScore <= 20) riskLevel = 'LOW';
    else if (finalScore <= 40) riskLevel = 'MODERATE';
    else if (finalScore <= 60) riskLevel = 'ELEVATED';
    else if (finalScore <= 80) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    // Calculate contribution percentage for each factor
    const factors: RiskFactor[] = weights.map((w) => {
      const weightedScore = +(w.score * w.weight).toFixed(2);
      const contributionPercent = totalWeightedScore > 0 ? Math.round((weightedScore / totalWeightedScore) * 100) : 0;
      let status: RiskFactor['status'] = 'SAFE';
      if (w.score >= 70) status = 'DANGER';
      else if (w.score >= 35) status = 'WARNING';

      return {
        factor: w.name,
        score: w.score,
        weight: w.weight,
        weightedScore,
        contributionPercent,
        status,
      };
    });

    // Generate explainable natural-language reasons
    const reasons: string[] = [];
    const recommendations: string[] = [];

    if (prodDeviationRatio >= 0.2) {
      reasons.push(`Production ${Math.round(prodDeviationRatio * 100)}% below expected yield.`);
      recommendations.push('Inspect inverter subsystem and feeder line connections.');
    }
    if (reading.equipment_temperature >= 70) {
      reasons.push(`Equipment operating temperature elevated (${reading.equipment_temperature.toFixed(1)}°C).`);
      recommendations.push('Verify transformer coolant levels and forced-air blower operations.');
    }
    if (vibScore >= 60) {
      reasons.push(`Mechanical vibration amplitude anomalous (${reading.vibration.toFixed(2)} mm/s RMS).`);
      recommendations.push('Schedule urgent mechanical bearing vibration harmonic inspection.');
    }
    if (reading.wind_speed >= 25 && !isSolar) {
      reasons.push(`High wind gusts (${reading.wind_speed.toFixed(1)} m/s) approaching turbine structural limit.`);
      recommendations.push('Engage aerodynamic rotor pitch feathering for storm safety.');
    }
    if (reading.sensor_status === 'FROZEN') {
      reasons.push('Sensor telemetry frozen across successive observation cycles.');
      recommendations.push('Perform remote telemetry bridge reset or dispatch sensor recalibration.');
    }
    if (suddenChangeScore >= 50) {
      reasons.push('Sudden generation drop detected exceeding 20% plant capacity within single sample.');
      recommendations.push('Check breaker trip logs and circuit isolators.');
    }

    if (reasons.length === 0) {
      reasons.push('All parameters within baseline operating tolerance boundaries.');
      recommendations.push('Routine automated monitoring in progress.');
    }

    // Save history
    history.push(reading);
    if (history.length > 30) history.shift();
    this.historyMap.set(plant.plant_id, history);

    return {
      assessment_id: `RA-${plant.plant_id}-${Date.now()}`,
      plant_id: plant.plant_id,
      timestamp: reading.timestamp,
      risk_score: finalScore,
      risk_level: riskLevel,
      factors,
      reasons,
      recommendations,
    };
  }
}
