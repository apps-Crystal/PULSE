import Head from 'next/head';
import WarehouseDashboard from '@/components/WarehouseDashboard';

export default function Home() {
    return (
        <>
            <Head>
                <title>Pulse | Cold Chain Monitor</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <main>
                <WarehouseDashboard />
            </main>
        </>
    );
}
