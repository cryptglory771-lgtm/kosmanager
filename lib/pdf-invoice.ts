import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const C_GREEN    = rgb(0.04, 0.30, 0.21)
const C_GREEN_LT = rgb(0.82, 0.93, 0.88)
const C_GRAY     = rgb(0.50, 0.50, 0.50)
const C_DARK     = rgb(0.10, 0.10, 0.10)
const C_WHITE    = rgb(1, 1, 1)
const C_RED      = rgb(0.80, 0.10, 0.10)
const C_LINE     = rgb(0.90, 0.90, 0.90)

export type InvoicePdfData = {
  invoiceId: string
  amount: number
  dueDate: string
  paidAt?: string | null
  payMethod?: string | null
  payNote?: string | null
  tenantName: string
  tenantPhone?: string | null
  roomNumber: string
  propertyName: string
  propertyAddress?: string | null
  isPaid: boolean
}

function rp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

const PAY_METHOD_LABEL: Record<string, string> = {
  cash:     'Tunai',
  transfer: 'Transfer Bank',
  qris:     'QRIS',
  online:   'Online (Midtrans)',
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89]) // A4
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg  = await doc.embedFont(StandardFonts.Helvetica)
  const { width, height } = page.getSize()
  const M = 50

  // ── Header bar ────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 75, width, height: 75, color: C_GREEN })
  page.drawRectangle({ x: M, y: height - 63, width: 36, height: 36, color: C_WHITE })
  page.drawText('K', { x: M + 9, y: height - 44, size: 22, font: bold, color: C_GREEN })
  page.drawText('KosManager', { x: M + 46, y: height - 46, size: 16, font: bold, color: C_WHITE })
  page.drawText('Manajemen Kos Profesional', { x: M + 46, y: height - 60, size: 8, font: reg, color: rgb(0.7, 1, 0.85) })
  page.drawText('INVOICE', { x: width - M - 68, y: height - 46, size: 18, font: bold, color: C_WHITE })

  // ── Invoice meta (right column) ───────────────────────────
  const invoiceNum = `INV-${data.invoiceId.slice(-8).toUpperCase()}`
  const dueDateStr = format(new Date(data.dueDate), 'd MMMM yyyy', { locale: localeId })
  const todayStr   = format(new Date(), 'd MMMM yyyy', { locale: localeId })
  const paidAtStr  = data.paidAt
    ? format(new Date(data.paidAt), 'd MMMM yyyy, HH:mm', { locale: localeId })
    : null

  const RX = width - M - 190
  let RY = height - 95

  function metaRow(label: string, value: string) {
    page.drawText(label, { x: RX,      y: RY, size: 8, font: reg,  color: C_GRAY })
    page.drawText(value, { x: RX + 90, y: RY, size: 8, font: bold, color: C_DARK })
    RY -= 15
  }

  metaRow('No. Invoice:',    invoiceNum)
  metaRow('Tanggal Terbit:', todayStr)
  metaRow('Jatuh Tempo:',    dueDateStr)
  if (paidAtStr)       metaRow('Dibayar Pada:',  paidAtStr)
  if (data.payMethod)  metaRow('Metode Bayar:',  PAY_METHOD_LABEL[data.payMethod] ?? data.payMethod)

  // ── From (left column) ────────────────────────────────────
  let y = height - 95
  page.drawText('DARI:', { x: M, y, size: 8, font: bold, color: C_GRAY })
  y -= 14
  page.drawText(data.propertyName, { x: M, y, size: 11, font: bold, color: C_DARK })
  if (data.propertyAddress) {
    y -= 13
    const addr = data.propertyAddress.length > 52
      ? data.propertyAddress.slice(0, 52) + '...'
      : data.propertyAddress
    page.drawText(addr, { x: M, y, size: 9, font: reg, color: C_GRAY })
  }

  y = Math.min(y - 28, RY - 10)

  // ── Divider ───────────────────────────────────────────────
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: C_LINE })
  y -= 22

  // ── Kepada ────────────────────────────────────────────────
  page.drawText('KEPADA:', { x: M, y, size: 8, font: bold, color: C_GRAY })
  y -= 14
  page.drawText(data.tenantName, { x: M, y, size: 12, font: bold, color: C_DARK })
  y -= 15
  page.drawText(`Kamar ${data.roomNumber}`, { x: M, y, size: 10, font: reg, color: C_GRAY })
  if (data.tenantPhone) {
    y -= 13
    page.drawText(data.tenantPhone, { x: M, y, size: 9, font: reg, color: C_GRAY })
  }
  y -= 30

  // ── Table header ──────────────────────────────────────────
  page.drawRectangle({ x: M, y: y - 6, width: width - M * 2, height: 24, color: C_GREEN })
  page.drawText('DESKRIPSI', { x: M + 10,         y: y + 3, size: 9, font: bold, color: C_WHITE })
  page.drawText('JUMLAH',    { x: width - M - 60, y: y + 3, size: 9, font: bold, color: C_WHITE })
  y -= 32

  // ── Table row ─────────────────────────────────────────────
  const month  = format(new Date(data.dueDate), 'MMMM yyyy', { locale: localeId })
  const desc   = `Sewa Kamar ${data.roomNumber} - ${month}`
  const amtStr = rp(data.amount)

  page.drawText(desc, { x: M + 10, y, size: 10, font: reg, color: C_DARK })
  page.drawText(amtStr, {
    x: width - M - 10 - bold.widthOfTextAtSize(amtStr, 10),
    y, size: 10, font: bold, color: C_DARK,
  })

  if (data.payNote) {
    y -= 14
    page.drawText(`Catatan: ${data.payNote}`, { x: M + 10, y, size: 8, font: reg, color: C_GRAY })
  }

  y -= 12
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: C_LINE })
  y -= 28

  // ── Total box ─────────────────────────────────────────────
  const boxW = 210
  const boxX = width - M - boxW
  page.drawRectangle({ x: boxX, y: y - 20, width: boxW, height: 48, color: C_GREEN_LT })
  page.drawText('TOTAL PEMBAYARAN', { x: boxX + 12, y: y + 12, size: 8, font: bold, color: C_GREEN })
  page.drawText(amtStr,             { x: boxX + 12, y: y - 8,  size: 16, font: bold, color: C_GREEN })
  y -= 65

  // ── Status stamp ──────────────────────────────────────────
  if (data.isPaid) {
    page.drawRectangle({ x: M, y: y - 26, width: 180, height: 50, color: rgb(0.88, 0.98, 0.90) })
    page.drawRectangle({ x: M, y: y - 26, width: 5,   height: 50, color: rgb(0.07, 0.55, 0.22) })
    page.drawText('LUNAS',  { x: M + 16, y: y + 8,  size: 22, font: bold, color: rgb(0.05, 0.45, 0.18) })
    if (paidAtStr) {
      page.drawText(`Dibayar: ${paidAtStr}`, { x: M + 16, y: y - 8,  size: 8, font: reg, color: rgb(0.1, 0.5, 0.2) })
    }
    if (data.payMethod) {
      page.drawText(`Metode: ${PAY_METHOD_LABEL[data.payMethod] ?? data.payMethod}`, {
        x: M + 16, y: y - 20, size: 8, font: reg, color: rgb(0.1, 0.5, 0.2),
      })
    }
  } else {
    page.drawRectangle({ x: M, y: y - 20, width: 170, height: 38, color: rgb(1, 0.92, 0.92) })
    page.drawRectangle({ x: M, y: y - 20, width: 5,   height: 38, color: C_RED })
    page.drawText('BELUM DIBAYAR', { x: M + 16, y: y + 2,  size: 15, font: bold, color: C_RED })
    page.drawText(`Jatuh tempo: ${dueDateStr}`, { x: M + 16, y: y - 12, size: 8,  font: reg,  color: C_RED })
  }

  // ── Footer ────────────────────────────────────────────────
  page.drawLine({ start: { x: M, y: 48 }, end: { x: width - M, y: 48 }, thickness: 0.5, color: C_LINE })
  page.drawText('Dokumen ini dibuat otomatis oleh KosManager · kosmanager.id', {
    x: M, y: 30, size: 8, font: reg, color: C_GRAY,
  })
  page.drawText(invoiceNum, {
    x: width - M - reg.widthOfTextAtSize(invoiceNum, 8),
    y: 30, size: 8, font: reg, color: C_GRAY,
  })

  return doc.save()
}
