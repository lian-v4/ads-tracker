import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ads Tracker - Tráfego Pago em Tempo Real',
  description: 'Painel de acompanhamento de Meta Ads e Google Ads com atualização automática.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'Inter', sans-serif", background: '#0a0d14', color: '#f1f5f9' }}>
        {children}
      </body>
    </html>
  );
}

