import { useState, useEffect } from 'react';
import { WAREHOUSE_CONFIG } from '@/config/warehouse-map';
import { AlertTriangle, DoorOpen, Thermometer, Zap } from 'lucide-react';

export default function WarehouseMap({ alarms }) {
    // Helper to get status for a specific room
    const getRoomStatus = (roomId) => {
        const activeAlarms = alarms.filter(a =>
            (a.status === 'active') &&
            (a.room_id && a.room_id.toLowerCase().includes(roomId.toLowerCase().split('-')[1])) // Match room number
        );

        const isDoorOpen = activeAlarms.some(a => a.alarm_type === 'door_open');
        const isPanic = activeAlarms.some(a => a.alarm_type === 'panic_button');
        const isPowerFail = activeAlarms.some(a => a.alarm_type === 'power_failure');
        const isTempAlarm = activeAlarms.some(a => a.alarm_type === 'temperature_alarm');

        return {
            hasAlarm: activeAlarms.length > 0,
            isDoorOpen,
            isPanic,
            isPowerFail,
            isTempAlarm,
            alarmCount: activeAlarms.length,
            alarms: activeAlarms
        };
    };

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 p-8" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)'}}>

            {/* Grid Container */}
            <div className="w-full h-full grid grid-cols-4 gap-4">

                {WAREHOUSE_CONFIG.rooms.map((room) => {
                    const status = getRoomStatus(room.id);

                    return (
                        <div
                            key={room.id}
                            className={`relative transition-all duration-300 border-2 rounded-lg cursor-default flex flex-col items-center justify-between p-4 group overflow-hidden
                                ${status.hasAlarm
                                    ? 'bg-gradient-to-br from-red-950/50 to-slate-950/70 border-red-500/60 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[inset_0_0_30px_rgba(239,68,68,0.15)]'
                                    : 'bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border-slate-600/50 hover:border-cyan-500/50 hover:bg-gradient-to-br hover:from-slate-800/70 hover:via-cyan-900/20 hover:to-slate-900/60 shadow-lg shadow-slate-900/20 hover:shadow-cyan-900/20'
                                }
                            `}
                            style={{
                                gridColumn: room.column + 1,
                                gridRow: room.row + 1,
                                gridRowEnd: `span ${room.rowSpan || 1}`
                            }}
                        >
                            {/* Status Indicator Bar */}
                            <div className={`absolute top-0 inset-x-0 h-1 transition-colors duration-300 ${status.hasAlarm ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30' : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-500/60 group-hover:to-blue-500/60'}`} />

                            {/* Room Label */}
                            <div className="text-center w-full mt-1">
                                <h3 className={`text-sm md:text-base font-bold uppercase tracking-wide ${status.hasAlarm ? 'text-red-400 drop-shadow-lg' : 'text-slate-300 group-hover:text-cyan-300 transition-colors'}`}>
                                    {room.label}
                                </h3>
                            </div>

                            {/* Center Status / Icon */}
                            <div className="flex-1 flex flex-col items-center justify-center gap-2 my-2">
                                {status.hasAlarm ? (
                                    <div className="animate-pulse flex flex-col items-center">
                                        <AlertTriangle size={36} className="text-red-500 mb-2 drop-shadow-lg" />
                                        <span className="text-red-400 font-bold uppercase text-[10px] tracking-widest">Alarm Active</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 opacity-70 group-hover:opacity-100 transition-all duration-300">
                                        <div className={`text-2xl md:text-3xl font-mono font-bold drop-shadow-lg ${status.isPowerFail ? 'text-slate-600' : 'text-cyan-400'}`}>
                                            {status.isPowerFail ? '--' : room.tempSetpoint}
                                            <span className="text-sm align-top ml-0.5">°C</span>
                                        </div>
                                        <span className="text-[8px] uppercase text-cyan-500/70 font-bold tracking-widest">Setpoint</span>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Sensor Array */}
                            <div className="w-full flex justify-between items-end border-t border-slate-700/40 pt-3 mt-auto">
                                <div className="flex gap-2">
                                    {room.sensors.map((s, i) => (
                                        <div key={i}
                                            className={`w-2.5 h-2.5 rounded-full transition-all ${s === 'temp' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' :
                                                s === 'door' ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
                                                    s === 'panic' ? 'bg-gradient-to-br from-amber-500 to-red-500' : 'bg-slate-500'
                                                } opacity-50 group-hover:opacity-100 shadow-md`}
                                            title={s}
                                        />
                                    ))}
                                </div>
                                {status.isDoorOpen && <DoorOpen size={18} className="text-red-400 animate-bounce drop-shadow-lg" />}
                            </div>

                            {/* Hover Overlay Details */}
                            {status.hasAlarm && (
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-red-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="font-bold text-red-400 uppercase text-xs mb-3 border-b border-red-900/50 pb-2 w-full">Active Alerts</p>
                                    {status.alarms.map((a, i) => (
                                        <div key={i} className="mb-2 last:mb-0">
                                            <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block mb-1">
                                                {a.alarm_type.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-slate-200 leading-tight block">
                                                {a.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-md border border-slate-600/50 rounded-lg p-4 text-xs shadow-xl">
                <p className="font-bold text-cyan-400 mb-3 uppercase tracking-wide">Sensor Legend</p>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 shadow-md" />
                        <span className="text-slate-300">Temperature Sensor</span>
                    </div>
                    <div className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-md" />
                        <span className="text-slate-300">Door Sensor</span>
                    </div>
                    <div className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-500 to-red-500 shadow-md" />
                        <span className="text-slate-300">Panic Button</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
