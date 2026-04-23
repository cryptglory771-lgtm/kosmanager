import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendWhatsApp, buildInvoiceMessage } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId wajib diisi' }, { status: 400 })

  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .select(`
      id, amount, due_date,
      tenants ( name, phone,
        rooms ( room_number,
          properties ( name )
        )
      )
    `)
    .eq('id', invoiceId)
    .single()

  if (error || !invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })

  const tenant = invoice.tenants as any
  const room = tenant?.rooms
  const property = room?.properties

  const message = buildInvoiceMessage({
    tenantName: tenant?.name ?? '',
    propertyName: property?.name ?? 'Kos',
    roomNumber: room?.room_number ?? '-',
    amount: invoice.amount,
    dueDate: invoice.due_date,
    type: 'manual',
  })

  const result = await sendWhatsApp(tenant?.phone, message)

  await supabaseAdmin.from('notifications').insert({
    invoice_id: invoice.id,
    channel: 'whatsapp',
    status: result?.status ? 'sent' : 'failed',
  })

  return NextResponse.json({ ok: result?.status ?? false, message })
}
