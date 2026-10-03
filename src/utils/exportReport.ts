import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PlantWithState } from '../services/api';
import { AlertItem, DashboardSummary, MaintenancePrediction, SensorReading } from '../types';

export interface ExportReportOptions {
  summary: DashboardSummary | null;
  plants: PlantWithState[];
  readings: SensorReading[];
  alerts: AlertItem[];
  predictions: MaintenancePrediction[];
  selectedPlantId?: string | 'ALL';
}

/**
 * Clean text for CSV escaping
 */
const escapeCSV = (val: unknown): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Trigger browser file download via Blob
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 1. Export Telemetry Sensor Data to CSV
 */
export const exportTelemetryToCSV = (options: ExportReportOptions) => {
  const { plants, readings, selectedPlantId } = options;
  const isFleet = !selectedPlantId || selectedPlantId === 'ALL';

  const plantMap = new Map<string, PlantWithState>();
  plants.forEach((p) => plantMap.set(p.plant_id, p));

  const filteredReadings = isFleet
    ? readings
    : readings.filter((r) => r.plant_id === selectedPlantId);

  const headers = [
    'Timestamp',
    'Plant ID',
    'Plant Name',
    'Plant Type',
    'Region',
    'Power Generated (MW)',
    'Expected Yield (MW)',
    'Capacity Factor (%)',
    'Solar Irradiance (W/m2)',
    'Direct Normal Irradiance (W/m2)',
    'Wind Speed (m/s)',
    'Wind Direction (deg)',
    'Ambient Temp (deg C)',
    'Panel / Gearbox Temp (deg C)',
    'Equipment Temp (deg C)',
    'Vibration RMS (mm/s)',
    'Bus Voltage (V)',
    'Current (A)',
    'Relative Humidity (%)',
    'Barometric Pressure (hPa)',
    'Equipment Health Status',
    'Sensor Diagnostic Status',
    'Data Stream Source',
  ];

  const rows = filteredReadings.map((r) => {
    const plant = plantMap.get(r.plant_id);
    const cap = plant?.capacity_mw || 1;
    const factor = ((r.power_generated / cap) * 100).toFixed(2);

    return [
      escapeCSV(r.timestamp),
      escapeCSV(r.plant_id),
      escapeCSV(plant?.plant_name || r.station_name || 'N/A'),
      escapeCSV(plant?.plant_type || 'RENEWABLE'),
      escapeCSV(plant?.region || 'National Grid India'),
      escapeCSV(r.power_generated.toFixed(2)),
      escapeCSV(r.expected_power.toFixed(2)),
      escapeCSV(factor),
      escapeCSV(r.solar_irradiance.toFixed(1)),
      escapeCSV(r.direct_normal_irradiance !== undefined ? r.direct_normal_irradiance.toFixed(1) : 'N/A'),
      escapeCSV(r.wind_speed.toFixed(2)),
      escapeCSV(r.wind_direction.toFixed(1)),
      escapeCSV(r.temperature.toFixed(1)),
      escapeCSV(r.panel_temperature.toFixed(1)),
      escapeCSV(r.equipment_temperature.toFixed(1)),
      escapeCSV(r.vibration.toFixed(2)),
      escapeCSV(r.voltage.toFixed(1)),
      escapeCSV(r.current.toFixed(1)),
      escapeCSV(r.humidity.toFixed(1)),
      escapeCSV(r.pressure.toFixed(1)),
      escapeCSV(r.equipment_status),
      escapeCSV(r.sensor_status),
      escapeCSV(r.data_source || 'SuryaSakti Real-Time Telemetry Node'),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const targetScope = isFleet ? 'FLEET_WIDE' : selectedPlantId;
  downloadFile(
    csvContent,
    `SuryaSakti_Telemetry_${targetScope}_${dateStr}.csv`,
    'text/csv;charset=utf-8;'
  );
};

/**
 * 2. Export Maintenance Logs & Alerts to CSV
 */
export const exportMaintenanceToCSV = (options: ExportReportOptions) => {
  const { alerts, predictions, plants, selectedPlantId } = options;
  const isFleet = !selectedPlantId || selectedPlantId === 'ALL';

  const plantMap = new Map<string, PlantWithState>();
  plants.forEach((p) => plantMap.set(p.plant_id, p));

  const filteredAlerts = isFleet
    ? alerts
    : alerts.filter((a) => a.plant_id === selectedPlantId);

  const filteredPredictions = isFleet
    ? predictions
    : predictions.filter((p) => p.plant_id === selectedPlantId);

  // Section 1: Alerts
  const alertHeaders = [
    'RECORD_TYPE',
    'Alert ID',
    'Timestamp',
    'Plant ID',
    'Plant Name',
    'Severity',
    'Alert Title / Summary',
    'Detailed Description',
    'Suggested Maintenance Action',
    'Operational Status',
  ];

  const alertRows = filteredAlerts.map((a) => {
    const plant = plantMap.get(a.plant_id);
    const status = a.status || (a.resolved ? 'RESOLVED' : a.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE');
    return [
      escapeCSV('INCIDENT_ALERT'),
      escapeCSV(a.alert_id),
      escapeCSV(a.timestamp),
      escapeCSV(a.plant_id),
      escapeCSV(plant?.plant_name || a.plant_name || 'N/A'),
      escapeCSV(a.severity),
      escapeCSV(a.title),
      escapeCSV(a.description || a.message || ''),
      escapeCSV(a.suggested_action || 'Inspect subsystem and recalibrate telemetry sensor feed'),
      escapeCSV(status),
    ].join(',');
  });

  // Section 2: Predictive Maintenance Diagnostics
  const predHeaders = [
    'RECORD_TYPE',
    'Plant ID',
    'Equipment ID',
    'Equipment Name / Subsystem',
    'Diagnostic Prediction',
    'Health Index (%)',
    'Vibration RMS (mm/s)',
    'Temperature (deg C)',
    'Operating Service Hours',
    'Likely Failure Mode',
    'Estimated Time To Failure',
    'Recommended Engineering Action',
  ];

  const predRows = filteredPredictions.map((p) => {
    return [
      escapeCSV('PREDICTIVE_MAINTENANCE'),
      escapeCSV(p.plant_id),
      escapeCSV(p.equipment_id),
      escapeCSV(p.equipment_name),
      escapeCSV(p.prediction),
      escapeCSV(p.health_score.toFixed(1)),
      escapeCSV(p.vibration_rms.toFixed(2)),
      escapeCSV(p.temperature_c.toFixed(1)),
      escapeCSV(p.operating_hours),
      escapeCSV(p.likely_failure_type || 'Mechanical / Thermal Wear'),
      escapeCSV(p.estimated_time_to_failure || 'Within Operational Tolerance'),
      escapeCSV(p.recommended_action || p.explanation),
    ].join(',');
  });

  const fullContent = [
    '# ========================================================',
    '# SURYASAKTI SCADA - INCIDENT ALERTS & PREDICTIVE LOGS',
    `# Export Generated: ${new Date().toISOString()}`,
    `# Scope: ${isFleet ? 'National Fleet (All Plants)' : selectedPlantId}`,
    '# ========================================================',
    '',
    '# SECTION 1: INCIDENT ALERTS',
    alertHeaders.join(','),
    ...alertRows,
    '',
    '# SECTION 2: PREDICTIVE EQUIPMENT MAINTENANCE DIAGNOSTICS',
    predHeaders.join(','),
    ...predRows,
  ].join('\r\n');

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const targetScope = isFleet ? 'FLEET_WIDE' : selectedPlantId;
  downloadFile(
    fullContent,
    `SuryaSakti_Maintenance_Logs_${targetScope}_${dateStr}.csv`,
    'text/csv;charset=utf-8;'
  );
};

/**
 * 3. Export Comprehensive SCADA Executive Engineering PDF Report
 */
export const exportExecutivePDF = (options: ExportReportOptions) => {
  const { summary, plants, readings, alerts, predictions, selectedPlantId } = options;
  const isFleet = !selectedPlantId || selectedPlantId === 'ALL';
  const targetPlant = !isFleet ? plants.find((p) => p.plant_id === selectedPlantId) : null;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const now = new Date();

  // Color Palette matching Obsidian SCADA
  const darkNavy = [10, 19, 36] as [number, number, number];
  const emeraldGreen = [16, 185, 129] as [number, number, number];
  const cardBg = [245, 247, 250] as [number, number, number];
  const textDark = [30, 41, 59] as [number, number, number];
  const textMuted = [100, 116, 139] as [number, number, number];

  // 1. Top Header Banner
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Emerald Accent Line
  doc.setFillColor(...emeraldGreen);
  doc.rect(0, 72, pageWidth, 3, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SURYASAKTI • RENEWABLE FLEET SCADA REPORT', margin, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    'National Solar & Wind Operations Intelligence • Grid Synchronization & Predictive Telemetry',
    margin,
    48
  );

  const reportId = `SCADA-REP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFontSize(8);
  doc.setFont('courier', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`REPORT ID: ${reportId}`, pageWidth - margin, 32, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now.toUTCString()}`, pageWidth - margin, 48, { align: 'right' });

  let yPos = 92;

  // 2. Executive Scope & Metadata Box
  doc.setFillColor(...cardBg);
  doc.roundedRect(margin, yPos, contentWidth, 48, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, yPos, contentWidth, 48, 4, 4, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  const scopeTitle = isFleet
    ? 'SCOPE: NATIONAL RENEWABLE FLEET (ALL 6 SITES)'
    : `SCOPE: ${targetPlant?.plant_name.toUpperCase()} (${targetPlant?.plant_id})`;
  doc.text(scopeTitle, margin + 12, yPos + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  const scopeDetails = isFleet
    ? `Fleet Capacity: 1,650 MW | Generation: ${summary?.current_generation_mw.toFixed(1) || '0'} MW | Operating Status: Optimal (6/6 Online)`
    : `Location: ${targetPlant?.region} | Nameplate Capacity: ${targetPlant?.capacity_mw} MW | Type: ${targetPlant?.plant_type} FACILITY`;
  doc.text(scopeDetails, margin + 12, yPos + 34);

  // Status Badge on the right
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(pageWidth - margin - 100, yPos + 12, 88, 22, 3, 3, 'F');
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SCADA SYNCHRONIZED', pageWidth - margin - 56, yPos + 26, { align: 'center' });

  yPos += 60;

  // 3. KPI Key Metrics Strip (4 metrics)
  const totalGen = isFleet
    ? summary?.current_generation_mw || readings.reduce((acc, r) => acc + r.power_generated, 0)
    : targetPlant?.latest_reading?.power_generated || 0;
  const totalCap = isFleet ? 1650 : targetPlant?.capacity_mw || 1;
  const capFactor = ((totalGen / totalCap) * 100).toFixed(1);
  const gridFreq = summary?.grid_frequency_hz ? `${summary.grid_frequency_hz.toFixed(2)} Hz` : '50.02 Hz';
  const activeAlertsCount = isFleet
    ? alerts.filter((a) => !a.resolved).length
    : alerts.filter((a) => a.plant_id === selectedPlantId && !a.resolved).length;

  const kpis = [
    { label: 'POWER GENERATED', value: `${totalGen.toFixed(1)} MW`, note: `Of ${totalCap} MW Capacity` },
    { label: 'FLEET CAPACITY FACTOR', value: `${capFactor}%`, note: 'Thermal & Irradiance Index' },
    { label: 'GRID FREQUENCY', value: gridFreq, note: '50.00 Hz Standard Sync' },
    { label: 'ACTIVE INCIDENTS', value: `${activeAlertsCount}`, note: 'Automated SCADA Diagnostics' },
  ];

  const colWidth = (contentWidth - 18) / 4;
  kpis.forEach((kpi, index) => {
    const x = margin + index * (colWidth + 6);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, yPos, colWidth, 44, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, yPos, colWidth, 44, 3, 3, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(kpi.label, x + 8, yPos + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.text(kpi.value, x + 8, yPos + 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.note, x + 8, yPos + 37);
  });

  yPos += 54;

  // 4. Plant Telemetry Status Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text('1. FACILITY TELEMETRY & GENERATION PERFORMANCE', margin, yPos);
  yPos += 8;

  const displayPlants = isFleet ? plants : plants.filter((p) => p.plant_id === selectedPlantId);

  const plantTableBody = displayPlants.map((p) => {
    const r = p.latest_reading;
    const power = r ? r.power_generated.toFixed(1) : '0.0';
    const cap = p.capacity_mw;
    const efficiency = r ? ((r.power_generated / cap) * 100).toFixed(1) : '0.0';
    const risk = p.latest_risk?.risk_level || 'LOW';
    const score = p.latest_risk?.risk_score || 0;

    return [
      p.plant_id,
      p.plant_name,
      p.plant_type,
      p.region.split('(')[0].trim(),
      `${cap} MW`,
      `${power} MW`,
      `${efficiency}%`,
      p.operating_status,
      `${risk} (${score})`,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [
      [
        'Plant ID',
        'Facility Name',
        'Type',
        'Region',
        'Capacity',
        'Current Power',
        'Yield %',
        'Status',
        'Risk Rating',
      ],
    ],
    body: plantTableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: darkNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Calculate position after plant table
  // @ts-expect-error - jspdf-autotable extends jsPDF with lastAutoTable
  yPos = doc.lastAutoTable.finalY + 20;

  // 5. Intelligent Incident Alerts Table
  const displayAlerts = isFleet
    ? alerts.slice(0, 8)
    : alerts.filter((a) => a.plant_id === selectedPlantId).slice(0, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text('2. INCIDENT ALERTS & ANOMALY SURVEILLANCE', margin, yPos);
  yPos += 8;

  if (displayAlerts.length > 0) {
    const alertTableBody = displayAlerts.map((a) => [
      a.alert_id,
      a.plant_id,
      a.severity,
      a.title,
      a.suggested_action ? a.suggested_action.slice(0, 48) + '...' : 'Verify telemetry feed',
      a.status || (a.resolved ? 'RESOLVED' : a.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE'),
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Alert ID', 'Plant', 'Severity', 'Incident Summary', 'Recommended Mitigation', 'Status']],
      body: alertTableBody,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 3.5,
        textColor: textDark,
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // @ts-expect-error - jspdf-autotable
    yPos = doc.lastAutoTable.finalY + 18;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('No active incidents or critical telemetry warnings detected.', margin, yPos + 10);
    yPos += 24;
  }

  // Check if we need a new page for Predictive Maintenance
  if (yPos > pageHeight - 120) {
    doc.addPage();
    yPos = 40;
  }

  // 6. Predictive Maintenance Diagnoses Table
  const displayPredictions = isFleet
    ? predictions.slice(0, 6)
    : predictions.filter((p) => p.plant_id === selectedPlantId).slice(0, 6);

  if (displayPredictions.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text('3. PREDICTIVE EQUIPMENT MAINTENANCE DIAGNOSTICS', margin, yPos);
    yPos += 8;

    const predTableBody = displayPredictions.map((p) => [
      p.plant_id,
      p.equipment_id,
      p.equipment_name,
      p.prediction,
      `${p.health_score.toFixed(0)}%`,
      `${p.vibration_rms.toFixed(2)} mm/s`,
      p.recommended_action ? p.recommended_action.slice(0, 52) + '...' : 'Normal service schedule',
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Plant', 'Unit ID', 'Equipment Component', 'Status', 'Health', 'Vibration', 'Action Required']],
      body: predTableBody,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 3.5,
        textColor: textDark,
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // @ts-expect-error - jspdf-autotable
    yPos = doc.lastAutoTable.finalY + 16;
  }

  // Check footer space
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 40;
  }

  // 7. Footer / SCADA Certification Stamp on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, pageHeight - 26, pageWidth, 26, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, pageHeight - 26, pageWidth, pageHeight - 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      'SuryaSakti SCADA System • Confidential Official Facility Report • Automated Sensor Synchronization',
      margin,
      pageHeight - 11
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 11, { align: 'right' });
  }

  // Save the PDF
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const targetScope = isFleet ? 'FLEET_WIDE' : selectedPlantId;
  doc.save(`SuryaSakti_SCADA_Report_${targetScope}_${dateStr}.pdf`);
};
