// src/app/api/apps/slack/install-url/route.ts

// Add dynamic and runtime directives
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getInstallUrl } from "@midday/app-store/slack";
import { getUser } from "@midday/supabase/cached-queries";
import { NextResponse } from "next/server";

export async function GET() {
  // Check for required credentials
  const hasSlackCredentials = !!(
    process.env.SLACK_CLIENT_ID && 
    process.env.SLACK_CLIENT_SECRET
  );
  
  // Handle missing credentials gracefully
  if (!hasSlackCredentials) {
    console.warn('Slack credentials not available');
    return NextResponse.json({ 
      url: '#slack-not-configured',
      status: 'Slack not configured' 
    }, { status: 200 });
  }
  
  try {
    const { data } = await getUser();
    if (!data) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const url = await getInstallUrl({
      teamId: data.team_id,
      userId: data.id,
    });
    
    return NextResponse.json({
      url,
    });
  } catch (error) {
    console.error('Error generating Slack install URL:', error);
    return NextResponse.json(
      { error: "Failed to generate install URL" },
      { status: 500 }
    );
  }
}
