import fs from 'fs';
import path from 'path';
import os from 'os';
import * as XLSX from 'xlsx';
import { Project, ProjectKind } from './types';

import { GOOGLE_SHEET_CSV_URL, GOOGLE_SHEET_VIEW_URL } from './constants';
export { GOOGLE_SHEET_CSV_URL, GOOGLE_SHEET_VIEW_URL };

// Directory and file paths (local dev + /tmp fallback for Vercel/serverless environments)
const DATA_DIR = path.join(process.cwd(), 'data');
const TMP_DATA_DIR = path.join(os.tmpdir(), 'easitronics_data');

const CUSTOM_PROJECTS_FILE = path.join(DATA_DIR, 'custom-projects.json');
const TMP_CUSTOM_PROJECTS_FILE = path.join(TMP_DATA_DIR, 'custom-projects.json');

const OVERRIDES_FILE = path.join(DATA_DIR, 'project-overrides.json');
const TMP_OVERRIDES_FILE = path.join(TMP_DATA_DIR, 'project-overrides.json');

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const TMP_SETTINGS_FILE = path.join(TMP_DATA_DIR, 'settings.json');

const EXCEL_FILE_PATH = path.join(process.cwd(), 'project_catalog_data.xlsx');
const CSV_FILE_PATH = path.join(process.cwd(), 'project_catalog_data.csv');

interface FetchProjectsResult {
  projects: Project[];
  isFallback: boolean;
  error?: string;
  lastUpdated: string;
  totalFromSheet: number;
  totalCustom: number;
}

// In-memory runtime cache for serverless resiliency
let cachedResult: FetchProjectsResult | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL, easily refreshed on demand

let memoryOverrides: Record<string, Partial<Project>> = {};
let memoryCustomProjects: Project[] | null = null;
let memorySettings: Record<string, any> = {};

/**
 * Robust RFC-compliant CSV parser
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Clean citation artifacts like [cite: 1] or [cite: 2]
 */
function cleanCitations(str: string): string {
  if (!str) return '';
  return str.replace(/\[cite:\s*\d+\]/gi, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Get saved project overrides (edits made to existing sheet/catalog titles)
 * Reads from in-memory cache, local data directory, and /tmp fallback for serverless.
 */
export function getProjectOverrides(): Record<string, Partial<Project>> {
  const result: Record<string, Partial<Project>> = { ...memoryOverrides };

  // 1. Read from persistent local project-overrides.json if exists
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const raw = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(result, parsed);
      }
    }
  } catch (_) {}

  // 2. Read from /tmp if exists (Vercel serverless writable storage)
  try {
    if (fs.existsSync(TMP_OVERRIDES_FILE)) {
      const raw = fs.readFileSync(TMP_OVERRIDES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(result, parsed);
      }
    }
  } catch (_) {}

  // Sync memory cache
  Object.assign(memoryOverrides, result);
  return result;
}

/**
 * Save project overrides locally, in /tmp for Vercel, and in memory
 */
export function saveProjectOverrides(overrides: Record<string, Partial<Project>>): void {
  // Set memory state directly to overrides
  memoryOverrides = { ...overrides };
  cachedResult = null;

  // Save to /tmp (always writable in Vercel / AWS Lambda)
  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TMP_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf-8');
  } catch (_) {}

  // Save to local project directory if writable
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf-8');
  } catch (_) {}
}

/**
 * Get locally saved custom/uploaded projects
 */
export function getCustomProjects(): Project[] {
  if (memoryCustomProjects !== null && memoryCustomProjects.length > 0) {
    return [...memoryCustomProjects];
  }

  let projects: Project[] = [];

  try {
    if (fs.existsSync(CUSTOM_PROJECTS_FILE)) {
      const raw = fs.readFileSync(CUSTOM_PROJECTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        projects = parsed;
      }
    }
  } catch (_) {}

  try {
    if (fs.existsSync(TMP_CUSTOM_PROJECTS_FILE)) {
      const raw = fs.readFileSync(TMP_CUSTOM_PROJECTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(projects.map((p) => p.id));
        parsed.forEach((p: Project) => {
          if (!existingIds.has(p.id)) {
            projects.push(p);
          }
        });
      }
    }
  } catch (_) {}

  memoryCustomProjects = [...projects];
  return projects;
}

/**
 * Save custom projects locally, in /tmp, and in memory
 */
export function saveCustomProjects(projects: Project[]): void {
  memoryCustomProjects = [...projects];
  cachedResult = null;

  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TMP_CUSTOM_PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (_) {}

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CUSTOM_PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (_) {}
}

/**
 * Fetch projects directly from user's live Google Sheet CSV URL
 */
export async function getProjects(forceRefresh = false): Promise<FetchProjectsResult> {
  const now = Date.now();
  if (!forceRefresh && cachedResult && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedResult;
  }

  const overrides = getProjectOverrides();
  const rawCustomProjects = getCustomProjects();
  let sheetProjects: Project[] = [];
  let isFallback = false;
  let errorMessage: string | undefined;

  try {
    // Fetch live Google Sheet public CSV
    const response = await fetch(GOOGLE_SHEET_CSV_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ProjectCatalog/1.0',
        Accept: 'text/csv, text/plain, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Sheet returned HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      throw new Error('Google Sheet is empty or lacks data rows');
    }

    // Header index mapping
    const headerRow = rows[0].map((h) => h.toLowerCase().trim());
    const titleIdx = headerRow.findIndex((h) => h.includes('title'));
    const domainIdx = headerRow.findIndex((h) => h.includes('domain'));
    const branchIdx = headerRow.findIndex((h) => h.includes('branch'));
    const typeIdx = headerRow.findIndex((h) => h.includes('type'));
    const priceIdx = headerRow.findIndex((h) => h.includes('price') || h.includes('cost'));
    const descIdx = headerRow.findIndex((h) => h.includes('desc'));
    const demoIdx = headerRow.findIndex((h) => h.includes('video') || h.includes('demo'));
    const tagsIdx = headerRow.findIndex((h) => h.includes('tag'));
    const featIdx = headerRow.findIndex((h) => h.includes('feat'));

    // Process data rows
    sheetProjects = rows.slice(1).map((row, idx) => {
      const rawTitle = titleIdx >= 0 ? row[titleIdx] : row[0] || '';
      const domain = domainIdx >= 0 ? row[domainIdx] : row[1] || 'Engineering';
      const branch = branchIdx >= 0 ? row[branchIdx] : row[2] || 'General';
      const typeStr = typeIdx >= 0 ? row[typeIdx] : row[3] || 'Prototype';
      const priceStr = priceIdx >= 0 ? row[priceIdx] : row[4] || '0';
      const rawDesc = descIdx >= 0 ? row[descIdx] : row[5] || '';
      const demoVideoUrlRaw = demoIdx >= 0 ? row[demoIdx] : row[7] || '';
      const tagsStr = tagsIdx >= 0 ? row[tagsIdx] : row[8] || '';
      const featuredStr = featIdx >= 0 ? row[featIdx] : row[9] || 'FALSE';

      const title = cleanCitations(rawTitle) || `Project #${idx + 1}`;
      const description = cleanCitations(rawDesc) || 'No description provided.';
      const cleanedPrice = parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10) || 12000;
      const type: ProjectKind = typeStr.trim().toLowerCase() === 'product' ? 'Product' : 'Prototype';
      const featured = String(featuredStr).trim().toUpperCase() === 'TRUE';

      const tags = tagsStr
        ? tagsStr
            .split(',')
            .map((t) => t.trim().replace(/^#/, ''))
            .filter(Boolean)
        : [];

      const demoVideoUrl =
        demoVideoUrlRaw && !demoVideoUrlRaw.includes('ADD_VIDEO_LINK')
          ? demoVideoUrlRaw
          : undefined;

      const id = `sheet-${idx + 1}`;
      const baseProject: Project = {
        id,
        title,
        domain: domain.trim(),
        branch: branch.trim(),
        type,
        price: cleanedPrice,
        description,
        demoVideoUrl,
        tags,
        featured,
        source: 'sheet',
        orderIndex: idx + 1, // Higher index means added later in Excel sheet
      };

      const override =
        overrides[id] ||
        overrides[title] ||
        overrides[title.toLowerCase().trim()] ||
        overrides[id.toLowerCase()];
      if (override) {
        return {
          ...baseProject,
          ...override,
          id, // retain primary ID
          source: 'sheet',
          isEdited: true,
          orderIndex: idx + 1,
        };
      }

      return baseProject;
    });
  } catch (err: any) {
    console.error('Error fetching Google Sheet:', err.message || err);
    isFallback = true;
    errorMessage = `Unable to fetch live Google Sheet: ${err.message}. Using backup dataset.`;

    // Fallback: Read local project_catalog_data.csv if network fails
    try {
      const fallbackPath = path.join(process.cwd(), 'project_catalog_data.csv');
      if (fs.existsSync(fallbackPath)) {
        const localCsv = fs.readFileSync(fallbackPath, 'utf-8');
        const rows = parseCSV(localCsv);
        sheetProjects = rows.slice(1).map((row, idx) => {
          const id = `local-${idx + 1}`;
          const title = cleanCitations(row[0]) || `Project #${idx + 1}`;
          const baseProject: Project = {
            id,
            title,
            domain: (row[1] || 'IoT').trim(),
            branch: (row[2] || 'ECE').trim(),
            type: (row[3]?.toLowerCase() === 'product' ? 'Product' : 'Prototype') as ProjectKind,
            price: parseInt(String(row[4]).replace(/[^0-9]/g, ''), 10) || 10000,
            description: cleanCitations(row[5]) || '',
            demoVideoUrl: row[7] && !row[7].includes('ADD_VIDEO_LINK') ? row[7] : undefined,
            tags: row[8] ? row[8].split(',').map((t) => t.trim()).filter(Boolean) : [],
            featured: String(row[9]).toUpperCase() === 'TRUE',
            source: 'sheet',
            orderIndex: idx + 1,
          };

          const override =
            overrides[id] ||
            overrides[title] ||
            overrides[title.toLowerCase().trim()] ||
            overrides[id.toLowerCase()];
          if (override) {
            return {
              ...baseProject,
              ...override,
              id,
              source: 'sheet',
              isEdited: true,
              orderIndex: idx + 1,
            };
          }

          return baseProject;
        });
      }
    } catch (fallbackErr) {
      console.error('Failed to load fallback CSV:', fallbackErr);
    }
  }

  // Deduplicate: If a custom project has the same title as a sheet project, avoid duplicate entries.
  const sheetTitleMap = new Set<string>();
  sheetProjects.forEach((sp) => sheetTitleMap.add(sp.title.toLowerCase().trim()));

  const uniqueCustom = rawCustomProjects.filter(
    (cp) => !sheetTitleMap.has(cp.title.toLowerCase().trim())
  );

  // Format custom projects with overrides and chronological orderIndex
  const maxSheetIndex = sheetProjects.length > 0 ? sheetProjects[sheetProjects.length - 1].orderIndex || sheetProjects.length : 1000;
  const customProjects = uniqueCustom.map((cp, cIdx) => {
    const override =
      overrides[cp.id] ||
      overrides[cp.title] ||
      overrides[cp.title.toLowerCase().trim()] ||
      overrides[cp.id.toLowerCase()];
    const projectWithOverride = override ? { ...cp, ...override, isEdited: true } : cp;
    return {
      ...projectWithOverride,
      orderIndex: (cp.orderIndex || maxSheetIndex + 1000 + (uniqueCustom.length - cIdx)),
    };
  });

  // Combine with first preference given to recently added titles (from last in Excel sheet + custom)
  // Reversing sheetProjects places the highest index (the bottom rows of Excel sheet) at the top
  const reversedSheetProjects = [...sheetProjects].reverse();
  const allProjects = [...customProjects, ...reversedSheetProjects];

  const result: FetchProjectsResult = {
    projects: allProjects,
    isFallback,
    error: errorMessage,
    lastUpdated: new Date().toISOString(),
    totalFromSheet: sheetProjects.length,
    totalCustom: customProjects.length,
  };

  cachedResult = result;
  lastCacheTime = now;
  return result;
}

/**
 * Get configured Google Sheet Webhook URL
 */
export function getGoogleSheetWebhookUrl(): string {
  if (process.env.GOOGLE_SHEET_WEBHOOK_URL) {
    return process.env.GOOGLE_SHEET_WEBHOOK_URL.trim();
  }
  if (memorySettings.googleSheetWebhookUrl) {
    return memorySettings.googleSheetWebhookUrl.trim();
  }
  try {
    if (fs.existsSync(TMP_SETTINGS_FILE)) {
      const raw = fs.readFileSync(TMP_SETTINGS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.googleSheetWebhookUrl) return data.googleSheetWebhookUrl.trim();
    }
  } catch (_) {}
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return (data.googleSheetWebhookUrl || '').trim();
    }
  } catch (_) {}
  return '';
}

/**
 * Save Google Sheet Webhook URL
 */
export function setGoogleSheetWebhookUrl(url: string): void {
  const trimmedUrl = url.trim();
  memorySettings.googleSheetWebhookUrl = trimmedUrl;
  memorySettings.lastUpdated = new Date().toISOString();

  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TMP_SETTINGS_FILE, JSON.stringify(memorySettings, null, 2), 'utf-8');
  } catch (_) {}

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let data: any = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      } catch (_) {}
    }
    data.googleSheetWebhookUrl = trimmedUrl;
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (_) {}
}

/**
 * Export projects to CSV format matching the Google Sheet structure
 */
export function projectsToCSV(projects: Project[]): string {
  const headers = ['Title', 'Domain', 'Branch', 'Type', 'Price', 'Description', 'ImageURL', 'DemoVideoURL', 'Tags', 'Featured'];
  
  const escapeCell = (val: string | number | boolean) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = projects.map((p) => [
    escapeCell(p.title),
    escapeCell(p.domain),
    escapeCell(p.branch),
    escapeCell(p.type),
    escapeCell(p.price),
    escapeCell(p.description),
    escapeCell('ADD_IMAGE_LINK'),
    escapeCell(p.demoVideoUrl || 'ADD_VIDEO_LINK'),
    escapeCell(p.tags.join(', ')),
    escapeCell(p.featured ? 'TRUE' : 'FALSE'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate binary Microsoft Excel (.xlsx) buffer
 */
export function projectsToXLSXBuffer(projects: Project[]): Buffer {
  const excelRows = projects.map((p) => ({
    Title: p.title,
    Domain: p.domain,
    Branch: p.branch,
    Type: p.type,
    Price: p.price,
    Description: p.description,
    ImageURL: 'ADD_IMAGE_LINK',
    DemoVideoURL: p.demoVideoUrl || 'ADD_VIDEO_LINK',
    Tags: p.tags.join(', '),
    Featured: p.featured ? 'TRUE' : 'FALSE',
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Automatically updates both CSV and Microsoft Excel (.xlsx) files on disk
 */
export function syncToExcelFiles(projects: Project[]): { csvUpdated: boolean; xlsxUpdated: boolean } {
  let csvUpdated = false;
  let xlsxUpdated = false;

  try {
    const csvContent = projectsToCSV(projects);
    fs.writeFileSync(CSV_FILE_PATH, csvContent, 'utf-8');
    csvUpdated = true;
  } catch (err) {
    console.error('Failed to update CSV file on disk:', err);
  }

  try {
    const buffer = projectsToXLSXBuffer(projects);
    fs.writeFileSync(EXCEL_FILE_PATH, buffer);
    xlsxUpdated = true;
  } catch (err) {
    console.error('Failed to update XLSX file on disk:', err);
  }

  return { csvUpdated, xlsxUpdated };
}

/**
 * Asynchronously posts new project rows to the connected Google Apps Script Webhook
 */
export async function pushToGoogleSheetWebhook(
  projects: Array<Omit<Project, 'id' | 'source'>>
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = getGoogleSheetWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'Google Sheets Webhook URL not configured. Data saved to local Excel sheet.',
    };
  }

  try {
    const payload = projects.map((p) => ({
      title: p.title,
      domain: p.domain,
      branch: p.branch,
      type: p.type,
      price: p.price,
      description: p.description,
      imageUrl: 'ADD_IMAGE_LINK',
      demoVideoUrl: p.demoVideoUrl || 'ADD_VIDEO_LINK',
      tags: p.tags,
      featured: p.featured,
    }));

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { success: true, message: `Successfully updated ${projects.length} project(s) in your live Google Sheet!` };
    } else {
      return { success: false, message: `Google Sheet Webhook returned status ${res.status}` };
    }
  } catch (err: any) {
    console.warn('Google Sheet Webhook sync note:', err.message);
    return { success: false, message: `Google Sheet push note: ${err.message}` };
  }
}

/**
 * Push an edited project update to the connected Google Apps Script Webhook
 */
export async function updateGoogleSheetWebhook(
  project: Project,
  originalTitle?: string
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = getGoogleSheetWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'Google Sheets Webhook URL not configured.',
    };
  }

  try {
    const payload = {
      action: 'update',
      originalTitle: originalTitle || project.title,
      id: project.id,
      project: {
        title: project.title,
        domain: project.domain,
        branch: project.branch,
        type: project.type,
        price: project.price,
        description: project.description,
        imageUrl: 'ADD_IMAGE_LINK',
        demoVideoUrl: project.demoVideoUrl || 'ADD_VIDEO_LINK',
        tags: project.tags,
        featured: project.featured,
      },
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { success: true, message: `Successfully synced edits to live Google Sheet!` };
    } else {
      return { success: false, message: `Google Sheet Webhook returned status ${res.status}` };
    }
  } catch (err: any) {
    console.warn('Google Sheet Webhook sync note:', err.message);
    return { success: false, message: `Google Sheet push note: ${err.message}` };
  }
}

/**
 * Add a new custom project & automatically update Excel sheet (.xlsx/.csv) and Google Sheet
 */
export async function addProject(newProject: Omit<Project, 'id' | 'source'>): Promise<{
  project: Project;
  excelUpdated: boolean;
  sheetSynced: boolean;
  sheetMessage?: string;
}> {
  const customProjects = getCustomProjects();
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const createdProject: Project = {
    ...newProject,
    id,
    source: 'custom',
  };

  customProjects.unshift(createdProject);
  saveCustomProjects(customProjects);

  // Invalidate cache
  cachedResult = null;

  // 1. Automatically update local Excel files (.xlsx & .csv)
  let csvUpdated = false;
  let xlsxUpdated = false;
  try {
    const fullData = await getProjects(true);
    const syncRes = syncToExcelFiles(fullData.projects);
    csvUpdated = syncRes.csvUpdated;
    xlsxUpdated = syncRes.xlsxUpdated;
  } catch (_) {}

  // 2. Automatically push to live Google Sheet if webhook is configured
  const webhookResult = await pushToGoogleSheetWebhook([newProject]);

  return {
    project: createdProject,
    excelUpdated: csvUpdated || xlsxUpdated,
    sheetSynced: webhookResult.success,
    sheetMessage: webhookResult.message,
  };
}

/**
 * Add batch projects (e.g. from CSV upload) & automatically update Excel sheet (.xlsx/.csv) and Google Sheet
 */
export async function addProjectsBatch(newProjects: Array<Omit<Project, 'id' | 'source'>>): Promise<{
  added: Project[];
  excelUpdated: boolean;
  sheetSynced: boolean;
  sheetMessage?: string;
}> {
  const customProjects = getCustomProjects();
  const created = newProjects.map((p, index) => ({
    ...p,
    id: `custom-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    source: 'custom' as const,
  }));

  const updated = [...created, ...customProjects];
  saveCustomProjects(updated);

  // Invalidate cache
  cachedResult = null;

  // 1. Automatically update local Excel files (.xlsx & .csv)
  let csvUpdated = false;
  let xlsxUpdated = false;
  try {
    const fullData = await getProjects(true);
    const syncRes = syncToExcelFiles(fullData.projects);
    csvUpdated = syncRes.csvUpdated;
    xlsxUpdated = syncRes.xlsxUpdated;
  } catch (_) {}

  // 2. Automatically push to live Google Sheet if webhook is configured
  const webhookResult = await pushToGoogleSheetWebhook(newProjects);

  return {
    added: created,
    excelUpdated: csvUpdated || xlsxUpdated,
    sheetSynced: webhookResult.success,
    sheetMessage: webhookResult.message,
  };
}

/**
 * Update an existing project (from sheet or custom) and sync changes to Excel files (.xlsx & .csv) and Google Sheet
 */
export async function updateProject(
  updatedData: Partial<Project> & { id: string; originalTitle?: string }
): Promise<{
  project: Project;
  excelUpdated: boolean;
  sheetSynced: boolean;
  sheetMessage?: string;
}> {
  const id = updatedData.id;
  if (!id) {
    throw new Error('Project ID is required to update.');
  }

  // 1. Retrieve current project from catalog if available
  const currentResult = await getProjects(false);
  const existing = currentResult.projects.find((p) => p.id === id);
  const origTitle = updatedData.originalTitle || existing?.title;
  const isCustom = id.startsWith('custom-');

  // 2. Form definitive merged project - guarantee user's edits are NOT overwritten
  const mergedProject: Project = {
    ...(existing || {}),
    ...updatedData,
    id,
    source: existing?.source || (isCustom ? 'custom' : 'sheet'),
    isEdited: true,
  } as Project;

  // 3. If custom project, update custom projects list
  if (isCustom) {
    const customProjects = getCustomProjects();
    const index = customProjects.findIndex((p) => p.id === id);
    if (index !== -1) {
      customProjects[index] = { ...customProjects[index], ...mergedProject };
    } else {
      customProjects.unshift(mergedProject);
    }
    saveCustomProjects(customProjects);
  }

  // 4. Update overrides keyed by ID, original title, and new title
  const overrides = getProjectOverrides();
  overrides[id] = { ...mergedProject };
  overrides[id.toLowerCase()] = { ...mergedProject };

  if (origTitle) {
    overrides[origTitle] = { ...mergedProject };
    overrides[origTitle.toLowerCase().trim()] = { ...mergedProject };
  }
  if (mergedProject.title) {
    overrides[mergedProject.title] = { ...mergedProject };
    overrides[mergedProject.title.toLowerCase().trim()] = { ...mergedProject };
  }
  saveProjectOverrides(overrides);

  // 5. Invalidate cached catalog
  cachedResult = null;

  // 6. Sync updated catalog to project_catalog_data.xlsx and project_catalog_data.csv on disk if writable
  let csvUpdated = false;
  let xlsxUpdated = false;
  try {
    const fullData = await getProjects(true);
    const syncRes = syncToExcelFiles(fullData.projects);
    csvUpdated = syncRes.csvUpdated;
    xlsxUpdated = syncRes.xlsxUpdated;
  } catch (err) {
    console.warn('Excel files sync error:', err);
  }

  // 7. Push update directly to Google Sheet Webhook if configured
  const webhookResult = await updateGoogleSheetWebhook(mergedProject, origTitle);

  return {
    project: mergedProject,
    excelUpdated: csvUpdated || xlsxUpdated,
    sheetSynced: webhookResult.success,
    sheetMessage: webhookResult.message,
  };
}

/**
 * Reset an edited sheet project back to its original sheet values
 */
export async function resetProjectOverride(
  id: string,
  title?: string
): Promise<{ success: boolean; excelUpdated: boolean }> {
  const overrides = getProjectOverrides();
  let deleted = false;

  const normalizedId = id.trim().toLowerCase();
  const normalizedTitle = title?.trim().toLowerCase();

  for (const key of Object.keys(overrides)) {
    const ov = overrides[key];
    const keyLower = key.toLowerCase().trim();
    const matchesId =
      keyLower === normalizedId ||
      (ov?.id && ov.id.toLowerCase().trim() === normalizedId);
    const matchesTitle =
      normalizedTitle &&
      (keyLower === normalizedTitle ||
        (ov?.title && ov.title.toLowerCase().trim() === normalizedTitle) ||
        ((ov as any)?.originalTitle &&
          (ov as any).originalTitle.toLowerCase().trim() === normalizedTitle));

    if (matchesId || matchesTitle) {
      delete overrides[key];
      delete memoryOverrides[key];
      deleted = true;
    }
  }

  if (deleted) {
    saveProjectOverrides(overrides);
    cachedResult = null;
    let csvUpdated = false;
    let xlsxUpdated = false;
    try {
      const fullData = await getProjects(true);
      const syncRes = syncToExcelFiles(fullData.projects);
      csvUpdated = syncRes.csvUpdated;
      xlsxUpdated = syncRes.xlsxUpdated;
    } catch (_) {}
    return { success: true, excelUpdated: csvUpdated || xlsxUpdated };
  }

  return { success: false, excelUpdated: false };
}

