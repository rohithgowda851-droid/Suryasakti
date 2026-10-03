import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Filter,
  Info,
  Layers,
  Search,
  ShieldAlert,
  Sliders,
  Sun,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { Alert, AlertItem, MaintenancePrediction } from '../types';
import { equipmentVisual } from '../assets/images';

interface AlertsMaintenanceViewProps {
  alerts: AlertItem[];
  predictions: MaintenancePrediction[];
  selectedPlantId?: string;
  onSelectPlant?: (id: string) => void;
  onOpenExport?: () => void;
  onAcknowledgeAlert: (id: string) => Promise<void>;
  onResolveAlert: (id: string) => Promise<void>;
}

export const AlertsMaintenanceView: React.FC<AlertsMaintenanceViewProps> = ({
  alerts,
  predictions,
  selectedPlantId,
  onSelectPlant,
  onOpenExport,
  onAcknowledgeAlert,
  onResolveAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'MAINTENANCE'>('ALERTS');
  const [plantFilter, setPlantFilter] = useState<string>(selectedPlantId || 'ALL');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [alertStatusFilter, setAlertStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Keep synchronized with selectedPlantId
  useEffect(() => {
    if (selectedPlantId) {
      setPlantFilter(selectedPlantId);
    }
  }, [selectedPlantId]);

  const getAlertStatus = (a: Alert): 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' => {
    if (a.status) return a.status;
    if (a.resolved) return 'RESOLVED';
    if (a.acknowledged) return 'ACKNOWLEDGED';
    return 'ACTIVE';
  };

  const getAlertDescription = (a: Alert): string => {
    return a.description || a.message || a.title || 'Telemetry variance detected';
  };

  const getAlertAction = (a: Alert): string => {
    return a.suggested_action || 'Inspect inverter subsystem and verify real-time sensor streams';
  };

  const filteredAlerts = alerts.filter((a) => {
    const status = getAlertStatus(a);
    const desc = getAlertDescription(a);
    const matchPlant = plantFilter === 'ALL' || a.plant_id === plantFilter;
    const matchSeverity = alertSeverityFilter === 'ALL' || a.severity === alertSeverityFilter;
    const matchStatus = alertStatusFilter === 'ALL' || status === alertStatusFilter;
    const matchSearch =
      a.plant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchPlant && matchSeverity && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            OPERATIONAL HEALTH & RELIABILITY COMMAND
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Intelligent Incident Alerts & Predictive Maintenance Center
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
            Real-time threshold alert dispatching with lifecycle management (Active, Acknowledged, Resolved) and physics-based
            Remaining Useful Life (RUL) estimation across inverters, gearboxes, bearings, and solar PV strings.
          </p>
        </div>

        {/* Actions & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              title="Export Maintenance Logs & Incident Alerts (CSV / PDF)"
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white transition flex items-center gap-2 cursor-pointer shadow-sm shadow-amber-950/30"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Logs (CSV/PDF)</span>
            </button>
          )}

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ALERTS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Alerts Panel ({alerts.filter((a) => getAlertStatus(a) === 'ACTIVE').length} Active)
            </button>
            <button
              onClick={() => setActiveTab('MAINTENANCE')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'MAINTENANCE' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              Predictive Maintenance (RUL)
            </button>
          </div>
        </div>
      </div>

      {/* Section 8.E: Small Equipment Health Supporting Visuals */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="w-16 h-14 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
              <img
                src={equipmentVisual}
                alt="Substation & Inverter Equipment"
                className="w-full h-full object-cover object-center brightness-90 contrast-110"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Substation &amp; Critical Equipment Fleet Status
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Continuous SCADA diagnostic telemetry across primary asset classes
              </span>
            </div>
          </div>

          {/* 5 Small Equipment Indicator Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full md:w-auto text-xs font-mono">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <span className="text-slate-400 block text-[9px]">SOLAR PANELS</span>
                <span className="text-emerald-400 font-bold text-[11px]">98.2% Norm</span>
              </div>
            </div>

            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[9px]">INVERTERS</span>
                <span className="text-emerald-400 font-bold text-[11px]">96.8% Safe</span>
              </div>
            </div>

            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <div>
                <span className="text-slate-400 block text-[9px]">WIND TURBINES</span>
                <span className="text-emerald-400 font-bold text-[11px]">94.5% Active</span>
              </div>
            </div>

            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <span className="text-slate-400 block text-[9px]">TRANSFORMERS</span>
                <span className="text-emerald-400 font-bold text-[11px]">400kV OK</span>
              </div>
            </div>

            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <div>
                <span className="text-slate-400 block text-[9px]">BATTERY (BESS)</span>
                <span className="text-emerald-400 font-bold text-[11px]">92% Charge</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'ALERTS' ? (
        /* ALERTS SUB-VIEW */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search alert description or plant ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Site-Specific Filter as specified in Section 22 */}
              <select
                value={plantFilter}
                onChange={(e) => {
                  setPlantFilter(e.target.value);
                  if (e.target.value !== 'ALL' && onSelectPlant) {
                    onSelectPlant(e.target.value);
                  }
                }}
                className="bg-slate-950 text-slate-300 font-mono px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none text-xs"
              >
                <option value="ALL">All 6 Sites (Fleet-Wide)</option>
                <option value="PL-S001">PL-S001 (Bhadla Solar)</option>
                <option value="PL-S002">PL-S002 (Pavagada Solar)</option>
                <option value="PL-S003">PL-S003 (Rewa Solar)</option>
                <option value="PL-W001">PL-W001 (Muppandal Wind)</option>
                <option value="PL-W002">PL-W002 (Jaisalmer Wind)</option>
                <option value="PL-W003">PL-W003 (Kutch Wind)</option>
              </select>

              <select
                value={alertSeverityFilter}
                onChange={(e) => setAlertSeverityFilter(e.target.value as any)}
                className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none text-xs"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Alerts</option>
                <option value="WARNING">Warning Alerts</option>
                <option value="INFO">Info Notices</option>
              </select>

              <select
                value={alertStatusFilter}
                onChange={(e) => setAlertStatusFilter(e.target.value as any)}
                className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-800/70">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => {
                  const status = getAlertStatus(alert);
                  const desc = getAlertDescription(alert);
                  const action = getAlertAction(alert);

                  return (
                    <div
                      key={alert.alert_id}
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                        status === 'ACTIVE'
                          ? alert.severity === 'CRITICAL'
                            ? 'bg-rose-950/20 hover:bg-rose-950/30'
                            : 'bg-amber-950/10 hover:bg-amber-950/20'
                          : 'hover:bg-slate-850/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 p-2 rounded-xl shrink-0 ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400'
                              : alert.severity === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {alert.severity === 'CRITICAL' ? (
                            <AlertOctagon className="w-5 h-5" />
                          ) : alert.severity === 'WARNING' ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <Info className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                              {alert.plant_id}
                            </span>
                            <span
                              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : alert.severity === 'WARNING'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-slate-500 text-[11px] font-mono">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-slate-200 mt-1">{desc}</h3>
                          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
                            <ArrowRight className="w-3 h-3 shrink-0" />
                            Recommended Action: {action}
                          </p>
                        </div>
                      </div>

                      {/* Alert Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${
                            status === 'ACTIVE'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : status === 'ACKNOWLEDGED'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {status}
                        </span>

                        {status === 'ACTIVE' && (
                          <button
                            onClick={() => onAcknowledgeAlert(alert.alert_id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}

                        {status !== 'RESOLVED' && (
                          <button
                            onClick={() => onResolveAlert(alert.alert_id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">No alerts matching current filter criteria.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* PREDICTIVE MAINTENANCE SUB-VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((pred, idx) => {
              const comp = pred.component || pred.equipment_name || pred.equipment_id;
              const confidence = pred.confidence_pct ?? Math.max(75, Math.round(100 - pred.health_score));
              const failureType = pred.likely_failure_type || pred.prediction || pred.explanation || 'Subsystem Degradation';
              const timeToFailure = pred.estimated_time_to_failure || `${Math.max(12, Math.round(pred.health_score * 0.8))}h`;
              const hoursRemaining = pred.estimated_hours_remaining ?? Math.round(pred.operating_hours || 48);

              return (
                <div
                  key={idx}
                  className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                          {pred.plant_id}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">{comp}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400">{confidence}% Confidence</span>
                    </div>

                    <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {failureType}
                    </h3>

                    <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Estimated Time to Failure:</span>
                        <span className="font-mono font-bold text-amber-400">{timeToFailure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Predicted Horizon:</span>
                        <span className="font-mono text-slate-300">
                          {hoursRemaining} Operating Hours
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Mitigation Plan:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                      {pred.recommended_action}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
