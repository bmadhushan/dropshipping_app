import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import apiService from '../services/api';
import './CsvImporter.css';
import logo from '../assets/logo animation_1.svg';

// Expected headers for our product import
const PRODUCT_HEADERS = [
  "ID", "Sold individually?", "Type", "SKU", "GTIN, UPC, EAN, or ISBN", "Is featured?", 
  "Visibility in catalog", "Name", "Published", "In stock?", "Short description", 
  "Description", "Date sale price starts", "Date sale price ends", "Sale price", 
  "Tax status", "Tax class", "Shipping class", "Stock", "Low stock amount", 
  "Backorders allowed?", "Allow customer reviews?", "Weight (kg)", "Length (cm)", 
  "Width (cm)", "Height (cm)", "Purchase note", "Regular price", "Categories", 
  "Tags", "Images", "Download limit", "Download expiry days", "Parent", 
  "Grouped products", "Upsells", "Cross-sells", "External URL", "Button text", 
  "Position", "Brands"
];

const CsvImporter = ({ onImportComplete, onClose }) => {
  const [csvData, setCsvData] = useState([]);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);
  const [headerMap, setHeaderMap] = useState({});
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [fileInfo, setFileInfo] = useState({ size: 0, rows: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [importResults, setImportResults] = useState(null);

  // Effect to create initial header mapping when new headers are uploaded
  useEffect(() => {
    if (uploadedHeaders.length > 0) {
      const initialMap = {};
      uploadedHeaders.forEach((header) => {
        const normalizedHeader = header.toLowerCase().trim();
        let foundProductHeader = PRODUCT_HEADERS.find(prodH => prodH.toLowerCase() === normalizedHeader);
        
        if (!foundProductHeader) {
          foundProductHeader = PRODUCT_HEADERS.find(prodH => {
            const normalizedProductHeader = prodH.toLowerCase();
            return normalizedProductHeader.includes(normalizedHeader) || 
                   normalizedHeader.includes(normalizedProductHeader);
          });
        }
        
        if (!foundProductHeader) {
          const mappings = {
            'id': 'ID', 'product_id': 'ID',
            'sold_individually': 'Sold individually?', 'individual': 'Sold individually?',
            'type': 'Type', 'product_type': 'Type',
            'sku': 'SKU', 'product_sku': 'SKU',
            'gtin': 'GTIN, UPC, EAN, or ISBN', 'upc': 'GTIN, UPC, EAN, or ISBN', 'ean': 'GTIN, UPC, EAN, or ISBN', 'isbn': 'GTIN, UPC, EAN, or ISBN',
            'featured': 'Is featured?', 'is_featured': 'Is featured?',
            'visibility': 'Visibility in catalog', 'catalog_visibility': 'Visibility in catalog',
            'title': 'Name', 'product_name': 'Name', 'name': 'Name',
            'published': 'Published', 'status': 'Published', 'active': 'Published',
            'in_stock': 'In stock?', 'stock_status': 'In stock?',
            'short_desc': 'Short description', 'short_description': 'Short description', 'excerpt': 'Short description',
            'desc': 'Description', 'description': 'Description', 'content': 'Description',
            'sale_start': 'Date sale price starts', 'sale_price_start': 'Date sale price starts',
            'sale_end': 'Date sale price ends', 'sale_price_end': 'Date sale price ends',
            'sale_price': 'Sale price', 'price_sale': 'Sale price',
            'tax_status': 'Tax status', 'taxable': 'Tax status',
            'tax_class': 'Tax class',
            'shipping_class': 'Shipping class',
            'stock': 'Stock', 'quantity': 'Stock', 'stock_quantity': 'Stock',
            'low_stock': 'Low stock amount', 'low_stock_amount': 'Low stock amount',
            'backorders': 'Backorders allowed?', 'backorders_allowed': 'Backorders allowed?',
            'reviews': 'Allow customer reviews?', 'reviews_allowed': 'Allow customer reviews?',
            'weight': 'Weight (kg)', 'weight_kg': 'Weight (kg)',
            'length': 'Length (cm)', 'length_cm': 'Length (cm)',
            'width': 'Width (cm)', 'width_cm': 'Width (cm)',
            'height': 'Height (cm)', 'height_cm': 'Height (cm)',
            'purchase_note': 'Purchase note', 'note': 'Purchase note',
            'price': 'Regular price', 'regular_price': 'Regular price', 'cost': 'Regular price',
            'category': 'Categories', 'categories': 'Categories', 'cat': 'Categories',
            'tags': 'Tags', 'product_tags': 'Tags',
            'image': 'Images', 'images': 'Images', 'image_url': 'Images',
            'download_limit': 'Download limit', 'downloads': 'Download limit',
            'download_expiry': 'Download expiry days', 'expiry': 'Download expiry days',
            'parent': 'Parent', 'parent_id': 'Parent',
            'grouped': 'Grouped products', 'grouped_products': 'Grouped products',
            'upsells': 'Upsells', 'upsell': 'Upsells',
            'crosssells': 'Cross-sells', 'cross_sells': 'Cross-sells',
            'external_url': 'External URL', 'url': 'External URL',
            'button_text': 'Button text', 'btn_text': 'Button text',
            'position': 'Position', 'menu_order': 'Position',
            'brand': 'Brands', 'brands': 'Brands', 'manufacturer': 'Brands'
          };
          foundProductHeader = mappings[normalizedHeader] || "";
        }
        initialMap[header] = foundProductHeader || "";
      });
      setHeaderMap(initialMap);
    } else {
      setHeaderMap({});
    }
  }, [uploadedHeaders]);

  const processFile = (file) => {
    resetFileState();
    
    if (file && (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.name.toLowerCase().endsWith('.csv') || file.type === 'text/plain')) {
      setFileName(file.name);
      setFileInfo({ size: (file.size / 1024).toFixed(2), rows: 0 });
      setProcessing(true);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          if (results.data && results.data.length > 0 && results.meta && results.meta.fields) {
            const filteredData = results.data.filter(row => 
              Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '')
            );
            
            if (filteredData.length > 0) {
              setCsvData(filteredData);
              setUploadedHeaders(results.meta.fields);
              setFileInfo(prev => ({ ...prev, rows: filteredData.length }));
            } else {
              alert("CSV file appears to be empty or contains no valid data.");
              resetFileState();
            }
          } else {
            alert("Could not parse CSV or CSV is empty/invalid.");
            resetFileState();
          }
          setProcessing(false);
        },
        error: (error) => {
          console.error("PapaParse Error:", error);
          alert(`Error parsing CSV: ${error.message}`);
          resetFileState();
          setProcessing(false);
        }
      });
    } else {
      alert('Please select a valid CSV file.');
      resetFileState();
    }
  };

  const resetFileState = () => {
    setCsvData([]);
    setUploadedHeaders([]);
    setFileName("");
    setFileInfo({ size: 0, rows: 0 });
    setDownloadUrl(null);
    setImportResults(null);
    const fileInput = document.getElementById('csv-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleMappingChange = (uploadedHeader, productHeader) => {
    setHeaderMap((prevMap) => ({ ...prevMap, [uploadedHeader]: productHeader }));
  };

  const handleCellEdit = (rowIndex, header, newValue) => {
    const updatedData = [...csvData];
    updatedData[rowIndex][header] = newValue;
    setCsvData(updatedData);
    setEditingCell(null);
  };

  const getSmartSuggestions = (uploadedHeader) => {
    const normalizedUploaded = uploadedHeader.toLowerCase().trim();
    const scoredSuggestions = PRODUCT_HEADERS.map(productHeader => {
      const normalizedProduct = productHeader.toLowerCase();
      let score = 0;
      if (normalizedProduct === normalizedUploaded) score = 100;
      else if (normalizedProduct.includes(normalizedUploaded) || normalizedUploaded.includes(normalizedProduct)) score = 80;
      else {
        const uploadedWords = normalizedUploaded.split(/[\s_-]+/);
        const productWords = normalizedProduct.split(/[\s_-]+/);
        const matchingWords = uploadedWords.filter(word => 
          productWords.some(productWord => productWord.includes(word) || word.includes(productWord))
        );
        if (matchingWords.length > 0) score = (matchingWords.length / Math.max(uploadedWords.length, productWords.length)) * 60;
      }
      return { header: productHeader, score };
    });
    return scoredSuggestions.filter(item => item.score > 10).sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.header);
  };

  const generateProcessedData = () => {
    return csvData.map((row) => {
      const newRow = {};
      
      // Map each product header to the corresponding CSV data
      PRODUCT_HEADERS.forEach((productHeader) => {
        const originalKey = Object.keys(headerMap).find(
          (key) => headerMap[key] === productHeader
        );
        let value = originalKey && row[originalKey] !== undefined ? String(row[originalKey]).trim() : "";

        // Process specific fields
        if (productHeader === "Regular price" || productHeader === "Sale price") {
          const price = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
          value = !isNaN(price) && price > 0 ? price.toString() : "";
        } else if (productHeader === "Stock") {
          const stock = parseInt(String(value).replace(/[^0-9]+/g, ""));
          value = !isNaN(stock) && stock >= 0 ? stock.toString() : "0";
        } else if (productHeader === "Published" || productHeader === "In stock?" || productHeader === "Is featured?" || productHeader === "Sold individually?" || productHeader === "Backorders allowed?" || productHeader === "Allow customer reviews?") {
          value = String(value).toLowerCase() === 'true' || String(value) === '1' || String(value).toLowerCase() === 'yes' ? 'true' : 'false';
        } else if (productHeader === "Weight (kg)" || productHeader === "Length (cm)" || productHeader === "Width (cm)" || productHeader === "Height (cm)") {
          const measurement = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
          value = !isNaN(measurement) && measurement >= 0 ? measurement.toString() : "0";
        } else if (productHeader === "Low stock amount" || productHeader === "Download limit" || productHeader === "Download expiry days" || productHeader === "Position") {
          const number = parseInt(String(value).replace(/[^0-9]+/g, ""));
          value = !isNaN(number) && number >= 0 ? number.toString() : "0";
        }
        
        newRow[productHeader] = value;
      });
      return newRow;
    });
  };

  const downloadCsvTemplate = () => {
    const csvContent = `ID,Sold individually?,Type,SKU,GTIN UPC EAN or ISBN,Is featured?,Visibility in catalog,Name,Published,In stock?,Short description,Description,Date sale price starts,Date sale price ends,Sale price,Tax status,Tax class,Shipping class,Stock,Low stock amount,Backorders allowed?,Allow customer reviews?,Weight (kg),Length (cm),Width (cm),Height (cm),Purchase note,Regular price,Categories,Tags,Images,Download limit,Download expiry days,Parent,Grouped products,Upsells,Cross-sells,External URL,Button text,Position,Brands
1,no,simple,SAMPLE-001,123456789012,no,visible,"Sample Product",1,1,"Short description of the product","This is a detailed description of the sample product",,,,taxable,,standard,100,5,no,1,0.5,10,8,5,"Thank you for your purchase!",29.99,"Electronics > Gadgets","sample tag",https://example.com/image.jpg,,,,,,,,,0,"Sample Brand"
2,no,simple,SAMPLE-002,123456789013,yes,visible,"Featured Product",1,1,"Another short description","This is another detailed product description",,,,taxable,,standard,50,10,no,1,0.3,12,10,3,"Thanks for buying!",49.99,"Clothing > Shirts","featured tag",https://example.com/image2.jpg,,,,,,,,,1,"Another Brand"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      alert("Please upload a CSV file first.");
      return;
    }

    // Validate that required fields are mapped
    const requiredFields = ['SKU', 'Name', 'Categories', 'Regular price'];
    const missingMappings = requiredFields.filter(field => 
      !Object.values(headerMap).includes(field)
    );

    if (missingMappings.length > 0) {
      alert(`Please map the following required fields: ${missingMappings.join(', ')}`);
      return;
    }

    try {
      setProcessing(true);
      setImportResults(null);

      const processedData = generateProcessedData();
      
      // Transform to format expected by backend
      const products = processedData.map(row => ({
        id: row.ID || '',
        soldIndividually: row['Sold individually?'] === 'true',
        type: row.Type || 'simple',
        sku: row.SKU,
        gtin: row['GTIN, UPC, EAN, or ISBN'] || '',
        isFeatured: row['Is featured?'] === 'true',
        catalogVisibility: row['Visibility in catalog'] || 'visible',
        name: row.Name,
        published: row.Published === 'true',
        inStock: row['In stock?'] === 'true',
        shortDescription: row['Short description'] || '',
        description: row.Description || '',
        salePriceStart: row['Date sale price starts'] || '',
        salePriceEnd: row['Date sale price ends'] || '',
        salePrice: parseFloat(row['Sale price']) || 0,
        taxStatus: row['Tax status'] || 'taxable',
        taxClass: row['Tax class'] || '',
        shippingClass: row['Shipping class'] || '',
        stock: parseInt(row.Stock) || 0,
        lowStockAmount: parseInt(row['Low stock amount']) || 0,
        backordersAllowed: row['Backorders allowed?'] === 'true',
        reviewsAllowed: row['Allow customer reviews?'] === 'true',
        weight: parseFloat(row['Weight (kg)']) || 0,
        length: parseFloat(row['Length (cm)']) || 0,
        width: parseFloat(row['Width (cm)']) || 0,
        height: parseFloat(row['Height (cm)']) || 0,
        purchaseNote: row['Purchase note'] || '',
        regularPrice: parseFloat(row['Regular price']) || 0,
        categories: row.Categories || '',
        tags: row.Tags || '',
        images: row.Images || '',
        downloadLimit: parseInt(row['Download limit']) || 0,
        downloadExpiry: parseInt(row['Download expiry days']) || 0,
        parent: row.Parent || '',
        groupedProducts: row['Grouped products'] || '',
        upsells: row.Upsells || '',
        crossSells: row['Cross-sells'] || '',
        externalUrl: row['External URL'] || '',
        buttonText: row['Button text'] || '',
        position: parseInt(row.Position) || 0,
        brands: row.Brands || ''
      }));

      // Filter out invalid products (check for required fields)
      const validProducts = products.filter(product => 
        product.sku && product.name && product.categories && product.regularPrice > 0
      );

      if (validProducts.length === 0) {
        throw new Error('No valid products found after processing');
      }

      const result = await apiService.bulkCreateProducts(validProducts);
      
      setImportResults({
        success: true,
        message: result.message,
        summary: {
          totalRows: csvData.length,
          successCount: validProducts.length,
          skippedCount: csvData.length - validProducts.length,
          errorCount: 0
        }
      });

      if (onImportComplete) {
        onImportComplete(result);
      }

    } catch (err) {
      console.error('Import error:', err);
      setImportResults({
        success: false,
        message: err.message,
        summary: { errorCount: 1 }
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!onClose) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="csv-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="csv-modal-header">
          <img src={logo} alt="Logo" className="csv-modal-logo" />
          <h2 className="csv-modal-title">CSV Product Importer</h2>
          <p className="csv-modal-subtitle">Upload, map, and import your product data</p>
        </div>

        <div className="csv-modal-body">
          {/* File Upload Section */}
          <div className="form-section">
            <h3 className="section-title">📤 Upload CSV File</h3>
            <div 
              className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="upload-text">Drop your CSV file here</p>
              <p className="upload-subtext">or click to browse</p>
              <div className="upload-buttons">
                <label htmlFor="csv-upload" className="btn-primary">
                  {fileName ? "Change File" : "Choose CSV File"}
                </label>
                <button onClick={downloadCsvTemplate} className="btn-outline">
                  📥 Download Template
                </button>
              </div>
              <input
                id="csv-upload"
                type="file"
                accept=".csv,.txt,text/csv,application/vnd.ms-excel,text/plain"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {fileName && (
              <div className="file-info">
                <div className="file-details">
                  <h4>{fileName}</h4>
                  <p>{fileInfo.rows} rows • {fileInfo.size} KB</p>
                </div>
                <div className="file-actions">
                  <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <button onClick={resetFileState} className="remove-file" title="Clear file and reset">
                    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {processing && csvData.length === 0 && (
              <div className="processing-indicator">
                <svg className="csv-spinner" style={{ height: '1.25rem', width: '1.25rem', marginRight: '0.5rem' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing file...
              </div>
            )}
          </div>

          {csvData.length > 0 && (
            <>
              {/* Data Preview Section */}
              <div className="form-section">
                <h3 className="section-title">📊 Data Preview</h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                  Preview your CSV data (first 5 rows). Click any cell to edit.
                </p>
                <div className="data-preview">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {uploadedHeaders.slice(0, 6).map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                        {uploadedHeaders.length > 6 && (
                          <th>+{uploadedHeaders.length - 6} more</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {uploadedHeaders.slice(0, 6).map((header) => (
                            <td key={`${rowIndex}-${header}`}>
                              {editingCell?.row === rowIndex && editingCell?.header === header ? (
                                <input
                                  type="text"
                                  defaultValue={row[header]}
                                  onBlur={(e) => handleCellEdit(rowIndex, header, e.target.value)}
                                  onKeyDown={(e) => { 
                                    if (e.key === 'Enter') { 
                                      e.preventDefault(); 
                                      handleCellEdit(rowIndex, header, e.target.value); 
                                    } else if (e.key === 'Escape') { 
                                      setEditingCell(null); 
                                    } 
                                  }}
                                  className="cell-input"
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  onClick={() => setEditingCell({ row: rowIndex, header })}
                                  className="editable-cell"
                                  title="Click to edit"
                                >
                                  {String(row[header]).trim() || <span style={{ color: 'var(--neutral)' }}>-</span>}
                                </div>
                              )}
                            </td>
                          ))}
                          {uploadedHeaders.length > 6 && <td>...</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 5 && (
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--secondary)' }}>
                    Showing 5 of {csvData.length} rows
                  </p>
                )}
              </div>

              {/* Header Mapping Section */}
              <div className="form-section">
                <h3 className="section-title">🧩 Header Mapping</h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                  Match your CSV column headers to the required product fields.
                  <br />
                  <span style={{ color: 'var(--error)', fontWeight: '600' }}>* Required fields: SKU, Name, Categories, Regular price</span>
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="mapping-table">
                    <thead>
                      <tr>
                        <th>Your CSV Header</th>
                        <th>Map to Product Field</th>
                        <th>Suggestions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedHeaders.map((uploaded) => {
                        const suggestions = getSmartSuggestions(uploaded);
                        const isRequired = ['SKU', 'Name', 'Categories', 'Regular price'].includes(headerMap[uploaded]);
                        return (
                          <tr key={uploaded}>
                            <td style={{ fontWeight: '500' }}>{uploaded}</td>
                            <td>
                              <select
                                value={headerMap[uploaded] || ""}
                                onChange={(e) => handleMappingChange(uploaded, e.target.value)}
                                className={`mapping-select ${isRequired ? 'required' : ''}`}
                              >
                                <option value="">-- Select Product Field --</option>
                                {PRODUCT_HEADERS.map((productHeader) => (
                                  <option key={productHeader} value={productHeader}>
                                    {productHeader}
                                    {['SKU', 'Name', 'Categories', 'Regular price'].includes(productHeader) ? ' *' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="suggestion-buttons">
                                {suggestions.map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    onClick={() => handleMappingChange(uploaded, suggestion)}
                                    className="suggestion-button"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                                {suggestions.length === 0 && (
                                  <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--neutral)' }}>
                                    No suggestions
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Results */}
              {importResults && (
                <div className="form-section">
                  <h3 className="section-title">{importResults.success ? '✅ Import Results' : '❌ Import Failed'}</h3>
                  <p style={{
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    color: importResults.success ? 'var(--success)' : 'var(--error)'
                  }}>
                    {importResults.message}
                  </p>
                  {importResults.summary && (
                    <div className="results-grid">
                      <div className="result-card total">
                        <h4>📊 Total Rows</h4>
                        <p className="result-number">{importResults.summary.totalRows || 0}</p>
                      </div>
                      <div className="result-card success">
                        <h4>✅ Successfully Created</h4>
                        <p className="result-number">{importResults.summary.successCount || 0}</p>
                      </div>
                      <div className="result-card warning">
                        <h4>⏭️ Skipped</h4>
                        <p className="result-number">{importResults.summary.skippedCount || 0}</p>
                      </div>
                      <div className="result-card error">
                        <h4>❌ Errors</h4>
                        <p className="result-number">{importResults.summary.errorCount || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Import Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={processing || csvData.length === 0}
                  className="btn-primary"
                  style={{
                    opacity: (processing || csvData.length === 0) ? 0.6 : 1
                  }}
                >
                  {processing ? (
                    <>
                      <svg className="csv-spinner" style={{
                        marginRight: '0.5rem',
                        height: '1.25rem',
                        width: '1.25rem'
                      }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Import...
                    </>
                  ) : (
                    '⬆️ Import Products'
                  )}
                </button>
              </div>
            </>
          )}

          {csvData.length === 0 && !fileName && (
            <div className="empty-state">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p>Upload a CSV file to get started.</p>
            </div>
          )}
        </div>
        
      </div>
    </>
  );
};

export default CsvImporter;