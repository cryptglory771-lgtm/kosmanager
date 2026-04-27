import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendWhatsApp, sendWhatsAppFile, buildInvoiceMessage } from '@/lib/whatsapp'
import { createPaymentTransaction } from '@/lib/midtrans'
import { generateInvoicePdf } from '@/lib/pdf-invoice'
import { uploadInvoicePdf } from '@/lib/supabase-storage'

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, templateType } = await req.json()
    if (!invoiceId) return NextResponse.json({ ok: false, error: 'invoiceId wajib diisi' }, { status: 400 })

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        id, amount, due_date, status, pdf_url,
        tenants ( name, phone,
          rooms ( room_number,
            properties ( name, address )
          )
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) return NextResponse.json({ ok: false, error: 'Invoice tidak ditemukan' }, { status: 404 })
    if (invoice.status === 'paid') return NextResponse.json({ ok: false, error: 'Invoice sudah lunas' }, { status: 400 })

    const tenant   = invoice.tenants as any
    const room     = tenant?.rooms
    const property = room?.properties

    // ── Midtrans payment link ──────────────────────────────
    let paymentUrl: string | null = null
    let paymentOrderId: string | null = null
    let midtransError: string | null = null
    try {
      const payment = await createPaymentTransaction({
        invoiceId:    invoice.id,
        amount:       invoice.amount,
        tenantName:   tenant?.name      ?? 'Penyewa',
        tenantPhone:  tenant?.phone     ?? null,
        roomNumber:   room?.room_number ?? '-',
        propertyName: property?.name    ?? 'Kos',
      })
      paymentUrl     = payment.paymentUrl
      paymentOrderId = payment.orderId
      await supabaseAdmin
        .from('invoices')
        .update({ payment_url: paymentUrl, payment_order_id: paymentOrderId })
        .eq('id', invoice.id)
    } catch (payErr: any) {
      midtransError = payErr?.message ?? String(payErr)
      console.error('[send-reminder] Midtrans error:', payErr)
    }

    // ── Generate invoice PDF ───────────────────────────────
    let pdfUrl: string | null = (invoice as any).pdf_url ?? null
    try {
      const pdfBuffer = await generateInvoicePdf({
        invoiceId:       invoice.id,
        amount:          invoice.amount,
        dueDate:         invoice.due_date,
        isPaid:          false,
        tenantName:      tenant?.name           ?? '',
        tenantPhone:     tenant?.phone          ?? null,
        roomNumber:      room?.room_number      ?? '-',
        propertyName:    property?.name         ?? 'Kos',
        propertyAddress: property?.address      ?? null,
      })
      pdfUrl = await uploadInvoicePdf(pdfBuffer, invoice.id, 'invoice')
      await supabaseAdmin.from('invoices').update({ pdf_url: pdfUrl }).eq('id', invoice.id)
    } catch (pdfErr) {
      console.error('[send-reminder] PDF error:', pdfErr)
    }

    // ── Build WA message ──────────────────────────────────
    const message = buildInvoiceMessage({
      tenantName:   tenant?.name      ?? '',
      propertyName: property?.name    ?? 'Kos',
      roomNumber:   room?.room_number ?? '-',
      amount:       invoice.amount,
      dueDate:      invoice.due_date,
      type:         (templateType ?? 'manual') as 'h7' | 'h3' | 'overdue' | 'manual',
      paymentUrl,
    })

    // ── Send WhatsApp (with PDF if available) ─────────────
    let waOk = false
    try {
      if (pdfUrl && tenant?.phone) {
        const result = await sendWhatsAppFile(
          tenant.phone,
          pdfUrl,
          `invoice-kamar-${room?.room_number ?? ''}.pdf`,
          message,
        )
        waOk = result?.status ?? false
      } else if (tenant?.phone) {
        const result = await sendWhatsApp(tenant.phone, message)
        waOk = result?.status ?? false
      }
    } catch (waErr) {
      console.error('[send-reminder] WhatsApp error:', waErr)
    }

    await supabaseAdmin.from('notifications').insert({
      invoice_id: invoice.id,
      channel:    'whatsapp',
      status:     waOk ? 'sent' : 'failed',
    })

    return NextResponse.json({ ok: waOk, message, paymentUrl, pdfUrl, midtransError })
  } catch (err) {
    console.error('[send-reminder] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
