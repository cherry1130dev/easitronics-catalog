import { NextResponse } from 'next/server';
import { 
  getProjects, 
  addProject, 
  addProjectsBatch, 
  projectsToCSV, 
  projectsToXLSXBuffer 
} from '@/lib/sheets';
import { Project } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const exportFormat = searchParams.get('export');

    const data = await getProjects(forceRefresh);

    if (exportFormat === 'xlsx') {
      const buffer = projectsToXLSXBuffer(data.projects);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="easitronics_project_catalog_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      });
    }

    if (exportFormat === 'csv') {
      const csv = projectsToCSV(data.projects);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="easitronics_project_catalog_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch project catalog', 
        details: error?.message 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if it's a batch upload (array of projects)
    if (Array.isArray(body.projects)) {
      const result = await addProjectsBatch(body.projects);
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${result.added.length} projects. Excel sheet (.xlsx & .csv) automatically updated!`,
        added: result.added,
        excelUpdated: result.excelUpdated,
        sheetSynced: result.sheetSynced,
        sheetMessage: result.sheetMessage,
      });
    }

    // Single project upload
    if (!body.title || !body.branch || !body.domain) {
      return NextResponse.json(
        { error: 'Title, Branch, and Domain are required fields.' },
        { status: 400 }
      );
    }

    const result = await addProject({
      title: body.title,
      domain: body.domain,
      branch: body.branch,
      type: body.type === 'Product' ? 'Product' : 'Prototype',
      price: parseInt(String(body.price).replace(/[^0-9]/g, ''), 10) || 10000,
      description: body.description || '',
      demoVideoUrl: body.demoVideoUrl || undefined,
      tags: Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
      featured: Boolean(body.featured),
    });

    return NextResponse.json({
      success: true,
      message: 'Project successfully added to catalog & Excel sheet automatically updated!',
      project: result.project,
      excelUpdated: result.excelUpdated,
      sheetSynced: result.sheetSynced,
      sheetMessage: result.sheetMessage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add project', details: error?.message },
      { status: 500 }
    );
  }
}
