// src/app/api/webhook/teller/route.ts

// Use these to tell Next.js not to pre-render this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from "next/server";

// Check for ALL required Teller credentials - make sure this runs first
const hasTellerCredentials = !!(
  process.env.TELLER_CERTIFICATE && 
  process.env.TELLER_CERTIFICATE_PRIVATE_KEY &&
  process.env.TELLER_SIGNING_SECRET // Add this - it's needed for signature validation
);

// Create a dummy handler that always returns success if credentials aren't available
export async function POST(req: NextRequest) {
  // Return immediately if credentials aren't available
  if (!hasTellerCredentials) {
    console.log('Teller is not configured. Webhook endpoint is disabled.');
    return NextResponse.json({ status: 'Teller not configured' }, { status: 200 });
  }

  // At this point we know credentials are available, so we can safely import dependencies
  try {
    // Dynamically import dependencies to avoid build-time initialization issues
    const { validateTellerSignature } = await import("@/utils/teller");
    const { createClient } = await import("@midday/supabase/server");
    const { isAfter, subDays } = await import("date-fns");
    const { syncConnection } = await import("jobs/tasks/bank/sync/connection");
    const { z } = await import("zod");

    // Define schema inside the function
    const webhookSchema = z.object({
      id: z.string(),
      payload: z.object({
        enrollment_id: z.string().optional(),
        reason: z.string().optional(),
      }),
      timestamp: z.string(),
      type: z.enum([
        "enrollment.disconnected",
        "transactions.processed",
        "account.number_verification.processed",
        "webhook.test",
      ]),
    });

    // Real handler implementation
    const text = await req.clone().text();
    const body = await req.json();
    
    const signatureValid = validateTellerSignature({
      signatureHeader: req.headers.get("teller-signature"),
      text,
    });
    
    if (!signatureValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }
    
    // Parse and validate webhook body
    const result = webhookSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid webhook payload", details: result.error.issues },
        { status: 400 },
      );
    }
    
    const { type, payload } = result.data;
    if (type === "webhook.test") {
      return NextResponse.json({ success: true });
    }
    
    if (!payload.enrollment_id) {
      return NextResponse.json(
        { error: "Missing enrollment_id" },
        { status: 400 },
      );
    }
    
    const supabase = createClient({ admin: true });
    const { data: connectionData, error: connectionError } = await supabase
      .from("bank_connections")
      .select("id, created_at")
      .eq("enrollment_id", payload.enrollment_id)
      .single();
      
    console.log("payload", payload);
    console.log("connectionData", connectionData);
    console.log("connectionError", connectionError);
    
    if (!connectionData) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 },
      );
    }
    
    switch (type) {
      case "transactions.processed":
        {
          // Only run manual sync if the connection was created in the last 24 hours
          const manualSync = isAfter(
            new Date(connectionData.created_at),
            subDays(new Date(), 1),
          );
          await syncConnection.trigger({
            connectionId: connectionData.id,
            manualSync,
          });
        }
        break;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Teller webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
