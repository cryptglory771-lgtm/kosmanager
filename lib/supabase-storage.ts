import { supabaseAdmin } from './supabase-server'

export async function uploadInvoicePdf(
  buffer: Uint8Array,
  invoiceId: string,
  type: 'invoice' | 'receipt',
): Promise<string> {
  const path = `${type}/${invoiceId}.pdf`

  const { error } = await supabaseAdmin.storage
    .from('invoices')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabaseAdmin.storage.from('invoices').getPublicUrl(path)
  return data.publicUrl
}
