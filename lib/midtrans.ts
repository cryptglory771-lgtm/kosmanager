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
  const orderId = `INV-${invoiceId}-${Date.now()}`
  const nameParts = tenantName.trim().split(/\s+/)

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(' ') || undefined,
      ...(tenantPhone ? { phone: tenantPhone } : {}),
      ...(tenantEmail ? { email: tenantEmail } : {}),
    },
    item_details: [
      {
        id: invoiceId,
        price: amount,
        quantity: 1,
        name: `Sewa Kamar ${roomNumber} - ${propertyName}`,
      },
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices`,
    },
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
