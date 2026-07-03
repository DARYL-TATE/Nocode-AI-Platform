'use client';

import { useState } from 'react';
import { FiCheck, FiActivity, FiRefreshCw, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface PreprocessingSteps {
  handleMissing: string;
  removeDuplicates: boolean;
  normalizeData: boolean;
  removeOutliers: boolean;
  encodeCategorical: boolean;
}

interface Results {
  success: boolean;
  message: string;
  stats: {
    missingValuesFilled: number;
    duplicatesRemoved: number;
    outliersRemoved: number;
    rowsBefore: number;
    rowsAfter: number;
  };
}

export default function PreprocessingPage() {
  const [preprocessingSteps, setPreprocessingSteps] = useState<PreprocessingSteps>({
    handleMissing: 'auto',
    removeDuplicates: true,
    normalizeData: false,
    removeOutliers: false,
    encodeCategorical: true,
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<Results | null>(null);

  const steps = [
    {
      id: 'handleMissing' as keyof PreprocessingSteps,
      name: 'Handle Missing Values',
      description: 'Automatically fill or remove missing values',
      options: ['auto', 'mean', 'median', 'mode', 'drop'],
    },
    {
      id: 'removeDuplicates' as keyof PreprocessingSteps,
      name: 'Remove Duplicates',
      description: 'Remove duplicate records from dataset',
    },
    {
      id: 'normalizeData' as keyof PreprocessingSteps,
      name: 'Normalize Data',
      description: 'Scale numerical data to standard range',
    },
    {
      id: 'removeOutliers' as keyof PreprocessingSteps,
      name: 'Remove Outliers',
      description: 'Remove statistical outliers from dataset',
    },
    {
      id: 'encodeCategorical' as keyof PreprocessingSteps,
      name: 'Encode Categorical Variables',
      description: 'Convert text categories to numerical values',
    },
  ];

  const handleToggle = (step: keyof PreprocessingSteps, value?: string): void => {
    if (value !== undefined) {
      setPreprocessingSteps({ ...preprocessingSteps, [step]: value });
    } else {
      setPreprocessingSteps({ 
        ...preprocessingSteps, 
        [step]: !preprocessingSteps[step] 
      });
    }
  };

  const handleProcess = async (): Promise<void> => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setResults({
        success: true,
        message: 'Data preprocessing completed successfully',
        stats: {
          missingValuesFilled: 23,
          duplicatesRemoved: 5,
          outliersRemoved: 3,
          rowsBefore: 1250,
          rowsAfter: 1242,
        },
      });
      setIsProcessing(false);
      toast.success('Preprocessing completed!');
    }, 2000);
  };

  const handleExport = (): void => {
    toast.success('Export started! Your cleaned data will be downloaded shortly.');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Preprocessing</h1>
        <p className="text-gray-600 mt-1">Clean and prepare your data for analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Preprocessing Steps</h2>
            <p className="text-sm text-gray-500 mt-1">Select the steps you want to apply</p>
          </div>
          <div className="divide-y divide-gray-200">
            {steps.map((step) => (
              <div key={step.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{step.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  </div>
                  {'options' in step ? (
                    <select
                      value={preprocessingSteps[step.id] as string}
                      onChange={(e) => handleToggle(step.id, e.target.value)}
                      className="ml-4 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {step.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => handleToggle(step.id)}
                      className={`ml-4 w-10 h-6 rounded-full transition-colors ${
                        preprocessingSteps[step.id] ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                          preprocessingSteps[step.id] ? 'translate-x-5' : 'translate-x-1'
                        } mt-1`}
                      />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FiActivity className="w-4 h-4" />
                  Apply Preprocessing
                </>
              )}
            </button>
          </div>
        </div>

        {results && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Processing Results</h2>
            </div>
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700">
                  <FiCheck className="w-5 h-5" />
                  <span className="font-medium">{results.message}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Missing Values Filled:</span>
                  <span className="font-medium text-gray-900">{results.stats.missingValuesFilled}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Duplicates Removed:</span>
                  <span className="font-medium text-gray-900">{results.stats.duplicatesRemoved}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Outliers Removed:</span>
                  <span className="font-medium text-gray-900">{results.stats.outliersRemoved}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Rows (Before → After):</span>
                  <span className="font-medium text-gray-900">
                    {results.stats.rowsBefore.toLocaleString()} → {results.stats.rowsAfter.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="w-full mt-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export Cleaned Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}