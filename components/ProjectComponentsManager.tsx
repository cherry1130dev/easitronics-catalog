'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Plus
} from 'lucide-react';
import { ClientProjectBrief, ProjectComponent, ClientProjectStatus, ClientProjectPriority, Project } from '@/lib/types';
import { GOOGLE_FORM_RESPONSES_SHEET_URL } from '@/lib/constants';

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

export default function ProjectComponentsManager({ catalogProjects = [] }: ProjectComponentsManagerProps) {
  // State
  const [projects, setProjects] = useState<ClientProjectBrief[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingGoogleForm, setSyncingGoogleForm] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'projects' | 'master-bom'>('projects');
  
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
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // 1. Initial Load: Fetch from API
  const loadData = async (forceGoogleFormSync = false) => {
    try {
      if (forceGoogleFormSync) {
        setSyncingGoogleForm(true);
      } else {
        setLoading(true);
      }
      
      const endpoint = forceGoogleFormSync 
        ? '/api/client-projects?importGoogleForm=true' 
        : '/api/client-projects';

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
          localStorage.setItem('easicart_client_projects', JSON.stringify(data.projects));
          if (forceGoogleFormSync) {
            setSyncStatus(`Successfully synced! Loaded ${data.projects.length} project orders from Google Form sheet.`);
            setTimeout(() => setSyncStatus(null), 4000);
          }
          return;
        }
      }
      
      // Fallback to localStorage
      const local = localStorage.getItem('easicart_client_projects');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
        }
      }
    } catch (err) {
      console.error('Error loading client projects:', err);
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
      localStorage.setItem('easicart_client_projects', JSON.stringify(updated));
      await fetch('/api/client-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all', projects: updated }),
      });
    } catch (e) {
      console.error('Error persisting projects:', e);
    }
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

  // Save inline editor
  const handleSaveInlineEditor = async (projectId: string) => {
    const validComponents = editComponents
      .map(c => ({ ...c, name: c.name.trim() }))
      .filter(c => c.name.length > 0);

    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          clientSpecialNotes: editNotes.trim(),
          clientRequirements: editRequirements.trim(),
          budget: editBudget.trim() || p.budget,
          deadline: editDeadline.trim() || p.deadline,
          clientPhone: editClientPhone.trim() || p.clientPhone,
          components: validComponents,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    await persistProjects(updated);
    setSaveSuccessMsg('Saved successfully! Components & Project Notes updated in Master List.');
    setTimeout(() => {
      setEditingCardId(null);
      setSaveSuccessMsg(null);
    }, 1200);
  };

  // Quick toggle component status (Need to Buy -> Procured -> Assembled)
  const handleToggleComponentStatus = async (projectId: string, componentId: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
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
      text += `\n`;
    });

    text += `Generated via EasiCart (powered by Easitronics)\n`;

    navigator.clipboard.writeText(text);
    setSyncStatus('Master Shopping List copied to clipboard!');
    setTimeout(() => setSyncStatus(null), 3000);
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
    setIsNewModalOpen(false);

    // Reset form
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

  // Overall Statistics
  const totalComponentsNeeded = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.components || []).reduce((cAcc, c) => cAcc + c.quantity, 0), 0);
  }, [projects]);

  const totalComponentsProcured = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.components || []).filter(c => c.status !== 'pending').reduce((cAcc, c) => cAcc + c.quantity, 0), 0);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* GOOGLE FORM SHEET SYNC BAR */}
      <div className="bg-white border border-[#d5d9d9] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#007185]/10 border border-[#007185]/20 flex items-center justify-center text-[#007185] shrink-0 mt-0.5">
            <RefreshCw className={`w-5 h-5 ${syncingGoogleForm ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#007185]">
                Connected Google Form Sheet
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Auto-Link Active
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0f1111]">
              Title List Form: Budget, Contact Number & Submissions
            </h3>
            <p className="text-xs text-[#565959] mt-0.5 max-w-2xl">
              Import incoming project titles directly from your Google Form responses spreadsheet. Type notes & component lists for each, then check your consolidated Master BOM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={GOOGLE_FORM_RESPONSES_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0f1111] border border-[#d5d9d9] transition-all"
            title="Open Live Google Sheet in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#565959]" />
            <span>Open Sheet</span>
          </a>

          <button
            onClick={() => loadData(true)}
            disabled={syncingGoogleForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogleForm ? 'animate-spin' : ''}`} />
            <span>{syncingGoogleForm ? 'Syncing...' : 'Sync Orders from Form Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatus}</span>
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
          <div className="text-[11px] text-[#565959] mt-0.5">Imported & Saved Projects</div>
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
            <span>Procured / Ready</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{totalComponentsProcured}</div>
          <div className="text-[11px] text-[#565959] mt-0.5">
            {totalComponentsNeeded > 0 ? `${Math.round((totalComponentsProcured / totalComponentsNeeded) * 100)}% ready` : '0% ready'}
          </div>
        </div>
      </div>

      {/* VIEW TABS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#d5d9d9] p-3 rounded-2xl shadow-sm">
        {/* Toggle between Projects & Master Components List */}
        <div className="flex items-center gap-2 bg-[#eaeded] p-1 rounded-xl">
          <button
            onClick={() => setActiveView('projects')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeView === 'master-bom'
                ? 'bg-[#ffd814] text-[#0f1111] shadow-sm border border-[#fcd200]'
                : 'text-[#565959] hover:text-[#0f1111]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#b12704]" />
            <span>🛒 Check Components List ({consolidatedBOM.length} parts)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#565959] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, client, phone, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f7fafa] border border-[#d5d9d9] text-[#0f1111] text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#007185] focus:bg-white placeholder:text-[#565959]"
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

        {/* Add Custom Project Button */}
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ffa41c] hover:bg-[#ff8f00] text-[#0f1111] border border-[#ff8f00] shadow-sm transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Custom Project</span>
        </button>
      </div>

      {/* VIEW 1: PROJECTS & NOTE FORMS */}
      {activeView === 'projects' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-[#d5d9d9] rounded-2xl p-12 text-center text-[#565959]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#007185]" />
              <p className="text-xs font-semibold">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white border border-[#d5d9d9] rounded-2xl p-10 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-[#0f1111]">No matching projects found</h4>
              <p className="text-xs text-[#565959] max-w-md mx-auto">
                Sync with your Google Form Responses sheet or click "Add Custom Project" above to create one.
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
                              <span className="text-[11px] text-[#565959]">Type notes and components, then click Save</span>
                            </div>

                            {saveSuccessMsg && (
                              <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#0f1111] text-xs font-bold border border-[#d5d9d9] shadow-sm self-start sm:self-auto"
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
                                    className="px-3 py-1.5 rounded-lg bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold text-xs border border-[#fcd200] shrink-0"
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
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#eaeded] hover:bg-[#d5d9d9] text-[#0f1111] font-medium transition-colors"
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
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-black text-xs sm:text-sm border border-[#fcd200] shadow-md transition-all active:scale-95 cursor-pointer"
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
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-black text-[#b12704] uppercase tracking-wider">
                                        📝 PROJECT NOTE & CLIENT INSTRUCTIONS:
                                      </h4>
                                      <button
                                        onClick={() => startEditProject(project)}
                                        className="text-[11px] font-bold text-[#007185] hover:text-[#c7511f] flex items-center gap-1"
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
                                  className="text-xs font-bold text-[#007185] hover:text-[#c7511f]"
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
                                    className="text-xs font-bold text-[#007185] hover:text-[#c7511f]"
                                  >
                                    + Edit List
                                  </button>
                                </div>
                              </div>

                              {totalComps === 0 ? (
                                <div className="p-4 rounded-xl bg-[#f7fafa] border border-[#d5d9d9] text-center text-xs text-[#565959]">
                                  No components listed yet. Click <strong>"Type Note & Components"</strong> above to add components.
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
            </div>
          </div>

          {consolidatedBOM.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-[#0f1111]">No components in Master List yet</h4>
              <p className="text-xs text-[#565959]">
                Click on the <strong>"📋 Project Note Forms"</strong> tab and add components to your projects to see them aggregated here.
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
                        <td className="py-3 px-3 text-[#565959]">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                        </td>

                        {/* Total Qty */}
                        <td className="py-3 px-3 text-center font-black text-[#b12704] font-mono text-base">
                          {item.totalQuantity} pcs
                        </td>

                        {/* Need to buy */}
                        <td className="py-3 px-3 text-center font-mono">
                          {item.pendingQuantity > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                              {item.pendingQuantity} pcs
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold flex items-center justify-center gap-1 text-xs">
                              <Check className="w-3.5 h-3.5" /> All Ready
                            </span>
                          )}
                        </td>

                        {/* Required by projects & project notes! */}
                        <td className="py-3 px-4 space-y-2">
                          {item.usedInProjects.map((u, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2.5 rounded-lg bg-[#f7fafa] border border-[#d5d9d9] space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="font-extrabold text-[#0f1111]">
                                  📌 {u.projectTitle}
                                </span>
                                <span className="font-mono font-bold text-[#007185] bg-white px-2 py-0.5 rounded border border-[#d5d9d9]">
                                  {u.componentQty} pcs needed
                                </span>
                              </div>

                              <div className="text-[11px] text-[#565959] flex items-center gap-3">
                                <span>Client: <strong>{u.clientName}</strong></span>
                                {u.budget && <span>Budget: {u.budget}</span>}
                                {u.deadline && <span>Deadline: {u.deadline}</span>}
                              </div>

                              {/* Project Note */}
                              {u.projectNote ? (
                                <div className="p-1.5 rounded bg-[#fffbf2] border border-[#fbd8b5] text-[11px] text-[#0f1111] font-medium leading-relaxed">
                                  <strong className="text-[#b12704]">Project Note:</strong> {u.projectNote}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic">
                                  No project note recorded
                                </div>
                              )}

                              {u.componentNote && (
                                <div className="text-[10px] text-[#007185]">
                                  Part Note: {u.componentNote}
                                </div>
                              )}
                            </div>
                          ))}
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

      {/* CREATE NEW CUSTOM PROJECT MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#d5d9d9] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#e7e7e7] pb-3">
              <div>
                <span className="text-xs font-bold text-[#b12704] uppercase tracking-wider">
                  New Project Brief
                </span>
                <h3 className="text-lg font-black text-[#0f1111]">
                  Add Project & Required Components
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
                    className="text-xs text-[#007185] hover:text-[#c7511f] font-bold"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-1.5">
                  {newComponents.map((c, i) => (
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
                        className="p-1.5 text-slate-400 hover:text-rose-600"
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
    </div>
  );
}
