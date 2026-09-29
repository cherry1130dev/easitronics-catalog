'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Printer, 
  Search, 
  Layers, 
  Cpu, 
  ShoppingBag, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Building2, 
  Tag, 
  Sparkles, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Download, 
  RefreshCw,
  ExternalLink,
  PackageCheck,
  MessageCircle,
  Save,
  Plus,
  Database,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
  Cloud,
  CloudUpload,
  CloudDownload,
  Settings
} from 'lucide-react';
import { ClientProjectBrief, ProjectComponent, ClientProjectStatus, ClientProjectPriority, Project } from '@/lib/types';
import { GOOGLE_FORM_RESPONSES_SHEET_URL, GOOGLE_SHEET_VIEW_URL } from '@/lib/constants';
import { MASTER_APPS_SCRIPT_CODE } from '@/lib/apps-script-template';

interface ProjectComponentsManagerProps {
  catalogProjects?: Project[];
}

const COMMON_COMPONENT_CHIPS = [
  'Arduino UNO R3',
  'ESP32 NodeMCU',
  'ESP8266 NodeMCU',
  'Raspberry Pi Pico',
  '0.96 OLED Display',
  '16x2 LCD with I2C',
  '5V Relay Module (1-Ch)',
  '5V Relay Module (4-Ch)',
  'Capacitive Soil Moisture',
  'DHT11 Temp & Humidity',
  'HC-SR04 Ultrasonic',
  'PIR Motion Sensor',
  'MQ-2 Smoke/Gas Sensor',
  'SG90 Micro Servo',
  'MG995 Metal Gear Servo',
  'L298N Motor Driver',
  '18650 Battery Pack + BMS',
  'Active Buzzer 5V',
  'Jumper Wires Assorted',
  'Breadboard (Half Size)',
  'LM2596 Buck Converter',
];

const CATEGORIES = [
  'Microcontroller',
  'Sensor',
  'Display',
  'Actuator',
  'Power',
  'Wireless',
  'Hardware',
  'Other'
];

const LOCAL_VAULT_KEY = 'easicart_saved_components_vault';
const LOCAL_PROJECTS_KEY = 'easicart_client_projects';

interface VaultEntry {
  projectTitle: string;
  projectId?: string;
  clientSpecialNotes?: string;
  budget?: string;
  deadline?: string;
  clientPhone?: string;
  components: ProjectComponent[];
  updatedAt: string;
}

function getLocalVault(): Record<string, VaultEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_VAULT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function saveLocalVault(vault: Record<string, VaultEntry>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(vault));
  } catch (_) {}
}

export default function ProjectComponentsManager({ catalogProjects = [] }: ProjectComponentsManagerProps) {
  // State
  const [projects, setProjects] = useState<ClientProjectBrief[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingGoogleForm, setSyncingGoogleForm] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'projects' | 'master-bom' | 'vault'>('projects');
  
  // Google Sheets Cloud Sync State (Cross-Device)
  const [cloudSyncActive, setCloudSyncActive] = useState<boolean>(false);
  const [cloudVaultCount, setCloudVaultCount] = useState<number>(0);
  const [fetchingCloud, setFetchingCloud] = useState<boolean>(false);
  const [pushingCloud, setPushingCloud] = useState<boolean>(false);
  const [isCloudSetupModalOpen, setIsCloudSetupModalOpen] = useState<boolean>(false);
  const [cloudWebhookInput, setCloudWebhookInput] = useState<string>('');
  const [savingWebhook, setSavingWebhook] = useState<boolean>(false);
  const [copiedAppsScript, setCopiedAppsScript] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Inline Note & Components Editor State for a specific project
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [editComponents, setEditComponents] = useState<ProjectComponent[]>([]);
  const [editQuickLine, setEditQuickLine] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Modal for brand new custom project
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCollege, setNewCollege] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newComponents, setNewComponents] = useState<ProjectComponent[]>([
    { id: 'nc-1', name: '', quantity: 1, category: 'Microcontroller', notes: '', status: 'pending' },
    { id: 'nc-2', name: '', quantity: 1, category: 'Sensor', notes: '', status: 'pending' },
  ]);

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load: Fetch from API with Smart Merge so local components are NEVER lost
  const loadData = async (forceGoogleFormSync = false) => {
    try {
      if (forceGoogleFormSync) {
        setSyncingGoogleForm(true);
      } else {
        setLoading(true);
      }
      
      const localVault = getLocalVault();
      let localProjects: ClientProjectBrief[] = [];
      try {
        const rawLocal = localStorage.getItem(LOCAL_PROJECTS_KEY);
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) localProjects = parsed;
        }
      } catch (_) {}

      const endpoint = forceGoogleFormSync 
        ? '/api/client-projects?importGoogleForm=true' 
        : '/api/client-projects';

      const res = await fetch(endpoint);
      let serverProjects: ClientProjectBrief[] = [];
      let syncDetailMsg = '';

      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          serverProjects = data.projects;
          if (data.syncResult) {
            syncDetailMsg = `Auto-synced with Google Sheet! Loaded ${data.projects.length} orders (${data.syncResult.importedCount} new).`;
          }
          if (data.cloudSynced) {
            setCloudSyncActive(true);
            setCloudVaultCount(data.cloudVaultCount || 0);
          } else if (data.webhookConfigured) {
            setCloudSyncActive(true);
          }
          if (data.lastSyncedAt) {
            setLastSyncTime(new Date(data.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }
        }
      }

      // Server projects are live and cloud-synced with Google Sheets
      const cleanServerProjects = serverProjects.filter(p => 
        p.projectTitle && !p.projectTitle.toLowerCase().includes('obstacle avoiding robot')
      );

      let finalProjects: ClientProjectBrief[] = [];
      if (cleanServerProjects.length > 0) {
        finalProjects = cleanServerProjects;
      } else {
        finalProjects = localProjects.filter(p => 
          p.projectTitle && !p.projectTitle.toLowerCase().includes('obstacle avoiding robot')
        );
      }

      setProjects(finalProjects);
      try {
        localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(finalProjects));
      } catch (_) {}

      // Refresh local vault with any active components
      finalProjects.forEach((p) => {
        const normKey = (p.projectTitle || '').toLowerCase().trim();
        if (normKey && ((p.components && p.components.length > 0) || p.clientSpecialNotes)) {
          localVault[normKey] = {
            projectTitle: p.projectTitle,
            projectId: p.id,
            components: p.components || [],
            clientSpecialNotes: p.clientSpecialNotes || '',
            budget: p.budget || '',
            deadline: p.deadline || '',
            clientPhone: p.clientPhone || '',
            updatedAt: p.updatedAt || new Date().toISOString(),
          };
        }
      });
      saveLocalVault(localVault);

      if (forceGoogleFormSync) {
        setSyncStatus(syncDetailMsg || `Successfully synced! Loaded ${finalProjects.length} project orders from Google Form sheet.`);
        setTimeout(() => setSyncStatus(null), 5000);
      }
    } catch (err) {
      console.error('Error loading client projects:', err);
      // Fallback to localStorage directly
      const local = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects(parsed);
          }
        } catch (_) {}
      }
    } finally {
      setLoading(false);
      setSyncingGoogleForm(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save changes to localStorage and server API
  const persistProjects = async (updated: ClientProjectBrief[]) => {
    setProjects(updated);
    try {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updated));
      await fetch('/api/client-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all', projects: updated }),
      });
    } catch (e) {
      console.error('Error persisting projects:', e);
    }
  };

  // Fetch components from Google Sheets cloud
  const handleFetchFromGoogleSheet = async () => {
    setFetchingCloud(true);
    setSyncStatus('Fetching latest components from Google Sheets cloud...');
    try {
      const res = await fetch('/api/client-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch_cloud_components' }),
      });
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
        localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(data.projects));
        if (data.vault) {
          saveLocalVault(data.vault);
        }
        setCloudSyncActive(true);
        setCloudVaultCount(data.cloudCount || Object.keys(data.vault || {}).length);
        setSyncStatus(data.message || `Loaded components for ${data.cloudCount} projects from Google Sheets!`);
      } else {
        setSyncStatus(`Notice: ${data.message || 'No saved components found in Google Sheets Webhook'}`);
      }
    } catch (err: any) {
      setSyncStatus(`Error fetching from Google Sheets: ${err.message}`);
    } finally {
      setFetchingCloud(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  // Push all local components to Google Sheets cloud
  const handlePushAllToGoogleSheet = async () => {
    setPushingCloud(true);
    setSyncStatus('Pushing all saved components to Google Sheets cloud...');
    try {
      const res = await fetch('/api/client-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push_all_to_cloud' }),
      });
      const data = await res.json();
      if (data.success) {
        setCloudSyncActive(true);
        setSyncStatus(data.message || 'All saved components successfully pushed to Google Sheets!');
      } else {
        setSyncStatus(`Notice: ${data.message || 'Failed to push to Google Sheets'}`);
      }
    } catch (err: any) {
      setSyncStatus(`Error pushing to Google Sheets: ${err.message}`);
    } finally {
      setPushingCloud(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  // Open Cloud Setup Modal and load existing webhook URL
  const handleOpenCloudSetupModal = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json();
        if (d.googleSheetWebhookUrl) {
          setCloudWebhookInput(d.googleSheetWebhookUrl);
        }
      }
    } catch (_) {}
    setIsCloudSetupModalOpen(true);
  };

  // Save Webhook URL from modal
  const handleSaveCloudWebhook = async () => {
    if (!cloudWebhookInput.trim()) {
      alert('Please enter a valid Google Apps Script Webhook URL');
      return;
    }
    setSavingWebhook(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: cloudWebhookInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCloudSyncActive(true);
        setSyncStatus('Google Sheet Webhook saved! Testing connection...');
        await handleFetchFromGoogleSheet();
        setIsCloudSetupModalOpen(false);
      } else {
        alert('Failed to save webhook URL: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving webhook URL: ' + err.message);
    } finally {
      setSavingWebhook(false);
    }
  };

  // Copy Master Apps Script code
  const handleCopyMasterAppsScript = () => {
    navigator.clipboard.writeText(MASTER_APPS_SCRIPT_CODE);
    setCopiedAppsScript(true);
    setTimeout(() => setCopiedAppsScript(false), 2500);
  };

  // Toggle Project Expand/Collapse
  const toggleExpand = (id: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  const isProjectExpanded = (id: string) => {
    return expandedProjects[id] !== false; // default true
  };

  // Open inline editor for a project card
  const startEditProject = (project: ClientProjectBrief) => {
    setEditingCardId(project.id);
    setEditNotes(project.clientSpecialNotes || '');
    setEditRequirements(project.clientRequirements || '');
    setEditBudget(project.budget || '');
    setEditDeadline(project.deadline || '');
    setEditClientPhone(project.clientPhone || '');
    setEditQuickLine('');
    setSaveSuccessMsg(null);

    // Deep clone components
    if (project.components && project.components.length > 0) {
      setEditComponents(JSON.parse(JSON.stringify(project.components)));
    } else {
      setEditComponents([
        { id: `c-${Date.now()}-1`, name: '', quantity: 1, category: 'Microcontroller', notes: '', status: 'pending' },
        { id: `c-${Date.now()}-2`, name: '', quantity: 1, category: 'Sensor', notes: '', status: 'pending' },
      ]);
    }

    // Ensure card is expanded
    setExpandedProjects(prev => ({ ...prev, [project.id]: true }));
  };

  // Cancel inline editor
  const cancelEditProject = () => {
    setEditingCardId(null);
    setSaveSuccessMsg(null);
  };

  // Add component row in editor
  const addEditComponentRow = (name = '', qty = 1, category = 'Sensor') => {
    setEditComponents(prev => [
      ...prev,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        quantity: qty,
        category,
        notes: '',
        status: 'pending'
      }
    ]);
  };

  // Remove component row in editor
  const removeEditComponentRow = (id: string) => {
    setEditComponents(prev => prev.filter(c => c.id !== id));
  };

  // Update component in editor
  const updateEditComponent = (id: string, field: keyof ProjectComponent, val: any) => {
    setEditComponents(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  // Parse quick line or pasted lines (e.g. "Arduino Uno x 1\nSoil Moisture - 2")
  const handleQuickAddLines = (text: string) => {
    if (!text.trim()) return;
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const newItems: ProjectComponent[] = [];

    lines.forEach(line => {
      let name = line;
      let qty = 1;

      // Match "2x Arduino" or "2 * Arduino"
      const prefixMatch = line.match(/^(\d+)\s*(?:x|\*|-)\s*(.+)$/i);
      if (prefixMatch) {
        qty = parseInt(prefixMatch[1], 10) || 1;
        name = prefixMatch[2].trim();
      } else {
        // Match "Arduino x 2" or "Arduino - 2" or "Arduino (2)"
        const suffixMatch = line.match(/^(.+?)(?:\s*(?:x|-|,|\()|\s+qty:?\s*)(\d+)\)?$/i);
        if (suffixMatch) {
          name = suffixMatch[1].trim();
          qty = parseInt(suffixMatch[2], 10) || 1;
        }
      }

      // Guess category
      let category = 'Other';
      const nLower = name.toLowerCase();
      if (nLower.includes('arduino') || nLower.includes('esp32') || nLower.includes('nodemcu') || nLower.includes('pico') || nLower.includes('stm32')) {
        category = 'Microcontroller';
      } else if (nLower.includes('sensor') || nLower.includes('dht') || nLower.includes('mq') || nLower.includes('ultrasonic') || nLower.includes('pir') || nLower.includes('moisture')) {
        category = 'Sensor';
      } else if (nLower.includes('display') || nLower.includes('lcd') || nLower.includes('oled') || nLower.includes('screen')) {
        category = 'Display';
      } else if (nLower.includes('motor') || nLower.includes('relay') || nLower.includes('servo') || nLower.includes('pump')) {
        category = 'Actuator';
      } else if (nLower.includes('battery') || nLower.includes('power') || nLower.includes('converter') || nLower.includes('bms')) {
        category = 'Power';
      } else if (nLower.includes('wire') || nLower.includes('jumper') || nLower.includes('breadboard') || nLower.includes('pcb')) {
        category = 'Hardware';
      }

      newItems.push({
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        quantity: Math.max(1, qty),
        category,
        notes: '',
        status: 'pending'
      });
    });

    if (newItems.length > 0) {
      // Remove placeholder empty rows if any
      const cleaned = editComponents.filter(c => c.name.trim().length > 0);
      setEditComponents([...cleaned, ...newItems]);
      setEditQuickLine('');
    }
  };

  // Save inline editor: Saves to state, localStorage, local vault, and server API!
  const handleSaveInlineEditor = async (projectId: string) => {
    const validComponents = editComponents
      .map(c => ({ ...c, name: c.name.trim() }))
      .filter(c => c.name.length > 0);

    const now = new Date().toISOString();
    let savedTitle = '';

    const updated = projects.map(p => {
      if (p.id === projectId) {
        savedTitle = p.projectTitle;
        return {
          ...p,
          clientSpecialNotes: editNotes.trim(),
          clientRequirements: editRequirements.trim(),
          budget: editBudget.trim() || p.budget,
          deadline: editDeadline.trim() || p.deadline,
          clientPhone: editClientPhone.trim() || p.clientPhone,
          components: validComponents,
          updatedAt: now
        };
      }
      return p;
    });

    // 1. Immediately update state
    setProjects(updated);

    // 2. Immediately save to localStorage projects
    try {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updated));
    } catch (_) {}

    // 3. Immediately save to Local Vault (keyed by project title)
    if (savedTitle) {
      const normKey = savedTitle.toLowerCase().trim();
      const vault = getLocalVault();
      vault[normKey] = {
        projectTitle: savedTitle,
        projectId: projectId,
        clientSpecialNotes: editNotes.trim(),
        budget: editBudget.trim(),
        deadline: editDeadline.trim(),
        clientPhone: editClientPhone.trim(),
        components: validComponents,
        updatedAt: now,
      };
      saveLocalVault(vault);
    }

    // 4. Send to server API with save_components action for server-side persistence & cloud sync
    let cloudSynced = false;
    try {
      const res = await fetch('/api/client-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_components',
          projectId,
          projectTitle: savedTitle,
          components: validComponents,
          notes: editNotes.trim(),
          budget: editBudget.trim(),
          deadline: editDeadline.trim(),
          clientPhone: editClientPhone.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        cloudSynced = Boolean(data.cloudSynced);
        if (cloudSynced) {
          setCloudSyncActive(true);
        }
      }

      // Also sync all to update project JSON
      await fetch('/api/client-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all', projects: updated }),
      });
    } catch (err) {
      console.warn('Server components sync notice (stored in local vault):', err);
    }

    if (cloudSynced) {
      setSaveSuccessMsg(`Saved & Cloud Synced! ${validComponents.length} components permanently locked & accessible across all your devices via Google Sheets! ✨`);
    } else {
      setSaveSuccessMsg(`Saved & Locked! ${validComponents.length} components permanently stored for "${savedTitle}". Will never be erased on refresh.`);
    }
    setTimeout(() => {
      setEditingCardId(null);
      setSaveSuccessMsg(null);
    }, 2200);
  };

  // Quick toggle component status (Need to Buy -> Procured -> Assembled)
  const handleToggleComponentStatus = async (projectId: string, componentId: string) => {
    let targetTitle = '';
    const updated = projects.map(p => {
      if (p.id === projectId) {
        targetTitle = p.projectTitle;
        const updatedComps = p.components.map(c => {
          if (c.id === componentId) {
            const nextStatus: 'pending' | 'procured' | 'assembled' = 
              c.status === 'pending' ? 'procured' : c.status === 'procured' ? 'assembled' : 'pending';
            return { ...c, status: nextStatus };
          }
          return c;
        });
        return { ...p, components: updatedComps, updatedAt: new Date().toISOString() };
      }
      return p;
    });

    setProjects(updated);
    try {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updated));
      if (targetTitle) {
        const normKey = targetTitle.toLowerCase().trim();
        const vault = getLocalVault();
        const pObj = updated.find(p => p.id === projectId);
        if (pObj && vault[normKey]) {
          vault[normKey].components = pObj.components;
          vault[normKey].updatedAt = new Date().toISOString();
          saveLocalVault(vault);
        }
      }
    } catch (_) {}

    await persistProjects(updated);
  };

  // Delete project
  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Delete project brief for "${title}"?`)) return;
    const updated = projects.filter(p => p.id !== id);
    await persistProjects(updated);
  };

  // Copy Project Summary for WhatsApp
  const handleCopyProjectSummary = (project: ClientProjectBrief) => {
    let text = `🛠️ *EasiCart Project & Components Brief*\n`;
    text += `📌 *Project:* ${project.projectTitle}\n`;
    text += `👤 *Client:* ${project.clientName} ${project.clientPhone ? `(${project.clientPhone})` : ''}\n`;
    if (project.collegeOrOrg) text += `🏫 *College:* ${project.collegeOrOrg}\n`;
    if (project.budget) text += `💰 *Cost/Budget:* ${project.budget}\n`;
    if (project.deadline) text += `📅 *Target Deadline:* ${project.deadline}\n`;

    if (project.clientSpecialNotes) {
      text += `\n📝 *PROJECT NOTE & INSTRUCTIONS:*\n${project.clientSpecialNotes}\n`;
    }

    if (project.components && project.components.length > 0) {
      text += `\n📦 *REQUIRED COMPONENTS:*\n`;
      project.components.forEach((c, i) => {
        const mark = c.status === 'assembled' ? '✅ [Assembled]' : c.status === 'procured' ? '🟡 [Procured]' : '⚪ [Need to Buy]';
        text += `${i + 1}. ${c.name} — Qty: ${c.quantity} ${c.notes ? `(${c.notes})` : ''} ${mark}\n`;
      });
    } else {
      text += `\n📦 *REQUIRED COMPONENTS:* None added yet\n`;
    }

    text += `\nGenerated via EasiCart (powered by Easitronics)\n`;

    navigator.clipboard.writeText(text);
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Print Workbench Sheet
  const handlePrintWorkbenchSheet = (project: ClientProjectBrief) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Workbench BOM - ${project.projectTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111; line-height: 1.4; }
          .header { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 22px; font-weight: bold; margin: 0 0 6px 0; }
          .brand { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 16px; }
          .special-notes { background: #fff8e6; border: 2px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
          .special-title { font-weight: bold; color: #b45309; font-size: 14px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
          th { background: #f3f4f6; font-weight: bold; }
          .checkbox { width: 18px; height: 18px; border: 1.5px solid #555; display: inline-block; vertical-align: middle; }
          .footer { margin-top: 30px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">EasiCart • Developer Hardware Workbench Sheet</div>
          <h1 class="title">${project.projectTitle}</h1>
          <div>Client: <strong>${project.clientName}</strong> ${project.clientPhone ? `| Phone: ${project.clientPhone}` : ''} | Budget: <strong>${project.budget || 'N/A'}</strong></div>
        </div>

        ${project.clientSpecialNotes ? `
          <div class="special-notes">
            <div class="special-title">📝 PROJECT NOTE & INSTRUCTIONS:</div>
            <div>${project.clientSpecialNotes}</div>
          </div>
        ` : ''}

        <h3>Required Components & Assembly Checklist</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">Check</th>
              <th>Component Name</th>
              <th style="width: 120px;">Category</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th>Wiring / Part Notes</th>
              <th style="width: 90px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${(project.components || []).map(c => `
              <tr>
                <td style="text-align: center;"><span class="checkbox"></span></td>
                <td><strong>${c.name}</strong></td>
                <td>${c.category || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${c.quantity}</td>
                <td>${c.notes || '-'}</td>
                <td style="text-align: center;">${c.status.toUpperCase()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          EasiCart (powered by Easitronics) • Printed on ${new Date().toLocaleDateString()}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.projectTitle.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        (p.clientSpecialNotes && p.clientSpecialNotes.toLowerCase().includes(q)) ||
        (p.clientPhone && p.clientPhone.includes(q)) ||
        (p.collegeOrOrg && p.collegeOrOrg.toLowerCase().includes(q)) ||
        (p.components && p.components.some(c => c.name.toLowerCase().includes(q)));

      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Master Consolidated Components List with project notes!
  const consolidatedBOM = useMemo(() => {
    const map = new Map<string, {
      name: string;
      category: string;
      totalQuantity: number;
      pendingQuantity: number;
      procuredQuantity: number;
      assembledQuantity: number;
      usedInProjects: {
        projectId: string;
        projectTitle: string;
        clientName: string;
        clientPhone?: string;
        budget?: string;
        deadline?: string;
        projectNote?: string;
        componentQty: number;
        componentNote?: string;
        status: string;
      }[];
    }>();

    projects.forEach(p => {
      (p.components || []).forEach(c => {
        const key = c.name.toLowerCase().trim();
        if (!key) return;

        const isProcured = c.status === 'procured';
        const isAssembled = c.status === 'assembled';
        const isPending = c.status === 'pending';

        const existing = map.get(key);
        const projectItem = {
          projectId: p.id,
          projectTitle: p.projectTitle,
          clientName: p.clientName,
          clientPhone: p.clientPhone,
          budget: p.budget,
          deadline: p.deadline,
          projectNote: p.clientSpecialNotes || p.clientRequirements,
          componentQty: c.quantity,
          componentNote: c.notes,
          status: c.status
        };

        if (existing) {
          existing.totalQuantity += c.quantity;
          if (isPending) existing.pendingQuantity += c.quantity;
          if (isProcured) existing.procuredQuantity += c.quantity;
          if (isAssembled) existing.assembledQuantity += c.quantity;
          existing.usedInProjects.push(projectItem);
        } else {
          map.set(key, {
            name: c.name,
            category: c.category || 'Other',
            totalQuantity: c.quantity,
            pendingQuantity: isPending ? c.quantity : 0,
            procuredQuantity: isProcured ? c.quantity : 0,
            assembledQuantity: isAssembled ? c.quantity : 0,
            usedInProjects: [projectItem]
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [projects]);

  // Saved Projects in Vault list (projects that currently have components saved)
  const savedVaultProjects = useMemo(() => {
    return projects.filter(p => p.components && p.components.length > 0);
  }, [projects]);

  // Copy Master Shopping List with project notes!
  const handleCopyMasterBOM = () => {
    let text = `🛒 *EasiCart Master Components Procurement List*\n`;
    text += `Total Unique Components: ${consolidatedBOM.length}\n`;
    text += `Generated for: ${projects.length} Saved Projects\n\n`;

    consolidatedBOM.forEach((item, idx) => {
      text += `${idx + 1}. *${item.name}* — Total: *${item.totalQuantity} pcs* (Need to Buy: ${item.pendingQuantity})\n`;
      item.usedInProjects.forEach(u => {
        text += `   ↳ Project: ${u.projectTitle} [${u.componentQty}x]\n`;
        if (u.projectNote) {
          text += `     📝 Note: ${u.projectNote}\n`;
        }
      });
    });

    text += `\nGenerated via EasiCart (powered by Easitronics)\n`;

    navigator.clipboard.writeText(text);
    setSyncStatus('Master Shopping List copied to clipboard!');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  // Export Components Vault as JSON Backup
  const handleExportVaultJSON = () => {
    const vault = getLocalVault();
    // Also include all current project components
    projects.forEach(p => {
      if (p.components && p.components.length > 0) {
        const normKey = (p.projectTitle || '').toLowerCase().trim();
        vault[normKey] = {
          projectTitle: p.projectTitle,
          projectId: p.id,
          components: p.components,
          clientSpecialNotes: p.clientSpecialNotes || '',
          budget: p.budget || '',
          deadline: p.deadline || '',
          clientPhone: p.clientPhone || '',
          updatedAt: p.updatedAt || new Date().toISOString(),
        };
      }
    });

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vault, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `easicart_components_vault_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSyncStatus('Components Vault exported to JSON file! You can keep this backup anytime.');
    setTimeout(() => setSyncStatus(null), 4000);
  };

  // Export Consolidated BOM to CSV
  const handleExportBOMCSV = () => {
    const headers = ['#', 'Component Name', 'Category', 'Total Required', 'Need to Buy', 'Procured', 'Assembled', 'Projects Using'];
    const rows = consolidatedBOM.map((item, idx) => [
      idx + 1,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.totalQuantity,
      item.pendingQuantity,
      item.procuredQuantity,
      item.assembledQuantity,
      `"${item.usedInProjects.map(u => `${u.projectTitle} (${u.componentQty}x)`).join('; ').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `easicart_master_bom_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    setSyncStatus('Master BOM exported as CSV spreadsheet!');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  // Restore Vault from uploaded JSON Backup
  const handleRestoreVaultFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedVault = JSON.parse(text);
        if (typeof parsedVault !== 'object' || parsedVault === null) {
          throw new Error('Invalid JSON format');
        }

        // Save to local vault
        const currentVault = getLocalVault();
        const mergedVault = { ...currentVault, ...parsedVault };
        saveLocalVault(mergedVault);

        // Update server vault
        await fetch('/api/client-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore_vault', vault: mergedVault }),
        });

        // Re-load projects
        await loadData(false);

        setSyncStatus(`Successfully restored ${Object.keys(parsedVault).length} saved component lists from backup file!`);
        setTimeout(() => setSyncStatus(null), 5000);
      } catch (err: any) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Add new custom project handler
  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newClientName.trim()) {
      alert('Project Title and Client Name are required.');
      return;
    }

    const cleanedComponents = newComponents
      .map(c => ({ ...c, name: c.name.trim() }))
      .filter(c => c.name.length > 0);

    const now = new Date().toISOString();
    const newProj: ClientProjectBrief = {
      id: `cp-${Date.now()}`,
      projectTitle: newTitle.trim(),
      domain: 'IoT',
      branch: 'ECE',
      clientName: newClientName.trim(),
      clientPhone: newPhone.trim(),
      collegeOrOrg: newCollege.trim(),
      budget: newBudget.trim(),
      deadline: newDeadline.trim(),
      status: 'In Development',
      priority: 'Medium',
      clientRequirements: '',
      clientSpecialNotes: newNotes.trim(),
      components: cleanedComponents,
      createdAt: now,
      updatedAt: now
    };

    const updated = [newProj, ...projects];
    await persistProjects(updated);

    // Save to local vault
    const normKey = newTitle.trim().toLowerCase();
    const vault = getLocalVault();
    vault[normKey] = {
      projectTitle: newTitle.trim(),
      projectId: newProj.id,
      components: cleanedComponents,
      clientSpecialNotes: newNotes.trim(),
      budget: newBudget.trim(),
      deadline: newDeadline.trim(),
      clientPhone: newPhone.trim(),
      updatedAt: now,
    };
    saveLocalVault(vault);

    setIsNewModalOpen(false);

    // Reset form
    setSelectedCatalogId('');
    setNewTitle('');
    setNewClientName('');
    setNewPhone('');
    setNewCollege('');
    setNewBudget('');
    setNewDeadline('');
    setNewNotes('');
    setNewComponents([
      { id: 'nc-1', name: '', quantity: 1, category: 'Microcontroller', notes: '', status: 'pending' },
      { id: 'nc-2', name: '', quantity: 1, category: 'Sensor', notes: '', status: 'pending' },
    ]);
  };

  // Handler for selecting from catalog projects
  const handleSelectCatalogProject = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    if (!catalogId) return;

    const matched = catalogProjects.find(p => p.id === catalogId);
    if (matched) {
      setNewTitle(matched.title);
      setNewBudget(`₹${matched.price.toLocaleString('en-IN')}`);
      setNewNotes(matched.description || '');
    }
  };

  // Overall Statistics
  const totalComponentsNeeded = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.components || []).reduce((cAcc, c) => cAcc + c.quantity, 0), 0);
  }, [projects]);

  const totalComponentsProcured = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.components || []).filter(c => c.status !== 'pending').reduce((cAcc, c) => cAcc + c.quantity, 0), 0);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* GOOGLE FORM SHEET & COMPONENTS CLOUD SYNC BAR */}
      <div className="bg-white border border-[#d5d9d9] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#007185]/10 border border-[#007185]/20 flex items-center justify-center text-[#007185] shrink-0 mt-0.5">
              <Cloud className={`w-5 h-5 ${fetchingCloud || pushingCloud ? 'animate-pulse text-[#007185]' : 'text-[#007185]'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#007185]">
                  Google Sheets Cloud Backend
                </span>
                
                {/* Orders Sheet Live Badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Orders Sheet Live ✅</span>
                </span>

                {/* Cloud Components Sync Badge */}
                {cloudSyncActive ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-teal-600" />
                    <span>Cross-Device Cloud Active ☁️</span>
                  </span>
                ) : (
                  <button
                    onClick={handleOpenCloudSetupModal}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-bold flex items-center gap-1 hover:bg-amber-100 cursor-pointer"
                  >
                    <Settings className="w-3 h-3 text-amber-700" />
                    <span>Setup Cloud Sync</span>
                  </button>
                )}

                {lastSyncTime && (
                  <span className="text-[11px] text-[#565959]">
                    Last synced: <span className="font-mono font-bold text-[#0f1111]">{lastSyncTime}</span>
                  </span>
                )}
              </div>

              <h3 className="text-sm sm:text-base font-extrabold text-[#0f1111] mt-0.5">
                Contact Information vsm 2026/27 &amp; Components Cloud Vault
              </h3>
              <p className="text-xs text-[#565959] mt-0.5 max-w-2xl">
                Hardware components &amp; notes are stored in Google Sheets so you can view, edit, and fetch them from <strong>any phone, laptop, or browser</strong>.
              </p>
            </div>
          </div>

          {/* Cloud Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Fetch from Google Sheet (Pull to this device) */}
            <button
              onClick={handleFetchFromGoogleSheet}
              disabled={fetchingCloud}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Pull latest saved components from Google Sheets into this device"
            >
              <CloudDownload className={`w-3.5 h-3.5 text-teal-700 ${fetchingCloud ? 'animate-bounce' : ''}`} />
              <span>{fetchingCloud ? 'Fetching...' : 'Fetch Components'}</span>
            </button>

            {/* Push to Google Sheet (Upload from this device) */}
            <button
              onClick={handlePushAllToGoogleSheet}
              disabled={pushingCloud}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0f1111] border border-[#d5d9d9] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Upload all local component lists to Google Sheets"
            >
              <CloudUpload className={`w-3.5 h-3.5 text-[#007185] ${pushingCloud ? 'animate-bounce' : ''}`} />
              <span>{pushingCloud ? 'Pushing...' : 'Push to Cloud'}</span>
            </button>

            {/* Open Google Sheet */}
            <a
              href={GOOGLE_FORM_RESPONSES_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0f1111] border border-[#d5d9d9] transition-all"
              title="Open Live Google Sheet in new tab to view components on any device"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#565959]" />
              <span>View Sheet</span>
            </a>

            {/* Google Sheets Cloud Setup Modal Opener */}
            <button
              onClick={handleOpenCloudSetupModal}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#565959] hover:text-[#0f1111] border border-[#d5d9d9] transition-all cursor-pointer"
              title="Configure Google Apps Script Webhook"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Sync Form Orders button */}
            <button
              onClick={() => loadData(true)}
              disabled={syncingGoogleForm}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Refresh project orders from Google Form Responses sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogleForm ? 'animate-spin' : ''}`} />
              <span>{syncingGoogleForm ? 'Syncing...' : 'Sync Orders'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncStatus}</span>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-emerald-700 hover:text-emerald-950 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#d5d9d9] p-3.5 sm:p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#565959] font-medium mb-1">
            <span>Total Orders / Titles</span>
            <Layers className="w-4 h-4 text-[#007185]" />
          </div>
          <div className="text-2xl font-black text-[#0f1111]">{projects.length}</div>
          <div className="text-[11px] text-[#565959] mt-0.5">Synced from Sheet & Catalog</div>
        </div>

        <div className="bg-white border border-[#d5d9d9] p-3.5 sm:p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#565959] font-medium mb-1">
            <span>Components Needed</span>
            <Cpu className="w-4 h-4 text-[#b12704]" />
          </div>
          <div className="text-2xl font-black text-[#0f1111]">{totalComponentsNeeded}</div>
          <div className="text-[11px] text-[#565959] mt-0.5">Units across all projects</div>
        </div>

        <div className="bg-white border border-[#d5d9d9] p-3.5 sm:p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#565959] font-medium mb-1">
            <span>Unique Parts</span>
            <ShoppingBag className="w-4 h-4 text-[#007185]" />
          </div>
          <div className="text-2xl font-black text-[#0f1111]">{consolidatedBOM.length}</div>
          <div className="text-[11px] text-[#565959] mt-0.5">In Master Components List</div>
        </div>

        <div className="bg-white border border-[#d5d9d9] p-3.5 sm:p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#565959] font-medium mb-1">
            <span>Saved in Vault</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{savedVaultProjects.length}</div>
          <div className="text-[11px] text-[#565959] mt-0.5">Titles with saved components</div>
        </div>
      </div>

      {/* VIEW SELECTOR & ACTION TOOLBAR */}
      <div className="bg-white border border-[#d5d9d9] rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* View Switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveView('projects')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'projects'
                ? 'bg-white text-[#0f1111] shadow-sm border border-[#d5d9d9]'
                : 'text-[#565959] hover:text-[#0f1111]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#007185]" />
            <span>📋 Project Note Forms ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveView('master-bom')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'master-bom'
                ? 'bg-[#ffd814] text-[#0f1111] shadow-sm border border-[#fcd200]'
                : 'text-[#565959] hover:text-[#0f1111]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#b12704]" />
            <span>🛒 Check Components List ({consolidatedBOM.length} parts)</span>
          </button>

          <button
            onClick={() => setActiveView('vault')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'vault'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#565959] hover:text-[#0f1111]'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>💾 Saved Components Vault ({savedVaultProjects.length})</span>
          </button>
        </div>

        {/* Global Vault Backup / Export Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden File Input for Restoring Vault Backup */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleRestoreVaultFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportVaultJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 text-[#0f1111] border border-[#d5d9d9] transition-all"
            title="Download full JSON backup of all saved components"
          >
            <Download className="w-3.5 h-3.5 text-[#007185]" />
            <span>Backup (.json)</span>
          </button>

          <button
            type="button"
            onClick={handleExportBOMCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 text-[#0f1111] border border-[#d5d9d9] transition-all"
            title="Download complete Master BOM as CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export BOM (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 text-[#0f1111] border border-[#d5d9d9] transition-all"
            title="Restore components from JSON backup file"
          >
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <span>Restore Backup</span>
          </button>

          {/* Add Custom Project Button */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#ffa41c] hover:bg-[#ff8f00] text-[#0f1111] border border-[#ff8f00] shadow-sm transition-all active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Project Title</span>
          </button>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#d5d9d9]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#565959] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search titles, components, client, phone, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-[#007185] focus:bg-white placeholder:text-[#565959]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#565959] font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#007185]"
          >
            <option value="All">All Projects ({projects.length})</option>
            <option value="In Development">In Development</option>
            <option value="Planning">Planning</option>
            <option value="Procuring">Procuring</option>
            <option value="Testing">Testing</option>
            <option value="Ready">Ready</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: PROJECTS & NOTE FORMS */}
      {activeView === 'projects' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-[#d5d9d9] rounded-2xl p-12 text-center text-[#565959]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#007185]" />
              <p className="text-xs font-semibold">Loading project orders from Google Sheet & storage...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white border border-[#d5d9d9] rounded-2xl p-10 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-[#0f1111]">No matching projects found</h4>
              <p className="text-xs text-[#565959] max-w-md mx-auto">
                Sync with your Google Form Responses sheet or click &quot;Add Project Title&quot; above to create one.
              </p>
              <button
                onClick={() => loadData(true)}
                className="px-4 py-2 rounded-xl bg-[#ffd814] text-[#0f1111] text-xs font-bold border border-[#fcd200] shadow-sm hover:bg-[#f7ca00]"
              >
                Sync from Form Sheet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project, pIndex) => {
                const isEditing = editingCardId === project.id;
                const isExpanded = isProjectExpanded(project.id);
                const totalComps = (project.components || []).length;
                const totalUnits = (project.components || []).reduce((acc, c) => acc + c.quantity, 0);
                const procuredUnits = (project.components || []).filter(c => c.status !== 'pending').reduce((acc, c) => acc + c.quantity, 0);

                return (
                  <div
                    key={project.id}
                    id={`project-card-${project.id}`}
                    className="bg-white border border-[#d5d9d9] hover:border-[#a6c8e0] rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    {/* CARD HEADER */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-white via-[#fcfdfd] to-[#f9fafa] border-b border-[#e7e7e7]">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Project Title */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              #{pIndex + 1}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-[#0f1111] leading-snug">
                              {project.projectTitle}
                            </h3>
                            {project.id.startsWith('gform-') && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                Google Form Order
                              </span>
                            )}
                            {totalComps > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1">
                                <Database className="w-3 h-3 text-blue-600" />
                                <span>{totalComps} Components Saved</span>
                              </span>
                            )}
                          </div>

                          {/* Client Details Row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#565959]">
                            <span className="flex items-center gap-1 font-semibold text-[#0f1111]">
                              <User className="w-3.5 h-3.5 text-[#007185]" />
                              {project.clientName}
                            </span>

                            {project.clientPhone && (
                              <a
                                href={`https://wa.me/91${project.clientPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                title="Chat on WhatsApp"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{project.clientPhone}</span>
                                <MessageCircle className="w-3 h-3 ml-0.5" />
                              </a>
                            )}

                            {project.collegeOrOrg && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate max-w-xs">{project.collegeOrOrg}</span>
                              </span>
                            )}

                            {project.budget && (
                              <span className="font-bold text-[#b12704] bg-[#fef8e7] px-2 py-0.5 rounded border border-[#fbd8b5]">
                                Budget: {project.budget}
                              </span>
                            )}

                            {project.deadline && (
                              <span className="flex items-center gap-1 text-[#565959] bg-slate-100 px-2 py-0.5 rounded">
                                <Calendar className="w-3 h-3" />
                                Deadline: {project.deadline}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top Card Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 self-start">
                          <button
                            onClick={() => handleCopyProjectSummary(project)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0f1111] border border-[#d5d9d9] text-xs transition-all"
                            title="Copy Project Brief (WhatsApp)"
                          >
                            {copiedId === project.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#565959]" />}
                          </button>

                          <button
                            onClick={() => handlePrintWorkbenchSheet(project)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0f1111] border border-[#d5d9d9] text-xs transition-all"
                            title="Print Hardware Workbench Sheet"
                          >
                            <Printer className="w-4 h-4 text-[#565959]" />
                          </button>

                          {!isEditing ? (
                            <button
                              onClick={() => startEditProject(project)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold text-xs border border-[#fcd200] shadow-sm transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Type Note & Components</span>
                            </button>
                          ) : (
                            <button
                              onClick={cancelEditProject}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold text-xs border border-slate-300"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteProject(project.id, project.projectTitle)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => toggleExpand(project.id)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-[#d5d9d9] text-xs transition-all"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Component Summary Pill */}
                      <div className="mt-3 pt-2.5 border-t border-[#f0f2f2] flex items-center justify-between text-xs text-[#565959]">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-[#007185]" />
                          <span>
                            <strong>{totalComps}</strong> components required ({totalUnits} total units)
                          </span>
                        </div>
                        {totalUnits > 0 && (
                          <span className="font-semibold text-emerald-700">
                            {procuredUnits} of {totalUnits} units ready
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CARD BODY */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 space-y-4 bg-white">
                        {/* INLINE EDIT MODE */}
                        {isEditing ? (
                          <div className="p-4 rounded-xl bg-[#fffcf5] border-2 border-[#f08804] space-y-4 animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-[#fbd8b5] pb-2">
                              <span className="font-extrabold text-[#0f1111] text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Pencil className="w-4 h-4 text-[#f08804]" />
                                Quick Note Form & Components Editor
                              </span>
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Saved components persist across refresh</span>
                              </span>
                            </div>

                            {saveSuccessMsg && (
                              <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{saveSuccessMsg}</span>
                              </div>
                            )}

                            {/* 1. Project Note Form Area */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-black text-[#0f1111]">
                                📝 Project Note & Client Instructions:
                              </label>
                              <p className="text-[11px] text-[#565959]">
                                Type special requirements, advance payment info, delivery notes, pinout preferences, or parts context here.
                              </p>
                              <textarea
                                rows={3}
                                placeholder="Type project notes here... (e.g. Advance paid ₹2000. Client specifically requested ESP32 with 0.96 OLED and buzzer. Deliver by Friday.)"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="w-full bg-white border border-[#d5d9d9] text-[#0f1111] rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-[#f08804] leading-relaxed shadow-inner"
                              />
                            </div>

                            {/* Optional meta edits: Budget, Deadline, Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div>
                                <label className="block text-[11px] font-bold text-[#565959] mb-1">Budget / Cost</label>
                                <input
                                  type="text"
                                  placeholder="e.g. ₹10,000"
                                  value={editBudget}
                                  onChange={(e) => setEditBudget(e.target.value)}
                                  className="w-full bg-white border border-[#d5d9d9] text-[#0f1111] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f08804]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-[#565959] mb-1">Target Deadline</label>
                                <input
                                  type="text"
                                  placeholder="e.g. October 20"
                                  value={editDeadline}
                                  onChange={(e) => setEditDeadline(e.target.value)}
                                  className="w-full bg-white border border-[#d5d9d9] text-[#0f1111] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f08804]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-[#565959] mb-1">Client Phone</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 9876543210"
                                  value={editClientPhone}
                                  onChange={(e) => setEditClientPhone(e.target.value)}
                                  className="w-full bg-white border border-[#d5d9d9] text-[#0f1111] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f08804]"
                                />
                              </div>
                            </div>

                            {/* 2. Components List Section */}
                            <div className="space-y-3 pt-2 border-t border-[#fbd8b5]">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <h4 className="text-xs font-black text-[#0f1111] uppercase tracking-wider flex items-center gap-1.5">
                                    <Cpu className="w-4 h-4 text-[#007185]" />
                                    <span>Components List for this Project</span>
                                  </h4>
                                  <p className="text-[11px] text-[#565959]">
                                    Type component names and quantities below, or use the quick chips.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => addEditComponentRow()}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#0f1111] text-xs font-bold border border-[#d5d9d9] shadow-sm self-start sm:self-auto cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Add Row</span>
                                </button>
                              </div>

                              {/* Quick One-Line Add or Paste */}
                              <div className="p-2.5 rounded-xl bg-white border border-[#d5d9d9] space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Fast type or paste e.g. Arduino Uno x 1 or ESP32 - 2, 5V Relay 1"
                                    value={editQuickLine}
                                    onChange={(e) => setEditQuickLine(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleQuickAddLines(editQuickLine);
                                      }
                                    }}
                                    className="flex-1 bg-[#f7fafa] border border-[#d5d9d9] rounded-lg px-3 py-1.5 text-xs text-[#0f1111] focus:outline-none focus:border-[#f08804] focus:bg-white font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAddLines(editQuickLine)}
                                    className="px-3 py-1.5 rounded-lg bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold text-xs border border-[#fcd200] shrink-0 cursor-pointer"
                                  >
                                    Add to List
                                  </button>
                                </div>

                                {/* Common hardware chips */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  <span className="text-[10px] text-[#565959] self-center mr-1">Quick Add:</span>
                                  {COMMON_COMPONENT_CHIPS.slice(0, 10).map((chip) => (
                                    <button
                                      key={chip}
                                      type="button"
                                      onClick={() => addEditComponentRow(chip, 1)}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#eaeded] hover:bg-[#d5d9d9] text-[#0f1111] font-medium transition-colors cursor-pointer"
                                    >
                                      + {chip}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Interactive Components Table */}
                              <div className="space-y-2">
                                {editComponents.map((comp, idx) => (
                                  <div
                                    key={comp.id}
                                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-white border border-[#d5d9d9] shadow-2xs"
                                  >
                                    <span className="text-[#565959] font-mono text-[11px] w-5 text-center hidden sm:inline">
                                      {idx + 1}.
                                    </span>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                      <input
                                        type="text"
                                        placeholder="Component Name (e.g. Arduino UNO, ESP32, 5V Relay)"
                                        value={comp.name}
                                        onChange={(e) => updateEditComponent(comp.id, 'name', e.target.value)}
                                        className="w-full bg-[#f7fafa] border border-[#d5d9d9] rounded-lg px-2.5 py-1.5 text-xs text-[#0f1111] font-semibold focus:outline-none focus:border-[#f08804] focus:bg-white"
                                      />
                                    </div>

                                    {/* Qty */}
                                    <div className="flex items-center gap-1 w-24 shrink-0">
                                      <span className="text-[10px] text-[#565959] sm:hidden">Qty:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={comp.quantity}
                                        onChange={(e) => updateEditComponent(comp.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-[#f7fafa] border border-[#d5d9d9] rounded-lg px-2 py-1.5 text-xs text-center font-bold text-[#0f1111] focus:outline-none focus:border-[#f08804] focus:bg-white"
                                      />
                                    </div>

                                    {/* Category */}
                                    <div className="w-28 shrink-0">
                                      <select
                                        value={comp.category}
                                        onChange={(e) => updateEditComponent(comp.id, 'category', e.target.value)}
                                        className="w-full bg-[#f7fafa] border border-[#d5d9d9] rounded-lg px-2 py-1.5 text-xs text-[#0f1111] focus:outline-none focus:border-[#f08804]"
                                      >
                                        {CATEGORIES.map(cat => (
                                          <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Spec / Notes */}
                                    <div className="flex-1 min-w-0">
                                      <input
                                        type="text"
                                        placeholder="Component note (e.g. I2C 0x3F, 5V)"
                                        value={comp.notes || ''}
                                        onChange={(e) => updateEditComponent(comp.id, 'notes', e.target.value)}
                                        className="w-full bg-[#f7fafa] border border-[#d5d9d9] rounded-lg px-2.5 py-1.5 text-xs text-[#565959] focus:outline-none focus:border-[#f08804] focus:bg-white"
                                      />
                                    </div>

                                    {/* Status */}
                                    <div className="w-28 shrink-0">
                                      <select
                                        value={comp.status}
                                        onChange={(e) => updateEditComponent(comp.id, 'status', e.target.value)}
                                        className={`w-full text-xs rounded-lg px-2 py-1.5 font-bold focus:outline-none ${
                                          comp.status === 'assembled' 
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                                            : comp.status === 'procured' 
                                            ? 'bg-amber-50 text-amber-800 border border-amber-300' 
                                            : 'bg-slate-50 text-slate-700 border border-slate-300'
                                        }`}
                                      >
                                        <option value="pending">Need to Buy</option>
                                        <option value="procured">Procured</option>
                                        <option value="assembled">Assembled</option>
                                      </select>
                                    </div>

                                    {/* Delete Row */}
                                    <button
                                      type="button"
                                      onClick={() => removeEditComponentRow(comp.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#fbd8b5]">
                              <button
                                type="button"
                                onClick={cancelEditProject}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565959] hover:text-[#0f1111]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveInlineEditor(project.id)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-black text-xs sm:text-sm border border-[#fcd200] shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                                <span>Save Project & Components</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* READ VIEW */
                          <div className="space-y-4">
                            {/* Project Note Display */}
                            {project.clientSpecialNotes ? (
                              <div className="p-3.5 sm:p-4 rounded-xl bg-[#fffbf2] border-2 border-[#f08804] shadow-xs">
                                <div className="flex items-start gap-2.5">
                                  <div className="p-1 rounded-lg bg-[#f08804]/20 text-[#b12704] shrink-0 mt-0.5">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-black text-[#b12704] uppercase tracking-wider">
                                        📝 PROJECT NOTE & CLIENT INSTRUCTIONS:
                                      </h4>
                                      <button
                                        onClick={() => startEditProject(project)}
                                        className="text-[11px] font-bold text-[#007185] hover:text-[#c7511f] flex items-center gap-1 cursor-pointer"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        <span>Edit Note</span>
                                      </button>
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#0f1111] font-medium leading-relaxed whitespace-pre-wrap">
                                      {project.clientSpecialNotes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-[#565959] flex items-center justify-between">
                                <span>No project note typed yet.</span>
                                <button
                                  onClick={() => startEditProject(project)}
                                  className="text-xs font-bold text-[#007185] hover:text-[#c7511f] cursor-pointer"
                                >
                                  + Type Project Note & Components
                                </button>
                              </div>
                            )}

                            {/* Components List Display */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <h4 className="font-extrabold text-[#0f1111] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-[#007185]" />
                                  Required Components List ({totalComps} Items)
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[#565959] text-[11px] hidden sm:inline">
                                    💡 Click status to toggle: Need to Buy ➔ Procured ➔ Assembled
                                  </span>
                                  <button
                                    onClick={() => startEditProject(project)}
                                    className="text-xs font-bold text-[#007185] hover:text-[#c7511f] cursor-pointer"
                                  >
                                    + Edit List
                                  </button>
                                </div>
                              </div>

                              {totalComps === 0 ? (
                                <div className="p-4 rounded-xl bg-[#f7fafa] border border-[#d5d9d9] text-center text-xs text-[#565959]">
                                  No components listed yet. Click <strong>&quot;Type Note & Components&quot;</strong> above to add components.
                                </div>
                              ) : (
                                <div className="border border-[#d5d9d9] rounded-xl overflow-hidden shadow-2xs">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead className="bg-[#f3f4f6] text-[#565959] border-b border-[#d5d9d9] font-bold uppercase text-[10px]">
                                        <tr>
                                          <th className="py-2.5 px-3 w-10 text-center">Status</th>
                                          <th className="py-2.5 px-3">Component Name</th>
                                          <th className="py-2.5 px-3 w-28 hidden sm:table-cell">Category</th>
                                          <th className="py-2.5 px-3 w-20 text-center">Quantity</th>
                                          <th className="py-2.5 px-3">Wiring / Part Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#e7e7e7] bg-white">
                                        {project.components.map((comp) => {
                                          const isAssembled = comp.status === 'assembled';
                                          const isProcured = comp.status === 'procured';

                                          return (
                                            <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                                              <td className="py-2 px-3 text-center">
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleComponentStatus(project.id, comp.id)}
                                                  className="cursor-pointer transition-transform active:scale-90"
                                                  title={`Status: ${comp.status}. Click to change.`}
                                                >
                                                  {isAssembled ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                  ) : isProcured ? (
                                                    <div className="w-4 h-4 rounded bg-amber-100 border border-amber-500 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                                                      ✓
                                                    </div>
                                                  ) : (
                                                    <div className="w-4 h-4 rounded border border-slate-300 hover:border-[#007185]" />
                                                  )}
                                                </button>
                                              </td>

                                              <td className="py-2 px-3 font-bold text-[#0f1111]">
                                                <div className="flex items-center gap-1.5">
                                                  <span>{comp.name}</span>
                                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                                                    isAssembled 
                                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                      : isProcured 
                                                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                                      : 'bg-slate-100 text-slate-600'
                                                  }`}>
                                                    {comp.status === 'pending' ? 'Need to Buy' : comp.status}
                                                  </span>
                                                </div>
                                              </td>

                                              <td className="py-2 px-3 text-[#565959] hidden sm:table-cell">
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                  {comp.category || 'Part'}
                                                </span>
                                              </td>

                                              <td className="py-2 px-3 text-center font-black text-[#0f1111] font-mono text-sm">
                                                {comp.quantity}
                                              </td>

                                              <td className="py-2 px-3 text-[#565959] text-[11px]">
                                                {comp.notes || <span className="text-slate-400 italic">—</span>}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MASTER COMPONENTS LIST ("Check Components List") */}
      {activeView === 'master-bom' && (
        <div className="bg-white border border-[#d5d9d9] rounded-2xl overflow-hidden p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e7e7] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fef8e7] text-[#b12704] border border-[#fbd8b5] text-xs font-bold mb-1">
                <span>🛒 Consolidated Shopping & Assembly BOM</span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-[#0f1111]">
                Master Components List Across All Saved Projects
              </h3>
              <p className="text-xs text-[#565959] mt-0.5">
                Shows all required components, total quantities needed, individual project notes, and which project needs each item.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyMasterBOM}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-black text-xs border border-[#fcd200] shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Master Shopping List</span>
              </button>

              <button
                onClick={handleExportBOMCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0f1111] font-bold text-xs border border-[#d5d9d9] shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download BOM (.csv)</span>
              </button>
            </div>
          </div>

          {consolidatedBOM.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-[#0f1111]">No components in Master List yet</h4>
              <p className="text-xs text-[#565959]">
                Click on the <strong>&quot;📋 Project Note Forms&quot;</strong> tab and add components to your projects to see them aggregated here.
              </p>
            </div>
          ) : (
            <div className="border border-[#d5d9d9] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f3f4f6] text-[#565959] border-b border-[#d5d9d9] font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Component Name</th>
                      <th className="py-2.5 px-3 w-28">Category</th>
                      <th className="py-2.5 px-3 w-28 text-center">Total Quantity</th>
                      <th className="py-2.5 px-3 w-32 text-center">Need to Buy</th>
                      <th className="py-2.5 px-4">Projects Using Component & Their Project Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7e7e7] bg-white">
                    {consolidatedBOM.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors align-top">
                        <td className="py-3 px-3 text-center text-[#565959] font-mono">{idx + 1}</td>
                        
                        {/* Name */}
                        <td className="py-3 px-3 font-bold text-[#0f1111] text-sm">
                          {item.name}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                        </td>

                        {/* Total Qty */}
                        <td className="py-3 px-3 text-center font-mono font-black text-sm text-[#0f1111]">
                          {item.totalQuantity} pcs
                        </td>

                        {/* Need to Buy */}
                        <td className="py-3 px-3 text-center">
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            item.pendingQuantity > 0 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {item.pendingQuantity > 0 ? `${item.pendingQuantity} needed` : 'All ready'}
                          </span>
                        </td>

                        {/* Used In Projects */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            {item.usedInProjects.map((u, uIdx) => (
                              <div key={uIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                                <div className="flex items-center justify-between font-bold text-[#0f1111]">
                                  <span>{u.projectTitle}</span>
                                  <span className="font-mono text-[#007185]">Qty: {u.componentQty}</span>
                                </div>
                                <div className="text-[11px] text-[#565959] mt-0.5 flex items-center gap-2">
                                  <span>Client: {u.clientName}</span>
                                  {u.clientPhone && <span>• Phone: {u.clientPhone}</span>}
                                  {u.budget && <span>• Budget: {u.budget}</span>}
                                </div>
                                {u.projectNote && (
                                  <div className="mt-1 pt-1 border-t border-slate-200 text-[11px] text-[#b12704] font-medium">
                                    📝 <strong>Project Note:</strong> {u.projectNote}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SAVED COMPONENTS VAULT */}
      {activeView === 'vault' && (
        <div className="bg-white border border-[#d5d9d9] rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e7e7] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Permanent Components Storage Vault</span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-[#0f1111]">
                All Saved Project Component Lists
              </h3>
              <p className="text-xs text-[#565959] mt-0.5">
                Every component list you save is permanently stored here and in browser storage. You can fetch, inspect, export, or edit any saved list anytime.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={handleExportVaultJSON}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold text-xs border border-[#fcd200] shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All (.json)</span>
              </button>

              <button
                onClick={handleExportBOMCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0f1111] font-bold text-xs border border-[#d5d9d9] cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV BOM</span>
              </button>
            </div>
          </div>

          {/* Cloud Synchronization Card */}
          <div className="bg-gradient-to-r from-teal-900/10 via-slate-50 to-amber-500/10 border border-teal-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-[#0f1111]">
                    Google Sheets Cloud Storage (Multi-Device Sync)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-300">
                    Tab: &quot;Components&quot; &amp; &quot;Components_Vault&quot;
                  </span>
                </div>
                <p className="text-xs text-[#565959] mt-0.5 max-w-xl">
                  Components are stored directly in your Google Sheet spreadsheet. You can open and view them on any smartphone or laptop via the Google Sheets app or fetch them live into EasiCart.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={handleFetchFromGoogleSheet}
                disabled={fetchingCloud}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-[#0f1111] border border-[#d5d9d9] shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <CloudDownload className={`w-3.5 h-3.5 text-teal-700 ${fetchingCloud ? 'animate-bounce' : ''}`} />
                <span>{fetchingCloud ? 'Fetching...' : 'Fetch from Sheet'}</span>
              </button>

              <button
                onClick={handlePushAllToGoogleSheet}
                disabled={pushingCloud}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${pushingCloud ? 'animate-bounce' : ''}`} />
                <span>{pushingCloud ? 'Pushing...' : 'Push All to Sheet'}</span>
              </button>

              <a
                href={GOOGLE_FORM_RESPONSES_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0f1111] border border-[#d5d9d9] transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#565959]" />
                <span>Open Sheet</span>
              </a>

              <button
                onClick={handleOpenCloudSetupModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Setup Guide</span>
              </button>
            </div>
          </div>

          {savedVaultProjects.length === 0 ? (
            <div className="p-10 text-center space-y-3 bg-[#f7fafa] rounded-2xl border border-dashed border-slate-300">
              <Database className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-[#0f1111]">No saved components in vault yet</h4>
              <p className="text-xs text-[#565959] max-w-md mx-auto">
                Open any project card in the &quot;Project Note Forms&quot; tab, click &quot;Type Note &amp; Components&quot;, add your hardware parts, and click Save. They will appear here immediately!
              </p>
              <button
                onClick={() => setActiveView('projects')}
                className="px-4 py-2 rounded-xl bg-[#ffd814] text-[#0f1111] text-xs font-bold border border-[#fcd200] shadow-sm hover:bg-[#f7ca00] cursor-pointer"
              >
                Go to Project Note Forms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedVaultProjects.map((p) => {
                const totalUnits = (p.components || []).reduce((acc, c) => acc + c.quantity, 0);

                return (
                  <div
                    key={p.id}
                    className="border border-[#d5d9d9] hover:border-[#a6c8e0] rounded-xl p-4 bg-white shadow-2xs space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          Saved Vault Item
                        </span>
                        <h4 className="font-extrabold text-[#0f1111] text-sm mt-1 leading-snug">
                          {p.projectTitle}
                        </h4>
                        <div className="text-[11px] text-[#565959] mt-0.5 flex items-center gap-2">
                          <span>Client: <strong>{p.clientName}</strong></span>
                          {p.clientPhone && <span>• {p.clientPhone}</span>}
                          {p.budget && <span>• <strong>{p.budget}</strong></span>}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveView('projects');
                          startEditProject(p);
                          setTimeout(() => {
                            const el = document.getElementById(`project-card-${p.id}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold text-xs border border-[#fcd200] shrink-0 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit List</span>
                      </button>
                    </div>

                    {/* Special Notes Preview */}
                    {p.clientSpecialNotes && (
                      <div className="p-2.5 rounded-lg bg-[#fffcf5] border border-[#fbd8b5] text-xs text-[#0f1111] leading-relaxed">
                        <div className="text-[10px] font-bold text-[#b12704] uppercase">Project Note:</div>
                        <div className="line-clamp-2">{p.clientSpecialNotes}</div>
                      </div>
                    )}

                    {/* Components Chips */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-[#565959]">
                        <span className="font-bold text-[#0f1111]">
                          {p.components.length} Components ({totalUnits} total units)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Updated: {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {p.components.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[#0f1111]"
                          >
                            <span className="font-semibold">{c.name}</span>
                            <span className="font-mono font-bold text-[#007185] bg-white px-1 rounded border border-slate-200">
                              x{c.quantity}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => handleCopyProjectSummary(p)}
                        className="text-[#007185] hover:text-[#c7511f] font-bold flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Brief</span>
                      </button>

                      <button
                        onClick={() => handlePrintWorkbenchSheet(p)}
                        className="text-[#565959] hover:text-[#0f1111] font-semibold flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Sheet</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL WITH CATALOG PROJECT SELECTOR */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#d5d9d9] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#e7e7e7] pb-3">
              <div>
                <span className="text-xs font-bold text-[#b12704] uppercase tracking-wider">
                  New Project Brief
                </span>
                <h3 className="text-lg font-black text-[#0f1111]">
                  Add Project Title & Components
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProject} className="space-y-4 text-xs">
              {/* Optional Quick Catalog Auto-select */}
              {catalogProjects.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="block text-[#0f1111] font-bold">
                    💡 Optional: Pick from Catalog Titles ({catalogProjects.length} Projects)
                  </label>
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => handleSelectCatalogProject(e.target.value)}
                    className="w-full bg-white border border-[#d5d9d9] text-[#0f1111] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f08804]"
                  >
                    <option value="">-- Choose an existing Catalog Project or type custom title below --</option>
                    {catalogProjects.map(cp => (
                      <option key={cp.id} value={cp.id}>
                        {cp.title} (₹{cp.price.toLocaleString('en-IN')}) - {cp.domain}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[#0f1111] font-bold">
                  Project Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IoT Based Smart Water Quality Monitoring"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#f08804] focus:bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#0f1111] font-bold">
                    Client Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#f08804] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#0f1111] font-bold">Client Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#f08804] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#0f1111] font-bold">College / Place</label>
                  <input
                    type="text"
                    placeholder="e.g. VSM College, Ramachandrapuram"
                    value={newCollege}
                    onChange={(e) => setNewCollege(e.target.value)}
                    className="w-full bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#f08804] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#0f1111] font-bold">Budget / Quote</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹12,000"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#f08804] focus:bg-white"
                  />
                </div>
              </div>

              {/* Project Note */}
              <div className="space-y-1">
                <label className="block text-[#0f1111] font-bold">
                  📝 Project Note / Special Requests:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Advance paid ₹2000. Needs presentation PPT and circuit diagram. Deliver by October 25."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#f08804] focus:bg-white leading-relaxed"
                />
              </div>

              {/* Components */}
              <div className="space-y-2 pt-2 border-t border-[#e7e7e7]">
                <div className="flex items-center justify-between">
                  <label className="block text-[#0f1111] font-bold">Required Components</label>
                  <button
                    type="button"
                    onClick={() => setNewComponents(prev => [...prev, { id: `nc-${Date.now()}`, name: '', quantity: 1, category: 'Sensor', notes: '', status: 'pending' }])}
                    className="text-xs text-[#007185] hover:text-[#c7511f] font-bold cursor-pointer"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-1.5">
                  {newComponents.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Component name (e.g. ESP32)"
                        value={c.name}
                        onChange={(e) => setNewComponents(prev => prev.map(item => item.id === c.id ? { ...item, name: e.target.value } : item))}
                        className="flex-1 bg-[#f7fafa] border border-[#d5d9d9] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f08804]"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={c.quantity}
                        onChange={(e) => setNewComponents(prev => prev.map(item => item.id === c.id ? { ...item, quantity: Math.max(1, parseInt(e.target.value) || 1) } : item))}
                        className="w-20 bg-[#f7fafa] border border-[#d5d9d9] rounded-lg px-2 py-1.5 text-xs text-center font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setNewComponents(prev => prev.filter(item => item.id !== c.id))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7e7e7]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold text-xs border border-[#fcd200] shadow-sm cursor-pointer"
                >
                  Save Project & Components
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOOGLE SHEETS CLOUD SETUP MODAL */}
      {isCloudSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#d5d9d9] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#e7e7e7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0f1111]">
                    Google Sheets Components Cloud Sync
                  </h3>
                  <p className="text-xs text-[#565959]">
                    Store and view hardware component details on any smartphone, tablet, or PC
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCloudSetupModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4 text-xs">
              <div className="bg-[#f7fafa] border border-[#d5d9d9] rounded-xl p-4 space-y-2.5">
                <h4 className="font-bold text-[#0f1111] text-xs uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ffd814] text-[#0f1111] flex items-center justify-center font-bold text-[11px]">
                    1
                  </span>
                  <span>Open Your Google Spreadsheet</span>
                </h4>
                <p className="text-slate-600 leading-relaxed pl-7">
                  Open your connected Google Sheet in a new tab.
                </p>
                <div className="pl-7">
                  <a
                    href={GOOGLE_FORM_RESPONSES_SHEET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-[#007185] border border-[#d5d9d9] shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Google Sheet ({GOOGLE_FORM_RESPONSES_SHEET_URL.substring(0, 45)}...)</span>
                  </a>
                </div>
              </div>

              <div className="bg-[#f7fafa] border border-[#d5d9d9] rounded-xl p-4 space-y-2.5">
                <h4 className="font-bold text-[#0f1111] text-xs uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ffd814] text-[#0f1111] flex items-center justify-center font-bold text-[11px]">
                    2
                  </span>
                  <span>Open Apps Script &amp; Paste Master Code</span>
                </h4>
                <p className="text-slate-600 leading-relaxed pl-7">
                  In Google Sheets menu, click <strong>Extensions &gt; Apps Script</strong>. Delete any old code in <code>Code.gs</code>, and paste the code below:
                </p>
                <div className="pl-7 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyMasterAppsScript}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] shadow-2xs cursor-pointer active:scale-95"
                  >
                    {copiedAppsScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copied to Clipboard! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Master Google Apps Script</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500">
                    (Auto-creates &quot;Components&quot; tab &amp; syncs cross-device)
                  </span>
                </div>
              </div>

              <div className="bg-[#f7fafa] border border-[#d5d9d9] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#0f1111] text-xs uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ffd814] text-[#0f1111] flex items-center justify-center font-bold text-[11px]">
                    3
                  </span>
                  <span>Deploy as Web App (Access: Anyone)</span>
                </h4>
                <p className="text-slate-600 leading-relaxed pl-7">
                  Click the blue <strong>Deploy &gt; New deployment</strong> button &gt; Select type: <strong>Web app</strong>.<br />
                  Set <em>&quot;Execute as&quot;</em>: <strong>Me</strong> and <em>&quot;Who has access&quot;</em>: <strong>Anyone</strong> (crucial for mobile &amp; cross-device access).<br />
                  Click Deploy, grant permissions, and copy the Web app URL.
                </p>
              </div>

              <div className="bg-[#f7fafa] border border-[#d5d9d9] rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-[#0f1111] text-xs uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ffd814] text-[#0f1111] flex items-center justify-center font-bold text-[11px]">
                    4
                  </span>
                  <span>Paste Web App URL &amp; Connect</span>
                </h4>
                <div className="pl-7 space-y-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={cloudWebhookInput}
                    onChange={(e) => setCloudWebhookInput(e.target.value)}
                    className="w-full bg-white border border-[#d5d9d9] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#f08804] font-mono text-[#0f1111]"
                  />
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <span className="text-[11px] text-slate-500">
                      Currently using: <code className="text-[#007185]">{cloudWebhookInput ? cloudWebhookInput.substring(0, 40) + '...' : 'None configured'}</code>
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveCloudWebhook}
                      disabled={savingWebhook}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${savingWebhook ? 'animate-spin' : ''}`} />
                      <span>{savingWebhook ? 'Connecting...' : 'Save & Connect Cloud'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#e7e7e7]">
              <button
                type="button"
                onClick={() => setIsCloudSetupModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0f1111] font-bold text-xs border border-[#d5d9d9] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
