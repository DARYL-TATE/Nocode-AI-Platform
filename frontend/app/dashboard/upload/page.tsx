'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  FiUploadCloud, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiArrowRight, 
  FiFile, 
  FiX,
  FiBarChart2,
  FiDatabase,
  FiTrendingUp,
  FiTrash2,
  FiRefreshCw
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

interface ValidationResult {
  success: boolean;
  message: string;
  dataset_id: number;
  file: {
    name: string;
    size: number;
    rows: number;
    columns: number;
  };
  validation: {
    is_valid: boolean;
    missing_columns: string[];
    type_issues: string[];
    row_count: number;
    column_count: number;
  };
  preview: Record<string, any>[];
}

interface ErrorResponse {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export default function UploadPage() {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [existingDatasets, setExistingDatasets] = useState<Dataset[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      fetchExistingDatasets();
    }
  }, [router]);

  const fetchExistingDatasets = async (): Promise<void> => {
    try {
      const response = await api.get('/api/datasets/');
      setExistingDatasets(response.data);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteAllDatasets = async (): Promise<void> => {
    if (!confirm('⚠️ WARNING: This will delete ALL your existing datasets. This action cannot be undone. Are you sure?')) {
      return;
    }
    
    setDeleting(true);
    try {
      await api.delete('/api/datasets/');
      toast.success('All datasets deleted successfully!');
      setExistingDatasets([]);
      localStorage.removeItem('lastPrediction');
    } catch (error) {
      toast.error('Failed to delete datasets');
    } finally {
      setDeleting(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]): Promise<void> => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileInfo({
      name: file.name,
      size: file.size
    });

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);
    setValidationResult(null);

    try {
      const response = await api.post('/api/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      setValidationResult(response.data);
      
      if (response.data.success) {
        toast.success('Dataset uploaded and validated successfully!');
        await fetchExistingDatasets();
      } else {
        toast.error('Dataset uploaded but validation failed. Check missing columns.');
      }
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      console.error('Upload error:', err);
      toast.error(err.response?.data?.detail || 'Upload failed');
      setValidationResult(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: uploading || !isAuthenticated,
  });

  const clearFile = (): void => {
    setFileInfo(null);
    setValidationResult(null);
    setUploadProgress(0);
  };

  const handleViewDataOverview = (): void => {
    router.push('/dashboard/data-overview');
  };

  const handleGeneratePredictions = (): void => {
    router.push('/dashboard/predictions');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Dataset</h1>
        <p className="text-gray-500 mt-2">Upload your CSV or Excel file to start analyzing</p>
      </div>

      {existingDatasets.length > 0 && !validationResult && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You have {existingDatasets.length} existing dataset(s)
                </p>
                <p className="text-xs text-yellow-700">
                  Uploading a new dataset will add it to your collection.
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteAllDatasets}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <FiTrash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Clear All Data'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div
            {...getRootProps()}
            className={`
              relative rounded-2xl border-2 border-dashed transition-all duration-200
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className={`
                w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all
                ${isDragActive ? 'bg-blue-500 scale-110' : 'bg-gray-200'}
              `}>
                <FiUploadCloud className={`
                  w-10 h-10 transition-all
                  ${isDragActive ? 'text-white' : 'text-gray-500'}
                `} />
              </div>
              
              {isDragActive ? (
                <>
                  <h3 className="text-xl font-semibold text-blue-600 mb-2">Drop your file here</h3>
                  <p className="text-blue-500">Release to upload</p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Drag & drop your file</h3>
                  <p className="text-gray-500 mb-4">or <span className="text-blue-600 font-medium">browse</span> from your computer</p>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><FiFile className="w-3 h-3" /> CSV</span>
                    <span className="flex items-center gap-1"><FiFile className="w-3 h-3" /> XLSX</span>
                    <span className="flex items-center gap-1"><FiFile className="w-3 h-3" /> XLS</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {uploading && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm font-semibold text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {fileInfo && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <FiFile className="w-3 h-3" />
                  <span>{fileInfo.name}</span>
                  <span>•</span>
                  <span>{formatFileSize(fileInfo.size)}</span>
                </div>
              )}
            </div>
          )}

          {fileInfo && !uploading && !validationResult && (
            <div className="mt-4 bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiFile className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{fileInfo.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(fileInfo.size)}</p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <FiX className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {validationResult?.success && (
            <div className="mt-6 bg-green-50 rounded-xl border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Upload Successful!</h3>
                  <p className="text-sm text-green-600">Your dataset has been validated and is ready for analysis.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleViewDataOverview}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <FiDatabase className="w-4 h-4" />
                  View Data Overview
                </button>
                <button
                  onClick={handleGeneratePredictions}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <FiTrendingUp className="w-4 h-4" />
                  Generate Predictions
                </button>
                <button
                  onClick={() => {
                    setValidationResult(null);
                    setFileInfo(null);
                    setUploadProgress(0);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <FiUploadCloud className="w-4 h-4" />
                  Upload Another
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {existingDatasets.length > 0 && !validationResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiDatabase className="w-4 h-4 text-blue-600" />
                  Your Datasets ({existingDatasets.length})
                </h3>
                <button
                  onClick={fetchExistingDatasets}
                  className="p-1 text-gray-400 hover:text-blue-600 transition"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              </div>
              {loadingDatasets ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existingDatasets.map((dataset) => (
                    <div key={dataset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                          {dataset.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dataset.rows.toLocaleString()} rows • {dataset.columns} cols
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        dataset.status === 'validated' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {dataset.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiBarChart2 className="w-4 h-4 text-blue-600" />
              Required Columns
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">ID</span>
                <span className="text-gray-400">Unique identifier</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Age</span>
                <span className="text-gray-400">Customer age</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Gender</span>
                <span className="text-gray-400">Male/Female</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Income</span>
                <span className="text-gray-400">Annual income (FCFA)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Purchased</span>
                <span className="text-gray-400">Purchase amount (%)</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiFile className="w-4 h-4 text-blue-600" />
              Sample Data Format
            </h3>
            <div className="bg-white rounded-lg p-3 overflow-x-auto">
              <pre className="text-xs text-gray-600 font-mono">
{`ID,Age,Gender,Income,Purchased
1001,25,Male,45000,23
1002,32,Female,52000,45
1003,41,Male,38000,67`}
              </pre>
            </div>
            <button
              onClick={() => {
                const sampleData = `ID,Age,Gender,Income,Purchased
1001,25,Male,45000,23
1002,32,Female,52000,45
1003,41,Male,38000,67
1004,29,Female,61000,34
1005,35,Male,49000,56`;
                const blob = new Blob([sampleData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sample_sales_data.csv';
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Sample CSV downloaded!');
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Download Sample CSV →
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-blue-600" />
              What happens next?
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-700">1</span>
                </div>
                <span className="text-sm text-gray-700">Automatic data validation</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-700">2</span>
                </div>
                <span className="text-sm text-gray-700">AI-powered preprocessing</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-700">3</span>
                </div>
                <span className="text-sm text-gray-700">Interactive visualizations</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-700">4</span>
                </div>
                <span className="text-sm text-gray-700">Sales forecasting & insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {validationResult && !validationResult.success && validationResult.validation && (
        <div className="mt-8 bg-red-50 rounded-xl border border-red-200 p-6">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5" />
            Validation Failed
          </h3>
          {validationResult.validation.missing_columns?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-800 mb-2">Missing Required Columns:</p>
              <div className="flex flex-wrap gap-2">
                {validationResult.validation.missing_columns.map((col: string) => (
                  <span key={col} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
          {validationResult.validation.type_issues?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-800 mb-2">Data Type Issues:</p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {validationResult.validation.type_issues.map((issue: string, idx: number) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={clearFile}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}