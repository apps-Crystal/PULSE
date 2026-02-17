import { Bell, DoorOpen, Thermometer, PersonStanding, Battery, AlertTriangle } from 'lucide-react';

export default function RoomCard({ roomId, roomName, temperature, sensors, alertMessage, alertType = 'normal' }) {
    // Determine background color based on alert type and room type
    const isFrozen = roomId?.startsWith('Frozen');
    const getCardColor = () => {
        switch (alertType) {
            case 'critical':
                return 'bg-red-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'offline':
                return 'bg-slate-600 grayscale';
            default:
                return isFrozen ? 'bg-sky-600' : 'bg-emerald-500';
        }
    };

    const cardColor = getCardColor();

    // Sensor icon with status indicator - Updated for solid backgrounds
    const SensorIcon = ({ active, icon: Icon, label, size = 16 }) => (
        <div className="flex flex-col items-center gap-0.5">
            <div className="relative p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                {/* White icons for contrast against colored background */}
                <Icon size={size} className="text-white drop-shadow-sm" strokeWidth={2.5} />

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
        <div className={`flex flex-col justify-between rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden ${cardColor}`}>
            <div>
                {/* Header with Zone ID */}
                <div className="px-3 py-2 bg-black/10 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">{roomName}</span>
                    </div>
                    <div className={`px-2 py-1 rounded backdrop-blur-md border border-white/20 ${alertType === 'offline' ? 'bg-black/40' : 'bg-white/20'}`}>
                        <span className="text-[9px] font-bold text-white uppercase tracking-wide">
                            {alertType === 'critical' ? 'ALARM' : alertType === 'warning' ? 'WARN' : alertType === 'offline' ? 'OFFLINE' : 'OK'}
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
            </div>

            {/* Sensor Icons + Temperature - Grid layout */}
            <div className="flex-grow grid grid-cols-3 gap-2 px-3 py-3 bg-black/10 border-t border-white/10 items-center">
                <SensorIcon active={sensors.panic} icon={Bell} label="Panic" size={24} />
                <SensorIcon active={sensors.door} icon={DoorOpen} label="Door" size={24} />
                {temperature && (
                    <div className="flex flex-col items-center gap-1">
                        <div className="relative p-2 rounded-md bg-white/20 backdrop-blur-sm">
                            <Thermometer size={20} className="text-white drop-shadow-sm" strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] text-white/90 uppercase font-bold tracking-wider">{temperature}°C</span>
                    </div>
                )}
            </div>
        </div>
    );
}
