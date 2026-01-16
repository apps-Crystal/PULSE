import { Bell, DoorOpen, Thermometer, PersonStanding, Battery, AlertTriangle } from 'lucide-react';

export default function RoomCard({ roomId, roomName, temperature, sensors, alertMessage, alertType = 'normal' }) {
    // Determine background color based on alert type - SOLID COLORS
    const getCardColor = () => {
        switch (alertType) {
            case 'critical':
                return 'bg-red-500';
            case 'warning':
                return 'bg-amber-500';
            default:
                return 'bg-emerald-500';
        }
    };

    const cardColor = getCardColor();

    // Sensor icon with status indicator - Updated for solid backgrounds
    const SensorIcon = ({ active, icon: Icon, label }) => (
        <div className="flex flex-col items-center gap-0.5">
            <div className="relative p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                {/* White icons for contrast against colored background */}
                <Icon size={16} className="text-white drop-shadow-sm" strokeWidth={2.5} />

                {/* Status dot */}
                <div
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm ${active ? 'bg-red-600 animate-pulse' : 'bg-green-400'
                        }`}
                />
            </div>
            <span className="text-[9px] text-white/90 uppercase font-bold tracking-wider scale-90">{label}</span>
        </div>
    );

    return (
        <div className={`rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden ${cardColor}`}>
            {/* Header with Zone ID */}
            <div className="px-3 py-1.5 bg-black/10 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">{roomName}</span>
                </div>
                <div className="px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/20">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wide">
                        {alertType === 'critical' ? 'ALARM' : alertType === 'warning' ? 'WARN' : 'OK'}
                    </span>
                </div>
            </div>

            {/* Alert Message Banner (if present) */}
            {alertMessage && (
                <div className="bg-black/20 px-3 py-1 flex items-center gap-2 animate-pulse">
                    <AlertTriangle size={12} className="text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wide">{alertMessage}</span>
                </div>
            )}

            {/* Main Content - Temperature/Status Display */}
            <div className="px-3 py-3 text-center">
                <div className="text-3xl font-bold font-mono text-white drop-shadow-md tracking-tighter">
                    {temperature}
                </div>
                {/* Removed "Current Status" text to save vertical space */}
            </div>

            {/* Sensor Icons Row */}
            <div className="grid grid-cols-4 gap-1 px-2 py-2 bg-black/10 border-t border-white/10">
                <SensorIcon active={sensors.panic} icon={Bell} label="Panic" />
                <SensorIcon active={!sensors.power} icon={Battery} label="Pwr" />
                <SensorIcon active={sensors.temperature} icon={Thermometer} label="Tmp" />
                <SensorIcon active={sensors.evacuation} icon={PersonStanding} label="Evac" />
            </div>
        </div>
    );
}
