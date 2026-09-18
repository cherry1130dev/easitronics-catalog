import { NextResponse } from 'next/server';
import { 
  getProjects, 
  addProject, 
  addProjectsBatch, 
  updateProject,
  resetProjectOverride,
  deleteProject,
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

    const branchVal = Array.isArray(body.branch)
      ? body.branch.join(', ')
      : String(body.branch || '').trim();
    const domainVal = Array.isArray(body.domain)
      ? body.domain.join(', ')
      : String(body.domain || '').trim();

    // Single project upload
    if (!body.title || !branchVal || !domainVal) {
      return NextResponse.json(
        { error: 'Title, Branch, and Domain are required fields.' },
        { status: 400 }
      );
    }

    const result = await addProject({
      title: body.title,
      domain: domainVal,
      branch: branchVal,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Project ID is required for editing.' },
        { status: 400 }
      );
    }

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Project title cannot be empty.' },
        { status: 400 }
      );
    }

    const branchVal = Array.isArray(body.branch)
      ? body.branch.join(', ')
      : body.branch !== undefined ? String(body.branch).trim() : 'ECE';
    const domainVal = Array.isArray(body.domain)
      ? body.domain.join(', ')
      : body.domain !== undefined ? String(body.domain).trim() : 'IoT';

    const updatePayload: Partial<Project> & { id: string; originalTitle?: string } = {
      id: body.id,
      originalTitle: body.originalTitle?.trim(),
      title: body.title.trim(),
      domain: domainVal,
      branch: branchVal,
      type: body.type === 'Product' ? 'Product' : 'Prototype',
      price: typeof body.price === 'number' ? body.price : parseInt(String(body.price).replace(/[^0-9]/g, ''), 10) || 10000,
      description: body.description !== undefined ? body.description.trim() : undefined,
      demoVideoUrl: body.demoVideoUrl !== undefined ? (body.demoVideoUrl.trim() || undefined) : undefined,
      tags: Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
      featured: Boolean(body.featured),
    };

    const result = await updateProject(updatePayload);

    let message = `Project "${result.project.title}" updated successfully!`;
    if (result.sheetSynced) {
      message += ' Live Google Sheet automatically updated.';
    } else if (result.excelUpdated) {
      message += ' Excel file (.xlsx & .csv) updated.';
    }

    return NextResponse.json({
      success: true,
      message,
      project: result.project,
      excelUpdated: result.excelUpdated,
      sheetSynced: result.sheetSynced,
      sheetMessage: result.sheetMessage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update project', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const title = searchParams.get('title') || undefined;
    const action = searchParams.get('action') || 'delete';

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (action === 'reset') {
      const result = await resetProjectOverride(id, title);
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'Project reset to original sheet values.'
          : 'No customized overrides found for this project.',
        excelUpdated: result.excelUpdated,
      });
    }

    // Default: permanently delete project
    const result = await deleteProject(id, title);
    return NextResponse.json({
      success: result.success,
      message: result.message || 'Project permanently deleted.',
      excelUpdated: result.excelUpdated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete project', details: error?.message },
      { status: 500 }
    );
  }
}

