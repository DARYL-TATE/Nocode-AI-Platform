'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { 
  FiDatabase, 
  FiBarChart2, 
  FiTable, 
  FiInfo, 
  FiRefreshCw,
  FiDownload,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiAlertCircle
} from 'react-icons/fi';
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

interface DatasetDetail {
  id: number;
  name: string;
  rows: number;
  columns: number;
  status: string;
  created_at: string;
  data: Record<string, unknown>[];
  statistics: {
    total_rows: number;
    total_columns: number;
  };
}

interface ErrorResponse {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

// ============ COMPONENT ============
export default function DataOverview() {
  // ============ STATE ============
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [datasetDetail, setDatasetDetail] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);

  // ============ FORMAT FCFA ============
  const formatFCFA = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  };

  // ============ FETCH DATASETS ============
  const fetchDatasets = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get('/api/datasets/');
      const data = response.data as Dataset[];
      setDatasets(data);
      
      if (data.length > 0) {
        const mostRecent = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setSelectedDataset(mostRecent);
        await fetchDatasetData(mostRecent.id);
      }
      setError(null);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      setError('Failed to load datasets. Make sure the backend is running.');
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ FETCH DATASET DATA ============
  const fetchDatasetData = useCallback(async (datasetId: number): Promise<void> => {
    setLoadingData(true);
    setError(null);
    try {
      const response = await api.get(`/api/datasets/${datasetId}/data`);
      const data = response.data as DatasetDetail;
      setDatasetDetail(data);
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to fetch dataset data:', err);
      setError(err.response?.data?.detail || 'Failed to load dataset data');
      toast.error('Failed to load dataset details');
    } finally {
      setLoadingData(false);
    }
  }, []);

  // ============ HANDLE DATASET CHANGE ============
  const handleDatasetChange = useCallback(async (datasetId: number): Promise<void> => {
    const dataset = datasets.find(d => d.id === datasetId);
    setSelectedDataset(dataset || null);
    if (dataset) {
      await fetchDatasetData(dataset.id);
    }
    setCurrentPage(1);
    setSearchTerm('');
  }, [datasets, fetchDatasetData]);

  // ============ HANDLE REFRESH ============
  const handleRefresh = useCallback(async (): Promise<void> => {
    if (selectedDataset) {
      await fetchDatasetData(selectedDataset.id);
      toast.success('Data refreshed!');
    }
  }, [selectedDataset, fetchDatasetData]);

  // ============ HANDLE EXPORT ============
  const handleExportToExcel = (): void => {
    if (!datasetDetail || !datasetDetail.data || datasetDetail.data.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datasetDetail.data);
      XLSX.utils.book_append_sheet(wb, ws, 'Dataset');
      const filename = `${selectedDataset?.name || 'dataset'}_data.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported to Excel!');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  // ============ FILTERED DATA ============
  const filteredData = datasetDetail?.data?.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(value => 
      value !== null && value !== undefined && 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  // ============ PAGINATION ============
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  // ============ STATS ============
  const stats = [
    { label: 'Total Datasets', value: datasets.length, icon: FiDatabase, color: 'blue' },
    { label: 'Total Records', value: datasetDetail?.rows?.toLocaleString() ?? '0', icon: FiTable, color: 'green' },
    { label: 'Total Columns', value: datasetDetail?.columns ?? '0', icon: FiBarChart2, color: 'purple' },
  ];

  // ============ COLUMN HEADERS ============
  const columnHeaders = datasetDetail?.data && datasetDetail.data.length > 0 
    ? Object.keys(datasetDetail.data[0]) 
    : [];

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Overview</h1>
        <p className="text-gray-500 mt-2">View and explore your dataset content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Selector */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Dataset</h2>
              <p className="text-sm text-gray-500 mt-1">Choose a dataset to view its contents</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={loadingData || !selectedDataset}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExportToExcel}
                disabled={!datasetDetail?.data?.length}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <FiDownload className="w-4 h-4" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <select
            value={selectedDataset?.id || ''}
            onChange={(e) => handleDatasetChange(parseInt(e.target.value))}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select a dataset</option>
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.rows.toLocaleString()} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading Data */}
      {loadingData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiLoader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading dataset content...</p>
        </div>
      ) : datasetDetail && datasetDetail.data && datasetDetail.data.length > 0 ? (
        <>
          {/* Dataset Info */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <FiInfo className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Dataset Information</h3>
                <p className="text-sm text-blue-700">
                  <strong>{selectedDataset?.name}</strong> • 
                  {datasetDetail.rows.toLocaleString()} records • 
                  {datasetDetail.columns} columns • 
                  Status: <span className="capitalize">{datasetDetail.status}</span> • 
                  Uploaded: {new Date(selectedDataset?.created_at ?? '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="p-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search in dataset..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    {columnHeaders.map((key) => (
                      <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </td>
                      {columnHeaders.map((col) => (
                        <td key={col} className="px-4 py-3 text-sm text-gray-900">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} entries
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : selectedDataset && !loadingData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiDatabase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">The dataset exists but no data could be loaded.</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : datasets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiDatabase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Datasets Found</h3>
          <p className="text-gray-500 mb-6">Upload a dataset to start analyzing your data</p>
          <button
            onClick={() => window.location.href = '/dashboard/upload'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload Dataset
          </button>
        </div>
      ) : null}
    </div>
  );
}