import { useState, useEffect } from 'react';
import Section from '../../components/common/Section.jsx';

const AdminSellerManagementPage = ({ darkMode }) => {
  const [sellers, setSellers] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Mock data - replace with API call
  useEffect(() => {
    const mockSellers = [
      {
        id: 1,
        businessName: 'Fashion Forward LLC',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@fashionforward.com',
        phone: '+1 (555) 123-4567',
        businessType: 'retailer',
        categoryInterests: ['Clothing', 'Beauty'],
        status: 'pending',
        submittedAt: '2024-01-15T10:30:00Z',
        description: 'Leading fashion retailer with 10+ years experience in women\'s clothing and accessories.'
      },
      {
        id: 2,
        businessName: 'Tech Solutions Inc',
        contactPerson: 'Mike Chen',
        email: 'mike@techsolutions.com',
        phone: '+1 (555) 987-6543',
        businessType: 'wholesaler',
        categoryInterests: ['Electronics', 'Automotive'],
        status: 'approved',
        submittedAt: '2024-01-10T14:20:00Z',
        approvedAt: '2024-01-12T09:15:00Z',
        description: 'Wholesale electronics distributor specializing in automotive and consumer electronics.'
      },
      {
        id: 3,
        businessName: 'Green Goods Co',
        contactPerson: 'Lisa Rodriguez',
        email: 'lisa@greengoods.com',
        phone: '+1 (555) 456-7890',
        businessType: 'manufacturer',
        categoryInterests: ['Home & Garden', 'Health'],
        status: 'rejected',
        submittedAt: '2024-01-08T16:45:00Z',
        rejectedAt: '2024-01-09T11:30:00Z',
        rejectionReason: 'Insufficient business documentation provided.'
      }
    ];
    setSellers(mockSellers);
  }, []);

  const filteredSellers = sellers.filter(seller => 
    filter === 'all' || seller.status === filter
  );

  const handleStatusChange = (sellerId, newStatus, reason = '') => {
    setSellers(prev => prev.map(seller => 
      seller.id === sellerId 
        ? { 
            ...seller, 
            status: newStatus,
            ...(newStatus === 'approved' && { approvedAt: new Date().toISOString() }),
            ...(newStatus === 'rejected' && { 
              rejectedAt: new Date().toISOString(),
              rejectionReason: reason 
            })
          }
        : seller
    ));
    setSelectedSeller(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-4">
      <Section title="Seller Management" darkMode={darkMode}>
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All', count: sellers.length },
            { key: 'pending', label: 'Pending', count: sellers.filter(s => s.status === 'pending').length },
            { key: 'approved', label: 'Approved', count: sellers.filter(s => s.status === 'approved').length },
            { key: 'rejected', label: 'Rejected', count: sellers.filter(s => s.status === 'rejected').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Sellers Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Business</th>
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Contact</th>
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Categories</th>
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Submitted</th>
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map(seller => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3">
                    <div>
                      <div className="font-medium">{seller.businessName}</div>
                      <div className="text-sm text-gray-600">{seller.contactPerson}</div>
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <div className="text-sm">
                      <div>{seller.email}</div>
                      <div className="text-gray-600">{seller.phone}</div>
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 capitalize">{seller.businessType}</td>
                  <td className="border border-gray-200 px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {seller.categoryInterests.map(category => (
                        <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <span className={getStatusBadge(seller.status)}>
                      {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-sm">
                    {formatDate(seller.submittedAt)}
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedSeller(seller)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                      {seller.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(seller.id, 'approved')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) handleStatusChange(seller.id, 'rejected', reason);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSellers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sellers found for the selected filter.
          </div>
        )}
      </Section>

      {/* Seller Detail Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Seller Application Details</h3>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <p className="mt-1">{selectedSeller.businessName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="mt-1">{selectedSeller.contactPerson}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1">{selectedSeller.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1">{selectedSeller.phone}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Type</label>
                  <p className="mt-1 capitalize">{selectedSeller.businessType}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category Interests</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedSeller.categoryInterests.map(category => (
                      <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Description</label>
                  <p className="mt-1 text-gray-600">{selectedSeller.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Status</label>
                  <span className={`mt-1 inline-block ${getStatusBadge(selectedSeller.status)}`}>
                    {selectedSeller.status.charAt(0).toUpperCase() + selectedSeller.status.slice(1)}
                  </span>
                </div>

                {selectedSeller.status === 'rejected' && selectedSeller.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                    <p className="mt-1 text-red-600">{selectedSeller.rejectionReason}</p>
                  </div>
                )}

                {selectedSeller.status === 'pending' && (
                  <div className="flex space-x-4 pt-4 border-t">
                    <button
                      onClick={() => handleStatusChange(selectedSeller.id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve Seller
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleStatusChange(selectedSeller.id, 'rejected', reason);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject Application
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerManagementPage;