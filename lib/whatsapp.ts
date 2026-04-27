export async function sendWhatsAppFile(
  phone: string,
  fileUrl: string,
  filename: string,
  caption?: string,
) {
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': process.env.FONNTE_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target: phone, file: fileUrl, filename, message: caption ?? '' }),
  })
  return res.json()
}

export async function sendWhatsApp(phone: string, message: string) {
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': process.env.FONNTE_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target: phone, message }),
  })
  return res.json()
}

type InvoiceMessageParams = {
  tenantName: string
  propertyName: string
  roomNumber: string
  amount: number
  dueDate: string
  type: 'h7' | 'h3' | 'overdue' | 'manual'
  paymentUrl?: string | null
}

function paymentCta(url?: string | null): string {
  if (!url) return ''
  return `\n\n💳 *Bayar Sekarang:*\n${url}`
}

export function buildInvoiceMessage(p: InvoiceMessageParams): string {
  const rupiah = `Rp ${p.amount.toLocaleString('id-ID')}`
  const header = `*${p.propertyName}*`
  const cta    = paymentCta(p.paymentUrl)

  switch (p.type) {
    case 'h7':
      return (
        `Halo *${p.tenantName}*! 👋\n\n` +
        `Pengingat dari ${header} — tagihan sewa kamar *${p.roomNumber}* akan jatuh tempo dalam *7 hari* lagi.\n\n` +
        `📋 *Detail Tagihan*\n` +
        `• Kamar: ${p.roomNumber}\n` +
        `• Jumlah: ${rupiah}\n` +
        `• Jatuh tempo: ${p.dueDate}\n\n` +
        `Mohon siapkan pembayaran sebelum tanggal jatuh tempo. Terima kasih! 🙏` +
        cta
      )

    case 'h3':
      return (
        `Halo *${p.tenantName}*! ⚠️\n\n` +
        `Tagihan sewa kamar *${p.roomNumber}* di ${header} akan jatuh tempo dalam *3 hari* lagi.\n\n` +
        `📋 *Detail Tagihan*\n` +
        `• Kamar: ${p.roomNumber}\n` +
        `• Jumlah: ${rupiah}\n` +
        `• Jatuh tempo: ${p.dueDate}\n\n` +
        `Segera lakukan pembayaran untuk menghindari keterlambatan. Terima kasih!` +
        cta
      )

    case 'overdue':
      return (
        `Halo *${p.tenantName}*,\n\n` +
        `⚠️ Tagihan sewa kamar *${p.roomNumber}* di ${header} telah *melewati jatuh tempo*.\n\n` +
        `📋 *Detail Tagihan*\n` +
        `• Kamar: ${p.roomNumber}\n` +
        `• Jumlah: ${rupiah}\n` +
        `• Jatuh tempo: ${p.dueDate} _(terlambat)_\n\n` +
        `Mohon segera selesaikan pembayaran atau hubungi kami untuk konfirmasi. Terima kasih atas perhatiannya.` +
        cta
      )

    case 'manual':
    default:
      return (
        `Halo *${p.tenantName}*! 👋\n\n` +
        `Ini pengingat tagihan sewa dari ${header}:\n\n` +
        `📋 *Detail Tagihan*\n` +
        `• Kamar: ${p.roomNumber}\n` +
        `• Jumlah: ${rupiah}\n` +
        `• Jatuh tempo: ${p.dueDate}\n\n` +
        `Mohon segera lakukan pembayaran. Terima kasih! 🙏` +
        cta
      )
  }
}
