import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, CheckCircle, XCircle, Pause, Play, User, Mail, Phone, Building, MapPin, Calendar, Tag, X } from 'lucide-react';
import '../styles/theme.css';

const SellerManagement = () => {
  const { getAllSellers, getPendingSellers, approveSeller, rejectSeller, updateSellerStatus } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSellers = async () => {
      try {
        setLoading(true);
        setError(null);
        const allSellers = await getAllSellers();
        setSellers(allSellers);
      } catch (error) {
        console.error('Failed to load sellers:', error);
        setError('Failed to load sellers. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSellers();
  }, [getAllSellers]);

  const filteredSellers = sellers.filter(seller => 
    filter === 'all' || seller.status === filter
  );

  const handleApprove = async (sellerId) => {
    try {
      await approveSeller(sellerId);
      // Refresh sellers list
      const allSellers = await getAllSellers();
      setSellers(allSellers);
      setSelectedSeller(null);
    } catch (error) {
      console.error('Failed to approve seller:', error);
    }
  };

  const handleReject = async (sellerId, reason) => {
    try {
      await rejectSeller(sellerId, reason);
      // Refresh sellers list
      const allSellers = await getAllSellers();
      setSellers(allSellers);
      setSelectedSeller(null);
    } catch (error) {
      console.error('Failed to reject seller:', error);
    }
  };

  const handleStatusUpdate = async (sellerId, newStatus) => {
    try {
      await updateSellerStatus(sellerId, newStatus);
      // Refresh sellers list
      const allSellers = await getAllSellers();
      setSellers(allSellers);
      setSelectedSeller(null);
    } catch (error) {
      console.error('Failed to update seller status:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Seller Management</h1>
            <p className="dashboard-subtitle">Loading sellers...</p>
          </div>
        </div>
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <p>Loading seller data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Seller Management</h1>
            <p className="dashboard-subtitle">Error loading sellers</p>
          </div>
        </div>
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <p style={{ color: 'var(--error)' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
            style={{ marginTop: 'var(--space-4)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Seller Management</h1>
          <p className="dashboard-subtitle">Review and manage seller applications and existing sellers</p>
        </div>
      </div>

      <div style={{ padding: '0 var(--space-6)' }}>
        {/* Filter Tabs */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          {[
            { key: 'all', label: 'All Sellers', count: sellers.length, icon: '👥' },
            { key: 'pending', label: 'Pending', count: sellers.filter(s => s.status === 'pending').length, icon: '⏳' },
            { key: 'active', label: 'Active', count: sellers.filter(s => s.status === 'active').length, icon: '✅' },
            { key: 'suspended', label: 'Suspended', count: sellers.filter(s => s.status === 'suspended').length, icon: '⏸️' },
            { key: 'rejected', label: 'Rejected', count: sellers.filter(s => s.status === 'rejected').length, icon: '❌' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={filter === tab.key ? 'btn btn-primary' : 'btn btn-outline'}
              style={{
                marginRight: 'var(--space-2)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Sellers Table */}
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Building size={16} />
                  Business
                </th>
                <th style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <User size={16} />
                  Contact
                </th>
                <th style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Tag size={16} />
                  Type
                </th>
                <th style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Tag size={16} />
                  Categories
                </th>
                <th style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <CheckCircle size={16} />
                  Status
                </th>
                <th style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Calendar size={16} />
                  Submitted
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map(seller => (
                <tr key={seller.id}>
                  <td>
                    <div>
                      <div className="font-semibold">{seller.businessName}</div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{seller.contactPerson}</div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: '2px' }}>
                        <Mail size={12} style={{ color: 'var(--text-secondary)' }} />
                        {seller.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                        <Phone size={12} />
                        {seller.phone}
                      </div>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{seller.businessType}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                      {seller.categoryInterests?.map(category => (
                        <span key={category} className="badge badge-info">
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      seller.status === 'pending' ? 'badge-warning' :
                      seller.status === 'active' ? 'badge-success' :
                      seller.status === 'suspended' ? 'badge-secondary' :
                      'badge-error'
                    }`}>
                      {seller.status}
                    </span>
                  </td>
                  <td className="text-sm">
                    {formatDate(seller.registrationDate)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button
                        onClick={() => setSelectedSeller(seller)}
                        className="btn btn-outline"
                        style={{
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: 'var(--space-1) var(--space-3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)'
                        }}
                      >
                        <Eye size={12} />
                        View
                      </button>
                      {seller.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(seller.id)}
                            className="btn btn-secondary"
                            style={{
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: 'var(--space-1) var(--space-3)',
                              backgroundColor: 'var(--success)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-1)'
                            }}
                          >
                            <CheckCircle size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) handleReject(seller.id, reason);
                            }}
                            className="btn btn-secondary"
                            style={{
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: 'var(--space-1) var(--space-3)',
                              backgroundColor: 'var(--error)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-1)'
                            }}
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </>
                      )}
                      {seller.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(seller.id, 'suspended')}
                          className="btn btn-secondary"
                          style={{
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: 'var(--space-1) var(--space-3)',
                            backgroundColor: 'var(--warning)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)'
                          }}
                        >
                          <Pause size={12} />
                          Suspend
                        </button>
                      )}
                      {seller.status === 'suspended' && (
                        <button
                          onClick={() => handleStatusUpdate(seller.id, 'active')}
                          className="btn btn-secondary"
                          style={{
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: 'var(--space-1) var(--space-3)',
                            backgroundColor: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)'
                          }}
                        >
                          <Play size={12} />
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSellers.length === 0 && (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No sellers found for the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* Seller Detail Modal */}
      {selectedSeller && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(53, 75, 74, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="card" style={{
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 className="card-title">Seller Details</h3>
              <button
                onClick={() => setSelectedSeller(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {/* Account Information */}
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-4)' }}>
                <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <User size={18} />
                  Account Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Username</label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedSeller.username}</p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Status</label>
                    <span className={`badge ${
                      selectedSeller.status === 'pending' ? 'badge-warning' :
                      selectedSeller.status === 'active' ? 'badge-success' :
                      selectedSeller.status === 'suspended' ? 'badge-secondary' :
                      'badge-error'
                    }`}>
                      {selectedSeller.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-4)' }}>
                <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Building size={18} />
                  Business Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Business Name</label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedSeller.businessName}</p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Contact Person</label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedSeller.contactPerson}</p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Email</label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedSeller.email}</p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Phone</label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedSeller.phone}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Business Address</label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedSeller.businessAddress}</p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Business Type</label>
                    <p style={{ margin: 0, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{selectedSeller.businessType}</p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Tax ID</label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedSeller.taxId || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Category Interests */}
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-4)' }}>
                <label className="font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                  <Tag size={16} />
                  Category Interests
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {selectedSeller.categoryInterests?.map(category => (
                    <span key={category} className="badge badge-info">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Business Description */}
              {selectedSeller.description && (
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-4)' }}>
                  <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Business Description</label>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedSeller.description}</p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Calendar size={18} />
                  Timeline
                </h4>
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  <div>
                    <label className="font-semibold" style={{ display: 'inline', color: 'var(--text-primary)' }}>Registration Date:</label>
                    <span style={{ marginLeft: 'var(--space-2)', color: 'var(--text-secondary)' }}>{formatDate(selectedSeller.registrationDate)}</span>
                  </div>
                  {selectedSeller.approvedDate && (
                    <div>
                      <label className="font-semibold" style={{ display: 'inline', color: 'var(--text-primary)' }}>Approved Date:</label>
                      <span style={{ marginLeft: 'var(--space-2)', color: 'var(--text-secondary)' }}>{formatDate(selectedSeller.approvedDate)}</span>
                    </div>
                  )}
                  {selectedSeller.rejectedDate && (
                    <div>
                      <label className="font-semibold" style={{ display: 'inline', color: 'var(--text-primary)' }}>Rejected Date:</label>
                      <span style={{ marginLeft: 'var(--space-2)', color: 'var(--text-secondary)' }}>{formatDate(selectedSeller.rejectedDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedSeller.status === 'rejected' && selectedSeller.rejectionReason && (
                <div>
                  <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--error)' }}>Rejection Reason</label>
                  <p style={{ margin: 0, color: 'var(--error)' }}>{selectedSeller.rejectionReason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-light)' }}>
                {selectedSeller.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedSeller.id)}
                      className="btn btn-secondary"
                      style={{
                        backgroundColor: 'var(--success)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)'
                      }}
                    >
                      <CheckCircle size={16} />
                      Approve Seller
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleReject(selectedSeller.id, reason);
                      }}
                      className="btn btn-secondary"
                      style={{
                        backgroundColor: 'var(--error)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)'
                      }}
                    >
                      <XCircle size={16} />
                      Reject Application
                    </button>
                  </>
                )}
                {selectedSeller.status === 'active' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedSeller.id, 'suspended')}
                    className="btn btn-secondary"
                    style={{
                      backgroundColor: 'var(--warning)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)'
                    }}
                  >
                    <Pause size={16} />
                    Suspend Seller
                  </button>
                )}
                {selectedSeller.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedSeller.id, 'active')}
                    className="btn btn-secondary"
                    style={{
                      backgroundColor: 'var(--success)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)'
                    }}
                  >
                    <Play size={16} />
                    Reactivate Seller
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default SellerManagement;