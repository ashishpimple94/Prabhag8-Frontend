import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './App.css';
import { FaSearch, FaTimes, FaEye, FaSpinner } from 'react-icons/fa';

const API_URL = 'https://prabhag7-cmz1.vercel.app/api/voters?limit=all';

function App() {
  const [voters, setVoters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all voters on mount
  useEffect(() => {
    const fetchVoters = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(API_URL, {
          timeout: 180000,
          headers: { 'Accept': 'application/json' }
        });
        
        const result = response.data;
        let allVoters = [];
        
        if (result.success && Array.isArray(result.data)) {
          allVoters = result.data;
        } else if (Array.isArray(result)) {
          allVoters = result;
        } else if (result.data && Array.isArray(result.data)) {
          allVoters = result.data;
        } else if (result.voters && Array.isArray(result.voters)) {
          allVoters = result.voters;
        }
        
        setVoters(allVoters);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching voters:', err);
        setError('Data load नहीं हो पाया। कृपया refresh करें।');
        setLoading(false);
      }
    };
    
    fetchVoters();
  }, []);

  // Simple and optimized search function
  const searchVoter = (voter, query) => {
    if (!query || query.trim().length === 0) return false;
    
    const q = query.toLowerCase().trim();
    if (q.length === 0) return false;
    
    // Get all searchable fields
    const searchFields = [
      voter.name || voter.FM_NAME_EN || '',
      voter.name_mr || voter.FM_NAME_V1 || '',
      voter.LASTNAME_EN || '',
      voter.LASTNAME_V1 || '',
      voter.voterIdCard || voter.EPIC_NO || '',
      voter.mobileNumber || ''
    ];
    
    // Check if query matches any field
    return searchFields.some(field => {
      return String(field).toLowerCase().includes(q);
    });
  };

  // Filter voters - optimized with memoization
  const filteredVoters = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    
    const query = searchQuery.trim();
    if (query.length === 0) return [];
    
    const results = [];
    const maxResults = 1000;
    
    for (let i = 0; i < voters.length && results.length < maxResults; i++) {
      if (searchVoter(voters[i], query)) {
        results.push(voters[i]);
      }
    }
    
    return results;
  }, [voters, searchQuery]);

  // Suggestions - top 10 matches
  const suggestions = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    return filteredVoters.slice(0, 10);
  }, [filteredVoters, searchQuery]);

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
  };

  // Handle suggestion click
  const handleSuggestionClick = (voter) => {
    setSelectedVoter(voter);
    setShowModal(true);
    setShowSuggestions(false);
  };

  // Handle voter click
  const handleVoterClick = (voter) => {
    setSelectedVoter(voter);
    setShowModal(true);
  };

  return (
    <div className="App">
      <header>
        <h1>प्रवीण डोंगरे प्रभाग क्रमांक 7</h1>
        <h2>मतदार शोध प्रणाली</h2>
      </header>

      <div className="container">
        {/* Search Section - New Design */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-box">
              <div className="search-icon-wrapper">
                <FaSearch className="search-icon" />
              </div>
              <input
                type="text"
                className="search-input-new"
                placeholder="नाव, मतदान कार्ड क्र., मोबाईल नं. टाइप करा..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              {searchQuery && (
                <div
                  className="clear-icon"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                >
                  <FaTimes />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown - New Design */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-container">
                <div className="suggestions-header">
                  <span>{suggestions.length} सुझाव</span>
                </div>
                <div className="suggestions-list">
                  {suggestions.map((voter, index) => {
                    const nameEn = voter.name || voter.FM_NAME_EN || '';
                    const nameMr = voter.name_mr || voter.FM_NAME_V1 || '';
                    const lastNameEn = voter.LASTNAME_EN || '';
                    const lastNameMr = voter.LASTNAME_V1 || '';
                    const fullNameEn = `${nameEn} ${lastNameEn}`.trim();
                    const fullNameMr = `${nameMr} ${lastNameMr}`.trim();
                    const displayName = fullNameMr || fullNameEn || nameEn || nameMr || 'N/A';

                    return (
                      <div
                        key={voter._id || index}
                        className="suggestion-card"
                        onClick={() => handleSuggestionClick(voter)}
                      >
                        <div className="suggestion-content">
                          <div className="suggestion-name-new">{displayName}</div>
                          {voter.voterIdCard || voter.EPIC_NO ? (
                            <div className="suggestion-id-new">
                              <span className="id-label">ID:</span> {voter.voterIdCard || voter.EPIC_NO}
                            </div>
                          ) : null}
                          {voter.mobileNumber && (
                            <div className="suggestion-mobile">
                              <span className="mobile-label">Mobile:</span> {voter.mobileNumber}
                            </div>
                          )}
                        </div>
                        <div className="suggestion-arrow">
                          →
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading">
            <FaSpinner className="spinner" />
            <p>डेटा लोड होत आहे...</p>
          </div>
        )}

        {/* Total Voters Count */}
        {!loading && !error && voters.length > 0 && (
          <div className="total-voters-info">
            <div className="total-voters-card">
              <h3>कुल मतदार</h3>
              <p className="total-count">{voters.length.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && searchQuery && searchQuery.trim() && (
          <div className="results-section">
            {filteredVoters.length === 0 ? (
              <div className="no-results">
                <FaSearch />
                <p>कोणतेही परिणाम सापडले नाही</p>
              </div>
            ) : (
              <>
                <div className="search-info">
                  <span>{filteredVoters.length} परिणाम सापडले</span>
                </div>

                {/* Desktop Table */}
                <div className="table-wrapper">
                  <table className="voter-table">
                    <thead>
                      <tr>
                        <th>नाव (मराठी)</th>
                        <th>नाव (इंग्रजी)</th>
                        <th>मतदान कार्ड क्र.</th>
                        <th>मोबाईल नं.</th>
                        <th>क्रिया</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVoters.map((voter, index) => (
                        <tr key={voter._id || index}>
                          <td>{voter.name_mr || voter.FM_NAME_V1 || '-'}</td>
                          <td>{voter.name || voter.FM_NAME_EN || '-'}</td>
                          <td>{voter.voterIdCard || voter.EPIC_NO || '-'}</td>
                          <td>{voter.mobileNumber || '-'}</td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() => handleVoterClick(voter)}
                            >
                              <FaEye /> पहा
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="mobile-cards-view">
                  {filteredVoters.map((voter, index) => (
                    <div key={voter._id || index} className="voter-card-mobile">
                      <div className="voter-card-mobile-header">
                        <div className="voter-card-mobile-name">
                          {voter.name_mr || voter.FM_NAME_V1 || voter.name || voter.FM_NAME_EN || 'N/A'}
                        </div>
                        {(voter.name || voter.FM_NAME_EN) && (voter.name_mr || voter.FM_NAME_V1) && (
                          <div className="voter-card-mobile-name-en">
                            {voter.name || voter.FM_NAME_EN}
                          </div>
                        )}
                      </div>
                      <div className="voter-card-mobile-body">
                        <div className="voter-card-mobile-item">
                          <span className="voter-card-mobile-label">मतदान कार्ड क्र.:</span>
                          <span className="voter-card-mobile-value">
                            {voter.voterIdCard || voter.EPIC_NO || '-'}
                          </span>
                        </div>
                        {voter.mobileNumber && (
                          <div className="voter-card-mobile-item">
                            <span className="voter-card-mobile-label">मोबाईल नं.:</span>
                            <span className="voter-card-mobile-value">{voter.mobileNumber}</span>
                          </div>
                        )}
                        <button
                          className="view-btn view-btn-mobile"
                          onClick={() => handleVoterClick(voter)}
                        >
                          <FaEye /> सर्व तपशील पहा
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedVoter && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>संपूर्ण मतदार माहिती</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>📌 मूलभूत माहिती</h4>
                <div className="detail-grid">
                  <div>
                    <strong>नाव (इंग्रजी):</strong>{' '}
                    {selectedVoter.name || selectedVoter.FM_NAME_EN || '-'}
                  </div>
                  <div>
                    <strong>नाव (मराठी):</strong>{' '}
                    {selectedVoter.name_mr || selectedVoter.FM_NAME_V1 || '-'}
                  </div>
                  <div>
                    <strong>उपनाव (इंग्रजी):</strong>{' '}
                    {selectedVoter.LASTNAME_EN || '-'}
                  </div>
                  <div>
                    <strong>उपनाव (मराठी):</strong>{' '}
                    {selectedVoter.LASTNAME_V1 || '-'}
                  </div>
                  <div>
                    <strong>वय:</strong> {selectedVoter.age || '-'}
                  </div>
                  <div>
                    <strong>लिंग:</strong>{' '}
                    {selectedVoter.gender || selectedVoter.gender_mr || '-'}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>🪪 मतदान कार्ड माहिती</h4>
                <div className="detail-grid">
                  <div>
                    <strong>मतदान कार्ड क्र.:</strong>{' '}
                    {selectedVoter.voterIdCard || selectedVoter.EPIC_NO || '-'}
                  </div>
                  <div>
                    <strong>EPIC NO:</strong> {selectedVoter.EPIC_NO || '-'}
                  </div>
                  <div>
                    <strong>AC NO:</strong> {selectedVoter.AC_NO || '-'}
                  </div>
                  <div>
                    <strong>PART NO:</strong> {selectedVoter.PART_NO || '-'}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>📍 पत्ता</h4>
                <div className="detail-grid">
                  <div>
                    <strong>पत्ता (इंग्रजी):</strong> {selectedVoter.adr1 || '-'}
                  </div>
                  <div>
                    <strong>पत्ता (मराठी):</strong> {selectedVoter.adr2 || '-'}
                  </div>
                  <div>
                    <strong>घर क्र.:</strong>{' '}
                    {selectedVoter.houseNumber ||
                      selectedVoter.C_HOUSE_NO ||
                      '-'}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>📞 संपर्क माहिती</h4>
                <div className="detail-grid">
                  <div>
                    <strong>मोबाईल नं.:</strong>{' '}
                    {selectedVoter.mobileNumber || '-'}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

