'use client';
import { useState, useEffect } from 'react';
import RoomCard from './RoomCard';
import { AlertCircle, Clock } from 'lucide-react';

export default function WarehouseDashboard() {
    const [plcData, setPlcData] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Live Modbus Data
            const resModbus = await fetch('/api/modbus-data');
            const dataModbus = await resModbus.json();

            if (dataModbus) {
                setPlcData(dataModbus);

                // Add events when status changes
                const newEvents = [];
                if (dataModbus.panic) {
                    newEvents.push({
                        time: new Date().toLocaleTimeString(),
                        type: 'PANIC BUTTON PRESSED',
                        room: 'Cold Room 01',
                        status: 'ALERT ACTIVE'
                    });
                }
                if (dataModbus.door) {
                    newEvents.push({
                        time: new Date().toLocaleTimeString(),
                        type: 'DOOR OPEN',
                        room: 'Cold Room 01',
                        status: 'ALERT ACTIVE'
                    });
                }
                if (dataModbus.emergency) {
                    newEvents.push({
                        time: new Date().toLocaleTimeString(),
                        type: 'EMERGENCY STOP',
                        room: 'Cold Room 01',
                        status: 'ALERT ACTIVE'
                    });
                }

                if (newEvents.length > 0) {
                    setEvents(prev => [...newEvents, ...prev].slice(0, 10));
                }
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasActiveAlarm = plcData && (plcData.panic || plcData.door || plcData.emergency);
    const activeAlarmCount = plcData ? [plcData.panic, plcData.door, plcData.emergency].filter(Boolean).length : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
            {/* Header with Alarm Banner */}
            <header className="bg-gradient-to-b from-slate-900/90 to-slate-950/50 border-b border-slate-700/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white uppercase tracking-wider gradient-text">
                                ✦ PULSE WAREHOUSE
                            </h1>
                            <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                Monitoring 6 Rooms • Real-time Status
                            </p>
                        </div>

                        <div className="flex items-center gap-8">
                            {/* Active Alarm Banner */}
                            {hasActiveAlarm && (
                                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-xl flex items-center gap-3 animate-pulse shadow-lg shadow-red-500/30 border border-red-400/50">
                                    <AlertCircle size={24} className="animate-bounce" />
                                    <div>
                                        <div className="font-bold text-sm uppercase tracking-wide">
                                            ⚠ ACTIVE ALARM
                                        </div>
                                        <div className="text-xs opacity-90">
                                            {activeAlarmCount} ALERT{activeAlarmCount > 1 ? 'S' : ''} ACTIVE
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Last Update */}
                            <div className="text-right">
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Last Update</div>
                                <div className="text-sm font-mono text-slate-100 font-semibold flex items-center gap-2" suppressHydrationWarning>
                                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                    {lastUpdated.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Room Cards Grid - Fixed 3 columns to match reference design */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                    {loading ? (
                        <div className="col-span-full text-center py-20">
                            <div className="flex justify-center mb-4">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-cyan-500 shadow-lg shadow-cyan-500/20"></div>
                            </div>
                            <p className="text-slate-400 font-semibold text-lg">Connecting to PLC...</p>
                        </div>
                    ) : (
                        <>
                            {/* Cold Room 01 - Connected to Modbus */}
                            <RoomCard
                                roomId="01"
                                roomName="COLD ROOM 01"
                                temperature={plcData ? "5m 14s" : "--"}
                                sensors={{
                                    panic: plcData?.panic || false,
                                    power: true, // Normal
                                    temperature: false,
                                    evacuation: plcData?.emergency || false
                                }}
                                alertMessage={plcData?.panic ? "PANIC BUTTON PRESSED" : null}
                                alertType={plcData?.panic ? "critical" : "normal"}
                            />

                            {/* Blast Freezer 02 */}
                            <RoomCard
                                roomId="02"
                                roomName="BLAST FREEZER 02"
                                temperature="--"
                                sensors={{
                                    panic: false,
                                    power: true,
                                    temperature: false,
                                    evacuation: false
                                }}
                                alertType="normal"
                            />

                            {/* Chiller Room 03 - Door Open Warning */}
                            <RoomCard
                                roomId="03"
                                roomName="CHILLER ROOM 03"
                                temperature="--"
                                sensors={{
                                    panic: false,
                                    power: true,
                                    temperature: false,
                                    evacuation: false
                                }}
                                alertMessage={plcData?.door ? "DOOR OPEN Jan 22s" : null}
                                alertType={plcData?.door ? "warning" : "normal"}
                            />

                            {/* Cold Room 04 */}
                            <RoomCard
                                roomId="04"
                                roomName="COLD ROOM 04"
                                temperature="--"
                                sensors={{
                                    panic: false,
                                    power: true,
                                    temperature: false,
                                    evacuation: false
                                }}
                                alertType="normal"
                            />

                            {/* Ante Room 05 - Power Failure Warning */}
                            <RoomCard
                                roomId="05"
                                roomName="ANTE ROOM 05"
                                temperature="--"
                                sensors={{
                                    panic: false,
                                    power: false, // Power failure
                                    temperature: false,
                                    evacuation: false
                                }}
                                alertMessage="POWER FAILURE"
                                alertType="warning"
                            />

                            {/* Loading Bay 06 */}
                            <RoomCard
                                roomId="06"
                                roomName="LOADING BAY 06"
                                temperature="--"
                                sensors={{
                                    panic: false,
                                    power: true,
                                    temperature: false,
                                    evacuation: false
                                }}
                                alertType="normal"
                            />
                        </>
                    )}
                </div>

                {/* Today's Events */}
                <div className="bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/60 rounded-xl border border-slate-700/50 overflow-hidden shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <div className="bg-gradient-to-r from-cyan-600/20 via-blue-600/10 to-slate-900/20 px-6 py-4 flex items-center gap-3 border-b border-slate-700/50">
                        <div className="p-2 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg">
                            <Clock size={20} className="text-cyan-400" />
                        </div>
                        <h2 className="font-bold uppercase tracking-wide text-cyan-300">TODAY'S EVENTS</h2>
                        <div className="ml-auto">
                            <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">{events.length} events</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-950/40 text-xs uppercase tracking-wider text-cyan-400/70 border-b border-slate-700/30">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold">Time</th>
                                    <th className="px-6 py-4 text-left font-bold">Event Type</th>
                                    <th className="px-6 py-4 text-left font-bold">Room</th>
                                    <th className="px-6 py-4 text-left font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {events.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-3xl">✓</span>
                                                <span className="text-emerald-400 font-semibold">All Devices Normal</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event, idx) => (
                                        <tr key={idx} className="hover:bg-cyan-900/10 transition-all duration-200 border-slate-800/20">
                                            <td className="px-6 py-4 text-sm font-mono text-cyan-300 font-semibold">
                                                {event.time}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-400">
                                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
                                                    {event.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300 font-medium">
                                                {event.room}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block px-3 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-red-900/40 to-red-800/40 text-red-300 rounded-lg border border-red-500/30 shadow-md hover:shadow-lg transition-shadow">
                                                    {event.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
