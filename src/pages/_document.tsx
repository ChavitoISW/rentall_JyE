import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/assets/logo.png" />
        <link rel="shortcut icon" type="image/png" href="/assets/logo.png" />
        <link rel="apple-touch-icon" href="/assets/logo.png" />
        
        {/* Metadatos */}
        <meta name="description" content="RentAll - Sistema de gestión de alquiler de equipos" />
        <meta name="theme-color" content="#1a73e8" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
