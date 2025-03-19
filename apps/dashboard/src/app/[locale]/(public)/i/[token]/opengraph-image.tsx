import { OgTemplate } from "@midday/invoice";
import { verify } from "@midday/invoice/token";
import { createClient } from "@midday/supabase/server";
import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const runtime = "edge";

export default async function Image({ params }: { params: { token: string } }) {
  const supabase = createClient({ admin: true });
  const { id } = await verify(params.token);
  
  // Direct, simplified query instead of using getInvoiceQuery
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, invoice_number, issue_date, due_date, customer_name, template, customer_details, from_details, status, customer:customers(name, website)')
    .eq('id', id)
    .single();

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  // Simplified logo approach - assume valid and let component handle fallback
  const logoUrl = invoice.customer?.website 
    ? `https://img.logo.dev/${invoice.customer.website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=60` 
    : null;
  
  // Assume valid, component will handle fallback
  const isValidLogo = !!logoUrl;

  // Use ImageResponse without custom fonts
  return new ImageResponse(
    <OgTemplate
      {...invoice}
      name={invoice.customer_name || invoice.customer?.name}
      isValidLogo={isValidLogo}
      logoUrl={logoUrl}
    />,
    {
      width: 1200,
      height: 630,
      // No custom fonts - will use system fonts
    }
  );
}
