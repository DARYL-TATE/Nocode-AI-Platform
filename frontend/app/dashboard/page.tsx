'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  FiUsers,
  FiDollarSign
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Dataset {
  id: number;
  name: string;
  rows: number;
  columns: number;
  status: string;
  created_at: string;
}

export default function DashboardHome() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalRows: 0,
    validatedCount: 0,
    totalRevenue: '0 FCFA',
    avgPurchaseRate: '0%'
  });
  const router = useRouter();

  // Fetch datasets function
  const fetchDatasets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:8000/api/datasets/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = response.data;
      setDatasets(data);
      
      // Calculate stats from actual data
      const totalRows = data.reduce((sum: number, d: Dataset) => sum + d.rows, 0);
      const validatedCount = data.filter((d: Dataset) => d.status === 'validated').length;
      
      // Calculate estimated revenue based on dataset size
      const estimatedRevenue = totalRows * 5000; // Rough estimate: 5000 FCFA per row
      const avgPurchase = data.length > 0 ? (validatedCount / data.length) * 100 : 0;
      
      setStats({
        totalDatasets: data.length,
        totalRows: totalRows,
        validatedCount: validatedCount,
        totalRevenue: formatFCFA(estimatedRevenue),
        avgPurchaseRate: `${avgPurchase.toFixed(1)}%`
      });
    } catch (error: any) {
      console.error('Failed to fetch datasets:', error);
      if (error.response?.status === 401) {
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

  // Format FCFA currency
  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  };

  // Delete all datasets
  const handleDeleteAll = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL your datasets and all associated data (visualizations, predictions, exports). This action cannot be undone. Are you sure?')) {
      return;
    }
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:8000/api/datasets/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('All datasets deleted successfully!');
      
      // Clear all state
      setDatasets([]);
      setStats({
        totalDatasets: 0,
        totalRows: 0,
        validatedCount: 0,
        totalRevenue: '0 FCFA',
        avgPurchaseRate: '0%'
      });
      
      // Clear any cached data from localStorage
      localStorage.removeItem('lastPrediction');
      localStorage.removeItem('cachedVisualization');
      
      // Force hard refresh to clear all React component states
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete datasets');
    } finally {
      setDeleting(false);
    }
  };

  // Refresh dashboard data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDatasets();
    toast.success('Dashboard refreshed!');
    setRefreshing(false);
  };

  // Delete single dataset
  const handleDeleteSingle = async (datasetId: number, datasetName: string) => {
    if (!confirm(`Delete "${datasetName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/datasets/${datasetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`"${datasetName}" deleted successfully!`);
      await fetchDatasets(); // Refresh the list
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete dataset');
    }
  };

  useEffect(() => {
    fetchDatasets();
    
    // Add event listener to refresh when coming back to this page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDatasets();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDatasets]);

  // Stat cards configuration
  const statCards = [
    {
      title: 'Total Datasets',
      value: stats.totalDatasets,
      icon: FiDatabase,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Records',
      value: stats.totalRows.toLocaleString(),
      icon: FiBarChart2,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Validated Datasets',
      value: stats.validatedCount,
      icon: FiCheckCircle,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Revenue',
      value: stats.totalRevenue,
      icon: FiBarChart2,
      color: 'orange',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's an overview of your datasets</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/dashboard/upload"
          className="group bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Dataset</h3>
              <p className="text-blue-100 text-sm">Add new CSV or Excel file</p>
            </div>
            <FiUpload className="w-8 h-8 text-blue-200 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
        
        <Link
          href="/dashboard/visualization"
          className="group bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Visualize Data</h3>
              <p className="text-green-100 text-sm">Interactive charts and graphs</p>
            </div>
            <FiBarChart2 className="w-8 h-8 text-green-200 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
        
        <Link
          href="/dashboard/predictions"
          className="group bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">AI Predictions</h3>
              <p className="text-purple-100 text-sm">Generate sales forecasts</p>
            </div>
            <FiCpu className="w-8 h-8 text-purple-200 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Datasets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Your Datasets</h2>
          {stats.totalDatasets > 0 && (
            <span className="text-sm text-gray-500">{stats.totalDatasets} total</span>
          )}
        </div>
        
        {datasets.length === 0 ? (
          <div className="p-12 text-center">
            <FiDatabase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No datasets yet</h3>
            <p className="text-gray-500 mb-6">Upload your first dataset to get started</p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FiUpload className="w-4 h-4" />
              Upload Dataset
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rows</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Columns</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {dataset.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dataset.rows.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dataset.columns}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dataset.status === 'validated' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dataset.status === 'validated' ? (
                          <FiCheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <FiAlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {dataset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(dataset.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteSingle(dataset.id, dataset.name)}
                        className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                      >
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

      {/* Help Section - Only show when no datasets */}
      {datasets.length === 0 && (
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCpu className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Getting Started with SmartML</h3>
              <ol className="text-sm text-blue-800 space-y-2">
                <li>1. Click <strong>Upload Dataset</strong> to add your CSV or Excel file</li>
                <li>2. Wait for automatic validation and preprocessing</li>
                <li>3. View <strong>Data Overview</strong> to explore your data</li>
                <li>4. Generate <strong>Visualizations</strong> to see patterns</li>
                <li>5. Use <strong>AI Predictions</strong> to forecast sales</li>
                <li>6. <strong>Export Results</strong> in CSV, Excel, or PDF format</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tips when datasets exist */}
      {datasets.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">Pro Tip</h4>
            </div>
            <p className="text-sm text-gray-600">
              Go to <Link href="/dashboard/predictions" className="text-blue-600 hover:underline">Predictions</Link> to generate AI-powered sales forecasts based on your actual data.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FiBarChart2 className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Visualize Your Data</h4>
            </div>
            <p className="text-sm text-gray-600">
              Use the <Link href="/dashboard/visualization" className="text-green-600 hover:underline">Visualization</Link> page to see interactive charts and gain insights.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}