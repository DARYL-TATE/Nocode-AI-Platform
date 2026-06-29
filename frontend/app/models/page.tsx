'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCpu, FiPlus, FiArrowLeft, FiTrash2, FiActivity } from 'react-icons/fi';

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/models/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-2">
              <FiArrowLeft /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">ML Models</h1>
            <p className="text-gray-600 mt-1">Manage and track your trained models</p>
          </div>
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPlus /> New Model
          </Link>
        </div>

        {/* Models Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading models...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiCpu className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Models Yet</h3>
            <p className="text-gray-600 mb-4">Start by uploading a dataset and training your first model</p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Dataset
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model: any) => (
              <div key={model.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FiCpu className="w-6 h-6 text-blue-600" />
                  </div>
                  <button className="text-red-500 hover:text-red-700">
                    <FiTrash2 />
                  </button>
                </div>
                <h3 className="font-semibold text-lg mb-1">{model.model_name || 'Untitled Model'}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Algorithm: {model.algorithm || 'Unknown'}
                </p>
                {model.accuracy && (
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                    <FiActivity />
                    <span>Accuracy: {(model.accuracy * 100).toFixed(2)}%</span>
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Created: {new Date(model.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}