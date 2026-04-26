import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendWhatsApp, buildInvoiceMessage } from '@/lib/whatsapp'
import { createPaymentTransaction } from '@/lib/midtrans'
import { InvoiceReminderEmail } from '@/emails/invoice-reminder'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const in7days   = new Date(today); in7days.setDate(today.getDate() + 7)
  const in3days   = new Date(today); in3days.setDate(today.getDate() + 3)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  const dateMap: Record<string, 'h7' | 'h3' | 'overdue'> = {
    [fmt(in7days)]:   'h7',
    [fmt(in3days)]:   'h3',
    [fmt(yesterday)]: 'overdue',
  }

  const { data: invoices, error } = await supabaseAdmin
    .from('invoices')
    .select(`
      id, amount, due_date, status,
      tenants ( id, name, phone, email,
        rooms ( room_number,
          properties ( name )
        )
      )
    `)
    .in('due_date', [fmt(in7days), fmt(in3days), fmt(yesterday)])
    .eq('status', 'unpaid')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = []

  for (const invoice of invoices ?? []) {
    const tenant   = invoice.tenants as any
    if (!tenant) continue

    const room     = tenant.rooms
    const property = room?.properties
    const msgType  = dateMap[invoice.due_date] ?? 'manual'

    // Create Midtrans payment transaction for each invoice
    let paymentUrl: string | null = null
    let paymentOrderId: string | null = null

    try {
      const payment = await createPaymentTransaction({
        invoiceId:    invoice.id,
        amount:       invoice.amount,
        tenantName:   tenant.name,
        tenantPhone:  tenant.phone  ?? null,
        tenantEmail:  tenant.email  ?? null,
        roomNumber:   room?.room_number ?? '-',
        propertyName: property?.name    ?? 'Kos',
      })
      paymentUrl    = payment.paymentUrl
      paymentOrderId = payment.orderId

      await supabaseAdmin
        .from('invoices')
        .update({ payment_url: paymentUrl, payment_order_id: paymentOrderId })
        .eq('id', invoice.id)
    } catch (payErr) {
      console.error('[cron/send-reminders] Midtrans error for invoice', invoice.id, payErr)
    }

    const waMessage = buildInvoiceMessage({
      tenantName:   tenant.name,
      propertyName: property?.name    ?? 'Kos',
      roomNumber:   room?.room_number ?? '-',
      amount:       invoice.amount,
      dueDate:      invoice.due_date,
      type:         msgType,
      paymentUrl,
    })

    const waResult = await sendWhatsApp(tenant.phone, waMessage)

    let emailResult = null
    if (tenant.email) {
      const { error: emailError } = await resend.emails.send({
        from: 'KosManager <onboarding@resend.dev>',
        to: tenant.email,
        subject: `Tagihan sewa kamar ${room?.room_number} — ${property?.name}`,
        react: InvoiceReminderEmail({
          tenantName:   tenant.name,
          propertyName: property?.name ?? '',
          roomNumber:   room?.room_number ?? '',
          amount:       invoice.amount,
          dueDate:      invoice.due_date,
        }),
      })
      emailResult = emailError ? { error: emailError.message } : { ok: true }
    }

    await supabaseAdmin.from('notifications').insert([
      { invoice_id: invoice.id, channel: 'whatsapp', status: waResult?.status ? 'sent' : 'failed' },
      ...(tenant.email ? [{ invoice_id: invoice.id, channel: 'email', status: emailResult?.ok ? 'sent' : 'failed' }] : []),
    ])

    results.push({ invoice_id: invoice.id, type: msgType, wa: waResult?.status, email: emailResult, paymentUrl })
  }

  return NextResponse.json({ sent: results.length, results })
}
