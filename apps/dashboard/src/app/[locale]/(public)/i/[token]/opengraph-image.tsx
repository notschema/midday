// Export a static image instead of a dynamic edge function
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

// Use a simple static image for all invoices
export default function Image() {
  return new URL("../../../../public/images/invoice-og.png", import.meta.url);
}
