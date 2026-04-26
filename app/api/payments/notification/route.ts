import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { verifySignature } from '@/lib/midtrans'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body

    // Verify Midtrans signature
    if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
      console.error('[payment/notification] Invalid signature, order:', order_id)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Determine payment outcome
    const isPaid =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && (!fraud_status || fraud_status === 'accept'))

    const isFailed = ['cancel', 'deny', 'expire'].includes(transaction_status)

    // Pending — nothing to do yet
    if (!isPaid && !isFailed) {
      return NextResponse.json({ ok: true, status: 'pending' })
    }

    // Find invoice by payment_order_id
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        id, amount, status,
        tenants ( name, phone,
          rooms ( room_number,
            properties ( name )
          )
        )
      `)
      .eq('payment_order_id', order_id)
      .single()

    if (error || !invoice) {
      console.error('[payment/notification] Invoice not found, order:', order_id)
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ ok: true, status: 'already_paid' })
    }

    const tenant   = invoice.tenants as any
    const room     = tenant?.rooms
    const property = room?.properties
    const rupiah   = `Rp ${Number(invoice.amount).toLocaleString('id-ID')}`

    if (isPaid) {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', invoice.id)

      const message =
        `✅ *Pembayaran Berhasil!*\n\n` +
        `Halo *${tenant?.name}* 👋, pembayaran sewa kamar *${room?.room_number}* di *${property?.name}* sebesar *${rupiah}* sudah kami terima.\n\n` +
        `Terima kasih atas pembayaran tepat waktu! 🙏\n\n` +
        `_Simpan pesan ini sebagai bukti pembayaran Anda._`

      if (tenant?.phone) {
        await sendWhatsApp(tenant.phone, message).catch(e =>
          console.error('[payment/notification] WA success error:', e)
        )
        await supabaseAdmin.from('notifications').insert({
          invoice_id: invoice.id,
          channel: 'whatsapp',
          status: 'sent',
        })
      }
    } else {
      const message =
        `❌ *Pembayaran Tidak Berhasil*\n\n` +
        `Halo *${tenant?.name}*, pembayaran sewa kamar *${room?.room_number}* di *${property?.name}* sebesar *${rupiah}* tidak berhasil diproses.\n\n` +
        `Silakan coba lagi melalui link yang kami kirimkan sebelumnya, atau hubungi kami jika ada kendala.`

      if (tenant?.phone) {
        await sendWhatsApp(tenant.phone, message).catch(e =>
          console.error('[payment/notification] WA failed error:', e)
        )
      }
    }

    return NextResponse.json({ ok: true, status: isPaid ? 'paid' : 'failed' })
  } catch (err) {
    console.error('[payment/notification] unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
