'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  PlusCircle, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Table,
  Check,
  Copy,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { GOOGLE_SHEET_VIEW_URL } from '@/lib/constants';

const BRANCH_OPTIONS = ['ECE', 'CSE', 'EEE', 'Mechanical', 'Civil', 'Medical', 'Other'];
const DOMAIN_OPTIONS = ['IoT', 'Embedded', 'Robotics', 'Machine Learning', 'Simulation', 'Large AI', 'Other'];

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'form' | 'csv' | 'sheet'>('form');

  // Single Project Form State
  const [formData, setFormData] = useState({
    title: '',
    branch: 'ECE',
    domain: 'IoT',
    type: 'Prototype',
    price: '15000',
    description: '',
    tags: '',
    demoVideoUrl: '',
    featured: false,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Upload State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Sheet & Webhook Sync State
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isWebhookConfigured, setIsWebhookConfigured] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaveMsg, setWebhookSaveMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load existing webhook configuration
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.googleSheetWebhookUrl) {
          setWebhookUrl(d.googleSheetWebhookUrl);
          setIsWebhookConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  // Handle Single Project Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormSuccess(null);
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Project title is required.');
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          branch: formData.branch,
          domain: formData.domain,
          type: formData.type,
          price: parseInt(formData.price.replace(/[^0-9]/g, ''), 10) || 10000,
          description: formData.description.trim(),
          tags: formData.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          demoVideoUrl: formData.demoVideoUrl.trim() || undefined,
          featured: formData.featured,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to add project');
      }

      let successMsg = `Project "${formData.title}" added to catalog & automatically updated in Excel sheet (.xlsx & .csv)!`;
      if (result.sheetSynced) {
        successMsg += ' ✨ Live Google Sheet automatically updated!';
      }
      setFormSuccess(successMsg);

      // Reset form
      setFormData({
        title: '',
        branch: 'ECE',
        domain: 'IoT',
        type: 'Prototype',
        price: '15000',
        description: '',
        tags: '',
        demoVideoUrl: '',
        featured: false,
      });
    } catch (err: any) {
      setFormError(err.message || 'Error adding project');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Parse CSV client-side for immediate preview
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvSuccess(null);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV file must have at least one header and one data row.');
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const titleIdx = headers.findIndex((h) => h.includes('title'));
        const domainIdx = headers.findIndex((h) => h.includes('domain'));
        const branchIdx = headers.findIndex((h) => h.includes('branch'));
        const typeIdx = headers.findIndex((h) => h.includes('type'));
        const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('cost'));
        const descIdx = headers.findIndex((h) => h.includes('desc'));
        const tagsIdx = headers.findIndex((h) => h.includes('tag'));

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const rawCells = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          const cleanCells = rawCells.map((c) => c.trim().replace(/^"|"$/g, ''));
          const title = titleIdx >= 0 ? cleanCells[titleIdx] : cleanCells[0] || '';
          if (!title) continue;

          rows.push({
            title,
            domain: domainIdx >= 0 ? cleanCells[domainIdx] : 'IoT',
            branch: branchIdx >= 0 ? cleanCells[branchIdx] : 'ECE',
            type: (typeIdx >= 0 && cleanCells[typeIdx]?.toLowerCase() === 'product') ? 'Product' : 'Prototype',
            price: parseInt(String(priceIdx >= 0 ? cleanCells[priceIdx] : '10000').replace(/[^0-9]/g, ''), 10) || 10000,
            description: descIdx >= 0 ? cleanCells[descIdx] : '',
            tags: tagsIdx >= 0 && cleanCells[tagsIdx] ? cleanCells[tagsIdx].split(';').join(',').split(',') : [],
            featured: false,
          });
        }

        setParsedRows(rows);
      } catch (err: any) {
        setCsvError(`Failed to parse CSV: ${err.message}`);
        setParsedRows([]);
      }
    };
    reader.readAsText(file);
  };

  // Batch import parsed CSV rows
  const handleImportCsv = async () => {
    if (parsedRows.length === 0) return;
    setCsvUploading(true);
    setCsvError(null);
    setCsvSuccess(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import CSV projects');
      }

      let successMsg = `Successfully imported ${data.added?.length || parsedRows.length} projects & automatically updated in Excel sheet (.xlsx & .csv)!`;
      if (data.sheetSynced) {
        successMsg += ' ✨ Live Google Sheet automatically updated!';
      }
      setCsvSuccess(successMsg);
      setParsedRows([]);
      setCsvFile(null);
    } catch (err: any) {
      setCsvError(err.message || 'Error uploading projects');
    } finally {
      setCsvUploading(false);
    }
  };

  // Save Google Sheet Webhook URL
  const handleSaveWebhook = async (syncAll = false) => {
    setSavingWebhook(true);
    setWebhookSaveMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, syncAll }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setIsWebhookConfigured(Boolean(data.googleSheetWebhookUrl));
      if (syncAll && data.syncResult) {
        setWebhookSaveMsg(`Saved! ${data.syncResult.message || 'Synced all projects to Google Sheet'}`);
      } else {
        setWebhookSaveMsg('Google Sheet Webhook saved! All future uploads will automatically update your Google Sheet.');
      }
    } catch (err: any) {
      setWebhookSaveMsg(`Error: ${err.message}`);
    } finally {
      setSavingWebhook(false);
    }
  };

  // Copy Google Apps Script code to clipboard
  const handleCopyScript = () => {
    const scriptCode = `// Google Apps Script for Easitronics Google Sheet Auto-Update
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var rows = Array.isArray(data) ? data : [data];
  
  rows.forEach(function(p) {
    sheet.appendRow([
      p.title || '',
      p.domain || '',
      p.branch || '',
      p.type || '',
      p.price || '',
      p.description || '',
      p.imageUrl || 'ADD_IMAGE_LINK',
      p.demoVideoUrl || 'ADD_VIDEO_LINK',
      Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
      p.featured ? 'TRUE' : 'FALSE'
    ]);
  });
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', added: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateContent = [
      'Title,Domain,Branch,Type,Price,Description,ImageURL,DemoVideoURL,Tags,Featured',
      '"Smart Solar Powered Autonomous Dust Suppression System","IoT","Civil","Product","18500","IoT-enabled misting system that monitors PM2.5/PM10.","ADD_IMAGE_LINK","ADD_VIDEO_LINK","Solar, Dust Suppression, Smart City","TRUE"',
      '"Autonomous Pipe Inspection Crawler Robot","Robotics","Mechanical","Product","31000","Compact tracked robotic vehicle for drain inspection.","ADD_IMAGE_LINK","ADD_VIDEO_LINK","Robotics, Inspection, Mechanical","TRUE"',
      '"FPGA Radar Signal Processing Engine","Embedded","ECE","Prototype","14999","Chirp radar detection with hardware FFT acceleration.","ADD_IMAGE_LINK","ADD_VIDEO_LINK","FPGA, Radar, VHDL","FALSE"',
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'project_catalog_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sync / Refresh with Google Sheet
  const handleSyncWithSheet = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/projects?refresh=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync with Google Sheet');
      setSyncMessage(`Synced successfully! Loaded ${data.totalFromSheet || data.projects?.length} projects from Google Sheets.`);
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-6 transition-colors group bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Catalog</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-teal-300 font-medium mb-3">
            <span>Easitronics Admin Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Easitronics Project Upload & Sheet Sync
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Add new project titles to the Easitronics catalog, bulk import via CSV file, or synchronize and export updates to your Google Sheet.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'form'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Single Project</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'csv'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Batch Upload (CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'sheet'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Google Sheet Sync & Export</span>
          </button>
        </div>

        {/* TAB 1: Single Project Form */}
        {activeTab === 'form' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md">
            <h2 className="text-lg font-bold text-white mb-1">Add a New Project</h2>
            <p className="text-xs text-slate-400 mb-6">
              Fill in the project details. Newly added projects will appear immediately across the catalog and can be exported to your Google Sheet.
            </p>

            {formSuccess && (
              <div className="flex items-center gap-2 p-3.5 mb-6 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <div className="flex-1">{formSuccess}</div>
                <Link href="/" className="underline font-bold hover:text-white">View in Catalog</Link>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 p-3.5 mb-6 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. IoT-Enabled Smart Substation Monitoring System"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Engineering Branch
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none cursor-pointer focus:border-amber-400"
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Technology Domain
                  </label>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none cursor-pointer focus:border-amber-400"
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Project Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none cursor-pointer focus:border-amber-400"
                  >
                    <option value="Prototype">Prototype</option>
                    <option value="Product">Product</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Estimated Cost / Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="15000"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Technology Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="IoT, Sensors, Smart Grid, Power"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the problem solved, sensors or algorithms used, and expected working prototype output..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Demo Video Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.demoVideoUrl}
                  onChange={(e) => setFormData({ ...formData, demoVideoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-amber-400"
                />
                <label htmlFor="featured" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Feature this project on top picks
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Adding Project...' : 'Add Project to Catalog'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Batch CSV Upload */}
        {activeTab === 'csv' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Batch Upload via CSV</h2>
                <p className="text-xs text-slate-400">
                  Upload multiple projects at once using a comma-separated CSV file.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV Template</span>
              </button>
            </div>

            {csvSuccess && (
              <div className="flex items-center gap-2 p-3.5 mb-6 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <div className="flex-1">{csvSuccess}</div>
                <Link href="/" className="underline font-bold hover:text-white">View in Catalog</Link>
              </div>
            )}

            {csvError && (
              <div className="flex items-center gap-2 p-3.5 mb-6 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{csvError}</span>
              </div>
            )}

            {/* File Drop Area */}
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-400/80 rounded-2xl p-8 text-center transition-colors mb-6 bg-slate-950/50">
              <UploadCloud className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-white mb-1">Select or drag your CSV file here</p>
              <p className="text-xs text-slate-500 mb-4">
                Supported columns: Title, Domain, Branch, Type, Price, Description, Tags, Featured
              </p>
              <input
                type="file"
                accept=".csv"
                id="csvInput"
                onChange={handleCsvFileChange}
                className="hidden"
              />
              <label
                htmlFor="csvInput"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                <span>Choose CSV File</span>
              </label>
              {csvFile && (
                <p className="text-xs text-amber-300 mt-3 font-semibold">
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Preview of Parsed Rows */}
            {parsedRows.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">
                    Preview: {parsedRows.length} Projects Ready to Import
                  </h3>
                  <button
                    onClick={handleImportCsv}
                    disabled={csvUploading}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                  >
                    {csvUploading ? 'Importing...' : `Import All ${parsedRows.length} Projects`}
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Branch</th>
                        <th className="px-3 py-2">Domain</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {parsedRows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="px-3 py-2 font-mono text-slate-500">{i + 1}</td>
                          <td className="px-3 py-2 font-semibold text-white max-w-xs truncate">{row.title}</td>
                          <td className="px-3 py-2">{row.branch}</td>
                          <td className="px-3 py-2">{row.domain}</td>
                          <td className="px-3 py-2">{row.type}</td>
                          <td className="px-3 py-2 font-mono text-amber-300">₹{row.price.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Google Sheet & Excel Auto-Sync */}
        {activeTab === 'sheet' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-white">Google Sheet & Excel Auto-Update System</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Real-time Auto Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Whenever you add a project or upload a CSV, your catalog data is <strong>automatically updated in your Excel sheet</strong> (.xlsx & .csv) and automatically pushed to your live Google Sheet.
              </p>
            </div>

            {webhookSaveMsg && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{webhookSaveMsg}</span>
              </div>
            )}

            {syncMessage && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{syncMessage}</span>
              </div>
            )}

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Local Microsoft Excel File Auto-Update */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Excel Auto-Update
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Always Active ✅
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mb-1.5 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Microsoft Excel & CSV Files</span>
                  </h3>
                  
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Whenever you upload any project, both <strong>project_catalog_data.xlsx</strong> and <strong>project_catalog_data.csv</strong> on the server are automatically updated in real-time.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                  <a
                    href="/api/projects?export=xlsx"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel (.xlsx)</span>
                  </a>
                  <a
                    href="/api/projects?export=csv"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV (.csv)</span>
                  </a>
                </div>
              </div>

              {/* Card 2: Pull Latest Live from Google Sheet */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Google Sheets
                    </span>
                    <a
                      href={GOOGLE_SHEET_VIEW_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      <span>Open Live Sheet</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <h3 className="font-bold text-white text-base mb-1.5 flex items-center gap-2">
                    <Table className="w-4 h-4 text-amber-400" />
                    <span>Pull Live Rows from Google Sheet</span>
                  </h3>
                  
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    If you edited or added rows directly inside your Google Sheet, click below to re-fetch the sheet live and clear the website cache.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                  <button
                    onClick={handleSyncWithSheet}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Fetching Sheet...' : 'Sync with Sheet Now'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Card 3: Live Google Sheet Webhook Auto-Update Setup */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">
                    Direct Google Sheet Auto-Update (Apps Script Webhook)
                  </h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isWebhookConfigured 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {isWebhookConfigured ? 'Auto-Update Connected ✅' : 'Optional Cloud Webhook'}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Connect your Google Sheet via a Google Apps Script Webhook so that every time a project is uploaded on Easitronics, a new row is <strong>automatically inserted into your online Google Sheet</strong> without any manual import!
              </p>

              {/* Webhook Input Field */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleSaveWebhook(false)}
                  disabled={savingWebhook || !webhookUrl.trim()}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  {savingWebhook ? 'Saving...' : 'Save Webhook'}
                </button>
                {isWebhookConfigured && (
                  <button
                    onClick={() => handleSaveWebhook(true)}
                    disabled={savingWebhook}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-all disabled:opacity-50"
                  >
                    Sync All to Google Sheet
                  </button>
                )}
              </div>

              {/* Step-by-Step 30-Second Setup Guide */}
              <details className="mt-4 pt-3 border-t border-slate-900 group">
                <summary className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer">
                  ▶ How to set up Google Sheet Auto-Update in 30 seconds
                </summary>
                <div className="mt-3 space-y-2.5 text-xs text-slate-300 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                  <p>1. Open your <a href={GOOGLE_SHEET_VIEW_URL} target="_blank" rel="noopener noreferrer" className="text-teal-400 underline font-bold">Google Sheet</a>.</p>
                  <p>2. In the top menu, click <strong>Extensions &gt; Apps Script</strong>.</p>
                  <p>3. Delete any default code and paste the script below:</p>
                  
                  <div className="relative my-2">
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var rows = Array.isArray(data) ? data : [data];
  
  rows.forEach(function(p) {
    sheet.appendRow([
      p.title || '',
      p.domain || '',
      p.branch || '',
      p.type || '',
      p.price || '',
      p.description || '',
      p.imageUrl || 'ADD_IMAGE_LINK',
      p.demoVideoUrl || 'ADD_VIDEO_LINK',
      Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
      p.featured ? 'TRUE' : 'FALSE'
    ]);
  });
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                    </pre>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>

                  <p>4. Click <strong>Deploy &gt; New deployment</strong>, select type <strong>Web app</strong>.</p>
                  <p>5. Under <em>Execute as</em> choose <strong>Me</strong>, and under <em>Who has access</em> choose <strong>Anyone</strong>.</p>
                  <p>6. Click <strong>Deploy</strong>, copy the generated Web app URL, and paste it into the box above!</p>
                  <p className="text-emerald-400 font-semibold mt-1">
                    🎉 Once connected, every project you upload automatically adds a row to your Google Sheet instantly!
                  </p>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
