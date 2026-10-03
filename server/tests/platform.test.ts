/**
 * Automated Verification Suite for Renewable Energy Intelligence & Risk Assessment Platform
 * Tests all core backend engines, mathematical models, anomaly detection, and ML logic.
 */

import { SensorSimulator } from '../engines/sensorSimulator';
import { DataQualityEngine } from '../engines/dataQuality';
import { AnomalyDetectionEngine } from '../engines/anomalyDetector';
import { AdvancedRiskEngine } from '../engines/riskEngine';
import { SparkRDDProcessingEngine } from '../engines/sparkSimulator';
import { MLRiskPredictor } from '../engines/mlPredictor';
import { EnergyForecastingEngine } from '../engines/forecaster';
import { INITIAL_PLANTS } from '../data/plants';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PLATFORM TEST SUITE & MATHEMATICAL VERIFICATION');
  console.log('======================================================\n');

  // Test 1: Sensor Simulation & Physics Limits
  console.log('--- 1. Testing Sensor Simulator Physics Equations ---');
  const simulator = new SensorSimulator(INITIAL_PLANTS);
  const normalBatch = simulator.generateReadings('NORMAL');
  const solarReading = normalBatch.find((r) => r.plant_id === 'PL-S001')!;
  const windReading = normalBatch.find((r) => r.plant_id === 'PL-W001')!;
  const solarPlant = INITIAL_PLANTS.find((p) => p.plant_id === 'PL-S001')!;
  const windPlant = INITIAL_PLANTS.find((p) => p.plant_id === 'PL-W001')!;

  assert(solarReading.power_generated >= 0, 'Solar power generated must be non-negative');
  assert(solarReading.power_generated <= solarPlant.capacity_mw * 1.05, 'Solar power cannot exceed capacity margin');
  assert(solarReading.solar_irradiance >= 0 && solarReading.solar_irradiance <= 1200, 'Solar irradiance within physical limits');

  assert(windReading.power_generated >= 0, 'Wind power generated must be non-negative');
  assert(windReading.power_generated <= windPlant.capacity_mw * 1.05, 'Wind power cannot exceed capacity margin');
  assert(windReading.wind_speed >= 0 && windReading.wind_speed <= 35, 'Wind speed within physical limits');

  // Test 2: Fault Injection & Equipment Failure
  console.log('\n--- 2. Testing Fault Injection Scenario (EQUIPMENT_FAILURE) ---');
  const failBatch = simulator.generateReadings('EQUIPMENT_FAILURE', 'PL-S001');
  const failReading = failBatch.find((r) => r.plant_id === 'PL-S001')!;
  assert(failReading.vibration >= 4.0, 'Equipment failure should induce severe vibration spike');
  assert(failReading.equipment_temperature >= 70, 'Equipment failure should induce thermal runaway');
  assert(failReading.equipment_status === 'FAILED', 'Status should be marked FAILED');

  // Test 3: Data Quality Engine
  console.log('\n--- 3. Testing Data Quality Validation Engine ---');
  const dqEngine = new DataQualityEngine();
  const testBatch = [
    solarReading,
    windReading,
    failReading,
    { ...solarReading, reading_id: solarReading.reading_id }, // Duplicate
  ];
  const { report: dqReport } = dqEngine.validateBatch(testBatch);
  assert(dqReport.score >= 0 && dqReport.score <= 100, 'Data quality score must be normalized 0-100');
  assert(dqReport.total_records === 4, 'Correct record intake count');
  assert(dqReport.duplicates_removed >= 1, 'Data Quality engine successfully removed duplicates');

  // Test 4: Anomaly Detection Engine
  console.log('\n--- 4. Testing Statistical Anomaly Detection ---');
  const anomalyEngine = new AnomalyDetectionEngine();
  const anomalies = anomalyEngine.detectAnomalies(solarPlant, failReading, 85);
  assert(anomalies.length > 0, 'Anomaly detector should flag equipment failure readings');
  const tempAnomaly = anomalies.find((a) => a.anomaly_type === 'THERMAL_OVERHEAT');
  assert(!!tempAnomaly, 'Thermal overheat anomaly must be flagged');

  // Test 5: Explainable Risk Engine Mathematical Constraints
  console.log('\n--- 5. Testing Explainable Risk Scoring Engine ---');
  const riskEngine = new AdvancedRiskEngine();
  const nominalRisk = riskEngine.evaluateRisk(solarPlant, solarReading);
  assert(nominalRisk.risk_score >= 0 && nominalRisk.risk_score <= 100, 'Nominal risk score bounded [0, 100]');
  assert(nominalRisk.factors.length === 6, 'Risk engine must evaluate 6 distinct factor weights');

  const failureRisk = riskEngine.evaluateRisk(solarPlant, failReading);
  assert(failureRisk.risk_score >= 60, 'Equipment failure reading must trigger HIGH/CRITICAL risk (>=60)');
  assert(failureRisk.risk_level === 'HIGH' || failureRisk.risk_level === 'CRITICAL', 'Risk level must escalate');
  assert(failureRisk.reasons.length > 0, 'Explainable reasons must be provided in natural language');

  // Test 6: Spark RDD Distributed Benchmark Engine
  console.log('\n--- 6. Testing Apache Spark RDD Distributed Engine ---');
  const sparkEngine = new SparkRDDProcessingEngine();
  const sparkJob = sparkEngine.runRDDJob(100000);
  assert(sparkJob.record_count === 100000, 'Processed exact record scale');
  assert(sparkJob.rdd_pipeline.length === 6, 'Executed all 6 canonical RDD transformations');
  assert(sparkJob.throughput_records_sec > 10000, 'Throughput exceeds distributed performance criteria');
  assert(sparkJob.comparison.speedup_factor > 1.5, 'Spark distributed execution achieves measurable speedup');

  // Test 7: MLlib Risk Predictor & Confusion Matrix
  console.log('\n--- 7. Testing Spark MLlib Multi-Class Classifier ---');
  const mlPredictor = new MLRiskPredictor();
  const mlResults = mlPredictor.trainModels(1500);
  assert(mlResults.randomForest.accuracy > 0.70, 'Random Forest model accuracy exceeds 70% baseline');
  assert(mlResults.logisticRegression.accuracy > 0.65, 'Logistic Regression accuracy exceeds 65% baseline');
  assert(mlResults.randomForest.confusion_matrix.matrix.length === 5, '5x5 multi-class confusion matrix generated');

  // Test 8: 24h Energy Forecaster
  console.log('\n--- 8. Testing 24-Hour Energy Production Forecaster ---');
  const forecaster = new EnergyForecastingEngine();
  const forecast = forecaster.generate24hForecast(solarPlant, solarReading.power_generated);
  assert(forecast.length === 25, '25 hourly data points (-6h to +18h) generated');
  forecast.forEach((f) => {
    assert(f.predicted_power >= 0, 'Predicted power must be non-negative');
    assert(f.confidence_upper >= f.confidence_lower, 'Confidence upper bound must exceed lower bound');
  });

  console.log('\n======================================================');
  console.log('🎉 ALL AUTOMATED TESTS & VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
