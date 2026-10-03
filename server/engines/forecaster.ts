import { EnergyForecast, Plant } from '../../src/types';

export class EnergyForecastingEngine {
  public generate24hForecast(plant: Plant, currentPowerMW: number): EnergyForecast[] {
    const isSolar = plant.plant_type === 'SOLAR';
    const cap = plant.capacity_mw;
    const now = new Date();
    const currentHour = now.getHours();

    const forecasts: EnergyForecast[] = [];

    for (let i = -6; i <= 18; i++) {
      const forecastTime = new Date(now.getTime() + i * 3600 * 1000);
      const hour = (currentHour + i + 24) % 24;

      let expected = 0;
      let predicted = 0;

      if (isSolar) {
        // Solar diurnal curve (sun rises ~6am, peaks ~12-13pm, sets ~19pm)
        if (hour >= 6 && hour <= 19) {
          const solarAngle = Math.sin(((hour - 6) / 13) * Math.PI);
          expected = +(cap * 0.88 * Math.pow(solarAngle, 1.2)).toFixed(2);
          // Model estimation with weather attenuation factor
          const cloudFactor = 0.92 + 0.06 * Math.sin((i + currentHour) / 4);
          predicted = +(expected * cloudFactor).toFixed(2);
        } else {
          expected = 0;
          predicted = 0;
        }
      } else {
        // Wind diurnal & synoptic pattern
        const windBase = 0.65 + 0.25 * Math.sin(((hour + 4) / 24) * 2 * Math.PI);
        expected = +(cap * windBase).toFixed(2);
        const turbulenceFactor = 0.95 + 0.08 * Math.cos((i + currentHour) / 3);
        predicted = +(expected * turbulenceFactor).toFixed(2);
      }

      // 95% Confidence Interval spreads further into the future
      const uncertaintyBand = +(predicted * (0.04 + Math.abs(i) * 0.008)).toFixed(2);
      const lower = Math.max(0, +(predicted - uncertaintyBand).toFixed(2));
      const upper = +(predicted + uncertaintyBand).toFixed(2);

      const item: EnergyForecast = {
        timestamp: forecastTime.toISOString(),
        hour_offset: i,
        expected_power: expected,
        predicted_power: predicted,
        confidence_lower: lower,
        confidence_upper: upper,
      };

      if (i <= 0) {
        // Past / current hours have actual measured power
        item.actual_power = i === 0 ? currentPowerMW : +(expected * (0.97 + (Math.random() - 0.5) * 0.06)).toFixed(2);
      }

      forecasts.push(item);
    }

    return forecasts;
  }
}
