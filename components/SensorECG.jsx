'use client';
import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

export default function SensorECG({ sensorStatus, isConnected, lastUpdate, darkMode }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const timeOffsetRef = useRef(0);

    // Generate realistic ECG waveform pattern with dynamic frequency
    const generateECGWaveform = (x, timeOffset, amplitude, status, percentage = 100) => {
        if (status === 'offline') {
            // Flatline with minimal electrical noise (< 0.5mV equivalent)
            return amplitude * 0.5 + (Math.random() - 0.5) * 0.5;
        }

        // Dynamic frequency based on health - worse health = faster heartbeat (tachycardia)
        // Healthy (100%): 60 BPM = 1 beat per second
        // Warning (50-99%): 60-100 BPM 
        // Critical (<50%): 100-130 BPM (dangerous tachycardia)
        let bpm;
        if (percentage === 100) {
            bpm = 60; // Normal sinus rhythm
        } else if (percentage >= 50) {
            // Linear interpolation: 60 to 100 BPM
            bpm = 60 + (40 * (100 - percentage) / 50);
        } else {
            // Linear interpolation: 100 to 130 BPM
            bpm = 100 + (30 * (50 - percentage) / 50);
        }

        const beatsPerSecond = bpm / 60;
        const secondsPerBeat = 1 / beatsPerSecond;

        // Time in seconds (x represents canvas pixels, convert to time)
        const time = (x + timeOffset) / 100; // 100 pixels per second
        const beatPhase = (time % secondsPerBeat) / secondsPerBeat;

        let y = 0;

        // PR interval baseline (isoelectric)
        if (beatPhase < 0.12) {
            y = 0;
        }
        // P wave (atrial depolarization) - 80-100ms duration, 0.1-0.25mV amplitude
        else if (beatPhase < 0.22) {
            const pPhase = (beatPhase - 0.12) / 0.10;
            y = 0.15 * Math.sin(pPhase * Math.PI);
        }
        // PR segment (isoelectric)
        else if (beatPhase < 0.26) {
            y = 0;
        }
        // QRS complex (ventricular depolarization) - 80-120ms duration, high amplitude
        else if (beatPhase < 0.34) {
            const qrsPhase = (beatPhase - 0.26) / 0.08;

            // Q wave - small negative deflection
            if (qrsPhase < 0.15) {
                y = -0.2 * Math.sin(qrsPhase * Math.PI / 0.15);
            }
            // R wave - large positive deflection (1-1.5mV)
            else if (qrsPhase < 0.50) {
                const rPhase = (qrsPhase - 0.15) / 0.35;
                y = 1.4 * Math.sin(rPhase * Math.PI);
            }
            // S wave - small negative deflection
            else {
                const sPhase = (qrsPhase - 0.50) / 0.50;
                y = -0.3 * Math.sin(sPhase * Math.PI);
            }
        }
        // ST segment (should be isoelectric in healthy heart)
        else if (beatPhase < 0.44) {
            // ST elevation/depression in critical status (ischemia indicator)
            if (status === 'critical') {
                y = -0.1 + Math.random() * 0.05; // ST depression
            } else {
                y = 0;
            }
        }
        // T wave (ventricular repolarization) - 120-160ms, 0.2-0.5mV
        else if (beatPhase < 0.60) {
            const tPhase = (beatPhase - 0.44) / 0.16;
            y = 0.3 * Math.sin(tPhase * Math.PI);
        }
        // TP segment (isoelectric - diastole)
        else {
            y = 0;
        }

        // Add heart rate variability (HRV) - natural beat-to-beat variation
        const hrvNoise = Math.sin(time * 0.15) * 0.02; // Respiratory sinus arrhythmia
        y += hrvNoise;

        // Add pathological features based on health status
        if (status === 'warning') {
            // Slight amplitude variation and occasional ectopic beats
            y *= 0.85 + Math.random() * 0.15;
            // Random premature beats (5% chance per beat)
            if (beatPhase > 0.95 && Math.random() < 0.05) {
                y += 0.3 * Math.sin(beatPhase * Math.PI * 20);
            }
        } else if (status === 'critical') {
            // Severe irregularity - ventricular arrhythmia patterns
            y *= 0.6 + Math.random() * 0.4;
            // Frequent ectopic beats and wider QRS
            if (Math.random() < 0.15) {
                y += (Math.random() - 0.5) * 0.4;
            }
        }

        // Baseline wander (artifact from breathing, patient movement)
        const baselineWander = Math.sin(time * 0.3) * 0.03 + Math.sin(time * 0.7) * 0.02;
        y += baselineWander;

        // High-frequency noise (muscle artifact, electrical interference)
        const emgNoise = (Math.random() - 0.5) * 0.015;
        y += emgNoise;

        // Scale to canvas with proper baseline
        return amplitude * 0.5 - y * amplitude * 0.32;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Calculate health percentage
        const healthPercentage = sensorStatus.totalCount > 0
            ? (sensorStatus.activeCount / sensorStatus.totalCount) * 100
            : 0;

        // Determine status based on connection and health
        let status = 'normal';
        if (!isConnected || healthPercentage === 0) {
            status = 'offline';
        } else if (healthPercentage < 50) {
            status = 'critical';
        } else if (healthPercentage < 100) {
            status = 'warning';
        }

        const animate = () => {
            // Clear canvas
            ctx.fillStyle = darkMode ? '#1e293b' : '#f8fafc';
            ctx.fillRect(0, 0, width, height);

            // Draw grid (ECG paper style)
            ctx.strokeStyle = darkMode ? '#334155' : '#e2e8f0';
            ctx.lineWidth = 0.5;

            // Major grid lines (5mm)
            for (let x = 0; x < width; x += 25) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for (let y = 0; y < height; y += 25) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Minor grid lines (1mm)
            ctx.strokeStyle = darkMode ? '#1e293b' : '#f1f5f9';
            for (let x = 0; x < width; x += 5) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for (let y = 0; y < height; y += 5) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Draw ECG waveform
            ctx.beginPath();
            ctx.strokeStyle = status === 'offline' ? '#ef4444' :
                status === 'critical' ? '#f59e0b' :
                    status === 'warning' ? '#eab308' : '#10b981';
            ctx.lineWidth = 2;

            for (let x = 0; x < width; x++) {
                const y = generateECGWaveform(x, timeOffsetRef.current, height, status, healthPercentage);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            // Update time offset for animation
            timeOffsetRef.current += 2;

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isConnected, sensorStatus, darkMode]);

    // Calculate health percentage for display
    const healthPercentage = sensorStatus.totalCount > 0
        ? Math.round((sensorStatus.activeCount / sensorStatus.totalCount) * 100)
        : 0;

    return (
        <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`px-4 py-2 border-b flex items-center justify-between transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border shadow-sm transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <Activity size={16} className={`transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                    </div>
                    <h2 className={`font-bold uppercase tracking-widest text-xs transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Sensor Activity Monitor
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide transition-colors duration-300 ${!isConnected ? 'bg-red-100 text-red-600' :
                        healthPercentage === 100 ? 'bg-orange-100 text-orange-600' :
                            healthPercentage >= 50 ? 'bg-amber-100 text-amber-600' :
                                'bg-red-100 text-red-600'
                        }`}>
                        {sensorStatus.activeCount}/{sensorStatus.totalCount} ACTIVE
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide transition-colors duration-300 ${!isConnected ? 'bg-red-100 text-red-600' :
                        healthPercentage === 100 ? 'bg-orange-100 text-orange-600' :
                            healthPercentage >= 50 ? 'bg-amber-100 text-amber-600' :
                                'bg-red-100 text-red-600'
                        }`}>
                        {healthPercentage}% HEALTH
                    </span>
                </div>
            </div>
            <div className="p-3">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={60}
                    className="w-full h-auto"
                />
            </div>
        </div>
    );
}