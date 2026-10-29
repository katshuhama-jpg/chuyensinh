import type { Metadata, Viewport } from 'next';
import './globals.css';

const DESC = 'Game hẹn hò pixel cả một đời người: từ lúc chào đời đến lúc tóc bạc. Chọn ai để yêu, đời rẽ theo lối ấy. Không day dứt, chỉ tò mò: nếu rẽ lối khác, đời mình sẽ ra sao?';

export const metadata: Metadata = {
  metadataBase: new URL('https://loveslines.vercel.app'),
  title: { default: 'Đường Tình Rẽ Lối', template: '%s · Đường Tình Rẽ Lối' },
  description: DESC,
  applicationName: 'Đường Tình Rẽ Lối',
  keywords: ['game hẹn hò', 'game tình yêu', 'pixel', 'life sim', 'Đường Tình Rẽ Lối', "Love's Altered Lines"],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Đường Tình Rẽ Lối',
    title: "Đường Tình Rẽ Lối - Love's Altered Lines",
    description: DESC,
    locale: 'vi_VN',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Đường Tình Rẽ Lối - game hẹn hò pixel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Đường Tình Rẽ Lối - Love's Altered Lines",
    description: DESC,
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#211833',
};

// đặt giao diện sáng/tối trước khi vẽ để khỏi nháy màn
const THEME_JS = `try{var t=localStorage.getItem('dt.theme');if(t==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
