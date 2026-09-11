import { NextResponse } from 'next/server';
import { getGoogleSheetWebhookUrl, setGoogleSheetWebhookUrl, getProjects, pushToGoogleSheetWebhook } from '@/lib/sheets';
import { GOOGLE_SHEET_VIEW_URL } from '@/lib/constants';

export async function GET() {
  try {
    const webhookUrl = getGoogleSheetWebhookUrl();
    return NextResponse.json({
      googleSheetWebhookUrl: webhookUrl,
      isConfigured: Boolean(webhookUrl),
      googleSheetUrl: GOOGLE_SHEET_VIEW_URL,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { webhookUrl, syncAll } = body;

    if (typeof webhookUrl === 'string') {
      setGoogleSheetWebhookUrl(webhookUrl);
    }

    let syncResult = null;
    if (syncAll) {
      const { projects } = await getProjects();
      syncResult = await pushToGoogleSheetWebhook(projects);
    }

    const currentUrl = getGoogleSheetWebhookUrl();
    return NextResponse.json({
      success: true,
      googleSheetWebhookUrl: currentUrl,
      isConfigured: Boolean(currentUrl),
      syncResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
