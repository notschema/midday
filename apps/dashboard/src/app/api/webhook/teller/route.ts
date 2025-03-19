// src/app/api/webhook/teller/route.ts

// Use these to tell Next.js not to pre-render this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Skip all imports that might cause initialization issues
// import { validateTellerSignature } from "@/utils/teller";
// import { createClient } from "@midday/supabase/server";
// import { isAfter, subDays } from "date-fns";
// import { syncConnection } from "jobs/tasks/bank/sync/connection";
import { type NextRequest, NextResponse } from "next/server";
// import { z } from "zod";

// Check for Teller credentials - make absolutely sure this runs first
const hasTellerCredentials = !!(
  process.env.TELLER_CERTIFICATE && 
  process.env.TELLER_CERTIFICATE_PRIVATE_KEY
);

// Only import and define things conditionally if we have credentials
// This prevents instantiation of classes that might throw errors during build
const getHandler = () => {
  // If no credentials, return a simple handler
  if (!hasTellerCredentials) {
    return async () => {
      console.log('Teller is not configured. Webhook endpoint is disabled.');
      return NextResponse.json({ status: 'Teller not configured' }, { status: 200 });
    };
  }

  // Otherwise, import the real dependencies and create the real handler
  // These imports will only happen if we have credentials
  const { validateTellerSignature } = require("@/utils/teller");
  const { createClient } = require("@midday/supabase/server");
  const { isAfter, subDays } = require("date-fns");
  const { syncConnection } = require("jobs/tasks/bank/sync/connection");
  const { z } = require("zod");

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

  // Return the real handler
  return async (req: NextRequest) => {
    try {
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
  };
};

// Export the POST handler, which will either be the real handler or the simple one
export const POST = getHandler();
