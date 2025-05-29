import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
// import * as XLSX from 'xlsx'; // If you add XLSX later
import { APP_HEADERS } from './appHeaders'; // Import from local file
import Section from '../../components/common/Section.jsx'; // Adjusted path

// Props might include darkMode if it's managed at a higher level
function CsvProcessor({ darkMode }) {
  const [csvData, setCsvData] = useState([]);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);
  const [headerMap, setHeaderMap] = useState({});
  const [margin, setMargin] = useState(0);
  const [conversionRate, setConversionRate] = useState(1);
  // const [downloadUrl, setDownloadUrl] = useState(null); // Direct download is better
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [fileInfo, setFileInfo] = useState({ size: 0, rows: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const [customFileName, setCustomFileName] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (uploadedHeaders.length > 0) {
      const initialMap = {};
      uploadedHeaders.forEach((header) => {
        const normalizedHeader = header.toLowerCase().trim();
        let foundAppHeader = APP_HEADERS.find(appH => appH.toLowerCase() === normalizedHeader);
        if (!foundAppHeader) { /* ... (your existing auto-mapping logic) ... */ }
        initialMap[header] = foundAppHeader || "";
      });
      setHeaderMap(initialMap);
    } else {
      setHeaderMap({});
    }
  }, [uploadedHeaders]);

  const resetFileState = useCallback(() => {
    setCsvData([]);
    setUploadedHeaders([]);
    setFileName("");
    setFileInfo({ size: 0, rows: 0 });
    // setDownloadUrl(null);
    const fileInput = document.getElementById('csv-upload-processor'); // Unique ID for this instance
    if (fileInput) fileInput.value = '';
  }, []);


  const processFile = useCallback((file) => {
    resetFileState();
    if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv') /* ... more types ... */)) {
      setFileName(file.name);
      setFileInfo({ size: (file.size / 1024).toFixed(2), rows: 0 });
      setProcessing(true);
      Papa.parse(file, {
        header: true, skipEmptyLines: true, dynamicTyping: false,
        complete: (results) => {
          if (results.data && results.data.length > 0 && results.meta && results.meta.fields) {
            const filteredData = results.data.filter(row => Object.values(row).some(val => String(val).trim() !== ''));
            if (filteredData.length > 0) {
              setCsvData(filteredData);
              setUploadedHeaders(results.meta.fields);
              setFileInfo(prev => ({ ...prev, rows: filteredData.length }));
            } else { alert("CSV appears empty."); resetFileState(); }
          } else { alert("Could not parse CSV."); resetFileState(); }
          setProcessing(false);
        },
        error: (err) => { console.error(err); alert(`Error: ${err.message}`); resetFileState(); setProcessing(false); }
      });
    } else { alert('Please select a valid CSV file.'); resetFileState(); }
  }, [resetFileState]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); };
  const handleMappingChange = (uploadedHeader, appHeader) => setHeaderMap(prev => ({ ...prev, [uploadedHeader]: appHeader }));

  const generateProcessedData = useCallback(() => {
    // ... (your existing generateProcessedData logic) ...
    // Make sure to use `selectedTags`
     return csvData.map((row) => {
      const newRow = {};
      APP_HEADERS.forEach((appHeader) => {
        const originalKey = Object.keys(headerMap).find(
          (key) => headerMap[key] === appHeader
        );
        let value = originalKey && row[originalKey] !== undefined ? String(row[originalKey]) : "";

        if (appHeader === "Regular price" || appHeader === "Sale price") {
          const price = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(price)) {
            const adjustedPrice = price * (1 + parseFloat(margin) / 100) * parseFloat(conversionRate);
            value = adjustedPrice.toFixed(2);
          } else {
            value = "";
          }
        }
        
        if (appHeader === "Tags" && selectedTags.length > 0) {
           const existingTags = value ? value.split(',').map(t => t.trim()) : [];
           const combinedTags = [...new Set([...existingTags, ...selectedTags])];
           value = combinedTags.filter(t => t).join(', ');
        }
        newRow[appHeader] = value;
      });
      return newRow;
    });
  }, [csvData, headerMap, margin, conversionRate, selectedTags]);

  const handleDownload = useCallback(() => {
    // ... (your existing handleDownload logic for CSV/JSON, direct download) ...
    // Remember to use `exportFormat` and `customFileName`
    if (csvData.length === 0) { alert("Please upload a CSV."); return; }
    setProcessing(true);
    setTimeout(() => {
        const processedData = generateProcessedData();
        if (processedData.length === 0) { alert("No data to process."); setProcessing(false); return; }

        let blob;
        const finalFileName = customFileName.trim() ? `${customFileName.trim()}.${exportFormat}` : `updated_products.${exportFormat}`;

        if (exportFormat === 'json') {
            const jsonString = JSON.stringify(processedData, null, 2);
            blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        } else { // CSV default
            const csv = Papa.unparse(processedData, { columns: APP_HEADERS });
            blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', finalFileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setProcessing(false);
    }, 500);
  }, [csvData.length, generateProcessedData, customFileName, exportFormat]);

  // ... (handleCellEdit, getSmartSuggestions, calculateStats, addTag, removeTag) ...
  // Ensure these are also wrapped in useCallback if they don't change often or depend on stable values
  const handleCellEdit = useCallback((rowIndex, header, newValue) => {
    const updatedData = [...csvData];
    updatedData[rowIndex][header] = newValue;
    setCsvData(updatedData);
    setEditingCell(null);
  }, [csvData]);

  const getSmartSuggestions = useCallback((uploadedHeader) => {
    // ... your smart suggestion logic ...
    const normalizedUploaded = uploadedHeader.toLowerCase().trim();
    const scoredSuggestions = APP_HEADERS.map(appHeader => {
      const normalizedApp = appHeader.toLowerCase();
      let score = 0;
      if (normalizedApp === normalizedUploaded) score = 100;
      else if (normalizedApp.includes(normalizedUploaded) || normalizedUploaded.includes(normalizedApp)) score = 80;
      else {
        const uploadedWords = normalizedUploaded.split(/[\s_-]+/);
        const appWords = normalizedApp.split(/[\s_-]+/);
        const matchingWords = uploadedWords.filter(word => 
          appWords.some(appWord => appWord.includes(word) || word.includes(appWord))
        );
        if (matchingWords.length > 0) score = (matchingWords.length / Math.max(uploadedWords.length, appWords.length)) * 60;
      }
      return { header: appHeader, score };
    });
    return scoredSuggestions.filter(item => item.score > 10).sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.header);
  }, []);

  const calculateStats = useCallback(() => {
    // ... your calculate stats logic ...
     if (csvData.length === 0) return { count: 0, priceRange: 'N/A', avgProfit: 'N/A' };
    const prices = csvData.map(row => {
      const priceKey = Object.keys(headerMap).find(key => headerMap[key] === 'Regular price');
      if (!priceKey || row[priceKey] === undefined) return NaN;
      const price = parseFloat(String(row[priceKey]).replace(/[^0-9.-]+/g, ""));
      return isNaN(price) ? NaN : price;
    }).filter(p => !isNaN(p) && p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const avgProfit = avgPrice * (parseFloat(margin) / 100);
    return {
      count: csvData.length,
      priceRange: prices.length > 0 ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}` : 'N/A',
      avgProfit: prices.length > 0 ? avgProfit.toFixed(2) : 'N/A'
    };
  }, [csvData, headerMap, margin]);

  const addTag = useCallback((tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag]);
    }
    setTagInput('');
  }, [selectedTags]);

  const removeTag = useCallback((tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);


  return (
    // This component will be rendered within a page, so no need for min-h-screen here
    // The <form> tag was for the whole page, here we don't need it unless this specific feature needs one
    <div className="space-y-6">
        <Section title="📤 Upload CSV File" darkMode={darkMode}>
            {/* ... Your existing JSX for Upload section ... */}
            {/* IMPORTANT: Change id of file input to avoid conflicts if multiple instances exist */}
            {/* e.g., id="csv-upload-processor" */}
             <div 
                className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-150 ease-in-out ${
                isDragOver 
                    ? darkMode ? 'border-indigo-400 bg-gray-700' : 'border-indigo-500 bg-indigo-50' 
                    : darkMode 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            >
                {/* ... (icon, text, label for input) ... */}
                 <label htmlFor="csv-upload-processor" className="cursor-pointer ...">
                    {fileName ? "Change File" : "Choose CSV File"}
                 </label>
                 <input id="csv-upload-processor" type="file" onChange={handleFileUpload} className="hidden" accept=".csv,text/csv"/>
            </div>
            {fileName && <div>File Info Display</div>}
            {processing && csvData.length === 0 && <div>Processing Spinner</div>}
        </Section>

        {csvData.length > 0 && (
            <>
                <Section title="📊 Data Preview" darkMode={darkMode}>
                    {/* ... Your existing JSX for Data Preview section ... */}
                </Section>
                <Section title="🧩 Header Mapping" darkMode={darkMode}>
                    {/* ... Your existing JSX for Header Mapping section ... */}
                </Section>
                <Section title="💰 Pricing Panel" darkMode={darkMode}>
                    {/* ... Your existing JSX for Pricing Panel section ... */}
                </Section>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Section title="🚀 Export Options" className="lg:col-span-2" darkMode={darkMode}>
                        {/* ... Your existing JSX for Export Options ... */}
                         <button type="button" onClick={handleDownload} disabled={processing || csvData.length === 0} className="...">
                            {processing ? 'Processing...' : `Download ${exportFormat.toUpperCase()}`}
                         </button>
                    </Section>
                    <Section title="📈 Summary" darkMode={darkMode}>
                        {/* ... Your existing JSX for Summary Panel ... */}
                    </Section>
                </div>
                <Section title="🏷️ Global Tags" darkMode={darkMode}>
                    {/* ... Your existing JSX for Global Tags ... */}
                </Section>
            </>
        )}
        {csvData.length === 0 && !fileName && (
             <div className={`text-center py-10 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {/* ... (Upload a file to get started message) ... */}
             </div>
        )}
    </div>
  );
}
export default CsvProcessor;