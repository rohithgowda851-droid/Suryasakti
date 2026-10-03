-- RENEWABLE ENERGY INTELLIGENCE & RISK ASSESSMENT PLATFORM
-- PostgreSQL + TimescaleDB Schema Definition

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 1. Plants Metadata Dimension Table
CREATE TABLE IF NOT EXISTS plants (
    plant_id VARCHAR(32) PRIMARY KEY,
    plant_name VARCHAR(255) NOT NULL,
    plant_type VARCHAR(16) NOT NULL CHECK (plant_type IN ('SOLAR', 'WIND')),
    capacity_mw NUMERIC(10, 2) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    region VARCHAR(128) NOT NULL,
    installation_date DATE NOT NULL,
    equipment_count INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Raw High-Frequency Sensor Telemetry (TimescaleDB Hypertable)
CREATE TABLE IF NOT EXISTS telemetry_readings (
    reading_id UUID DEFAULT uuid_generate_v4(),
    plant_id VARCHAR(32) NOT NULL REFERENCES plants(plant_id),
    timestamp TIMESTAMPTZ NOT NULL,
    power_generated NUMERIC(10, 3) NOT NULL,
    expected_power NUMERIC(10, 3) NOT NULL,
    temperature NUMERIC(6, 2) NOT NULL,
    equipment_temperature NUMERIC(6, 2) NOT NULL,
    humidity NUMERIC(5, 2) NOT NULL,
    vibration NUMERIC(6, 3) NOT NULL,
    solar_irradiance NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    wind_speed NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    wind_direction NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    voltage NUMERIC(8, 2) NOT NULL,
    current NUMERIC(8, 2) NOT NULL,
    panel_temperature NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    equipment_status VARCHAR(32) NOT NULL,
    sensor_status VARCHAR(32) NOT NULL,
    error_code VARCHAR(32) NOT NULL,
    CONSTRAINT pk_telemetry PRIMARY KEY (plant_id, timestamp)
);

-- Convert to Hypertable with 1-day chunks
SELECT create_hypertable('telemetry_readings', 'timestamp', if_not_exists => TRUE, chunk_time_interval => INTERVAL '1 day');

CREATE INDEX IF NOT EXISTS idx_telemetry_plant_time ON telemetry_readings (plant_id, timestamp DESC);

-- 3. Anomaly Events Log
CREATE TABLE IF NOT EXISTS anomaly_events (
    anomaly_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id VARCHAR(32) NOT NULL REFERENCES plants(plant_id),
    timestamp TIMESTAMPTZ NOT NULL,
    anomaly_type VARCHAR(64) NOT NULL,
    metric_name VARCHAR(64) NOT NULL,
    actual_value NUMERIC(10, 3) NOT NULL,
    expected_value NUMERIC(10, 3) NOT NULL,
    z_score NUMERIC(8, 3),
    iqr_distance NUMERIC(8, 3),
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    algorithm VARCHAR(32) NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_time ON anomaly_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_plant ON anomaly_events (plant_id, timestamp DESC);

-- 4. Explainable Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id VARCHAR(32) NOT NULL REFERENCES plants(plant_id),
    timestamp TIMESTAMPTZ NOT NULL,
    risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(16) NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL')),
    production_risk INT NOT NULL,
    thermal_risk INT NOT NULL,
    vibration_risk INT NOT NULL,
    error_risk INT NOT NULL,
    sensor_risk INT NOT NULL,
    reasons JSONB NOT NULL,
    factors JSONB NOT NULL,
    mitigation_advice TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_plant_time ON risk_assessments (plant_id, timestamp DESC);

-- 5. Operational Incident Alerts
CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR(64) PRIMARY KEY,
    plant_id VARCHAR(32) NOT NULL REFERENCES plants(plant_id),
    timestamp TIMESTAMPTZ NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    description TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status, timestamp DESC);

-- 6. Predictive Maintenance Forecasts
CREATE TABLE IF NOT EXISTS predictive_maintenance_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id VARCHAR(32) NOT NULL REFERENCES plants(plant_id),
    component VARCHAR(64) NOT NULL,
    likely_failure_type VARCHAR(128) NOT NULL,
    estimated_hours_remaining INT NOT NULL,
    confidence_pct INT NOT NULL,
    recommended_action TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Continuous Aggregate for Hourly Plant Rollups
CREATE MATERIALIZED VIEW IF NOT EXISTS plant_hourly_metrics
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp) AS bucket,
    plant_id,
    AVG(power_generated) AS avg_power_mw,
    MAX(power_generated) AS max_power_mw,
    AVG(equipment_temperature) AS avg_equip_temp,
    AVG(vibration) AS avg_vibration,
    COUNT(*) AS sample_count
FROM telemetry_readings
GROUP BY bucket, plant_id;
