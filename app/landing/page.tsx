import type { Metadata } from 'next'
import Link from 'next/link'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './styles.css'

export const metadata: Metadata = {
  title: 'KosManager — Kelola Kos Lebih Cerdas',
  description: 'Platform manajemen kos terlengkap. Tagihan otomatis, reminder WhatsApp, dan laporan keuangan real-time.',
}

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export default function LandingPage() {
  return (
    <div className={`${fraunces.variable} ${plusJakarta.variable}`}>

      {/* NAV */}
      <nav>
        <Link href="/" className="logo">
          <div className="logo-mark">K</div>
          <div className="logo-text">Kos<span>Manager</span></div>
        </Link>
        <ul className="nav-links">
          <li><a href="#fitur">Fitur</a></li>
          <li><a href="#cara-kerja">Cara Kerja</a></li>
          <li><a href="#harga">Harga</a></li>
          <li><a href="#testimoni">Testimoni</a></li>
        </ul>
        <div className="nav-actions">
          <Link href="/login" className="btn-ghost">Masuk</Link>
          <Link href="/login" className="btn-primary">Coba Gratis →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-badge fade-up delay-1">
            <div className="hero-badge-dot"></div>
            Baru — Integrasi WhatsApp Otomatis
          </div>
          <h1 className="hero-headline fade-up delay-2">
            Kos kamu,<br />dikelola<br /><em>otomatis.</em>
          </h1>
          <p className="hero-sub fade-up delay-3">
            KosManager membantu pemilik kos kirim tagihan, reminder WA, dan terima pembayaran digital — semua otomatis, tanpa ribet.
          </p>
          <div className="hero-actions fade-up delay-4">
            <Link href="/login" className="btn-primary btn-large">Mulai Gratis 14 Hari <span>→</span></Link>
            <a href="#cara-kerja" className="btn-ghost btn-large">Lihat Cara Kerja</a>
          </div>
          <p className="hero-note fade-up delay-4">
            <span>✓</span> Tanpa kartu kredit &nbsp;·&nbsp; <span>✓</span> Setup 5 menit &nbsp;·&nbsp; <span>✓</span> Batalkan kapanpun
          </p>
          <div className="hero-stats fade-up delay-5">
            <div><div className="stat-val">7.000+</div><div className="stat-label">Kamar terkelola</div></div>
            <div><div className="stat-val">98%</div><div className="stat-label">Tagihan terbayar tepat waktu</div></div>
            <div><div className="stat-val">3 mnt</div><div className="stat-label">Rata-rata setup pertama</div></div>
          </div>
        </div>

        <div className="hero-right">
          <div className="grid-pattern"></div>
          <div className="float-card fc-left">
            <div className="fc-label">PEMASUKAN BULAN INI</div>
            <div className="fc-value">Rp 9,2jt</div>
            <div className="fc-sub"><span className="fc-up">↑ 18%</span> dari bulan lalu</div>
          </div>
          <div className="float-card fc-right float-card-2">
            <div className="fc-wa-label">REMINDER TERKIRIM ✓</div>
            <div className="fc-wa-msg">Halo Pak Budi 👋 Tagihan Rp 850.000 jatuh tempo 3 hari lagi. Klik untuk bayar →</div>
            <div className="fc-wa-sent">09:41 ✓✓ via WhatsApp</div>
          </div>
          <div className="phone-container">
            <div className="phone">
              <div className="phone-inner">
                <div className="phone-status"><span>09:41</span><span>▮▮▮ WiFi</span></div>
                <div className="phone-hero-section">
                  <div className="ph-greeting">Selamat pagi,</div>
                  <div className="ph-name">Bu Sari ☀️</div>
                  <div className="ph-card">
                    <div className="ph-stat"><div className="ph-stat-val">12</div><div className="ph-stat-label">Total kamar</div></div>
                    <div className="ph-divider"></div>
                    <div className="ph-stat"><div className="ph-stat-val">10</div><div className="ph-stat-label">Terisi</div></div>
                    <div className="ph-divider"></div>
                    <div className="ph-stat"><div className="ph-stat-val">Rp 7,8jt</div><div className="ph-stat-label">Bulan ini</div></div>
                  </div>
                </div>
                <div className="phone-content">
                  <div className="ph-section-title">Status kamar</div>
                  <div className="ph-room-grid">
                    <div className="ph-room filled"><div className="ph-room-num">1A</div></div>
                    <div className="ph-room filled"><div className="ph-room-num">1B</div></div>
                    <div className="ph-room soon"><div className="ph-room-num">1C</div></div>
                    <div className="ph-room empty"><div className="ph-room-num">1D</div></div>
                    <div className="ph-room filled"><div className="ph-room-num">2A</div></div>
                    <div className="ph-room filled"><div className="ph-room-num">2B</div></div>
                    <div className="ph-room filled"><div className="ph-room-num">2C</div></div>
                    <div className="ph-room filled"><div className="ph-room-num">2D</div></div>
                  </div>
                  <div className="ph-section-title">Tagihan terbaru</div>
                  <div className="ph-invoice">
                    <div className="ph-avatar" style={{background:'#DCFCE7',color:'#166534'}}>BS</div>
                    <div className="ph-inv-info"><div className="ph-inv-name">Budi Santoso</div><div className="ph-inv-room">Kamar 2B</div></div>
                    <span className="ph-badge badge-lunas">Lunas</span>
                  </div>
                  <div className="ph-invoice">
                    <div className="ph-avatar" style={{background:'#FEE2E2',color:'#991B1B'}}>AN</div>
                    <div className="ph-inv-info"><div className="ph-inv-name">Anisa Nur</div><div className="ph-inv-room">Kamar 1C</div></div>
                    <span className="ph-badge badge-belum">Belum</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="trust-strip">
        <span className="trust-label">Dipercaya oleh</span>
        <div className="trust-items">
          {[['🏠','500+ Pemilik Kos'],['🏙️','12 Kota di Indonesia'],['💰','Rp 2M+ Ditagihkan/Bulan'],['⭐','Rating 4.9/5 dari User'],['🔒','Data 100% Aman & Terenkripsi']].map(([icon, text]) => (
            <div key={text} className="trust-item"><span className="trust-icon">{icon}</span> {text}</div>
          ))}
        </div>
      </div>

      {/* PAIN POINTS */}
      <section>
        <div className="pain-section">
          <div className="section-label">Masalah yang kami selesaikan</div>
          <div className="section-title">Berhenti kelola kos<br />dengan cara <em>lama.</em></div>
          <div className="pain-grid">
            <div className="pain-list">
              <div style={{fontSize:'15px',fontWeight:800,color:'#DC2626',marginBottom:'4px'}}>❌ Cara lama — menyita waktu</div>
              {[['😤','Tagih penyewa satu-satu via WA setiap bulan — bolak-balik cek siapa yang sudah bayar'],['📝','Rekap pembayaran manual di buku atau spreadsheet yang mudah hilang'],['😰','Kamar tiba-tiba kosong karena lupa ingatkan penyewa soal kontrak yang mau habis'],['🏦','Penyewa minta transfer manual, susah dikonfirmasi, sering bermasalah']].map(([icon, text]) => (
                <div key={text} className="pain-item"><div className="pain-x">{icon}</div><div className="pain-text">{text}</div></div>
              ))}
            </div>
            <div className="solution-list">
              <div style={{fontSize:'15px',fontWeight:800,color:'#0B4D35',marginBottom:'4px'}}>✅ Dengan KosManager</div>
              {['Reminder tagihan WA & email terkirim otomatis ke semua penyewa — kamu tidak perlu lakukan apapun','Laporan keuangan real-time di dashboard — langsung tahu siapa lunas, siapa belum','Notifikasi kontrak hampir habis H-30 — kamu selalu siap sebelum kamar jadi kosong','Penyewa bayar via QRIS, GoPay, OVO, transfer bank — status otomatis terupdate'].map(text => (
                <div key={text} className="solution-item"><div className="sol-check">✓</div><div className="sol-text">{text}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fitur">
        <div className="section-label">Fitur unggulan</div>
        <div className="section-title">Semua yang kamu butuhkan,<br /><em>dalam satu tempat.</em></div>
        <p className="section-sub">Dirancang khusus untuk owner kos Indonesia. Sederhana, powerful, dan bisa langsung dipakai hari ini.</p>
        <div className="features-grid">
          {[
            {icon:'💬',title:'Reminder WA Otomatis',desc:'Kirim pesan WhatsApp ke penyewa secara otomatis H-7, H-3, dan H+1 jatuh tempo. Template pesan dalam Bahasa Indonesia yang sopan dan natural.',highlight:true},
            {icon:'💳',title:'Pembayaran Digital',desc:'Penyewa bayar via QRIS, GoPay, OVO, atau transfer bank langsung dari link yang dikirim di WA. Status tagihan terupdate otomatis.'},
            {icon:'🏠',title:'Manajemen Kamar Visual',desc:'Lihat status semua kamar sekilas pandang — hijau terisi, merah kosong, kuning mau habis kontrak. Tanpa tabel rumit.'},
            {icon:'📊',title:'Laporan Keuangan',desc:'Ringkasan pemasukan bulanan, tingkat hunian, dan tren 6 bulan. Export PDF atau kirim langsung ke WA kamu dalam satu tap.'},
            {icon:'📧',title:'Notifikasi Email',desc:'Tagihan dan kwitansi digital dikirim ke email penyewa secara otomatis. Desain profesional yang membuat kos kamu terlihat terpercaya.'},
            {icon:'👥',title:'Multi-Properti',desc:'Kelola beberapa properti kos dari satu dashboard. Cocok untuk investor dengan banyak lokasi atau manajer properti profesional.'},
          ].map(f => (
            <div key={f.title} className={`feature-card${f.highlight ? ' feature-highlight' : ''}`}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="cara-kerja">
        <div style={{textAlign:'center'}}>
          <div className="section-label">Cara kerja</div>
          <div className="section-title">Mulai dalam <em>3 langkah</em><br />mudah.</div>
          <p className="section-sub" style={{margin:'0 auto'}}>Setup pertama selesai dalam 5 menit. Tidak perlu keahlian teknis apapun.</p>
        </div>
        <div className="steps-grid">
          {[
            {n:'1',title:'Daftar & setup kos',desc:'Input nama kos, jumlah kamar, dan harga sewa. Login cukup pakai nomor HP — tidak perlu ingat password.'},
            {n:'2',title:'Tambah penyewa',desc:'Input nama, nomor WA, dan tanggal sewa penyewa. Sistem otomatis aktifkan reminder dan buat tagihan bulanan.'},
            {n:'3',title:'Terima bayar otomatis',desc:'Penyewa terima link bayar via WA, klik, bayar sesuai metode pilihan. Kamu dapat notifikasi saat uang masuk.'},
          ].map(s => (
            <div key={s.n} className="step-item">
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="harga">
        <div style={{textAlign:'center'}}>
          <div className="section-label">Harga transparan</div>
          <div className="section-title">Mulai gratis,<br /><em>upgrade kapanpun.</em></div>
          <p className="section-sub" style={{margin:'0 auto'}}>Tidak ada biaya tersembunyi. Batalkan kapanpun.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="plan-name">GRATIS</div>
            <div className="plan-price">Rp 0</div>
            <div className="plan-period">selamanya</div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              {['Maksimal 10 kamar','3 reminder WA per bulan','Dashboard dasar','1 properti'].map(f=><li key={f} className="plan-feature">{f}</li>)}
            </ul>
            <Link href="/login" className="btn-plan" style={{display:'block',textAlign:'center',textDecoration:'none'}}>Mulai Gratis</Link>
          </div>
          <div className="pricing-card featured">
            <div className="popular-badge">✦ PALING POPULER</div>
            <div className="plan-name">STARTER</div>
            <div className="plan-price">Rp 99rb</div>
            <div className="plan-period">per bulan · hemat 20% bayar tahunan</div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              {['Maksimal 50 kamar','WA & email reminder otomatis','Payment gateway (QRIS, GoPay, OVO)','Laporan keuangan + export PDF','1 properti','Support via WhatsApp'].map(f=><li key={f} className="plan-feature">{f}</li>)}
            </ul>
            <Link href="/login" className="btn-plan featured-btn" style={{display:'block',textAlign:'center',textDecoration:'none'}}>Coba 14 Hari Gratis</Link>
          </div>
          <div className="pricing-card">
            <div className="plan-name">PRO</div>
            <div className="plan-price">Rp 299rb</div>
            <div className="plan-period">per bulan</div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              {['Unlimited kamar','Multi-properti (unlimited)','Akses tim & manajer properti','Laporan keuangan lengkap + Excel','Template WA kustom','Priority support'].map(f=><li key={f} className="plan-feature">{f}</li>)}
            </ul>
            <Link href="/login" className="btn-plan" style={{display:'block',textAlign:'center',textDecoration:'none'}}>Mulai Gratis 14 Hari</Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testi-section" id="testimoni">
        <div className="section-label">Dari pengguna kami</div>
        <div className="section-title">Owner kos yang sudah<br /><em>merasakan manfaatnya.</em></div>
        <p className="section-sub">Mereka dulu juga kelola kos manual. Sekarang tidak lagi.</p>
        <div className="testi-grid">
          {[
            {init:'SR',name:'Bu Sri Rahayu',role:'Pemilik Kos · Yogyakarta · 18 kamar',text:'"Dulu tiap tanggal 1 saya harus WA satu-satu ke 18 penyewa. Sekarang sistem yang kirimin, saya tinggal tunggu notifikasi uang masuk. Luar biasa."'},
            {init:'BW',name:'Pak Budi Wibowo',role:'Investor Properti · Bandung · 3 lokasi',text:'"Saya punya 3 lokasi kos di Bandung. Dulu ribet banget koordinasi. Sekarang semua keliatan dari satu dashboard, laporan langsung ke WA saya tiap bulan."'},
            {init:'DN',name:'Dewi Nurhaliza',role:'Pemilik Kos · Surabaya · 12 kamar',text:'"Penyewa saya happy karena bisa bayar QRIS atau GoPay. Saya happy karena tidak perlu cek rekening satu-satu. Win-win! Setup-nya juga gampang banget."'},
          ].map(t => (
            <div key={t.name} className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <div className="testi-text">{t.text}</div>
              <div className="testi-author">
                <div className="testi-avatar">{t.init}</div>
                <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-label">Siap memulai?</div>
        <div className="section-title">Kelola kos kamu lebih<br /><em>cerdas mulai hari ini.</em></div>
        <p className="section-sub" style={{margin:'0 auto 40px'}}>Bergabung dengan 500+ owner kos yang sudah pakai KosManager. Setup 5 menit, gratis 14 hari, tidak perlu kartu kredit.</p>
        <div className="cta-actions">
          <Link href="/login" className="btn-primary btn-large">Mulai Gratis 14 Hari →</Link>
          <Link href="/login" className="btn-ghost btn-large">Sudah punya akun? Masuk</Link>
        </div>
        <div className="cta-note">
          <span>✓ Tanpa kartu kredit</span>
          <span>✓ Setup 5 menit</span>
          <span>✓ Batalkan kapanpun</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <div className="logo-mark">K</div>
              <div className="logo-text">Kos<span>Manager</span></div>
            </Link>
            <p className="footer-desc">Platform manajemen kos terlengkap untuk pemilik kos Indonesia. Tagihan otomatis, pembayaran digital, dan laporan real-time.</p>
          </div>
          <div>
            <div className="footer-col-title">Produk</div>
            <ul className="footer-links">
              <li><a href="#fitur">Fitur</a></li>
              <li><a href="#harga">Harga</a></li>
              <li><a href="#cara-kerja">Cara Kerja</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Perusahaan</div>
            <ul className="footer-links">
              <li><a href="#">Tentang Kami</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Hubungi Kami</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Bantuan</div>
            <ul className="footer-links">
              <li><a href="#">Panduan Pengguna</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 KosManager. Dibuat dengan ❤️ untuk owner kos Indonesia.</span>
          <span>Jakarta, Indonesia 🇮🇩</span>
        </div>
      </footer>
    </div>
  )
}
