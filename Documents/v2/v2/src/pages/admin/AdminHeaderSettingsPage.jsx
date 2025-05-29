import { useState, useEffect } from 'react';
import Section from '../../components/common/Section.jsx';

const AdminHeaderSettingsPage = ({ darkMode }) => {
  const [headers, setHeaders] = useState([]);
  const [newHeader, setNewHeader] = useState('');
  const [editingHeader, setEditingHeader] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error

  // Mock default headers - replace with API call
  useEffect(() => {
    const defaultHeaders = [
      { id: 1, name: 'SKU', enabled: true, required: true, description: 'Stock Keeping Unit - Product identifier' },
      { id: 2, name: 'Name', enabled: true, required: true, description: 'Product name/title' },
      { id: 3, name: 'Category', enabled: true, required: true, description: 'Product category classification' },
      { id: 4, name: 'Description', enabled: true, required: false, description: 'Product description' },
      { id: 5, name: 'Price', enabled: true, required: true, description: 'Base product price' },
      { id: 6, name: 'Stock', enabled: true, required: false, description: 'Available quantity' },
      { id: 7, name: 'Weight', enabled: false, required: false, description: 'Product weight for shipping' },
      { id: 8, name: 'Length', enabled: false, required: false, description: 'Product length dimension' },
      { id: 9, name: 'Width', enabled: false, required: false, description: 'Product width dimension' },
      { id: 10, name: 'Height', enabled: false, required: false, description: 'Product height dimension' },
      { id: 11, name: 'Brand', enabled: true, required: false, description: 'Product brand/manufacturer' },
      { id: 12, name: 'Color', enabled: false, required: false, description: 'Product color options' },
      { id: 13, name: 'Size', enabled: false, required: false, description: 'Product size options' },
      { id: 14, name: 'Material', enabled: false, required: false, description: 'Product material composition' },
      { id: 15, name: 'Barcode', enabled: false, required: false, description: 'Product barcode/UPC' }
    ];
    setHeaders(defaultHeaders);
  }, []);

  const handleToggleEnabled = (headerId) => {
    setHeaders(prev => prev.map(header => 
      header.id === headerId 
        ? { ...header, enabled: !header.enabled }
        : header
    ));
  };

  const handleToggleRequired = (headerId) => {
    setHeaders(prev => prev.map(header => 
      header.id === headerId 
        ? { ...header, required: !header.required }
        : header
    ));
  };

  const handleAddHeader = () => {
    if (newHeader.trim() && !headers.some(h => h.name.toLowerCase() === newHeader.toLowerCase())) {
      const newId = Math.max(...headers.map(h => h.id)) + 1;
      setHeaders(prev => [...prev, {
        id: newId,
        name: newHeader.trim(),
        enabled: true,
        required: false,
        description: '',
        custom: true
      }]);
      setNewHeader('');
    }
  };

  const handleEditHeader = (header) => {
    setEditingHeader({ ...header });
  };

  const handleSaveEdit = () => {
    if (editingHeader) {
      setHeaders(prev => prev.map(header => 
        header.id === editingHeader.id ? editingHeader : header
      ));
      setEditingHeader(null);
    }
  };

  const handleDeleteHeader = (headerId) => {
    const header = headers.find(h => h.id === headerId);
    if (header && header.custom && confirm(`Delete "${header.name}" header?`)) {
      setHeaders(prev => prev.filter(h => h.id !== headerId));
    }
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
    }
  };

  const enabledHeaders = headers.filter(h => h.enabled);
  const disabledHeaders = headers.filter(h => !h.enabled);

  return (
    <div className="container mx-auto p-4">
      <Section title="CSV Header Configuration" darkMode={darkMode}>
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Configure which CSV headers are available to sellers when exporting product data. 
            Enabled headers will appear in seller CSV exports, while disabled ones will be hidden.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">=� Export Impact</h4>
            <div className="text-sm text-blue-800">
              <p><strong>Enabled Headers:</strong> {enabledHeaders.length} columns will be available to sellers</p>
              <p><strong>Required Headers:</strong> {enabledHeaders.filter(h => h.required).length} columns are mandatory</p>
            </div>
          </div>
        </div>

        {/* Add New Header */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Add Custom Header</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newHeader}
              onChange={(e) => setNewHeader(e.target.value)}
              placeholder="Enter new header name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddHeader()}
            />
            <button
              onClick={handleAddHeader}
              disabled={!newHeader.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add Header
            </button>
          </div>
        </div>

        {/* Headers Configuration */}
        <div className="space-y-6">
          {/* Enabled Headers */}
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-3">
               Enabled Headers ({enabledHeaders.length})
            </h3>
            <div className="space-y-2">
              {enabledHeaders.map(header => (
                <div key={header.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{header.name}</span>
                      {header.required && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Required</span>
                      )}
                      {header.custom && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Custom</span>
                      )}
                    </div>
                    {header.description && (
                      <p className="text-sm text-gray-600 mt-1">{header.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={header.required}
                        onChange={() => handleToggleRequired(header.id)}
                        className="rounded"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                    <button
                      onClick={() => handleEditHeader(header)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleEnabled(header.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Disable
                    </button>
                    {header.custom && (
                      <button
                        onClick={() => handleDeleteHeader(header.id)}
                        className="text-red-700 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disabled Headers */}
          <div>
            <h3 className="text-lg font-semibold text-gray-600 mb-3">
              L Disabled Headers ({disabledHeaders.length})
            </h3>
            <div className="space-y-2">
              {disabledHeaders.map(header => (
                <div key={header.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-75">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-600">{header.name}</span>
                      {header.custom && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Custom</span>
                      )}
                    </div>
                    {header.description && (
                      <p className="text-sm text-gray-500 mt-1">{header.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditHeader(header)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleEnabled(header.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Enable
                    </button>
                    {header.custom && (
                      <button
                        onClick={() => handleDeleteHeader(header.id)}
                        className="text-red-700 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saveStatus === 'saving'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveStatus === 'saving' ? 'Saving...' : 
             saveStatus === 'saved' ? ' Saved' : 
             'Save Header Settings'}
          </button>
        </div>
      </Section>

      {/* Edit Header Modal */}
      {editingHeader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Header</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Header Name</label>
                  <input
                    type="text"
                    value={editingHeader.name}
                    onChange={(e) => setEditingHeader(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editingHeader.description}
                    onChange={(e) => setEditingHeader(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description for this header..."
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingHeader.enabled}
                      onChange={(e) => setEditingHeader(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingHeader.required}
                      onChange={(e) => setEditingHeader(prev => ({ ...prev, required: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Required</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setEditingHeader(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeaderSettingsPage;