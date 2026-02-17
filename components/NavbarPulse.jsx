'use client';
import { useEffect, useRef } from 'react';

/**
 * Mini ECG waveform for Navbar branding.
 * Purely cosmetic "heartbeat" to show system is alive.
 */
export default function NavbarPulse({ active = true, color = '#10b981', height = 30, width = 100 }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const timeOffsetRef = useRef(0);

    // Simplified waveform generation for aesthetics
    const getY = (x, offset) => {
        const time = (x + offset) * 0.02;
        // Periodic heartbeat every ~1.5s (normal rhythm)
        const rhythm = time % (Math.PI * 2);

        let y = 0;

        // P-QRS-T complex simulation
        if (rhythm < 0.5) {
            // P wave
            y += Math.sin(rhythm * 10) * 0.1;
        } else if (rhythm > 0.6 && rhythm < 1.0) {
            // QRS complex (the big spike)
            y += Math.sin((rhythm - 0.8) * 20) * (rhythm > 0.75 && rhythm < 0.85 ? 1.0 : -0.3);
        } else if (rhythm > 1.2 && rhythm < 1.6) {
            // T wave
            y += Math.sin((rhythm - 1.4) * 8) * 0.15;
        }

        // Add tiny noise for realism
        y += (Math.random() - 0.5) * 0.05;

        return y;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const centerY = h / 2;
        const scale = h * 0.4; // Amplitude scale

        const animate = () => {
            // Fade effect for trailing tail
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Clear with transparency for trail? No, clear fully for crispness
            ctx.clearRect(0, 0, w, h);

            if (!active) {
                // Flatline
                ctx.beginPath();
                ctx.moveTo(0, centerY);
                ctx.lineTo(w, centerY);
                ctx.strokeStyle = '#ef4444'; // Red for dead
                ctx.lineWidth = 1.5;
                ctx.stroke();
                return;
            }

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw the line
            for (let x = 0; x < w; x++) {
                // Scroll left
                const ySignal = getY(x, timeOffsetRef.current);
                const y = centerY - (ySignal * scale);

                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Glow effect
            ctx.shadowBlur = 4;
            ctx.shadowColor = color;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Move forward
            timeOffsetRef.current += 3; // Speed

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [active, color]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="opacity-80"
            style={{ width: `${width}px`, height: `${height}px` }}
        />
    );
}
