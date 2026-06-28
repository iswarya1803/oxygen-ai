import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Loader2, Copy, Download, RefreshCw, Star, MessageSquare, Target, Zap, AlertTriangle, FileText, CheckCircle, XCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';

function Generator() {
  const [formData, setFormData] = useState({
    primarySubject: '',
    requirements: '',
    constraints: '',
    preferences: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rating, setRating] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

  // Auto-hide toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.primarySubject.trim()) {
      newErrors.primarySubject = 'Primary Subject is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setResult(null);
    setRating(0);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/api/generate`, formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrors({ submit: err.response.data.error });
      } else {
        setErrors({ submit: 'Backend not connected. Cannot reach localhost:5000.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const trackAction = async (endpoint, id) => {
    try {
      await axios.post(`${API_URL}/api/${endpoint}`, { id });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Content copied successfully!');
      trackAction('copy', id);
    } catch (err) {
      showToast('Failed to copy content.', 'error');
    }
  };

  const getFormattedDate = () => {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  };

  const handleDownloadTxt = (title, text, id) => {
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${safeTitle}_${getFormattedDate()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('Downloaded TXT successfully!');
      trackAction('download', id);
    } catch (err) {
      showToast('Failed to download TXT.', 'error');
    }
  };

  const handleExportPDF = (title, index, id) => {
    try {
      const element = document.getElementById(`pdf-section-${index}`);
      if (!element) return;
      
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const opt = {
        margin:       15,
        filename:     `${safeTitle}_${getFormattedDate()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        showToast('Exported PDF successfully!');
        trackAction('export', id);
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF.', 'error');
    }
  };

  const handleRate = async (value) => {
    setRating(value);
    try {
      await axios.post(`${API_URL}/api/rating`, { id: result.id, rating: value });
      showToast('Rating saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('Database error: Failed to save rating.', 'error');
    }
  };

  // Helper to parse markdown by '###' sections
  const parseSections = (markdown) => {
    if (!markdown) return [];
    // Splitting by ### ensures we get the sections separated
    const parts = markdown.split('###').map(p => p.trim()).filter(p => p.length > 0);
    return parts.map(part => {
      const newlineIndex = part.indexOf('\n');
      if (newlineIndex === -1) return { title: part, content: '' };
      return {
        title: part.substring(0, newlineIndex).trim(),
        content: part.substring(newlineIndex).trim(),
        raw: part
      };
    });
  };

  const sections = result ? parseSections(result.ai_response) : [];

  return (
    <div className="generator-page animate-fade-in grid grid-2 relative">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed" style={{ top: '20px', right: '20px', zIndex: 9999, animation: 'fadeIn 0.3s ease' }}>
          <div className="card glass-panel flex items-center gap-3 px-6 py-4" style={{ borderLeft: `4px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}` }}>
            {toast.type === 'success' ? <CheckCircle className="text-success" /> : <XCircle className="text-danger" style={{ color: '#ef4444' }} />}
            <span className="text-white font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="card glass-panel hide-scrollbar" style={{ alignSelf: 'start', position: 'sticky', top: '100px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <h2 className="mb-6 flex items-center gap-2">
          <Zap className="text-secondary" /> AI Workspace
        </h2>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label className="form-label text-secondary">Primary Subject / Context *</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '16px', fontSize: '1.05rem' }}
              placeholder="e.g. Launching new Oxygen Pro Running Shoes"
              value={formData.primarySubject}
              onChange={(e) => setFormData({ ...formData, primarySubject: e.target.value })}
              disabled={loading}
            />
            {errors.primarySubject && <span className="form-error">{errors.primarySubject}</span>}
            <span className="form-helper">What is the main announcement about?</span>
          </div>

          <div className="form-group">
            <label className="form-label text-primary">Specific Requirements</label>
            <textarea
              className="form-textarea"
              rows="4"
              style={{ resize: 'none', padding: '16px', fontSize: '1.05rem' }}
              placeholder="e.g. Include a 20% discount code 'OXYGEN20' and mention breathability"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              disabled={loading}
            />
            <span className="form-helper">Any specific details that must be included.</span>
          </div>

          <div className="form-group">
            <label className="form-label text-accent">Constraints</label>
            <textarea
              className="form-textarea"
              rows="3"
              style={{ resize: 'none', padding: '16px', fontSize: '1.05rem' }}
              placeholder="e.g. Do not mention last year's models. Keep it under 120 words."
              value={formData.constraints}
              onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
              disabled={loading}
            />
            <span className="form-helper">What should the AI avoid?</span>
          </div>

          <div className="form-group">
            <label className="form-label text-success">Preferences</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '16px', fontSize: '1.05rem' }}
              placeholder="e.g. Friendly, exciting, and suitable for teenagers"
              value={formData.preferences}
              onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              disabled={loading}
            />
            <span className="form-helper">Tone and style preferences.</span>
          </div>

          {errors.submit && (
            <div className="form-error mb-4 p-4 rounded flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '1rem' }}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>Action Required:</strong>
                <p style={{ marginTop: '4px' }}>{errors.submit}</p>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '10px' }} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={24} /> Generating Real Content...
              </>
            ) : (
              <>Generate Announcement <Zap size={20} /></>
            )}
          </button>
        </form>
      </div>

      {/* Output Section */}
      <div className="card glass-panel flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0 }}>Generated Content</h2>
          {result && (
            <button className="btn-icon text-primary hover:text-white transition-colors" onClick={handleGenerate} title="Regenerate All">
              <RefreshCw size={18} /> <span className="ml-1 text-sm">Regenerate</span>
            </button>
          )}
        </div>

        <div className="output-area hide-scrollbar" style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '10px', height: '100%' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center mt-12 text-muted">
              <Loader2 className="spin mb-6 text-primary" size={48} />
              <p className="text-lg">Contacting AI and querying database...</p>
              
              <div className="w-full mt-8 space-y-4">
                <div className="skeleton mb-4" style={{ height: '140px', width: '100%', borderRadius: '12px' }}></div>
                <div className="skeleton mb-4" style={{ height: '180px', width: '100%', borderRadius: '12px' }}></div>
                <div className="skeleton mb-4" style={{ height: '120px', width: '100%', borderRadius: '12px' }}></div>
              </div>
            </div>
          ) : result ? (
            <div className="animate-fade-in flex flex-col gap-6">
              
              {sections.length > 0 ? (
                sections.map((section, index) => (
                  <div key={index} className="bg-black bg-opacity-20 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    
                    {/* Section Header with Actions */}
                    <div className="px-5 py-3 flex justify-between items-center bg-white bg-opacity-5 border-b border-white border-opacity-5">
                      <h4 className="text-white font-medium m-0 flex items-center gap-2 text-[1.1rem]">
                        {section.title.toLowerCase().includes('whatsapp') && <MessageSquare className="text-success" size={18} />}
                        {section.title.toLowerCase().includes('instagram') && <Target className="text-accent" size={18} />}
                        {section.title.toLowerCase().includes('in-store') && <Zap className="text-secondary" size={18} />}
                        {!section.title.toLowerCase().includes('whatsapp') && !section.title.toLowerCase().includes('instagram') && !section.title.toLowerCase().includes('in-store') && <FileText className="text-primary" size={18} />}
                        {section.title}
                      </h4>
                      
                      <div className="flex gap-1">
                        <button className="btn-icon p-2 hover:bg-white hover:bg-opacity-10 rounded text-muted hover:text-white transition-all" onClick={() => handleCopy(section.content, result.id)} title="Copy to Clipboard">
                          <Copy size={16} />
                        </button>
                        <button className="btn-icon p-2 hover:bg-white hover:bg-opacity-10 rounded text-muted hover:text-white transition-all" onClick={() => handleDownloadTxt(section.title, section.content, result.id)} title="Download TXT">
                          <span className="text-xs font-bold mr-1">TXT</span><Download size={14} />
                        </button>
                        <button className="btn-icon p-2 hover:bg-white hover:bg-opacity-10 rounded text-muted hover:text-white transition-all" onClick={() => handleExportPDF(section.title, index, result.id)} title="Export PDF">
                          <span className="text-xs font-bold mr-1">PDF</span><FileText size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Section Content (Used for PDF Export) */}
                    <div id={`pdf-section-${index}`} className="p-5" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                      <div className="prose custom-markdown">
                        {/* Add Oxygen Brand Header for PDF only. Will be invisible in UI but visible in PDF if styled appropriately. For now just render markdown */}
                        <div style={{ display: 'none' }} className="pdf-header mb-4 border-b pb-2">
                          <h2 style={{ color: '#4f46e5', margin: 0 }}>Oxygen Sports AI</h2>
                          <p style={{ color: '#666', margin: 0 }}>{section.title}</p>
                          <small style={{ color: '#999' }}>Generated: {new Date().toLocaleString()}</small>
                        </div>
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    </div>
                    
                  </div>
                ))
              ) : (
                <div className="prose custom-markdown" id="pdf-section-full">
                  <ReactMarkdown>{result.ai_response}</ReactMarkdown>
                </div>
              )}

              <div className="rating-section mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="form-label mb-3 text-lg">Rate this generation to update Analytics:</p>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      size={28}
                      className="transition-transform hover:scale-110"
                      style={{ cursor: 'pointer', color: rating >= star ? '#fbbf24' : 'var(--text-muted)' }}
                      onClick={() => handleRate(star)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 animate-fade-in">
              <p className="text-muted mb-8 text-center text-lg">Ensure MySQL is running and your API key is in .env before generating.</p>
              
              <div className="grid gap-6">
                <div className="card bg-black bg-opacity-20 border border-white border-opacity-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-success"></div>
                  <h4 className="flex items-center gap-2 text-success mb-2"><MessageSquare size={18}/> WhatsApp Broadcast</h4>
                  <div className="skeleton mt-3" style={{ height: '12px', width: '90%' }}></div>
                  <div className="skeleton mt-2" style={{ height: '12px', width: '70%' }}></div>
                </div>

                <div className="card bg-black bg-opacity-20 border border-white border-opacity-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent text-accent" style={{ background: 'var(--accent)'}}></div>
                  <h4 className="flex items-center gap-2 text-accent mb-2"><Target size={18}/> Instagram Caption</h4>
                  <div className="skeleton mt-3" style={{ height: '12px', width: '85%' }}></div>
                  <div className="skeleton mt-2" style={{ height: '12px', width: '95%' }}></div>
                  <div className="skeleton mt-2" style={{ height: '12px', width: '60%' }}></div>
                </div>

                <div className="card bg-black bg-opacity-20 border border-white border-opacity-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                  <h4 className="flex items-center gap-2 text-secondary mb-2"><Zap size={18}/> In-Store Announcement</h4>
                  <div className="skeleton mt-3" style={{ height: '12px', width: '100%' }}></div>
                  <div className="skeleton mt-2" style={{ height: '12px', width: '50%' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Generator;
