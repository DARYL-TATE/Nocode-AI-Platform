'use client';

import { useState, useEffect } from 'react';
import { 
  FiDatabase, 
  FiBarChart2, 
  FiTable, 
  FiInfo, 
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Dataset {
  id: number;
  name: string;
  rows: number;
  columns: number;
  status: string;
  created_at: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  unique_count: number;
  missing_count: number;
  missing_percentage: number;
  min?: number;
  max?: number;
  mean?: number;
}

interface DatasetDetail {
  id: number;
  name: string;
  rows: number;
  columns: number;
  status: string;
  created_at: string;
  columns_info: ColumnInfo[];
  preview_data: any[];
  statistics: any;
}

export default function DataOverviewPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [datasetDetail, setDatasetDetail] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'columns' | 'stats'>('preview');

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await api.get('/api/datasets/');
      setDatasets(response.data);
      if (response.data.length > 0) {
        const mostRecent = response.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setSelectedDataset(mostRecent);
        await fetchDatasetDetail(mostRecent.id);
      }
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDatasetDetail = async (datasetId: number) => {
    setLoadingDetail(true);
    try {
      // Fetch dataset basic info
      const datasetResponse = await api.get(`/api/datasets/${datasetId}`);
      const dataset = datasetResponse.data;
      
      // Fetch validation results
      const validationResponse = await api.get(`/api/datasets/${datasetId}/validation`);
      const validation = validationResponse.data;
      
      // For preview data, we need to read the actual file
      // Since the backend doesn't have a preview endpoint yet, we'll use the uploaded file
      // For now, we'll create a detailed view from available data
      
      setDatasetDetail({
        id: dataset.id,
        name: dataset.name,
        rows: dataset.rows,
        columns: dataset.columns,
        status: dataset.status,
        created_at: dataset.created_at,
        columns_info: generateColumnInfo(validation),
        preview_data: [],
        statistics: {
          total_rows: dataset.rows,
          total_columns: dataset.columns,
          missing_values: validation.missing_columns?.length || 0,
          valid: validation.is_valid
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch dataset details:', error);
      toast.error('Failed to load dataset details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Generate column info from validation data
  const generateColumnInfo = (validation: any): ColumnInfo[] => {
    const requiredColumns = ['ID', 'Age', 'Gender', 'Income', 'Purchased'];
    return requiredColumns.map(col => ({
      name: col,
      type: col === 'Gender' ? 'text' : 'numeric',
      unique_count: 0,
      missing_count: validation.missing_columns?.includes(col) ? 100 : 0,
      missing_percentage: validation.missing_columns?.includes(col) ? 100 : 0,
      min: undefined,
      max: undefined,
      mean: undefined
    }));
  };

  const handleDatasetChange = async (datasetId: number) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      setSelectedDataset(dataset);
      await fetchDatasetDetail(datasetId);
    }
  };

  const handleRefresh = async () => {
    if (selectedDataset) {
      await fetchDatasetDetail(selectedDataset.id);
      toast.success('Data refreshed!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <FiDatabase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Datasets Found</h3>
        <p className="text-gray-500 mb-6">
          Upload a dataset to see data overview
        </p>
        <button
          onClick={() => window.location.href = '/dashboard/upload'}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Overview</h1>
        <p className="text-gray-600 mt-1">View and manage your datasets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Datasets</p>
              <p className="text-3xl font-bold text-gray-900">{datasets.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiDatabase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Records</p>
              <p className="text-3xl font-bold text-gray-900">
                {datasets.reduce((sum, d) => sum + d.rows, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiTable className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Columns</p>
              <p className="text-3xl font-bold text-gray-900">
                {datasets.reduce((sum, d) => sum + d.columns, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiBarChart2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Validated</p>
              <p className="text-3xl font-bold text-gray-900">
                {datasets.filter(d => d.status === 'validated').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Dataset</h2>
              <p className="text-sm text-gray-500 mt-1">Choose a dataset to view details</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <select
                value={selectedDataset?.id || ''}
                onChange={(e) => handleDatasetChange(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.rows.toLocaleString()} rows)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {selectedDataset && datasetDetail && (
          <div className="p-6">
            {/* Dataset Info */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FiInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Dataset Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                    <div>
                      <p className="text-blue-700">Name</p>
                      <p className="font-medium text-blue-900">{selectedDataset.name}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Rows</p>
                      <p className="font-medium text-blue-900">{selectedDataset.rows.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Columns</p>
                      <p className="font-medium text-blue-900">{selectedDataset.columns}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedDataset.status === 'validated' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedDataset.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-blue-700">Uploaded</p>
                      <p className="font-medium text-blue-900">{formatDate(selectedDataset.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors ${
                    activeTab === 'preview'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Data Preview
                </button>
                <button
                  onClick={() => setActiveTab('columns')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors ${
                    activeTab === 'columns'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Column Details
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors ${
                    activeTab === 'stats'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Statistics
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading dataset details...</span>
              </div>
            ) : (
              <>
                {/* Preview Tab */}
                {activeTab === 'preview' && (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">
                      Showing preview of the dataset. Upload a CSV file to see actual data.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                      <FiTable className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Upload a CSV file to see data preview</p>
                      <button
                        onClick={() => window.location.href = '/dashboard/upload'}
                        className="mt-3 text-blue-600 hover:text-blue-700"
                      >
                        Upload Dataset →
                      </button>
                    </div>
                  </div>
                )}

                {/* Columns Tab */}
                {activeTab === 'columns' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing Values</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing %</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {datasetDetail.columns_info.map((col) => (
                          <tr key={col.name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{col.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                col.type === 'numeric' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {col.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{col.missing_count}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{col.missing_percentage}%</td>
                            <td className="px-4 py-3">
                              {col.missing_count === 0 ? (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                  <FiCheckCircle className="w-4 h-4" />
                                  Valid
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-yellow-600 text-sm">
                                  <FiAlertCircle className="w-4 h-4" />
                                  Has Missing
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'stats' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Dataset Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Rows:</span>
                          <span className="font-medium">{datasetDetail.rows.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Columns:</span>
                          <span className="font-medium">{datasetDetail.columns}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Validated:</span>
                          <span className={datasetDetail.statistics.valid ? 'text-green-600' : 'text-yellow-600'}>
                            {datasetDetail.statistics.valid ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Missing Values:</span>
                          <span className="font-medium">{datasetDetail.statistics.missing_values}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Required Columns Status</h3>
                      <div className="space-y-2">
                        {['ID', 'Age', 'Gender', 'Income', 'Purchased'].map(col => {
                          const colInfo = datasetDetail.columns_info.find(c => c.name === col);
                          const isMissing = colInfo?.missing_count === 100;
                          return (
                            <div key={col} className="flex justify-between items-center">
                              <span className="text-gray-600">{col}:</span>
                              {isMissing ? (
                                <span className="text-red-600 text-sm">Missing</span>
                              ) : (
                                <span className="text-green-600 text-sm">Present</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* All Datasets List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Datasets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rows</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Columns</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {datasets.map((dataset) => (
                <tr 
                  key={dataset.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${selectedDataset?.id === dataset.id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleDatasetChange(dataset.id)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{dataset.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dataset.rows.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dataset.columns}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      dataset.status === 'validated' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dataset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}