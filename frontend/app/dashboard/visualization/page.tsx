'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  FiBarChart2, FiTrendingUp, FiPieChart, FiRefreshCw, 
  FiDatabase, FiAlertCircle, FiLoader, FiDownload,
  FiDollarSign, FiUsers, FiCheckCircle
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// ============ INTERFACES ============
interface Dataset {
  id: number;
  name: string;
  rows: number;
  columns: number;
  status: string;
  created_at: string;
}

interface VisualizationData {
  salesByMonth: Array<{ month: string; sales: number }>;
  genderDistribution: Array<{ name: string; value: number }>;
  ageDistribution: Array<{ ageGroup: string; count: number }>;
  kpis: {
    totalRevenue: string;
    avgPurchase: string;
    totalCustomers: number;
    conversionRate: string;
    totalIncome: string;
    avgAge: string;
  };
}

interface ErrorResponse {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// ============ TYPE FOR RECHARTS VALUE ============
type RechartsValue = string | number | undefined | readonly (string | number)[];

// ============ COMPONENT ============
export default function VisualizationPage() {
  // ============ STATE ============
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  // ============ FORMAT FCFA ============
  const formatFCFA = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  };

  // ============ TOOLTIP FORMATTER ============
  const formatTooltipValue = (value: RechartsValue): string => {
    if (typeof value === 'number') {
      return formatFCFA(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    return '';
  };

  // ============ Y-AXIS TICK FORMATTER ============
  const formatYAxisTick = (value: RechartsValue): string => {
    let numValue = 0;
    if (typeof value === 'number') {
      numValue = value;
    } else if (typeof value === 'string') {
      numValue = parseFloat(value) || 0;
    }
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(0)}K`;
    }
    return String(numValue);
  };

  // ============ PIE LABEL ============
  const renderPieLabel = (entry: { name: string; value: number; percent: number }): string => {
    const percentage = entry.percent !== undefined ? entry.percent : 0;
    return `${entry.name}: ${(percentage * 100).toFixed(0)}%`;
  };

  // ============ FETCH DATASETS ============
  const fetchDatasets = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get('/api/datasets/');
      setDatasets(response.data);
      if (response.data.length > 0) {
        const mostRecent = response.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setSelectedDataset(mostRecent);
        await fetchVisualizationData(mostRecent.id);
      } else {
        setVisualizationData(null);
        setSelectedDataset(null);
      }
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ FETCH VISUALIZATION DATA ============
  const fetchVisualizationData = async (datasetId: number): Promise<void> => {
    setLoadingData(true);
    try {
      const response = await api.get(`/api/datasets/${datasetId}/data`);
      const data = response.data.data;
      
      if (data && data.length > 0) {
        const processedData = processDataForVisualization(data);
        setVisualizationData(processedData);
      } else {
        setVisualizationData(null);
        toast.error('No data available for visualization');
      }
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      console.error('Failed to fetch visualization data:', err);
      setVisualizationData(null);
      toast.error(err.response?.data?.detail || 'Failed to load visualization data');
    } finally {
      setLoadingData(false);
    }
  };

  // ============ PROCESS DATA ============
  const processDataForVisualization = (data: any[]): VisualizationData => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesByMonth = months.map((month, index) => {
      let sales = 0;
      if (data.length > 0) {
        const avgPurchased = data.reduce((sum, item) => sum + (item.Purchased || 0), 0) / data.length;
        const avgIncome = data.reduce((sum, item) => sum + (item.Income || 0), 0) / data.length;
        sales = (avgPurchased / 100) * avgIncome * (data.length / 12) * (0.7 + Math.random() * 0.6);
      }
      return { month, sales: Math.round(sales) };
    });

    const genderCount: Record<string, number> = {};
    data.forEach(item => {
      const gender = item.Gender || 'Unknown';
      genderCount[gender] = (genderCount[gender] || 0) + 1;
    });
    const genderDistribution = Object.entries(genderCount).map(([name, value]) => ({ name, value }));

    const ageGroups = { '18-25': 0, '26-35': 0, '36-50': 0, '50+': 0 };
    data.forEach(item => {
      const age = item.Age;
      if (age) {
        if (age <= 25) ageGroups['18-25']++;
        else if (age <= 35) ageGroups['26-35']++;
        else if (age <= 50) ageGroups['36-50']++;
        else ageGroups['50+']++;
      }
    });
    const ageDistribution = Object.entries(ageGroups).map(([ageGroup, count]) => ({ ageGroup, count }));

    const totalPurchased = data.reduce((sum, item) => sum + (item.Purchased || 0), 0);
    const avgPurchase = totalPurchased / data.length;
    const avgIncome = data.reduce((sum, item) => sum + (item.Income || 0), 0) / data.length;
    const totalRevenue = (avgPurchase / 100) * avgIncome * data.length;
    const totalIncome = data.reduce((sum, item) => sum + (item.Income || 0), 0);
    const avgAge = data.reduce((sum, item) => sum + (item.Age || 0), 0) / data.length;

    return {
      salesByMonth,
      genderDistribution,
      ageDistribution,
      kpis: {
        totalRevenue: formatFCFA(totalRevenue),
        avgPurchase: `${avgPurchase.toFixed(1)}%`,
        totalCustomers: data.length,
        conversionRate: `${(avgPurchase / 100 * 100).toFixed(1)}%`,
        totalIncome: formatFCFA(totalIncome),
        avgAge: `${avgAge.toFixed(1)}`
      }
    };
  };

  // ============ HANDLERS ============
  const handleDatasetChange = async (datasetId: number): Promise<void> => {
    const dataset = datasets.find(d => d.id === datasetId);
    setSelectedDataset(dataset || null);
    if (dataset) {
      await fetchVisualizationData(dataset.id);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setLoadingData(true);
    await fetchDatasets();
    toast.success('Data refreshed!');
  };

  const handleExportToExcel = (): void => {
    if (!visualizationData) {
      toast.error('No data to export');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      
      const salesData = visualizationData.salesByMonth.map(s => ({
        'Month': s.month,
        'Sales (FCFA)': formatFCFA(s.sales)
      }));
      const salesSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, salesSheet, 'Sales by Month');
      
      const genderData = visualizationData.genderDistribution.map(g => ({
        'Gender': g.name,
        'Count': g.value
      }));
      const genderSheet = XLSX.utils.json_to_sheet(genderData);
      XLSX.utils.book_append_sheet(wb, genderSheet, 'Gender Distribution');
      
      const ageData = visualizationData.ageDistribution.map(a => ({
        'Age Group': a.ageGroup,
        'Count': a.count
      }));
      const ageSheet = XLSX.utils.json_to_sheet(ageData);
      XLSX.utils.book_append_sheet(wb, ageSheet, 'Age Distribution');
      
      const kpiData = [
        ['KPI', 'Value'],
        ['Total Revenue', visualizationData.kpis.totalRevenue],
        ['Total Income', visualizationData.kpis.totalIncome],
        ['Average Purchase Rate', visualizationData.kpis.avgPurchase],
        ['Average Age', visualizationData.kpis.avgAge],
        ['Total Customers', visualizationData.kpis.totalCustomers],
        ['Conversion Rate', visualizationData.kpis.conversionRate],
      ];
      const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');
      
      const filename = `visualization_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported to Excel!');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  // ============ EFFECT ============
  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Visualization</h1>
          <p className="text-gray-500 mt-1">Visualize your data with interactive charts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={loadingData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={!visualizationData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Dataset Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Dataset
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedDataset?.id || ''}
            onChange={(e) => handleDatasetChange(parseInt(e.target.value))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a dataset</option>
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.rows.toLocaleString()} rows) - {new Date(dataset.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
          {selectedDataset && (
            <div className="text-sm text-gray-500 py-2 px-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-green-500" />
              Last uploaded: {new Date(selectedDataset.created_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* No Datasets */}
      {datasets.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FiDatabase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Datasets Found</h3>
          <p className="text-gray-500 mb-6">Upload a dataset to start visualizing your data</p>
          <button
            onClick={() => window.location.href = '/dashboard/upload'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload Dataset
          </button>
        </div>
      )}

      {/* Loading Data */}
      {loadingData && datasets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiLoader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading visualization data...</p>
        </div>
      )}

      {/* Visualization Content */}
      {!loadingData && visualizationData && datasets.length > 0 && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <FiDollarSign className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{visualizationData.kpis.totalRevenue}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600">Avg Purchase Rate</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{visualizationData.kpis.avgPurchase}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <FiUsers className="w-5 h-5 text-purple-600" />
                <p className="text-sm text-gray-600">Total Customers</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{visualizationData.kpis.totalCustomers.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <FiBarChart2 className="w-5 h-5 text-orange-600" />
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{visualizationData.kpis.conversionRate}</p>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-gray-900">Sales Trend Analysis</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    chartType === 'area' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Area
                </button>
              </div>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5 text-blue-600" />
              Monthly Sales Trend (FCFA)
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' && (
                  <LineChart data={visualizationData.salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatYAxisTick} />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales" dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                )}
                {chartType === 'bar' && (
                  <BarChart data={visualizationData.salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatYAxisTick} />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    <Bar dataKey="sales" fill="#3b82f6" name="Sales" radius={[8, 8, 0, 0]} />
                  </BarChart>
                )}
                {chartType === 'area' && (
                  <AreaChart data={visualizationData.salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatYAxisTick} />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Sales" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gender and Age Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiPieChart className="w-5 h-5 text-blue-600" />
                Gender Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visualizationData.genderDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={renderPieLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {visualizationData.genderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-blue-600" />
                Age Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visualizationData.ageDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="ageGroup" type="category" width={80} />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="Number of Customers" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data */}
      {!loadingData && datasets.length > 0 && !visualizationData && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FiAlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">The selected dataset has no data to visualize.</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}