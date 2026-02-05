'use client';
import { Bell, DoorOpen, AlertTriangle, Zap } from 'lucide-react';

export default function AlertCard({ alert }) {
    // Safety check
    if (!alert) {
        console.error('AlertCard: No alert data provided');
        return null;
    }

    console.log('AlertCard rendering:', alert);

    // Get icon based on alert type
    const getAlertIcon = () => {
        switch (alert.alertType) {
            case 'panic':
                return Bell;
            case 'door':
                return DoorOpen;
            case 'emergency':
                return AlertTriangle;
            case 'power':
                return Zap;
            default:
                return AlertTriangle;
        }
    };

    const Icon = getAlertIcon();

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-2xl shadow-red-500/50 transform hover:scale-105 transition-all duration-300 min-h-[200px]">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6">
                {/* Room Name */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-lg">
                        {alert.roomName || 'Unknown Room'}
                    </h3>
                    <div className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                            ALARM
                        </span>
                    </div>
                </div>

                {/* Alert Icon & Message */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg animate-pulse">
                        <Icon size={48} className="text-white drop-shadow-lg" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-white/80 mb-1">
                            Alert Type
                        </div>
                        <div className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-lg">
                            {alert.alertMessage || 'Unknown Alert'}
                        </div>
                    </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-sm font-bold uppercase tracking-wide">
                        Active Now
                    </span>
                </div>
            </div>

            {/* Pulsing Border Effect */}
            <div className="absolute inset-0 border-4 border-white/30 rounded-2xl animate-pulse" />
        </div>
    );
}
