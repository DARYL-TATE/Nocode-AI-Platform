'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  FiUpload, 
  FiDatabase, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiCpu,
  FiTrash2,
  FiRefreshCw,
  FiBarChart2,
  FiDollarSign
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Dataset {
  id: number;
  name: string;
  rows: number;
  columns: number;
  status: string;
  created_at: string;
}

interface Stats {
  totalDatasets: number;
  totalRows: number;
  validatedCount: number;
  totalRevenue: string;
  avgPurchaseRate: string;
}

interface ErrorResponse {
  response?: {
    data?: {
      detail?: string;
    };
    status?: number;
  };
}

export default function DashboardHome() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<Stats>({
    totalDatasets: 0,
    totalRows: 0,
    validatedCount: 0,
    totalRevenue: '0 FCFA',
    avgPurchaseRate: '0%'
  });
  const router = useRouter();

  const formatFCFA = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  };

  const fetchDatasets = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get('/api/datasets/');
      const data = response.data as Dataset[];
      setDatasets(data);
      
      const totalRows = data.reduce((sum: number, d: Dataset) => sum + d.rows, 0);
      const validatedCount = data.filter((d: Dataset) => d.status === 'validated').length;
      const estimatedRevenue = totalRows * 5000;
      const avgPurchase = data.length > 0 ? (validatedCount / data.length) * 100 : 0;
      
      setStats({
        totalDatasets: data.length,
        totalRows: totalRows,
        validatedCount: validatedCount,
        totalRevenue: formatFCFA(estimatedRevenue),
        avgPurchaseRate: `${avgPurchase.toFixed(1)}%`
      });
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      console.error('Failed to fetch datasets:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        toast.error('Failed to load datasets');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDeleteAll = async (): Promise<void> => {
    if (!confirm('⚠️ WARNING: This will delete ALL your datasets. This action cannot be undone. Are you sure?')) {
      return;
    }
    
    setDeleting(true);
    try {
      await api.delete('/api/datasets/');
      toast.success('All datasets deleted successfully!');
      setDatasets([]);
      setStats({
        totalDatasets: 0,
        totalRows: 0,
        validatedCount: 0,
        totalRevenue: '0 FCFA',
        avgPurchaseRate: '0%'
      });
      localStorage.removeItem('lastPrediction');
      localStorage.removeItem('cachedVisualization');
      window.location.href = '/dashboard';
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      toast.error(err.response?.data?.detail || 'Failed to delete datasets');
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchDatasets();
    toast.success('Dashboard refreshed!');
    setRefreshing(false);
  };

  const handleDeleteSingle = async (datasetId: number, datasetName: string): Promise<void> => {
    if (!confirm(`Delete "${datasetName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/api/datasets/${datasetId}`);
      toast.success(`"${datasetName}" deleted successfully!`);
      await fetchDatasets();
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      toast.error(err.response?.data?.detail || 'Failed to delete dataset');
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Datasets', value: stats.totalDatasets, icon: FiDatabase, color: 'blue' },
    { title: 'Total Records', value: stats.totalRows.toLocaleString(), icon: FiBarChart2, color: 'green' },
    { title: 'Validated', value: stats.validatedCount, icon: FiCheckCircle, color: 'purple' },
    { title: 'Est. Revenue', value: stats.totalRevenue, icon: FiDollarSign, color: 'orange' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Herei s an overview of your datasets</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {stats.totalDatasets > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <FiTrash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete All Data'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/upload" className="group bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Dataset</h3>
              <p className="text-blue-100 text-sm">Add new CSV or Excel file</p>
            </div>
            <FiUpload className="w-8 h-8 text-blue-200 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
        
        <Link href="/dashboard/visualization" className="group bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Visualize Data</h3>
              <p className="text-green-100 text-sm">Interactive charts and graphs</p>
            </div>
            <FiBarChart2 className="w-8 h-8 text-green-200 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
        
        <Link href="/dashboard/predictions" className="group bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">AI Predictions</h3>
              <p className="text-purple-100 text-sm">Generate sales forecasts</p>
            </div>
            <FiCpu className="w-8 h-8 text-purple-200 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Your Datasets</h2>
          {stats.totalDatasets > 0 && <span className="text-sm text-gray-500">{stats.totalDatasets} total</span>}
        </div>
        
        {datasets.length === 0 ? (
          <div className="p-12 text-center">
            <FiDatabase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No datasets yet</h3>
            <p className="text-gray-500 mb-6">Upload your first dataset to get started</p>
            <Link href="/dashboard/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <FiUpload className="w-4 h-4" />
              Upload Dataset
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rows</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Columns</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{dataset.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{dataset.rows.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{dataset.columns}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dataset.status === 'validated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dataset.status === 'validated' ? <FiCheckCircle className="w-3 h-3 mr-1" /> : <FiAlertCircle className="w-3 h-3 mr-1" />}
                        {dataset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(dataset.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => handleDeleteSingle(dataset.id, dataset.name)} className="text-red-600 hover:text-red-800 transition flex items-center gap-1">
                        <FiTrash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}