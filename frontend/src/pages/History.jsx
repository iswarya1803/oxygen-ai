import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Eye, Star, AlertTriangle, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/history`);
      setHistory(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Backend not connected. Ensure the Node server is running on localhost:5000.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-12"><div className="skeleton mx-auto" style={{height: '400px', width: '100%', maxWidth: '1000px'}}></div></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 p-8 text-center animate-fade-in card glass-panel mx-auto" style={{ maxWidth: '600px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <Database size={64} className="text-danger mb-4" style={{ color: '#ef4444' }} />
        <h2 className="text-white mb-2">Connection Error</h2>
        <p className="text-muted mb-6" style={{ fontSize: '1.1rem' }}>{error}</p>
        <div className="bg-black bg-opacity-30 p-4 rounded text-left text-sm text-muted w-full border border-white border-opacity-10">
          <strong>Troubleshooting:</strong>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>Ensure MySQL server is running (e.g., XAMPP, Docker)</li>
            <li>Check if <code>backend/.env</code> has the correct DB credentials</li>
            <li>Run <code>npm start</code> in the backend directory</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2>Generation History</h2>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center mt-12 p-12 card glass-panel mx-auto" style={{ maxWidth: '600px' }}>
          <h3 className="text-white mb-2">No Generations Yet</h3>
          <p className="text-muted">Head over to the AI Workspace to generate your first announcement. It will automatically be saved here.</p>
        </div>
      ) : (
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          {/* List */}
          <div className="history-list flex-col gap-4 hide-scrollbar" style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '10px' }}>
            {history.map((item) => (
              <div 
                key={item.id} 
                className="card glass-panel" 
                style={{ 
                  cursor: 'pointer', 
                  border: selectedId === item.id ? '1px solid var(--secondary)' : '',
                  boxShadow: selectedId === item.id ? '0 0 15px rgba(14, 165, 233, 0.3)' : '',
                  marginBottom: '1rem'
                }}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 style={{ margin: 0, color: selectedId === item.id ? 'white' : 'var(--text-main)' }}>{item.primary_subject}</h4>
                  <span className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <Clock size={12} />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.structured_prompt ? item.structured_prompt.substring(0, 100) : item.ai_response.substring(0, 100)}...
                </p>
                <div className="flex justify-between items-center mt-4">
                  {item.rating ? (
                    <div className="flex gap-1" style={{ fontSize: '0.85rem' }}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" /> 
                      <span className="text-white font-medium">{item.rating}/5</span>
                    </div>
                  ) : (
                    <span className="text-muted text-sm">Not rated</span>
                  )}
                  
                  <span className="text-secondary text-sm flex items-center gap-1 font-medium group-hover:underline">
                    View Details <Eye size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Details View */}
          <div className="history-details card glass-panel" style={{ position: 'sticky', top: '100px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            {selectedId ? (
              <div className="flex-col h-full hide-scrollbar" style={{ overflowY: 'auto' }}>
                {(() => {
                  const item = history.find(h => h.id === selectedId);
                  return (
                    <div className="animate-fade-in">
                      <h3 className="mb-6 gradient-text">Generation Details</h3>
                      
                      <div className="bg-black bg-opacity-30 p-5 rounded-xl border border-white border-opacity-10 mb-6">
                        <div className="mb-3">
                          <strong className="text-primary block mb-1">Subject</strong> 
                          <span className="text-white">{item.primary_subject}</span>
                        </div>
                        
                        {item.specific_requirements && (
                          <div className="mb-3">
                            <strong className="text-secondary block mb-1">Requirements</strong> 
                            <span className="text-muted">{item.specific_requirements}</span>
                          </div>
                        )}
                        
                        {item.preferences && (
                          <div>
                            <strong className="text-success block mb-1">Preferences</strong> 
                            <span className="text-muted">{item.preferences}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="mb-4 text-white">Generated Output</h4>
                      <div className="prose custom-markdown bg-black bg-opacity-20 p-5 rounded-xl border border-white border-opacity-5">
                        <ReactMarkdown>{item.ai_response}</ReactMarkdown>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center text-muted m-auto flex flex-col items-center justify-center py-12">
                <div className="bg-white bg-opacity-5 p-6 rounded-full mb-6">
                  <Eye size={48} className="text-secondary opacity-50" />
                </div>
                <h3 className="text-white mb-2">Select a Document</h3>
                <p className="max-w-xs">Click on any history item from the list to view the full details and generated marketing copy.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
