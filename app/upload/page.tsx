'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Pencil,
  Search,
  RotateCcw,
  X,
  IndianRupee,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GOOGLE_SHEET_VIEW_URL } from '@/lib/constants';
import { Project, ProjectKind } from '@/lib/types';

const BRANCH_OPTIONS = ['ECE', 'CSE', 'EEE', 'Mechanical', 'Civil', 'Medical', 'Other'];
const DOMAIN_OPTIONS = ['IoT', 'Embedded', 'Robotics', 'Machine Learning', 'Simulation', 'Large AI', 'Other'];

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'form' | 'csv' | 'edit' | 'sheet'>('form');

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

  // Existing Titles & Edit State
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [editSearch, setEditSearch] = useState('');
  const [editDomainFilter, setEditDomainFilter] = useState('All');
  const [editBranchFilter, setEditBranchFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Editing Project Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    branch: 'ECE',
    domain: 'IoT',
    customDomain: '',
    type: 'Prototype' as ProjectKind,
    price: '15000',
    description: '',
    tags: '',
    demoVideoUrl: '',
    featured: false,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Fetch all existing catalog projects for editing
  const loadExistingProjects = async (force = false) => {
    try {
      setLoadingExisting(true);
      const url = force ? '/api/projects?refresh=true' : '/api/projects';
      const res = await fetch(url);
      const data = await res.json();
      if (data.projects) {
        setExistingProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to load existing projects:', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'edit' && existingProjects.length === 0) {
      loadExistingProjects();
    }
  }, [activeTab]);

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
    const isPredefinedDomain = DOMAIN_OPTIONS.includes(project.domain);
    setEditFormData({
      title: project.title,
      branch: project.branch,
      domain: isPredefinedDomain ? project.domain : 'Other',
      customDomain: isPredefinedDomain ? '' : project.domain,
      type: project.type,
      price: String(project.price),
      description: project.description,
      tags: project.tags.join(', '),
      demoVideoUrl: project.demoVideoUrl || '',
      featured: Boolean(project.featured),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!editFormData.title.trim()) {
      setEditErrorMsg('Project title is required.');
      return;
    }

    setEditSaving(true);
    setEditSuccessMsg(null);
    setEditErrorMsg(null);

    const finalDomain =
      editFormData.domain === 'Other' && editFormData.customDomain.trim()
        ? editFormData.customDomain.trim()
        : editFormData.domain;

    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProject.id,
          title: editFormData.title.trim(),
          branch: editFormData.branch,
          domain: finalDomain,
          type: editFormData.type,
          price: parseInt(editFormData.price.replace(/[^0-9]/g, ''), 10) || 10000,
          description: editFormData.description.trim(),
          tags: editFormData.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          demoVideoUrl: editFormData.demoVideoUrl.trim() || undefined,
          featured: editFormData.featured,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update project');
      }

      setExistingProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...data.project, isEdited: true } : p))
      );

      setEditSuccessMsg(
        `Project "${data.project.title}" successfully updated! Both Excel sheet (.xlsx & .csv) and catalog updated.`
      );
      setEditingProject(null);
    } catch (err: any) {
      setEditErrorMsg(err.message || 'Error updating project');
    } finally {
      setEditSaving(false);
    }
  };

  const handleResetProject = async (id: string, title: string) => {
    if (!confirm(`Reset "${title}" back to original Excel sheet values?`)) {
      return;
    }
    setResettingId(id);
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset project');
      setEditSuccessMsg(data.message || 'Project reset to original values.');
      await loadExistingProjects(true);
    } catch (err: any) {
      setEditErrorMsg(err.message || 'Failed to reset project');
    } finally {
      setResettingId(null);
    }
  };

  const filteredExisting = useMemo(() => {
    return existingProjects.filter((p) => {
      if (editDomainFilter !== 'All' && p.domain.toLowerCase() !== editDomainFilter.toLowerCase()) return false;
      if (editBranchFilter !== 'All' && p.branch.toLowerCase() !== editBranchFilter.toLowerCase()) return false;
      if (editSearch.trim()) {
        const q = editSearch.toLowerCase().trim();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q) ||
          p.branch.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [existingProjects, editDomainFilter, editBranchFilter, editSearch]);

  const totalPages = Math.ceil(filteredExisting.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExisting.slice(start, start + pageSize);
  }, [filteredExisting, currentPage]);

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
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'edit'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Pencil className="w-4 h-4" />
            <span>Edit Existing Titles</span>
            {existingProjects.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-950/60 font-mono text-amber-300">
                {existingProjects.length}
              </span>
            )}
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

        {/* TAB 3: Edit Existing Titles from Sheet & Catalog */}
        {activeTab === 'edit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
            {/* Tab Header & Quick Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-white">Edit Existing Project Titles</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    Live Excel Editor
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Search and edit existing projects from your Excel sheets or catalog. Updated costs, titles, domains, and branches are <strong>automatically synced to project_catalog_data.xlsx & .csv</strong> on the server!
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadExistingProjects(true)}
                disabled={loadingExisting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
                title="Refresh project list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingExisting ? 'animate-spin text-amber-400' : ''}`} />
                <span>{loadingExisting ? 'Refreshing...' : 'Refresh Titles'}</span>
              </button>
            </div>

            {/* Notifications */}
            {editSuccessMsg && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <div className="flex-1">{editSuccessMsg}</div>
                <button
                  type="button"
                  onClick={() => setEditSuccessMsg(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {editErrorMsg && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <div className="flex-1">{editErrorMsg}</div>
                <button
                  type="button"
                  onClick={() => setEditErrorMsg(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editSearch}
                    onChange={(e) => {
                      setEditSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by title, domain, branch, or ID..."
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                  />
                  {editSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditSearch('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Domain Filter */}
                <div className="w-full md:w-44">
                  <select
                    value={editDomainFilter}
                    onChange={(e) => {
                      setEditDomainFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-400"
                  >
                    <option value="All">All Domains</option>
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Filter */}
                <div className="w-full md:w-40">
                  <select
                    value={editBranchFilter}
                    onChange={(e) => {
                      setEditBranchFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-400"
                  >
                    <option value="All">All Branches</option>
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
                <div>
                  Showing <span className="text-amber-400 font-bold">{filteredExisting.length}</span> matching titles{' '}
                  <span className="text-slate-600">({existingProjects.length} total in catalog)</span>
                </div>

                {(editSearch || editDomainFilter !== 'All' || editBranchFilter !== 'All') && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditSearch('');
                      setEditDomainFilter('All');
                      setEditBranchFilter('All');
                      setCurrentPage(1);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold underline text-xs"
                  >
                    Reset Search Filters
                  </button>
                )}
              </div>
            </div>

            {/* Existing Titles Table */}
            {loadingExisting && existingProjects.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                <span>Loading existing titles from catalog & Excel sheet...</span>
              </div>
            ) : filteredExisting.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-sm font-semibold text-white mb-1">No matching titles found</p>
                <p className="text-xs">Try adjusting your search query or branch/domain filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-3.5 py-3 w-12">#</th>
                        <th className="px-3.5 py-3">Title</th>
                        <th className="px-3.5 py-3">Branch</th>
                        <th className="px-3.5 py-3">Domain</th>
                        <th className="px-3.5 py-3">Type</th>
                        <th className="px-3.5 py-3">Cost (₹)</th>
                        <th className="px-3.5 py-3">Status</th>
                        <th className="px-3.5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {paginatedProjects.map((project, idx) => {
                        const serialNum = (currentPage - 1) * pageSize + idx + 1;
                        return (
                          <tr
                            key={project.id}
                            className="hover:bg-slate-900/60 transition-colors group"
                          >
                            <td className="px-3.5 py-3 font-mono text-slate-500 text-[11px]">
                              #{serialNum}
                            </td>
                            <td className="px-3.5 py-3 max-w-sm">
                              <div className="font-semibold text-white group-hover:text-amber-300 transition-colors leading-snug">
                                {project.title}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {project.description}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium">
                                {project.branch}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px] font-semibold">
                                {project.domain}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  project.type === 'Product'
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                    : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                                }`}
                              >
                                {project.type}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap font-mono font-bold text-amber-300">
                              ₹{project.price.toLocaleString('en-IN')}
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {project.source === 'custom' ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                                    Custom
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                    Sheet
                                  </span>
                                )}
                                {project.isEdited && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                                    Edited
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(project)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95"
                                  title="Edit Title, Cost, Domain & Specs"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                {project.isEdited && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetProject(project.id, project.title)}
                                    disabled={resettingId === project.id}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 border border-transparent hover:border-rose-900 transition-all"
                                    title="Reset back to original sheet values"
                                  >
                                    <RotateCcw className={`w-3.5 h-3.5 ${resettingId === project.id ? 'animate-spin' : ''}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-2 pt-2 text-xs text-slate-400">
                    <div>
                      Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 transition-colors flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = currentPage;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                                currentPage === pageNum
                                  ? 'bg-amber-400 text-slate-950 font-bold'
                                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 transition-colors flex items-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Google Sheet & Excel Auto-Sync */}
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

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => !editSaving && setEditingProject(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
                    Edit Project Specifications
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="font-mono">ID: {editingProject.id}</span>
                    <span>•</span>
                    <span className="capitalize">{editingProject.source || 'Sheet'} origin</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !editSaving && setEditingProject(null)}
                disabled={editSaving}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {editErrorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{editErrorMsg}</span>
                </div>
              )}

              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="e.g. Real-Time Object Tracking Robot Using YOLO"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                />
              </div>

              {/* Branch, Domain, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Engineering Branch
                  </label>
                  <select
                    value={editFormData.branch}
                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none cursor-pointer focus:border-amber-400"
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Technology Domain
                  </label>
                  <select
                    value={editFormData.domain}
                    onChange={(e) => setEditFormData({ ...editFormData, domain: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none cursor-pointer focus:border-amber-400"
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Project Type
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as ProjectKind })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none cursor-pointer focus:border-amber-400"
                  >
                    <option value="Prototype">Prototype</option>
                    <option value="Product">Product</option>
                  </select>
                </div>
              </div>

              {/* Custom domain if Other */}
              {editFormData.domain === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Custom Technology Domain Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.customDomain}
                    onChange={(e) => setEditFormData({ ...editFormData, customDomain: e.target.value })}
                    placeholder="e.g. Biomedical Signals, Blockchain, etc."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                  />
                </div>
              )}

              {/* Price & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Estimated Cost / Price (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      placeholder="15000"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:border-amber-400 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Catalog cost estimation in Indian Rupees
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Technology Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                    placeholder="YOLO, AI, Computer Vision, Raspberry Pi"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Description & Overview
                </label>
                <textarea
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Describe the hardware, sensors, algorithms, or application flow..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:border-amber-400 outline-none resize-y"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Demo Video Link (Optional)
                </label>
                <input
                  type="url"
                  value={editFormData.demoVideoUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, demoVideoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalFeatured"
                  checked={editFormData.featured}
                  onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-amber-400"
                />
                <label htmlFor="modalFeatured" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Feature this project in top picks banner & badges
                </label>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => !editSaving && setEditingProject(null)}
                  disabled={editSaving}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${editSaving ? 'animate-spin' : 'hidden'}`} />
                  <span>{editSaving ? 'Saving Changes...' : 'Save Changes & Update Excel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

