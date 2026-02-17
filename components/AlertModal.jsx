'use client';
import { useState, useEffect } from 'react';
import { Bell, DoorOpen, AlertTriangle, Zap } from 'lucide-react';

/**
 * FULL-SCREEN alert takeover — covers 100% of viewport.
 * NO close button, NO clickable elements.
 * Only disappears when PLC alert condition clears.
 */
function AlertTimer({ startTime }) {
    const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startTime) / 1000));

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (totalSeconds) => {
        if (totalSeconds < 60) return `${totalSeconds}s`;
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        if (m < 60) return `${m}m ${s}s`;
        const h = Math.floor(m / 60);
        const remM = m % 60;
        return `${h}h ${remM}m`;
    };

    return (
        <span className="text-2xl font-mono font-black text-white bg-red-600 px-3 py-1 rounded-lg border-2 border-white/20 shadow-lg tracking-widest">
            {formatTime(elapsed)}
        </span>
    );
}

export default function AlertModal({ alerts, darkMode }) {
    if (!alerts || alerts.length === 0) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'panic': return Bell;
            case 'door': return DoorOpen;
            case 'power': return Zap;
            default: return AlertTriangle;
        }
    };

    const getSeverityLabel = (type) => {
        switch (type) {
            case 'panic': return 'CRITICAL';
            case 'power': return 'CRITICAL';
            case 'emergency': return 'EMERGENCY';
            default: return 'WARNING';
        }
    };

    // Priority Order: 1. Panic, 2. Emergency, 3. Normal Door, 4. Others
    const getPriority = (type) => {
        switch (type) {
            case 'panic': return 0;
            case 'emergency': return 1;
            case 'door': return 2;
            default: return 3;
        }
    };

    // Sort alerts based on priority
    const sortedAlerts = [...alerts].sort((a, b) => {
        return getPriority(a.alertType) - getPriority(b.alertType);
    });

    // Dynamic sizing configuration based on alert count
    const getLayoutConfig = (count) => {
        // Single Alert: Maximum size, centered
        if (count === 1) return {
            container: 'flex justify-center items-center w-full max-w-5xl h-full',
            card: 'w-full max-h-[50vh] flex flex-col justify-center p-12 gap-8',
            icon: 80,
            title: 'text-6xl',
            badge: 'px-6 py-2 text-2xl',
            msg: 'text-5xl pl-8 border-l-[6px] py-2',
            timer: 'scale-[2.0]',
            live: 'scale-150 gap-3'
        };
        // Two Alerts: Split screen, large
        if (count === 2) return {
            container: 'grid grid-cols-2 gap-10 w-full max-w-[90vw] items-center',
            card: 'aspect-[16/10] flex flex-col justify-between p-8 gap-6',
            icon: 64,
            title: 'text-4xl',
            badge: 'px-4 py-1 text-lg',
            msg: 'text-3xl pl-6 border-l-[5px]',
            timer: 'scale-150',
            live: 'scale-125 gap-2'
        };
        // 3-4 Alerts: 2x2 Grid
        if (count <= 4) return {
            container: 'grid grid-cols-2 auto-rows-fr gap-6 w-full max-w-[90vw] h-full max-h-[70vh]',
            card: 'flex flex-col justify-between p-6 gap-4',
            icon: 48,
            title: 'text-3xl',
            badge: 'px-3 py-1 text-sm',
            msg: 'text-2xl pl-4 border-l-4',
            timer: 'scale-125',
            live: 'scale-110 gap-2'
        };
        // 5-6 Alerts: 3x2 Grid
        if (count <= 6) return {
            container: 'grid grid-cols-3 auto-rows-fr gap-4 w-full max-w-[95vw] h-full max-h-[75vh]',
            card: 'flex flex-col justify-between p-5 gap-3',
            icon: 40,
            title: 'text-4xl', // Increased from 2xl
            badge: 'px-3 py-1 text-sm',
            msg: 'text-3xl pl-3 border-l-4', // Increased from xl
            timer: 'scale-110',
            live: 'scale-100 gap-1'
        };
        // 7+ Alerts: Compact Grid
        return {
            container: 'grid grid-cols-4 auto-rows-fr gap-3 w-full max-w-[98vw] h-full max-h-[85vh]', // Widened container
            card: 'flex flex-col justify-between p-4 gap-2',
            icon: 36,
            title: 'text-3xl', // Increased from lg
            badge: 'px-2 py-0.5 text-xs',
            msg: 'text-2xl pl-3 border-l-4', // Increased from base
            timer: 'scale-100', // Increased from 90
            live: 'scale-90 gap-1'
        };
    };

    const layout = getLayoutConfig(sortedAlerts.length);

    return (
        <div className="fixed inset-0 z-[9999] select-none overflow-hidden"
            style={{ pointerEvents: 'all', cursor: 'default' }}>

            {/* Full-screen red background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-700 via-red-600 to-red-800" />

            {/* Animated scan lines effect */}
            <div className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                }}
            />

            {/* Pulsing border around entire screen */}
            <div className="absolute inset-0 border-[8px] border-white/30 animate-pulse" />

            {/* Content — fills entire screen */}
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-between py-8 px-8 pointer-events-none">

                {/* header section */}
                <div className="flex flex-col items-center gap-6 w-full">
                    {/* Top warning bar */}
                    <div className="bg-black/30 py-2 px-12 rounded-full flex items-center justify-center gap-4 backdrop-blur-md border border-white/10">
                        <AlertTriangle size={18} className="text-white animate-pulse" strokeWidth={3} />
                        <span className="text-white text-xs font-black uppercase tracking-[0.4em]">
                            ⚠ ALERT ACTIVE — DO NOT IGNORE ⚠
                        </span>
                        <AlertTriangle size={18} className="text-white animate-pulse" strokeWidth={3} />
                    </div>

                    {/* Alert count badge */}
                    <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-black/40 border-2 border-white/30 backdrop-blur-md shadow-xl">
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                        <span className="text-white text-lg font-black uppercase tracking-[0.3em]">
                            {sortedAlerts.length} Active {sortedAlerts.length === 1 ? 'Alert' : 'Alerts'}
                        </span>
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    </div>
                </div>

                {/* Dynamic Alert Container */}
                <div className={`flex-1 flex flex-col justify-center items-center w-full my-4 ${layout.container}`}>
                    {sortedAlerts.map((alert, i) => {
                        const Icon = getIcon(alert.alertType);
                        const severity = getSeverityLabel(alert.alertType);

                        return (
                            <div key={alert.id || i}
                                className={`relative overflow-hidden rounded-3xl bg-black/40 border-2 border-white/20 shadow-2xl backdrop-blur-md ${layout.card}`}>

                                <div className="flex items-start justify-between w-full">
                                    {/* Icon */}
                                    <div className={`rounded-2xl bg-white/10 border border-white/20 animate-pulse flex-shrink-0 flex items-center justify-center p-3`}>
                                        <Icon size={layout.icon} className="text-white drop-shadow-lg" strokeWidth={2} />
                                    </div>

                                    {/* Severity Badge */}
                                    <span className={`${layout.badge} rounded-lg bg-red-600/90 border border-red-400/50 font-black text-white uppercase tracking-[0.2em] shadow-lg animate-pulse`}>
                                        {severity}
                                    </span>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 w-full flex flex-col justify-center">
                                    <div className={`${layout.title} font-black uppercase tracking-tight text-white drop-shadow-lg leading-none mb-3`}>
                                        {alert.roomName || 'Unknown'}
                                    </div>
                                    <div className={`${layout.msg} font-bold uppercase tracking-widest text-white/90 border-white/30`}>
                                        {alert.alertMessage || 'Alert Active'}
                                    </div>
                                </div>

                                {/* Footer: Timer & Status */}
                                <div className="w-full pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                                    <div className={`flex items-center ${layout.live}`}>
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-lg shadow-white/50" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">LIVE</span>
                                    </div>

                                    {alert.startTime && (
                                        <div className={`origin-right ${layout.timer}`}>
                                            <AlertTimer startTime={alert.startTime} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom message */}
                <div className="bg-black/30 py-2 px-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10">
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                        This screen will clear automatically when all alerts are resolved
                    </span>
                </div>
            </div>
        </div>
    );
}
