import { supabaseAdmin } from './supabase-server'

const BUCKET = 'invoices'

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
  }
}

export async function uploadInvoicePdf(
  buffer: Uint8Array,
  invoiceId: string,
  type: 'invoice' | 'receipt',
): Promise<string> {
  await ensureBucket()

  const path = `${type}/${invoiceId}.pdf`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
