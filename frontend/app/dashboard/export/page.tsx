'use client';

import { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiFileText, 
  FiFile, 
  FiCheckCircle,
  FiDatabase,
  FiBarChart2,
  FiTrendingUp
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
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

export default function ExportPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [exporting, setExporting] = useState(false);
  const [selectedData, setSelectedData] = useState<string[]>(['rawData', 'processedData', 'visualizations', 'insights', 'predictions']);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/datasets/');
      setDatasets(response.data);
      if (response.data.length > 0) {
        setSelectedDataset(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    }
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  };

  // Generate sample data for export
  const getSampleData = () => {
    return {
      rawData: [
        { ID: 1001, Age: 25, Gender: 'Male', Income: 45000, Purchased: 23 },
        { ID: 1002, Age: 32, Gender: 'Female', Income: 52000, Purchased: 45 },
        { ID: 1003, Age: 41, Gender: 'Male', Income: 38000, Purchased: 67 },
        { ID: 1004, Age: 29, Gender: 'Female', Income: 61000, Purchased: 34 },
        { ID: 1005, Age: 35, Gender: 'Male', Income: 49000, Purchased: 56 },
      ],
      processedData: [
        { ID: 1001, Age: 25, Gender: 'Male', Income: 45000, Purchased: 23, Normalized_Income: 0.45 },
        { ID: 1002, Age: 32, Gender: 'Female', Income: 52000, Purchased: 45, Normalized_Income: 0.52 },
        { ID: 1003, Age: 41, Gender: 'Male', Income: 38000, Purchased: 67, Normalized_Income: 0.38 },
        { ID: 1004, Age: 29, Gender: 'Female', Income: 61000, Purchased: 34, Normalized_Income: 0.61 },
        { ID: 1005, Age: 35, Gender: 'Male', Income: 49000, Purchased: 56, Normalized_Income: 0.49 },
      ],
      insights: {
        totalRevenue: formatFCFA(245000),
        averageSales: formatFCFA(49000),
        topProduct: 'Product A',
        growthRate: '15.5%',
        bestPerformingMonth: 'March',
        recommendations: [
          'Increase marketing spend in Q2',
          'Focus on high-income segments',
          'Optimize pricing strategy'
        ]
      },
      predictions: [
        { month: 'January', predicted: formatFCFA(55000), confidence: 'High' },
        { month: 'February', predicted: formatFCFA(58000), confidence: 'High' },
        { month: 'March', predicted: formatFCFA(62000), confidence: 'Medium' },
        { month: 'April', predicted: formatFCFA(60000), confidence: 'Medium' },
        { month: 'May', predicted: formatFCFA(65000), confidence: 'Low' },
      ]
    };
  };

  // Export as CSV
  const exportAsCSV = () => {
    const data = getSampleData();
    let csvContent = '';
    
    if (selectedData.includes('rawData')) {
      csvContent += '\n--- RAW DATA ---\n';
      const headers = Object.keys(data.rawData[0]);
      csvContent += headers.join(',') + '\n';
      data.rawData.forEach(row => {
        csvContent += headers.map(h => row[h as keyof typeof row]).join(',') + '\n';
      });
    }
    
    if (selectedData.includes('processedData')) {
      csvContent += '\n--- PROCESSED DATA ---\n';
      const headers = Object.keys(data.processedData[0]);
      csvContent += headers.join(',') + '\n';
      data.processedData.forEach(row => {
        csvContent += headers.map(h => row[h as keyof typeof row]).join(',') + '\n';
      });
    }
    
    if (selectedData.includes('insights')) {
      csvContent += '\n--- INSIGHTS ---\n';
      csvContent += `Total Revenue,${data.insights.totalRevenue}\n`;
      csvContent += `Average Sales,${data.insights.averageSales}\n`;
      csvContent += `Top Product,${data.insights.topProduct}\n`;
      csvContent += `Growth Rate,${data.insights.growthRate}\n`;
      csvContent += `Best Month,${data.insights.bestPerformingMonth}\n`;
      csvContent += 'Recommendations,"' + data.insights.recommendations.join('; ') + '"\n';
    }
    
    if (selectedData.includes('predictions')) {
      csvContent += '\n--- PREDICTIONS ---\n';
      csvContent += 'Month,Predicted Sales,Confidence\n';
      data.predictions.forEach(p => {
        csvContent += `${p.month},${p.predicted},${p.confidence}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `export_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('CSV exported successfully!');
  };

  // Export as Excel
  const exportAsExcel = () => {
    const data = getSampleData();
    const wb = XLSX.utils.book_new();
    
    if (selectedData.includes('rawData')) {
      const ws = XLSX.utils.json_to_sheet(data.rawData);
      XLSX.utils.book_append_sheet(wb, ws, 'Raw Data');
    }
    
    if (selectedData.includes('processedData')) {
      const ws = XLSX.utils.json_to_sheet(data.processedData);
      XLSX.utils.book_append_sheet(wb, ws, 'Processed Data');
    }
    
    if (selectedData.includes('insights')) {
      const insightsData = [
        ['Metric', 'Value'],
        ['Total Revenue', data.insights.totalRevenue],
        ['Average Sales', data.insights.averageSales],
        ['Top Product', data.insights.topProduct],
        ['Growth Rate', data.insights.growthRate],
        ['Best Performing Month', data.insights.bestPerformingMonth],
        ['Recommendations', data.insights.recommendations.join(', ')],
      ];
      const ws = XLSX.utils.aoa_to_sheet(insightsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Insights');
    }
    
    if (selectedData.includes('predictions')) {
      const ws = XLSX.utils.json_to_sheet(data.predictions);
      XLSX.utils.book_append_sheet(wb, ws, 'Predictions');
    }
    
    XLSX.writeFile(wb, `export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file exported successfully!');
  };

  // Export as PDF
  const exportAsPDF = () => {
    const data = getSampleData();
    const doc = new jsPDF();
    let yPos = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('SmartML Export Report', 20, yPos);
    yPos += 10;
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 10;
    doc.text(`Dataset: ${selectedDataset?.name || 'N/A'}`, 20, yPos);
    yPos += 15;
    
    if (selectedData.includes('rawData')) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Raw Data', 20, yPos);
      yPos += 5;
      
      const tableData = data.rawData.map(row => [row.ID, row.Age, row.Gender, row.Income, row.Purchased]);
      (doc as any).autoTable({
        startY: yPos,
        head: [['ID', 'Age', 'Gender', 'Income', 'Purchased']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    if (selectedData.includes('insights')) {
      doc.setFontSize(14);
      doc.text('Key Insights', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text(`• Total Revenue: ${data.insights.totalRevenue}`, 25, yPos);
      yPos += 8;
      doc.text(`• Average Sales: ${data.insights.averageSales}`, 25, yPos);
      yPos += 8;
      doc.text(`• Top Product: ${data.insights.topProduct}`, 25, yPos);
      yPos += 8;
      doc.text(`• Growth Rate: ${data.insights.growthRate}`, 25, yPos);
      yPos += 8;
      doc.text(`• Best Month: ${data.insights.bestPerformingMonth}`, 25, yPos);
      yPos += 8;
      doc.text('• Recommendations:', 25, yPos);
      yPos += 5;
      data.insights.recommendations.forEach(rec => {
        doc.text(`  - ${rec}`, 30, yPos);
        yPos += 6;
      });
      yPos += 10;
    }
    
    if (selectedData.includes('predictions')) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Sales Predictions', 20, yPos);
      yPos += 5;
      
      const predData = data.predictions.map(p => [p.month, p.predicted, p.confidence]);
      (doc as any).autoTable({
        startY: yPos,
        head: [['Month', 'Predicted Sales', 'Confidence']],
        body: predData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94] },
      });
    }
    
    doc.save(`export_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully!');
  };

  const handleExport = () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset first');
      return;
    }
    
    if (selectedData.length === 0) {
      toast.error('Please select at least one section to export');
      return;
    }
    
    setExporting(true);
    
    try {
      if (exportFormat === 'csv') {
        exportAsCSV();
      } else if (exportFormat === 'excel') {
        exportAsExcel();
      } else if (exportFormat === 'pdf') {
        exportAsPDF();
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    { id: 'csv', name: 'CSV', icon: FiFileText, description: 'Comma-separated values', color: 'blue' },
    { id: 'excel', name: 'Excel', icon: FiFile, description: 'Microsoft Excel format (.xlsx)', color: 'green' },
    { id: 'pdf', name: 'PDF', icon: FiFile, description: 'PDF report with formatting', color: 'red' },
  ];

  const sections = [
    { id: 'rawData', name: 'Raw Data', description: 'Original dataset values', icon: FiDatabase },
    { id: 'processedData', name: 'Processed Data', description: 'Cleaned and normalized data', icon: FiBarChart2 },
    { id: 'insights', name: 'AI Insights', description: 'Key metrics and recommendations', icon: FiTrendingUp },
    { id: 'predictions', name: 'Predictions', description: 'Forecast and future trends', icon: FiTrendingUp },
  ];

  const toggleSection = (sectionId: string) => {
    if (selectedData.includes(sectionId)) {
      setSelectedData(selectedData.filter(s => s !== sectionId));
    } else {
      setSelectedData([...selectedData, sectionId]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Export Results</h1>
        <p className="text-gray-500 mt-2">Export your data, visualizations, and insights in multiple formats</p>
      </div>

      {/* Dataset Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Dataset
        </label>
        <select
          value={selectedDataset?.id || ''}
          onChange={(e) => {
            const dataset = datasets.find(d => d.id === parseInt(e.target.value));
            setSelectedDataset(dataset || null);
          }}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a dataset</option>
          {datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name} ({dataset.rows} rows)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Format Options */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Export Format</h2>
            <p className="text-sm text-gray-500 mt-1">Choose your preferred format</p>
          </div>
          <div className="p-6 space-y-4">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = exportFormat === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setExportFormat(option.id as any)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? `bg-${option.color}-600` : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-medium ${isSelected ? `text-${option.color}-900` : 'text-gray-900'}`}>
                      {option.name}
                    </h3>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  {isSelected && <FiCheckCircle className={`w-5 h-5 text-${option.color}-600`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sections to Export */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Content to Export</h2>
            <p className="text-sm text-gray-500 mt-1">Select which sections to include</p>
          </div>
          <div className="p-6 space-y-3">
            {sections.map((section) => {
              const Icon = section.icon;
              const isSelected = selectedData.includes(section.id);
              return (
                <label
                  key={section.id}
                  className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSection(section.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {section.name}
                    </p>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>
                  {isSelected && <FiCheckCircle className="w-5 h-5 text-blue-600" />}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Summary & Button */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">Ready to Export?</h3>
            <p className="text-blue-100 text-sm">
              Exporting {selectedData.length} section(s) as {exportFormat.toUpperCase()}
              {selectedDataset && ` from ${selectedDataset.name}`}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || !selectedDataset || selectedData.length === 0}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FiDownload className="w-5 h-5" />
                Export Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <FiFileText className="w-5 h-5 text-blue-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">CSV Format</h4>
          <p className="text-xs text-gray-500 mt-1">Compatible with Excel, Google Sheets, and most data tools</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <FiFile className="w-5 h-5 text-green-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Excel Format</h4>
          <p className="text-xs text-gray-500 mt-1">Multiple sheets with formatting and calculations</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <FiFile className="w-5 h-5 text-red-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">PDF Format</h4>
          <p className="text-xs text-gray-500 mt-1">Professional report with tables and insights</p>
        </div>
      </div>
    </div>
  );
}