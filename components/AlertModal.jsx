'use client';
import { X, AlertTriangle } from 'lucide-react';
import AlertCard from './AlertCard';

export default function AlertModal({ alerts, onDismiss, darkMode }) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn">
            {/* Blurred Backdrop */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-2xl"
                onClick={onDismiss}
            />

            {/* Alert Container */}
            <div className="relative z-10 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-red-600/20 to-transparent backdrop-blur-md border border-red-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50">
                                <AlertTriangle size={36} className="text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white drop-shadow-2xl bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                                Active Alerts
                            </h2>
                            <p className="text-sm font-bold text-red-400 uppercase tracking-wider mt-1">
                                {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'} Detected
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group backdrop-blur-sm"
                        aria-label="Dismiss alerts"
                    >
                        <X size={28} className="text-white group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Alert Cards Grid */}
                <div className={`grid gap-5 ${alerts.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
                    alerts.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' :
                        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}>
                    {alerts.map((alert, index) => (
                        <div
                            key={alert.id || `alert-${index}`}
                            className="transform transition-all duration-300 hover:scale-105 animate-fadeIn"
                            style={{
                                animationDelay: `${index * 150}ms`
                            }}
                        >
                            <AlertCard alert={alert} />
                        </div>
                    ))}
                </div>

                {/* Acknowledge Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onDismiss}
                        className="relative group px-10 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black uppercase tracking-wider text-base shadow-2xl shadow-red-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                        <span className="relative z-10">Acknowledge All Alerts</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
