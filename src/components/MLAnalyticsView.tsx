import React, { useState, useEffect } from 'react';
import {
  Activity,
  Brain,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, PlantWithState } from '../services/api';
import { EnergyForecast, MLModelMetrics, RiskLevel } from '../types';

interface MLAnalyticsViewProps {
  plants: PlantWithState[];
  selectedPlantId?: string;
  onSelectPlant?: (id: string) => void;
}

export const MLAnalyticsView: React.FC<MLAnalyticsViewProps> = ({
  plants,
  selectedPlantId,
  onSelectPlant,
}) => {
  const [metrics, setMetrics] = useState<{
    randomForest: MLModelMetrics;
    logisticRegression: MLModelMetrics;
    activeModel: string;
  } | null>(null);

  const [activePlantId, setActivePlantId] = useState(selectedPlantId || plants[0]?.plant_id || 'PL-S001');

  useEffect(() => {
    if (selectedPlantId) {
      setActivePlantId(selectedPlantId);
    }
  }, [selectedPlantId]);

  const [forecastData, setForecastData] = useState<EnergyForecast[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainDatasetSize, setTrainDatasetSize] = useState(3000);

  const fetchMetrics = async () => {
    try {
      const data = await api.getMLMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchForecast = async (id: string) => {
    try {
      const res = await api.getForecast(id);
      setForecastData(res.forecast);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchForecast(activePlantId);
  }, [activePlantId]);

  const handleRetrain = async () => {
    setIsTraining(true);
    try {
      const res = await api.trainMLModel(trainDatasetSize);
      setMetrics(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTraining(false);
    }
  };

  const activeModelMetrics =
    metrics?.activeModel === 'Random Forest' ? metrics?.randomForest : metrics?.logisticRegression;

  const comparisonData = metrics
    ? [
        {
          metric: 'Accuracy',
          'Random Forest': +(metrics.randomForest.accuracy * 100).toFixed(1),
          'Logistic Regression': +(metrics.logisticRegression.accuracy * 100).toFixed(1),
        },
        {
          metric: 'Precision',
          'Random Forest': +(metrics.randomForest.precision * 100).toFixed(1),
          'Logistic Regression': +(metrics.logisticRegression.precision * 100).toFixed(1),
        },
        {
          metric: 'Recall',
          'Random Forest': +(metrics.randomForest.recall * 100).toFixed(1),
          'Logistic Regression': +(metrics.logisticRegression.recall * 100).toFixed(1),
        },
        {
          metric: 'F1 Score',
          'Random Forest': +(metrics.randomForest.f1_score * 100).toFixed(1),
          'Logistic Regression': +(metrics.logisticRegression.f1_score * 100).toFixed(1),
        },
        {
          metric: 'ROC AUC',
          'Random Forest': +(metrics.randomForest.roc_auc * 100).toFixed(1),
          'Logistic Regression': +(metrics.logisticRegression.roc_auc * 100).toFixed(1),
        },
      ]
    : [];

  const formattedForecastChart = forecastData.map((f) => ({
    time: `${f.hour_offset > 0 ? '+' : ''}${f.hour_offset}h`,
    actual: f.actual_power,
    expected: f.expected_power,
    predicted: f.predicted_power,
    confidenceLower: f.confidence_lower,
    confidenceUpper: f.confidence_upper,
  }));

  const riskLabels: RiskLevel[] = ['LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Retrain Controls */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Brain className="w-3.5 h-3.5" />
            SPARK MLLIB PREDICTIVE INTELLIGENCE & ENERGY FORECASTING
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Multi-Class Risk Classifier & 24h Horizon Forecaster
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
            Comparing Apache Spark MLlib classification models (Random Forest vs Logistic Regression) on 9 sensor
            telemetry dimensions, with real 5x5 confusion matrix evaluation and 24-hour predictive generation horizons.
          </p>
        </div>

        {/* Retrain Action */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">Training Dataset:</span>
            <select
              value={trainDatasetSize}
              onChange={(e) => setTrainDatasetSize(Number(e.target.value))}
              className="bg-slate-900 text-white font-mono px-2 py-1 rounded border border-slate-700 text-xs"
            >
              <option value={1500}>1,500 Samples</option>
              <option value={3000}>3,000 Samples</option>
              <option value={6000}>6,000 Samples</option>
            </select>
          </div>

          <button
            onClick={handleRetrain}
            disabled={isTraining}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isTraining ? 'animate-spin' : ''}`} />
            {isTraining ? 'TRAINING PIPELINE...' : 'RETRAIN ML MODELS'}
          </button>
        </div>
      </div>

      {/* Algorithm Comparison Card */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: Performance Metric Comparison Chart */}
          <div className="lg:col-span-7 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Algorithm Evaluation: Random Forest vs. Logistic Regression
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Calculated from actual held-out test split (20% validation records)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Selected: {metrics.activeModel}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[70, 100]} stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}%`, 'Score']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Random Forest" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Logistic Regression" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px]">Test Accuracy</span>
                <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                  {(metrics.randomForest.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px]">Precision</span>
                <div className="font-mono font-bold text-slate-200 text-sm mt-0.5">
                  {(metrics.randomForest.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px]">Recall</span>
                <div className="font-mono font-bold text-slate-200 text-sm mt-0.5">
                  {(metrics.randomForest.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px]">F1-Score</span>
                <div className="font-mono font-bold text-cyan-300 text-sm mt-0.5">
                  {(metrics.randomForest.f1_score * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: 5x5 Confusion Matrix Heatmap */}
          <div className="lg:col-span-5 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  5x5 Confusion Matrix (Test Set)
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Rows: Actual | Cols: Predicted</span>
              </div>

              {/* Confusion Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead>
                    <tr className="text-[10px] text-slate-500">
                      <th className="p-1"></th>
                      {riskLabels.map((lbl) => (
                        <th key={lbl} className="p-1 text-[9px] uppercase">{lbl.slice(0, 4)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeModelMetrics?.confusion_matrix.matrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="p-1 text-right text-[9px] font-bold text-slate-400 uppercase">
                          {riskLabels[rIdx].slice(0, 4)}
                        </td>
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          return (
                            <td
                              key={cIdx}
                              className={`p-1.5 rounded text-xs font-bold ${
                                isDiagonal
                                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                  : val > 0
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-slate-950 text-slate-600'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature Importance Rankings */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Top Gini Feature Importance:
              </span>
              <div className="space-y-1 text-xs">
                {activeModelMetrics?.feature_importance.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300">{f.feature}</span>
                    <span className="font-mono text-cyan-400 font-bold">{(f.importance * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Energy Forecasting Module (Actual vs Expected vs Model Predicted) */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                24-Hour Energy Production Forecast & Uncertainty Bounds
              </h2>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Multi-variable autoregressive prediction model with 95% confidence intervals
            </p>
          </div>

          {/* Plant Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target Plant:</span>
            <select
              value={activePlantId}
              onChange={(e) => {
                setActivePlantId(e.target.value);
                onSelectPlant?.(e.target.value);
              }}
              className="bg-slate-950 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none text-xs"
            >
              {plants.map((p) => (
                <option key={p.plant_id} value={p.plant_id}>
                  {p.plant_id} ({p.plant_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 24-Hour Horizon Line Chart with Confidence Ribbon */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedForecastChart} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" MW" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Power (Measured)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="expected"
                name="Expected Yield (Theoretical)"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Model Predicted Power (Estimate)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="confidenceUpper"
                name="95% CI Upper Bound"
                stroke="#a855f7"
                strokeDasharray="2 2"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="confidenceLower"
                name="95% CI Lower Bound"
                stroke="#a855f7"
                strokeDasharray="2 2"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Forecast Horizon: -6h historical actuals to +18h forward prediction</span>
          <span className="font-semibold text-cyan-300">Confidence Band: 95% Wald Prediction Interval</span>
        </div>
      </div>
    </div>
  );
};
