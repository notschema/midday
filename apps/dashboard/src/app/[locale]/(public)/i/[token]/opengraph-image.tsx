import { OgTemplate } from "@midday/invoice";
import { verify } from "@midday/invoice/token";
import { createClient } from "@midday/supabase/server";
import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const runtime = "edge";

export default async function Image({ params }: { params: { token: string } }) {
  const supabase = createClient({ admin: true });
  const { id } = await verify(params.token);
  
  // Use your existing query function
  const { data: invoice } = await getInvoiceQuery(supabase, id);

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  // Create logo URL as before
  const logoUrl = `https://img.logo.dev/${invoice.customer?.website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=60`;
  
  // Simple validation - assume valid, component handles fallback
  const isValidLogo = !!invoice.customer?.website;

  // IMPORTANT: Remove font loading and use system fonts
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
      // No custom fonts defined here
    }
  );
}
