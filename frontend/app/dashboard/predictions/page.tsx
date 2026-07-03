'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  FiTrendingUp, 
  FiBarChart2, 
  FiDownload,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiCpu,
  FiLoader,
  FiDollarSign,
  FiUsers,
  FiDatabase
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Dataset {
  id: number;
  name: string;
  rows: number;
  columns: number;
  status: string;
  created_at: string;
}

interface PredictionData {
  success: boolean;
  dataset_id: number;
  dataset_name: string;
  confidence: number;
  metrics: {
    expectedRevenue: string;
    expectedRevenueRaw: number;
    growthRate: string;
    peakMonth: string;
    cagr: string;
    mae: string;
    rmse: string;
    avgPurchaseRate: string;
    avgIncome: string;
    totalCustomers: number;
    minPurchase: string;
    maxPurchase: string;
  };
  historical: Array<{ month: string; sales: number }>;
  forecast: Array<{ period: string; predictedSales: number; upperBound: number; lowerBound: number }>;
  insights: Array<{ title: string; description: string; type: string }>;
  data_summary: {
    total_rows: number;
    date_range: string;
    avg_age: string;
    gender_distribution: Record<string, number>;
  };
}

interface ErrorResponse {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export default function PredictionsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingDatasets, setLoadingDatasets] = useState<boolean>(true);
  const [forecastPeriod, setForecastPeriod] = useState<'30days' | '60days' | '90days'>('30days');
  const [activeTab, setActiveTab] = useState<'forecast' | 'insights' | 'details'>('forecast');

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async (): Promise<void> => {
    try {
      const response = await api.get('/api/datasets/');
      setDatasets(response.data);
      if (response.data.length > 0) {
        const mostRecent = response.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setSelectedDataset(mostRecent);
      }
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setLoadingDatasets(false);
    }
  };

  const generatePredictions = async (): Promise<void> => {
    if (!selectedDataset) {
      toast.error('Please select a dataset first');
      return;
    }

    setLoading(true);
    setPredictions(null);
    
    try {
      const response = await api.post('/api/predictions/generate', {
        dataset_id: selectedDataset.id,
        forecast_period: forecastPeriod
      });
      
      setPredictions(response.data);
      toast.success(`Predictions generated from ${selectedDataset.name}!`);
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      console.error('Prediction error:', err);
      toast.error(err.response?.data?.detail || 'Failed to generate predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = (): void => {
    if (!predictions) {
      toast.error('No predictions to export');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      
      const summaryData = [
        ['SMARTML SALES PREDICTIONS REPORT'],
        [`Generated on: ${new Date().toLocaleString()}`],
        [`Dataset: ${predictions.dataset_name}`],
        [`Forecast Period: ${forecastPeriod === '30days' ? '30 Days' : forecastPeriod === '60days' ? '60 Days' : '90 Days'}`],
        [''],
        ['KEY METRICS', ''],
        ['Expected Revenue', predictions.metrics.expectedRevenue],
        ['Projected Growth', `${predictions.metrics.growthRate}%`],
        ['Average Purchase Rate', predictions.metrics.avgPurchaseRate],
        ['Average Income', predictions.metrics.avgIncome],
        ['Total Customers', predictions.metrics.totalCustomers],
        ['CAGR', `${predictions.metrics.cagr}%`],
        ['AI Confidence Score', `${predictions.confidence}%`],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      const forecastData = predictions.forecast.map(f => ({
        'Period': f.period,
        'Predicted Sales (FCFA)': f.predictedSales.toLocaleString(),
        'Upper Bound': f.upperBound.toLocaleString(),
        'Lower Bound': f.lowerBound.toLocaleString(),
      }));
      const forecastSheet = XLSX.utils.json_to_sheet(forecastData);
      XLSX.utils.book_append_sheet(wb, forecastSheet, 'Forecast');
      
      const historicalData = predictions.historical.map(h => ({
        'Month': h.month,
        'Sales (FCFA)': h.sales.toLocaleString(),
      }));
      const historicalSheet = XLSX.utils.json_to_sheet(historicalData);
      XLSX.utils.book_append_sheet(wb, historicalSheet, 'Historical Data');
      
      const insightsData = predictions.insights.map((i, idx) => ({
        'No.': idx + 1,
        'Insight': i.title,
        'Description': i.description,
      }));
      const insightsSheet = XLSX.utils.json_to_sheet(insightsData);
      XLSX.utils.book_append_sheet(wb, insightsSheet, 'Insights');
      
      XLSX.writeFile(wb, `predictions_${predictions.dataset_name}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Exported to Excel!');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  const formatFCFA = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm" style={{ color: p.color }}>
              {p.name}: {formatFCFA(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loadingDatasets) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales Predictions</h1>
        <p className="text-gray-500 mt-2">AI-powered sales forecasting based on your actual data</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset
            </label>
            <select
              value={selectedDataset?.id || ''}
              onChange={(e) => {
                const dataset = datasets.find(d => d.id === parseInt(e.target.value));
                setSelectedDataset(dataset || null);
                setPredictions(null);
              }}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.rows.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Period
            </label>
            <div className="flex gap-2">
              {(['30days', '60days', '90days'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setForecastPeriod(period)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    forecastPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === '30days' ? '30 Days' : period === '60days' ? '60 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generatePredictions}
            disabled={loading || !selectedDataset}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiCpu className="w-4 h-4" />
                Generate Predictions
              </>
            )}
          </button>
        </div>
      </div>

      {selectedDataset && !predictions && !loading && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <FiDatabase className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Ready to analyze: {selectedDataset.name}</h3>
              <p className="text-sm text-blue-700">
                {selectedDataset.rows.toLocaleString()} records • {selectedDataset.columns} columns • 
                Uploaded: {new Date(selectedDataset.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiLoader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Data</h3>
          <p className="text-gray-500">Processing {selectedDataset?.rows.toLocaleString()} records...</p>
        </div>
      )}

      {predictions && !loading && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">AI Prediction Confidence</h3>
                <p className="text-blue-100 text-sm">Based on {predictions.data_summary.total_rows} records from your dataset</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{predictions.confidence}%</div>
                <div className="text-sm text-blue-100">Confidence Score</div>
              </div>
            </div>
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${predictions.confidence}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiDollarSign className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-gray-500">Expected Revenue</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{predictions.metrics.expectedRevenue}</p>
              <p className="text-xs text-green-600 mt-1">Next {forecastPeriod === '30days' ? '30 days' : forecastPeriod === '60days' ? '60 days' : '90 days'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-sm text-gray-500">Projected Growth</p>
              </div>
              <p className="text-2xl font-bold text-green-600">+{predictions.metrics.growthRate}%</p>
              <p className="text-xs text-gray-500 mt-1">vs current period</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiUsers className="w-4 h-4 text-purple-600" />
                <p className="text-sm text-gray-500">Avg Purchase Rate</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{predictions.metrics.avgPurchaseRate}</p>
              <p className="text-xs text-gray-500 mt-1">From {predictions.metrics.totalCustomers} customers</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiDollarSign className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-gray-500">Avg Income</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{predictions.metrics.avgIncome}</p>
              <p className="text-xs text-gray-500 mt-1">From your dataset</p>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('forecast')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'forecast'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Forecast Charts
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'insights'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                AI Insights
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Data Details
              </button>
            </div>
          </div>

          {activeTab === 'forecast' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiBarChart2 className="w-5 h-5 text-blue-600" />
                  Historical Sales Trend (From Your Actual Data)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={predictions.historical}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatFCFA(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.1}
                        name="Actual Sales (FCFA)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Based on actual purchase data from your uploaded dataset
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiTrendingUp className="w-5 h-5 text-blue-600" />
                  AI Forecast Predictions (FCFA)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictions.forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => formatFCFA(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="predictedSales" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Predicted Sales"
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="upperBound" 
                        stroke="#93c5fd" 
                        strokeDasharray="5 5"
                        name="Optimistic Forecast"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lowerBound" 
                        stroke="#93c5fd" 
                        strokeDasharray="5 5"
                        name="Pessimistic Forecast"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Forecast based on actual patterns from your dataset ({predictions.data_summary.total_rows} records)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiCpu className="w-5 h-5 text-blue-600" />
                  AI-Generated Insights from Your Data
                </h3>
                <div className="space-y-4">
                  {predictions.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      {insight.type === 'positive' ? (
                        <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : insight.type === 'negative' ? (
                        <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      ) : (
                        <FiInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(predictions.data_summary.gender_distribution).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Demographics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Average Age</span>
                        <span className="font-semibold text-gray-900">{predictions.data_summary.avg_age} years</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total Records</span>
                        <span className="font-semibold text-gray-900">{predictions.data_summary.total_rows.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Date Range</span>
                        <span className="font-semibold text-gray-900">{predictions.data_summary.date_range}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(predictions.data_summary.gender_distribution).map(([gender, count]) => (
                        <div key={gender} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">{gender}</span>
                          <span className="font-semibold text-gray-900">{count} customers</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Mean Absolute Error (MAE)</p>
                  <p className="text-2xl font-bold text-gray-900">{predictions.metrics.mae}</p>
                  <p className="text-xs text-gray-500 mt-1">Average prediction error</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Root Mean Square Error (RMSE)</p>
                  <p className="text-2xl font-bold text-gray-900">{predictions.metrics.rmse}</p>
                  <p className="text-xs text-gray-500 mt-1">Standard deviation of errors</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">CAGR (Compound Annual Growth Rate)</p>
                  <p className="text-2xl font-bold text-gray-900">{predictions.metrics.cagr}%</p>
                  <p className="text-xs text-gray-500 mt-1">Projected annual growth</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Purchase Range</p>
                <p className="text-lg font-semibold text-gray-900">{predictions.metrics.minPurchase} - {predictions.metrics.maxPurchase}</p>
                <p className="text-xs text-gray-500 mt-1">Minimum and maximum purchase rates from your data</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleExportToExcel}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              Export to Excel (.xlsx)
            </button>
          </div>
        </div>
      )}

      {!predictions && selectedDataset && !loading && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FiCpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for AI Analysis</h3>
          <p className="text-gray-500 mb-6">
            Generate AI-powered predictions based on your actual data from "{selectedDataset.name}"
          </p>
          <button
            onClick={generatePredictions}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Generate Predictions
          </button>
        </div>
      )}

      {datasets.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FiAlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Datasets Found</h3>
          <p className="text-gray-500 mb-6">
            Upload a dataset first to generate predictions
          </p>
          <button
            onClick={() => window.location.href = '/dashboard/upload'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload Dataset
          </button>
        </div>
      )}
    </div>
  );
}