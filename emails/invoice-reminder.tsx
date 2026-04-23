import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface InvoiceReminderEmailProps {
  tenantName: string
  propertyName: string
  roomNumber: string
  amount: number
  dueDate: string
  paymentUrl?: string
}

export function InvoiceReminderEmail({
  tenantName,
  propertyName,
  roomNumber,
  amount,
  dueDate,
  paymentUrl,
}: InvoiceReminderEmailProps) {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)

  return (
    <Html>
      <Head />
      <Preview>Tagihan sewa kamar {roomNumber} — {propertyName}</Preview>
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ color: '#1a1a1a', fontSize: '20px', marginBottom: '8px' }}>
            Tagihan Sewa Kos
          </Heading>
          <Text style={{ color: '#555', marginTop: '0' }}>{propertyName}</Text>

          <Hr />

          <Text style={{ color: '#1a1a1a' }}>Halo <strong>{tenantName}</strong>,</Text>
          <Text style={{ color: '#555' }}>
            Berikut adalah informasi tagihan sewa kamar kamu:
          </Text>

          <Section style={{ backgroundColor: '#f9f9f9', borderRadius: '6px', padding: '16px', marginBottom: '24px' }}>
            <Text style={{ margin: '4px 0', color: '#555' }}>Kamar: <strong style={{ color: '#1a1a1a' }}>{roomNumber}</strong></Text>
            <Text style={{ margin: '4px 0', color: '#555' }}>Jumlah tagihan: <strong style={{ color: '#1a1a1a' }}>{formattedAmount}</strong></Text>
            <Text style={{ margin: '4px 0', color: '#555' }}>Jatuh tempo: <strong style={{ color: '#e53e3e' }}>{dueDate}</strong></Text>
          </Section>

          {paymentUrl && (
            <Button
              href={paymentUrl}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                display: 'inline-block',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              Bayar Sekarang
            </Button>
          )}

          <Hr />
          <Text style={{ color: '#999', fontSize: '12px' }}>
            Email ini dikirim otomatis oleh sistem KosManager. Abaikan jika sudah melakukan pembayaran.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
