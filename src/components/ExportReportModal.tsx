import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Sparkles,
  Sun,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { PlantWithState } from '../services/api';
import { AlertItem, DashboardSummary, MaintenancePrediction, SensorReading } from '../types';
import {
  exportExecutivePDF,
  exportMaintenanceToCSV,
  exportTelemetryToCSV,
} from '../utils/exportReport';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DashboardSummary | null;
  plants: PlantWithState[];
  readings: SensorReading[];
  alerts: AlertItem[];
  predictions: MaintenancePrediction[];
  currentSelectedPlantId?: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  summary,
  plants,
  readings,
  alerts,
  predictions,
  currentSelectedPlantId,
}) => {
  const [selectedScope, setSelectedScope] = useState<string>(
    currentSelectedPlantId || 'ALL'
  );
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const isFleet = selectedScope === 'ALL';
  const targetPlant = !isFleet ? plants.find((p) => p.plant_id === selectedScope) : null;

  // Filter counts for live preview
  const previewReadingsCount = isFleet
    ? readings.length
    : readings.filter((r) => r.plant_id === selectedScope).length;
  const previewAlertsCount = isFleet
    ? alerts.length
    : alerts.filter((a) => a.plant_id === selectedScope).length;
  const previewPredictionsCount = isFleet
    ? predictions.length
    : predictions.filter((p) => p.plant_id === selectedScope).length;

  const showNotification = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  const handleExportPDF = () => {
    setIsGenerating(true);
    try {
      exportExecutivePDF({
        summary,
        plants,
        readings,
        alerts,
        predictions,
        selectedPlantId: selectedScope,
      });
      showNotification('Executive SCADA PDF Report generated successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportTelemetryCSV = () => {
    setIsGenerating(true);
    try {
      exportTelemetryToCSV({
        summary,
        plants,
        readings,
        alerts,
        predictions,
        selectedPlantId: selectedScope,
      });
      showNotification('Telemetry sensor data CSV exported successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMaintenanceCSV = () => {
    setIsGenerating(true);
    try {
      exportMaintenanceToCSV({
        summary,
        plants,
        readings,
        alerts,
        predictions,
        selectedPlantId: selectedScope,
      });
      showNotification('Maintenance & incident alerts CSV exported successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportAll = () => {
    setIsGenerating(true);
    try {
      handleExportPDF();
      setTimeout(() => handleExportTelemetryCSV(), 300);
      setTimeout(() => handleExportMaintenanceCSV(), 600);
      showNotification('Complete SCADA Data Bundle exported successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Export SCADA Telemetry &amp; Maintenance Reports
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Download official engineering PDF reports or export granular CSV records for audit compliance, grid dispatch, and reliability records.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast notification inside modal */}
        {downloadSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-mono animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Select Facility Scope</span>
              <span className="text-[11px] font-mono font-normal text-slate-400">
                {isFleet ? 'National Fleet (All 6 Sites)' : `${targetPlant?.plant_name}`}
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedScope('ALL')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isFleet
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">FLEET-WIDE</span>
                  {isFleet && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <span className="text-[10px] text-slate-400 mt-1">All 6 Facilities</span>
              </button>

              {plants.map((p) => {
                const isSelected = selectedScope === p.plant_id;
                const isSolar = p.plant_type === 'SOLAR';
                return (
                  <button
                    key={p.plant_id}
                    type="button"
                    onClick={() => setSelectedScope(p.plant_id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isSolar
                          ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-md'
                          : 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold flex items-center gap-1">
                        {isSolar ? (
                          <Sun className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Wind className="w-3 h-3 text-cyan-400" />
                        )}
                        {p.plant_id}
                      </span>
                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            isSolar ? 'text-amber-400' : 'text-cyan-400'
                          }`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate mt-1">
                      {p.plant_name.split(' ')[0]} ({p.capacity_mw} MW)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Live Dataset Metrics Preview */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">TARGET DATASET:</span>
              <span className="text-white font-bold">
                {isFleet ? '1,650 MW National Fleet' : `${targetPlant?.plant_id} • ${targetPlant?.plant_name}`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <span>
                <strong className="text-emerald-400">{previewReadingsCount}</strong> Sensor Readings
              </span>
              <span>•</span>
              <span>
                <strong className="text-amber-400">{previewAlertsCount}</strong> Incident Alerts
              </span>
              <span>•</span>
              <span>
                <strong className="text-cyan-400">{previewPredictionsCount}</strong> Diagnostics
              </span>
            </div>
          </div>

          {/* 3. Export Format Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Official PDF Report */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-red-500/10 text-rose-400 border border-rose-500/20">
                    <FileText className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    A4 FORMAT • PDF
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Official SCADA Engineering Report
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Comprehensive multi-page PDF with executive telemetry KPIs, facility generation table, active incident analysis, and predictive maintenance schedules.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download Executive PDF Report</span>
              </button>
            </div>

            {/* Card 2: Telemetry Sensor CSV */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    DATASTREAM • CSV
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Telemetry Sensor Data Stream
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Raw tabular timeseries including power generation (MW), solar irradiance, wind velocity, thermal indices, bus voltage, current, and sensor status.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportTelemetryCSV}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download Telemetry CSV</span>
              </button>
            </div>

            {/* Card 3: Maintenance Logs CSV */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    LOGS &amp; ALERTS • CSV
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Incident Alerts &amp; Maintenance Logs
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full incident history with severity levels, mitigation suggestions, resolution status, and ML component health degradation predictions.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportMaintenanceCSV}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download Maintenance CSV</span>
              </button>
            </div>

            {/* Card 4: Complete Bundle Single Click */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    <Layers className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    ALL-IN-ONE BUNDLE
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Full SCADA Export Bundle</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download all assets in one click: Executive PDF Report, Telemetry CSV dataset, and Maintenance &amp; Incident Alerts logs.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAll}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export Complete Bundle (PDF + CSVs)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 text-[11px] font-mono">
            SuryaSakti SCADA Data Export Service • Standards IEC 61400 / IEEE 1547 Compliant
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
