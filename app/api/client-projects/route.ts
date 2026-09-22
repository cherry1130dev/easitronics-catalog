import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { ClientProjectBrief } from '@/lib/types';
import { GOOGLE_FORM_RESPONSES_CSV_URL } from '@/lib/constants';

const DATA_DIR = path.join(process.cwd(), 'data');
const CLIENT_PROJECTS_FILE = path.join(DATA_DIR, 'client-projects.json');

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
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading client-projects.json:', error);
    return [];
  }
}

function saveProjectsToFile(projects: ClientProjectBrief[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CLIENT_PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

export async function importGoogleFormProjects(existingProjects: ClientProjectBrief[]) {
  const res = await fetch(GOOGLE_FORM_RESPONSES_CSV_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch Google Form sheet: ${res.statusText}`);
  }
  const csvText = await res.text();
  const wb = XLSX.read(csvText, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  let updatedProjects = [...existingProjects];
  let importedCount = 0;
  let updatedCount = 0;

  for (const row of rows) {
    // Find fields regardless of slight header variation
    const titleKey = Object.keys(row).find((k) => k.toLowerCase().includes('title'));
    const nameKey = Object.keys(row).find((k) => k.toLowerCase() === 'name');
    const phoneKey = Object.keys(row).find((k) => k.toLowerCase().includes('phone'));
    const costKey = Object.keys(row).find((k) => k.toLowerCase().includes('cost') || k.toLowerCase().includes('product'));
    const advanceKey = Object.keys(row).find((k) => k.toLowerCase().includes('advance'));
    const referralKey = Object.keys(row).find((k) => k.toLowerCase().includes('referral'));
    const deadlineKey = Object.keys(row).find((k) => k.toLowerCase().includes('deadline') || k.toLowerCase().includes('submission'));
    const collegeKey = Object.keys(row).find((k) => k.toLowerCase().includes('college') || k.toLowerCase().includes('place'));

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

    // Check if project exists by Title or Phone
    const existingIdx = updatedProjects.findIndex(
      (p) =>
        p.projectTitle.toLowerCase().trim() === title.toLowerCase() ||
        (clientPhone && p.clientPhone && p.clientPhone.replace(/[^0-9]/g, '') === clientPhone.replace(/[^0-9]/g, ''))
    );

    let specialNotesParts: string[] = [];
    if (advance) specialNotesParts.push(`Advance Paid: ₹${advance}`);
    if (referral) specialNotesParts.push(`Referral: ${referral}`);

    if (existingIdx >= 0) {
      // Existing project: Preserve existing components & notes, update blank fields
      const curr = updatedProjects[existingIdx];
      const mergedNotes = curr.clientSpecialNotes 
        ? curr.clientSpecialNotes 
        : specialNotesParts.join(' | ');

      updatedProjects[existingIdx] = {
        ...curr,
        clientName: curr.clientName || clientName,
        clientPhone: curr.clientPhone || clientPhone,
        budget: curr.budget || formattedBudget,
        deadline: curr.deadline || deadline,
        collegeOrOrg: curr.collegeOrOrg || collegeOrOrg,
        clientSpecialNotes: mergedNotes,
        updatedAt: new Date().toISOString(),
      };
      updatedCount++;
    } else {
      // New project from Google Form
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
        clientSpecialNotes: specialNotesParts.join(' | '),
        components: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedProjects.unshift(newProject);
      importedCount++;
    }
  }

  saveProjectsToFile(updatedProjects);
  return { updatedProjects, importedCount, updatedCount };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldImport = searchParams.get('importGoogleForm') === 'true';

    let projects = ensureDataFile();

    if (shouldImport) {
      const result = await importGoogleFormProjects(projects);
      return NextResponse.json({
        success: true,
        projects: result.updatedProjects,
        count: result.updatedProjects.length,
        importedCount: result.importedCount,
        updatedCount: result.updatedCount,
      });
    }

    return NextResponse.json({ projects, count: projects.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve client projects', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'save' } = body;
    let projects = ensureDataFile();

    if (action === 'import_google_form') {
      const result = await importGoogleFormProjects(projects);
      return NextResponse.json({
        success: true,
        projects: result.updatedProjects,
        count: result.updatedProjects.length,
        importedCount: result.importedCount,
        updatedCount: result.updatedCount,
      });
    }

    if (action === 'save' && body.project) {
      const incoming: ClientProjectBrief = body.project;
      const existingIdx = projects.findIndex((p) => p.id === incoming.id);
      
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

      saveProjectsToFile(projects);
      return NextResponse.json({ success: true, project: updatedProject, count: projects.length });
    }

    if (action === 'delete' && body.id) {
      const targetId = String(body.id);
      projects = projects.filter((p) => p.id !== targetId);
      saveProjectsToFile(projects);
      return NextResponse.json({ success: true, count: projects.length });
    }

    if (action === 'update_component_status' && body.projectId && body.componentId) {
      const pIdx = projects.findIndex((p) => p.id === body.projectId);
      if (pIdx >= 0) {
        const cIdx = projects[pIdx].components.findIndex((c) => c.id === body.componentId);
        if (cIdx >= 0) {
          projects[pIdx].components[cIdx].status = body.status;
          projects[pIdx].updatedAt = new Date().toISOString();
          saveProjectsToFile(projects);
          return NextResponse.json({ success: true, project: projects[pIdx] });
        }
      }
      return NextResponse.json({ error: 'Project or component not found' }, { status: 404 });
    }

    if (action === 'sync_all' && Array.isArray(body.projects)) {
      projects = body.projects;
      saveProjectsToFile(projects);
      return NextResponse.json({ success: true, count: projects.length });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process request', details: error?.message },
      { status: 500 }
    );
  }
}
