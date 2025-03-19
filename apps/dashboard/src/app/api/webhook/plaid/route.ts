import { NextResponse } from 'next/server';
import { PlaidApi, Configuration } from 'plaid';

// Check if required environment variables exist
const hasPlaidCredentials = !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);

// Only initialize Plaid if credentials are available
const plaidClient = hasPlaidCredentials 
  ? new PlaidApi(
      new Configuration({
        basePath: process.env.PLAID_ENV === 'sandbox' ? 'https://sandbox.plaid.com' : 'https://production.plaid.com',
        baseOptions: {
          headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
            'PLAID-SECRET': process.env.PLAID_SECRET!,
          },
        },
      })
    )
  : null;

export async function POST(request: Request) {
  // If Plaid is not configured, return a successful response
  if (!hasPlaidCredentials || !plaidClient) {
    console.log('Plaid is not configured. Webhook endpoint is disabled.');
    return NextResponse.json({ status: 'Plaid not configured' }, { status: 200 });
  }

  // Your existing webhook handling code here
  try {
    // Rest of your Plaid webhook handling code...
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Plaid webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
