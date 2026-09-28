import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { ClientProjectBrief, ProjectComponent } from '@/lib/types';
import { GOOGLE_FORM_RESPONSES_CSV_URL } from '@/lib/constants';

const DATA_DIR = path.join(process.cwd(), 'data');
const CLIENT_PROJECTS_FILE = path.join(DATA_DIR, 'client-projects.json');
const COMPONENTS_VAULT_FILE = path.join(DATA_DIR, 'components-vault.json');

export interface SavedComponentVaultEntry {
  projectTitle: string;
  projectId?: string;
  clientSpecialNotes?: string;
  clientRequirements?: string;
  budget?: string;
  deadline?: string;
  clientPhone?: string;
  components: ProjectComponent[];
  updatedAt: string;
}

export type ComponentsVaultMap = Record<string, SavedComponentVaultEntry>;

function ensureDataFile(): ClientProjectBrief[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CLIENT_PROJECTS_FILE)) {
      fs.writeFileSync(CLIENT_PROJECTS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(CLIENT_PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading client-projects.json:', error);
    return [];
  }
}

function saveProjectsToFile(projects: ClientProjectBrief[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CLIENT_PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (error) {
    console.error('Warning: Could not save to client-projects.json (read-only filesystem or permissions):', error);
  }
}

function ensureVaultFile(): ComponentsVaultMap {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(COMPONENTS_VAULT_FILE)) {
      fs.writeFileSync(COMPONENTS_VAULT_FILE, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(COMPONENTS_VAULT_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.error('Error reading components-vault.json:', error);
    return {};
  }
}

function saveVaultToFile(vault: ComponentsVaultMap): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(COMPONENTS_VAULT_FILE, JSON.stringify(vault, null, 2), 'utf-8');
  } catch (error) {
    console.error('Warning: Could not save to components-vault.json:', error);
  }
}

function normalizeKey(title: string): string {
  return (title || '').toLowerCase().trim();
}

/**
 * Sync vault entries into projects list so saved components are NEVER lost
 */
function restoreComponentsFromVault(projects: ClientProjectBrief[], vault: ComponentsVaultMap): ClientProjectBrief[] {
  return projects.map((p) => {
    const key = normalizeKey(p.projectTitle);
    const vaultEntry = vault[key];
    if (!vaultEntry) return p;

    const hasComps = p.components && p.components.length > 0;
    const vaultHasComps = vaultEntry.components && vaultEntry.components.length > 0;

    return {
      ...p,
      // If project has no components but vault does, restore them
      components: hasComps ? p.components : (vaultHasComps ? vaultEntry.components : []),
      clientSpecialNotes: p.clientSpecialNotes || vaultEntry.clientSpecialNotes || '',
      budget: p.budget || vaultEntry.budget || '',
      deadline: p.deadline || vaultEntry.deadline || '',
      clientPhone: p.clientPhone || vaultEntry.clientPhone || '',
    };
  });
}

/**
 * Update vault with all projects that have components or notes
 */
function updateVaultFromProjects(projects: ClientProjectBrief[], currentVault: ComponentsVaultMap): ComponentsVaultMap {
  const updatedVault = { ...currentVault };
  const now = new Date().toISOString();

  projects.forEach((p) => {
    const key = normalizeKey(p.projectTitle);
    if (!key) return;

    const validComps = (p.components || []).filter((c) => c && c.name && c.name.trim().length > 0);
    if (validComps.length > 0 || p.clientSpecialNotes) {
      updatedVault[key] = {
        projectTitle: p.projectTitle,
        projectId: p.id,
        clientSpecialNotes: p.clientSpecialNotes || '',
        clientRequirements: p.clientRequirements || '',
        budget: p.budget || '',
        deadline: p.deadline || '',
        clientPhone: p.clientPhone || '',
        components: validComps,
        updatedAt: p.updatedAt || now,
      };
    }
  });

  return updatedVault;
}

export const dynamic = 'force-dynamic';

async function importGoogleFormProjects(existingProjects: ClientProjectBrief[], vault: ComponentsVaultMap) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let csvText = '';
  try {
    const res = await fetch(GOOGLE_FORM_RESPONSES_CSV_URL, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`Google Form Sheet returned HTTP status ${res.status}: ${res.statusText}`);
    }
    csvText = await res.text();
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    throw new Error(`Failed to fetch Google Form sheet CSV: ${fetchErr?.message || fetchErr}`);
  }

  const wb = XLSX.read(csvText, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  let updatedProjects = [...existingProjects];
  let importedCount = 0;
  let updatedCount = 0;

  for (const row of rows) {
    // Find fields regardless of slight header variation
    const titleKey = Object.keys(row).find((k) => k.toLowerCase().includes('title'));
    const nameKey = Object.keys(row).find((k) => {
      const kl = k.toLowerCase().trim();
      return kl === 'name' || kl === 'client name' || kl === 'student name';
    });
    const phoneKey = Object.keys(row).find((k) => {
      const kl = k.toLowerCase();
      return kl.includes('phone') || kl.includes('mobile') || kl.includes('whatsapp') || kl.includes('contact');
    });
    const costKey = Object.keys(row).find((k) => {
      const kl = k.toLowerCase();
      return kl.includes('cost') || kl.includes('product') || kl.includes('budget') || kl.includes('price');
    });
    const advanceKey = Object.keys(row).find((k) => k.toLowerCase().includes('advance'));
    const referralKey = Object.keys(row).find((k) => k.toLowerCase().includes('referral'));
    const deadlineKey = Object.keys(row).find((k) => {
      const kl = k.toLowerCase();
      return kl.includes('deadline') || kl.includes('submission') || kl.includes('date');
    });
    const collegeKey = Object.keys(row).find((k) => {
      const kl = k.toLowerCase();
      return kl.includes('college') || kl.includes('place') || kl.includes('university') || kl.includes('org');
    });

    const title = titleKey && row[titleKey] ? String(row[titleKey]).trim() : '';
    const clientName = nameKey && row[nameKey] ? String(row[nameKey]).trim() : '';
    const clientPhone = phoneKey && row[phoneKey] ? String(row[phoneKey]).trim() : '';
    const rawCost = costKey && row[costKey] ? String(row[costKey]).replace(/[^0-9]/g, '') : '';
    const costNum = rawCost ? parseInt(rawCost, 10) : 0;
    const formattedBudget = costNum > 0 ? `₹${costNum.toLocaleString('en-IN')}` : '';
    const advance = advanceKey && row[advanceKey] ? String(row[advanceKey]).trim() : '';
    const referral = referralKey && row[referralKey] ? String(row[referralKey]).trim() : '';
    const deadline = deadlineKey && row[deadlineKey] ? String(row[deadlineKey]).trim() : '';
    const collegeOrOrg = collegeKey && row[collegeKey] ? String(row[collegeKey]).trim() : '';

    if (!title) continue;

    const cleanTitle = normalizeKey(title);
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');

    // Check if project exists by Title or Phone
    const existingIdx = updatedProjects.findIndex((p) => {
      const pTitle = normalizeKey(p.projectTitle);
      const pPhone = (p.clientPhone || '').replace(/[^0-9]/g, '');
      if (cleanTitle && pTitle === cleanTitle) return true;
      if (cleanPhone && cleanPhone.length >= 10 && pPhone && pPhone === cleanPhone) return true;
      return false;
    });

    let specialNotesParts: string[] = [];
    if (advance) specialNotesParts.push(`Advance Paid: ₹${advance}`);
    if (referral) specialNotesParts.push(`Referral: ${referral}`);

    const vaultEntry = vault[cleanTitle];

    if (existingIdx >= 0) {
      // Existing project: Preserve existing components & notes, update blank fields
      const curr = updatedProjects[existingIdx];
      
      // CRITICAL: Preserve components! If curr has components, keep them. Otherwise restore from vault!
      const preservedComponents = (curr.components && curr.components.length > 0)
        ? curr.components
        : (vaultEntry?.components && vaultEntry.components.length > 0 ? vaultEntry.components : []);

      const mergedNotes = curr.clientSpecialNotes 
        ? curr.clientSpecialNotes 
        : (vaultEntry?.clientSpecialNotes || (specialNotesParts.length > 0 ? specialNotesParts.join(' | ') : ''));

      updatedProjects[existingIdx] = {
        ...curr,
        projectTitle: curr.projectTitle || title,
        clientName: curr.clientName || clientName,
        clientPhone: curr.clientPhone || clientPhone,
        budget: curr.budget || formattedBudget,
        deadline: curr.deadline || deadline,
        collegeOrOrg: curr.collegeOrOrg || collegeOrOrg,
        clientSpecialNotes: mergedNotes,
        components: preservedComponents,
        updatedAt: new Date().toISOString(),
      };
      updatedCount++;
    } else {
      // New project from Google Form: check if vault has components saved for this title
      const newProject: ClientProjectBrief = {
        id: `gform-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectTitle: title,
        clientName: clientName || 'Client',
        clientPhone: clientPhone,
        clientEmail: '',
        budget: formattedBudget,
        collegeOrOrg: collegeOrOrg,
        deadline: deadline,
        domain: 'IoT',
        branch: 'ECE',
        status: 'In Development',
        priority: 'Medium',
        clientRequirements: '',
        clientSpecialNotes: specialNotesParts.join(' | ') || (vaultEntry?.clientSpecialNotes || ''),
        components: vaultEntry?.components ? [...vaultEntry.components] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedProjects.unshift(newProject);
      importedCount++;
    }
  }

  // Update vault and files
  const updatedVault = updateVaultFromProjects(updatedProjects, vault);
  saveProjectsToFile(updatedProjects);
  saveVaultToFile(updatedVault);

  return { updatedProjects, importedCount, updatedCount, totalRows: rows.length, vault: updatedVault };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceImport = searchParams.get('importGoogleForm') === 'true';
    const noSync = searchParams.get('noSync') === 'true';

    let projects = ensureDataFile();
    let vault = ensureVaultFile();

    // 1. Always restore any components from vault into project objects
    projects = restoreComponentsFromVault(projects, vault);

    let syncResult = null;
    let syncError = null;

    // 2. Automatically sync with Google Form Responses spreadsheet
    if (!noSync || forceImport) {
      try {
        const result = await importGoogleFormProjects(projects, vault);
        projects = result.updatedProjects;
        vault = result.vault;
        syncResult = {
          importedCount: result.importedCount,
          updatedCount: result.updatedCount,
          totalRows: result.totalRows,
        };
      } catch (err: any) {
        console.warn('Google Form sheet auto-sync notice:', err.message);
        syncError = err.message;
      }
    }

    return NextResponse.json({
      success: true,
      projects,
      count: projects.length,
      vaultCount: Object.keys(vault).length,
      syncResult,
      syncError,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to retrieve client projects:', error);
    try {
      const fallback = ensureDataFile();
      return NextResponse.json({
        success: true,
        projects: fallback,
        count: fallback.length,
        error: error?.message,
      });
    } catch (_) {
      return NextResponse.json(
        { error: 'Failed to retrieve client projects', details: error?.message },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'save' } = body;
    let projects = ensureDataFile();
    let vault = ensureVaultFile();

    // 1. Force Google Form sheet re-sync
    if (action === 'import_google_form') {
      const result = await importGoogleFormProjects(projects, vault);
      return NextResponse.json({
        success: true,
        projects: result.updatedProjects,
        count: result.updatedProjects.length,
        importedCount: result.importedCount,
        updatedCount: result.updatedCount,
        totalRows: result.totalRows,
      });
    }

    // 2. Save components specifically for a title/project (bulletproof persistence)
    if (action === 'save_components') {
      const { projectId, projectTitle, components = [], notes, budget, deadline, clientPhone } = body;
      const cleanTitle = normalizeKey(projectTitle);
      const now = new Date().toISOString();

      const validComps = Array.isArray(components)
        ? components.map((c: any) => ({
            id: c.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: String(c.name || '').trim(),
            quantity: Math.max(1, parseInt(c.quantity, 10) || 1),
            category: c.category || 'Sensor',
            notes: String(c.notes || '').trim(),
            status: c.status || 'pending',
          })).filter((c: any) => c.name.length > 0)
        : [];

      // Update vault
      if (cleanTitle) {
        vault[cleanTitle] = {
          projectTitle: projectTitle || 'Project',
          projectId: projectId,
          clientSpecialNotes: notes !== undefined ? String(notes).trim() : (vault[cleanTitle]?.clientSpecialNotes || ''),
          budget: budget !== undefined ? String(budget).trim() : (vault[cleanTitle]?.budget || ''),
          deadline: deadline !== undefined ? String(deadline).trim() : (vault[cleanTitle]?.deadline || ''),
          clientPhone: clientPhone !== undefined ? String(clientPhone).trim() : (vault[cleanTitle]?.clientPhone || ''),
          components: validComps,
          updatedAt: now,
        };
        saveVaultToFile(vault);
      }

      // Update project in projects list
      let matched = false;
      projects = projects.map((p) => {
        if (p.id === projectId || (cleanTitle && normalizeKey(p.projectTitle) === cleanTitle)) {
          matched = true;
          return {
            ...p,
            components: validComps,
            clientSpecialNotes: notes !== undefined ? String(notes).trim() : p.clientSpecialNotes,
            budget: budget !== undefined ? String(budget).trim() : p.budget,
            deadline: deadline !== undefined ? String(deadline).trim() : p.deadline,
            clientPhone: clientPhone !== undefined ? String(clientPhone).trim() : p.clientPhone,
            updatedAt: now,
          };
        }
        return p;
      });

      if (!matched && projectTitle) {
        // Create new project if not in list yet
        const newProj: ClientProjectBrief = {
          id: projectId || `cp-${Date.now()}`,
          projectTitle: projectTitle.trim(),
          clientName: 'Client',
          clientPhone: clientPhone || '',
          budget: budget || '',
          deadline: deadline || '',
          domain: 'IoT',
          branch: 'ECE',
          status: 'In Development',
          priority: 'Medium',
          clientRequirements: '',
          clientSpecialNotes: notes || '',
          components: validComps,
          createdAt: now,
          updatedAt: now,
        };
        projects.unshift(newProj);
      }

      saveProjectsToFile(projects);
      return NextResponse.json({
        success: true,
        message: `Saved ${validComps.length} components for "${projectTitle}" in both projects list and persistent vault!`,
        componentsCount: validComps.length,
        projects,
        count: projects.length,
      });
    }

    // 3. Save single project
    if (action === 'save' && body.project) {
      const incoming: ClientProjectBrief = body.project;
      const existingIdx = projects.findIndex((p) => p.id === incoming.id || normalizeKey(p.projectTitle) === normalizeKey(incoming.projectTitle));
      
      const now = new Date().toISOString();
      const updatedProject: ClientProjectBrief = {
        ...incoming,
        updatedAt: now,
        createdAt: incoming.createdAt || now,
      };

      if (existingIdx >= 0) {
        projects[existingIdx] = updatedProject;
      } else {
        projects.unshift(updatedProject);
      }

      const updatedVault = updateVaultFromProjects(projects, vault);
      saveProjectsToFile(projects);
      saveVaultToFile(updatedVault);

      return NextResponse.json({ success: true, project: updatedProject, count: projects.length });
    }

    // 4. Delete project
    if (action === 'delete' && body.id) {
      const targetId = String(body.id);
      projects = projects.filter((p) => p.id !== targetId);
      saveProjectsToFile(projects);
      return NextResponse.json({ success: true, count: projects.length });
    }

    // 5. Update component status (pending -> procured -> assembled)
    if (action === 'update_component_status' && body.projectId && body.componentId) {
      const pIdx = projects.findIndex((p) => p.id === body.projectId);
      if (pIdx >= 0) {
        const cIdx = projects[pIdx].components.findIndex((c) => c.id === body.componentId);
        if (cIdx >= 0) {
          projects[pIdx].components[cIdx].status = body.status;
          projects[pIdx].updatedAt = new Date().toISOString();
          
          const updatedVault = updateVaultFromProjects(projects, vault);
          saveProjectsToFile(projects);
          saveVaultToFile(updatedVault);
          
          return NextResponse.json({ success: true, project: projects[pIdx] });
        }
      }
      return NextResponse.json({ error: 'Project or component not found' }, { status: 404 });
    }

    // 6. Sync all projects
    if (action === 'sync_all' && Array.isArray(body.projects)) {
      projects = body.projects;
      const updatedVault = updateVaultFromProjects(projects, vault);
      saveProjectsToFile(projects);
      saveVaultToFile(updatedVault);
      return NextResponse.json({ success: true, count: projects.length });
    }

    // 7. Get Components Vault
    if (action === 'get_components_vault') {
      return NextResponse.json({ success: true, vault, count: Object.keys(vault).length });
    }

    // 8. Restore Vault from backup
    if (action === 'restore_vault' && body.vault && typeof body.vault === 'object') {
      vault = { ...vault, ...body.vault };
      projects = restoreComponentsFromVault(projects, vault);
      saveVaultToFile(vault);
      saveProjectsToFile(projects);
      return NextResponse.json({ success: true, count: Object.keys(vault).length, projects });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process request', details: error?.message },
      { status: 500 }
    );
  }
}
