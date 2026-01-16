import { Bell, DoorOpen, Thermometer, PersonStanding, Battery, AlertTriangle } from 'lucide-react';

export default function RoomCard({ roomId, roomName, temperature, sensors, alertMessage, alertType = 'normal' }) {
    const StatusIcon = ({ active, icon: Icon, label }) => (
        <div className="flex flex-col items-center gap-1 group">
            <div className={`p-3 rounded-xl transition-all duration-300 ${active
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/60 animate-pulse scale-110'
                    : 'bg-gradient-to-br from-emerald-500/30 to-teal-600/30 text-emerald-400 shadow-md shadow-emerald-500/20 group-hover:from-emerald-500/50 group-hover:to-teal-600/50'
                }`}>
                <Icon size={24} strokeWidth={2} />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">{label}</span>
        </div>
    );

    // Determine card styling based on alert type
    const getCardStyles = () => {
        switch (alertType) {
            case 'critical':
                return {
                    border: 'border-red-500/50 hover:border-red-400',
                    bg: 'bg-gradient-to-br from-red-950/30 via-slate-900/50 to-slate-900/80',
                    header: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20',
                    alertBg: 'bg-gradient-to-r from-red-500/80 to-red-600/80 text-white shadow-md backdrop-blur-sm',
                    animate: 'animate-pulse-glow border-2',
                    tempColor: 'text-red-400'
                };
            case 'warning':
                return {
                    border: 'border-amber-500/50 hover:border-amber-400',
                    bg: 'bg-gradient-to-br from-amber-950/20 via-slate-900/50 to-slate-900/80',
                    header: 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 shadow-lg shadow-amber-500/20',
                    alertBg: 'bg-gradient-to-r from-amber-500/80 to-amber-400/80 text-slate-900 shadow-md backdrop-blur-sm',
                    animate: 'border-2',
                    tempColor: 'text-amber-400'
                };
            default:
                return {
                    border: 'border-slate-600/50 hover:border-slate-400/50',
                    bg: 'bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-slate-900/80 backdrop-blur-sm',
                    header: 'bg-gradient-to-r from-slate-700/80 to-slate-600/80 text-slate-200 shadow-md',
                    alertBg: '',
                    animate: 'border-2',
                    tempColor: 'text-cyan-400'
                };
        }
    };

    const styles = getCardStyles();

    return (
        <div className={`rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${styles.border} ${styles.bg} ${styles.animate} group`}>
            {/* Header */}
            <div className={`px-5 py-4 font-bold text-sm uppercase tracking-wider ${styles.header}`}>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-white/40 group-hover:bg-white/60 transition-all"></span>
                    {roomName}
                </div>
            </div>

            {/* Alert Message (conditional) */}
            {alertMessage && (
                <div className={`px-5 py-3 font-bold text-xs uppercase tracking-wide ${styles.alertBg} flex items-center gap-2 animate-pulse`}>
                    <AlertTriangle size={16} className="animate-bounce flex-shrink-0" />
                    {alertMessage}
                </div>
            )}

            {/* Temperature/Timer Display */}
            <div className="px-5 py-8 bg-gradient-to-b from-slate-900/40 to-slate-950/60 text-center backdrop-blur-sm">
                <div className={`text-5xl font-bold font-mono drop-shadow-lg ${styles.tempColor}`}>
                    {temperature}
                </div>
                <div className="text-xs text-slate-500 mt-2 tracking-wider">CURRENT STATUS</div>
            </div>

            {/* Status Icons Row */}
            <div className="grid grid-cols-4 gap-3 p-4 bg-gradient-to-t from-slate-950/40 to-slate-900/20 backdrop-blur-sm border-t border-slate-700/30">
                <StatusIcon active={sensors.panic} icon={Bell} label="Panic" />
                <StatusIcon active={sensors.power} icon={Battery} label="Power" />
                <StatusIcon active={sensors.temperature} icon={Thermometer} label="Temp" />
                <StatusIcon active={sensors.evacuation} icon={PersonStanding} label="Evac" />
            </div>
        </div>
    );
}
