// eslint-disable-next-line @typescript-eslint/no-require-imports
const MidtransClient = require('midtrans-client')

function getSnap() {
  return new MidtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  })
}

export type CreateTransactionResult = {
  orderId: string
  token: string
  paymentUrl: string
}

export async function createPaymentTransaction(params: {
  invoiceId: string
  amount: number
  tenantName: string
  tenantPhone?: string | null
  tenantEmail?: string | null
  roomNumber: string
  propertyName: string
}): Promise<CreateTransactionResult> {
  const { invoiceId, amount, tenantName, tenantPhone, tenantEmail, roomNumber, propertyName } = params

  // max 36 chars — Midtrans limits order_id to 50 chars; UUID alone is 36
  const orderId = `KM-${invoiceId.replace(/-/g, '').slice(0, 20)}`

  // Supabase numeric cols return as string — Midtrans requires integer
  const grossAmount = Math.round(Number(amount))

  // item name max 50 chars
  const itemName = `Sewa Kamar ${roomNumber} - ${propertyName}`.slice(0, 50)

  const nameParts = tenantName.trim().split(/\s+/)
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const parameter = {
    transaction_details: {
      order_id:     orderId,
      gross_amount: grossAmount,
    },
    customer_details: {
      first_name: nameParts[0],
      last_name:  nameParts.slice(1).join(' ') || undefined,
      ...(tenantPhone ? { phone: tenantPhone } : {}),
      ...(tenantEmail ? { email: tenantEmail } : {}),
    },
    item_details: [
      {
        id:       invoiceId,
        price:    grossAmount,
        quantity: 1,
        name:     itemName,
      },
    ],
    ...(siteUrl ? {
      callbacks: {
        finish: `${siteUrl}/dashboard/invoices/${invoiceId}/paid?method=online`,
      },
    } : {}),
  }

  const snap = getSnap()
  const result = await snap.createTransaction(parameter)
  return {
    orderId,
    token: result.token as string,
    paymentUrl: result.redirect_url as string,
  }
}

export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  const { createHash } = require('crypto') as typeof import('crypto')
  const hash = createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest('hex')
  return hash === signatureKey
}
