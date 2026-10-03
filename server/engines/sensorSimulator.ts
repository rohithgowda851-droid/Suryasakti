import { Plant, SensorReading, SimulationScenario } from '../../src/types';

export class SensorSimulator {
  private baseReadings: Map<string, SensorReading> = new Map();
  private scenarioTicks: number = 0;

  constructor(private plants: Plant[]) {
    this.initBase();
  }

  private initBase() {
    const now = new Date().toISOString();
    for (const plant of this.plants) {
      const isSolar = plant.plant_type === 'SOLAR';
      const cap = plant.capacity_mw;

      const reading: SensorReading = {
        reading_id: `SR-${plant.plant_id}-${Date.now()}`,
        timestamp: now,
        plant_id: plant.plant_id,
        solar_irradiance: isSolar ? 880 : 15,
        temperature: 28.5,
        humidity: 42.0,
        wind_speed: isSolar ? 3.2 : 11.4,
        wind_direction: 215,
        pressure: 1012.4,
        panel_temperature: isSolar ? 44.2 : 22.0,
        vibration: isSolar ? 0.35 : 1.8,
        voltage: isSolar ? 1500 : 33000,
        current: isSolar ? (cap * 1000) / 1.5 : 850,
        power_generated: +(cap * 0.82).toFixed(2),
        expected_power: +(cap * 0.85).toFixed(2),
        equipment_temperature: 46.5,
        equipment_status: 'OPTIMAL',
        sensor_status: 'ONLINE',
      };
      this.baseReadings.set(plant.plant_id, reading);
    }
  }

  public generateReadings(scenario: SimulationScenario, injectFaultPlantId?: string): SensorReading[] {
    this.scenarioTicks++;
    const now = new Date().toISOString();
    const readings: SensorReading[] = [];

    for (const plant of this.plants) {
      const isSolar = plant.plant_type === 'SOLAR';
      const cap = plant.capacity_mw;
      const prev = this.baseReadings.get(plant.plant_id);

      // Determine if this specific plant is subject to scenario fault
      const isTargeted = !injectFaultPlantId || injectFaultPlantId === plant.plant_id;
      const activeScenario = isTargeted ? scenario : 'NORMAL';

      // Base jitter
      const jitter = (Math.random() - 0.5) * 0.04;
      const t = Date.now() / 1000;

      let irradiance = isSolar ? Math.max(0, 850 + 80 * Math.sin(t / 60) + (Math.random() - 0.5) * 30) : 10;
      let temp = 27 + 3 * Math.sin(t / 120) + (Math.random() - 0.5) * 1.5;
      let humidity = 45 + (Math.random() - 0.5) * 4;
      let windSpeed = isSolar ? 3.0 + Math.random() : 10.5 + 2.5 * Math.sin(t / 45) + (Math.random() - 0.5) * 1.5;
      let windDir = (210 + Math.sin(t / 30) * 15 + Math.random() * 5) % 360;
      let pressure = 1013 + (Math.random() - 0.5) * 2;
      let panelTemp = isSolar ? temp + irradiance * 0.022 + (Math.random() - 0.5) * 2 : temp;
      let vibration = isSolar ? 0.3 + Math.random() * 0.1 : 1.6 + Math.random() * 0.4;
      let equipTemp = 44 + (Math.random() - 0.5) * 3;
      let equipStatus: SensorReading['equipment_status'] = 'OPTIMAL';
      let sensorStatus: SensorReading['sensor_status'] = 'ONLINE';

      // Physics model for expected power
      let expectedPower = 0;
      if (isSolar) {
        const tempCoeff = 1 - 0.004 * Math.max(0, panelTemp - 25);
        expectedPower = +(cap * (irradiance / 1000) * tempCoeff * 0.94).toFixed(2);
      } else {
        // Wind power curve
        if (windSpeed < 3.0 || windSpeed > 25.0) {
          expectedPower = 0;
        } else if (windSpeed >= 12.0) {
          expectedPower = +(cap * 0.95).toFixed(2);
        } else {
          const ratio = (windSpeed - 3.0) / (12.0 - 3.0);
          expectedPower = +(cap * Math.pow(ratio, 3) * 0.95).toFixed(2);
        }
      }

      let powerGenerated = +(expectedPower * (1 + jitter)).toFixed(2);

      // Apply Scenario modifications
      switch (activeScenario) {
        case 'LOW_SUNLIGHT':
          if (isSolar) {
            irradiance = 140 + Math.random() * 60;
            expectedPower = +(cap * (irradiance / 1000) * 0.85).toFixed(2);
            powerGenerated = +(expectedPower * 0.92).toFixed(2);
          }
          break;

        case 'EXTREME_TEMPERATURE':
          temp = 51.5 + Math.random() * 3.5;
          panelTemp = 83.0 + Math.random() * 4.0;
          equipTemp = 79.5 + Math.random() * 5.5;
          equipStatus = 'WARMING';
          // Derating due to extreme heat
          powerGenerated = +(expectedPower * 0.68).toFixed(2);
          break;

        case 'HIGH_WIND':
          if (!isSolar) {
            windSpeed = 29.5 + Math.random() * 6.0;
            vibration = 7.8 + Math.random() * 3.2;
            equipStatus = 'DEGRADED';
            equipTemp = 68.0 + Math.random() * 4.0;
            // High wind cutout safety reduction
            powerGenerated = +(cap * 0.22).toFixed(2);
          }
          break;

        case 'POWER_DROP':
          // Inverter fault or sudden sub-string failure
          powerGenerated = +(expectedPower * 0.38).toFixed(2);
          equipStatus = 'DEGRADED';
          equipTemp = 62.0;
          break;

        case 'EQUIPMENT_FAILURE':
          equipStatus = 'FAILED';
          vibration = isSolar ? 4.8 : 12.5 + Math.random() * 4;
          equipTemp = 88.5 + Math.random() * 6.0;
          powerGenerated = +(expectedPower * 0.15).toFixed(2);
          break;

        case 'SENSOR_FAILURE':
          sensorStatus = 'FROZEN';
          // Send identical frozen readings or glitch values
          if (prev) {
            irradiance = prev.solar_irradiance;
            temp = prev.temperature;
            windSpeed = prev.wind_speed;
            powerGenerated = prev.power_generated;
          }
          break;

        case 'POWER_SPIKE':
          // Sudden spike over expected capacity (transient surge)
          powerGenerated = +(expectedPower * 1.48).toFixed(2);
          vibration = 4.2;
          equipTemp = 72.0;
          equipStatus = 'WARMING';
          break;

        case 'PERFORMANCE_DEGRADATION':
          // Gradual efficiency loss (fouling, blade degradation, aging)
          powerGenerated = +(expectedPower * 0.62).toFixed(2);
          equipStatus = 'DEGRADED';
          equipTemp = 58.0;
          break;

        case 'NORMAL':
        default:
          equipStatus = 'OPTIMAL';
          sensorStatus = 'ONLINE';
          break;
      }

      const voltage = isSolar ? 1500 + (Math.random() - 0.5) * 20 : 33000 + (Math.random() - 0.5) * 250;
      const current = powerGenerated > 0 ? +((powerGenerated * 1000000) / voltage).toFixed(1) : 0;

      const reading: SensorReading = {
        reading_id: `SR-${plant.plant_id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: now,
        plant_id: plant.plant_id,
        solar_irradiance: +irradiance.toFixed(1),
        temperature: +temp.toFixed(1),
        humidity: +humidity.toFixed(1),
        wind_speed: +windSpeed.toFixed(1),
        wind_direction: +windDir.toFixed(0),
        pressure: +pressure.toFixed(1),
        panel_temperature: +panelTemp.toFixed(1),
        vibration: +vibration.toFixed(2),
        voltage: +voltage.toFixed(1),
        current: +current.toFixed(1),
        power_generated: Math.max(0, +powerGenerated.toFixed(2)),
        expected_power: Math.max(0, +expectedPower.toFixed(2)),
        equipment_temperature: +equipTemp.toFixed(1),
        equipment_status: equipStatus,
        sensor_status: sensorStatus,
      };

      this.baseReadings.set(plant.plant_id, reading);
      readings.push(reading);
    }

    return readings;
  }
}
