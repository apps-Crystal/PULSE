import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="description" content="Real-time cold chain warehouse monitoring system with PLC integration" />
                <meta name="keywords" content="cold chain, warehouse, monitoring, PLC, Modbus, SCADA" />
                <meta name="author" content="Pulse Cold Chain Monitor" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
