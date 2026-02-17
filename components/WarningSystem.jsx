'use client';
import { AlertTriangle, DoorOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Right-side floating warning system for non-critical issues (e.g., Door open > 5 mins).
 * Stacks vertically on the right side of the screen.
 */
export default function WarningSystem({ warnings }) {
    if (!warnings || warnings.length === 0) return null;

    const getStyles = (severity) => {
        if (severity === 'warning') {
            return {
                container: 'bg-yellow-500/90 border-yellow-700 text-black',
                iconBg: 'bg-black/10',
                title: 'WARNING',
                iconColor: 'text-black'
            };
        }
        return {
            // Notice / Info Logic (0-5 mins)
            container: 'bg-slate-800/90 border-blue-500 text-white min-h-[80px]',
            iconBg: 'bg-blue-500/20',
            title: 'DOOR OPEN',
            iconColor: 'text-blue-400'
        };
    };

    return (
        <div className="fixed top-24 right-4 z-[99999] flex flex-col gap-3 w-80 pointer-events-none">
            {warnings.map((warning, i) => {
                const styles = getStyles(warning.severity);

                return (
                    <div key={warning.id || i}
                        className={`${styles.container} p-3 rounded-lg shadow-xl border-l-[6px] flex items-start gap-3 animate-slide-in-right backdrop-blur-md pointer-events-auto transition-all duration-300 hover:scale-105`}>

                        <div className={`p-1.5 rounded-md ${styles.iconBg} mt-0.5`}>
                            <DoorOpen size={20} className={styles.iconColor} strokeWidth={2.5} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4 className="font-black uppercase tracking-wider text-xs truncate pr-2">
                                    {warning.roomName}
                                </h4>
                                <span className="bg-black/20 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest opacity-80">
                                    {styles.title}
                                </span>
                            </div>

                            {/* Timer for warning duration */}
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${warning.severity === 'warning' ? 'bg-black' : 'bg-blue-400'}`} />
                                <WarningTimer startTime={warning.startTime} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function WarningTimer({ startTime }) {
    const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startTime) / 1000));

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <span className="font-mono font-bold text-xs">
            OPEN FOR {formatTime(elapsed)}
        </span>
    );
}
