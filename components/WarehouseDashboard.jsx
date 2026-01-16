'use client';
import { useState, useEffect } from 'react';
import { WAREHOUSE_CONFIG } from '@/config/warehouse-map';
import RoomCard from './RoomCard';
import { AlertCircle, Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

export default function WarehouseDashboard() {
    const [plcData, setPlcData] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        // Initialize dark mode from local storage or system preference
        const isDark = localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

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

    // Calculate zone statistics
    const totalZones = WAREHOUSE_CONFIG.rooms.length;
    const normalZones = totalZones - activeAlarmCount;
    const warningZones = plcData?.door ? 1 : 0;
    const alarmZones = plcData ? [plcData.panic, plcData.emergency].filter(Boolean).length : 0;

    // SCADA Style Bold Metric Card
    const MetricCard = ({ icon: Icon, label, value, colorClass, shadowClass }) => (
        <div className={`rounded-xl shadow-lg border border-white/20 p-2.5 flex items-center gap-2.5 text-white overflow-hidden relative ${colorClass} ${shadowClass}`}>
            {/* Background Pattern for Texture */}
            <div className="absolute top-0 right-0 p-2 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                <Icon size={50} strokeWidth={3} />
            </div>

            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner">
                <Icon size={20} className="text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
            <div className="z-10">
                <div className="text-xl font-black tracking-tight drop-shadow-md">{value}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-90">{label}</div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
            {/* Header */}
            <header className={`border-b shadow-sm sticky top-0 z-50 transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-xl font-black uppercase tracking-tighter transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                <span className="text-blue-600">PULSE</span> WAREHOUSE
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Real-time Monitor
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleDarkMode}
                                className={`p-2 rounded-lg border transition-all duration-200 ${darkMode ? 'bg-slate-700 border-slate-600 text-yellow-400 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-amber-500'}`}
                                aria-label="Toggle Dark Mode"
                            >
                                {darkMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                                )}
                            </button>
                            <div className={`text-right px-3 py-1.5 rounded-lg border transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">System Time</div>
                                <div className={`text-sm font-mono font-bold tracking-tight transition-colors duration-300 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`} suppressHydrationWarning>
                                    {lastUpdated.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-4">
                {/* Status Metrics Bar - Bold SCADA Colors */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                    <MetricCard
                        icon={Activity}
                        label="Total Zones"
                        value={`${totalZones}/36`}
                        colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
                        shadowClass="shadow-blue-500/20"
                    />
                    <MetricCard
                        icon={CheckCircle}
                        label="System Normal"
                        value={normalZones}
                        colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
                        shadowClass="shadow-emerald-500/20"
                    />
                    <MetricCard
                        icon={AlertTriangle}
                        label="Active Warnings"
                        value={warningZones}
                        colorClass="bg-gradient-to-br from-amber-400 to-amber-500"
                        shadowClass="shadow-amber-500/20"
                    />
                    <MetricCard
                        icon={AlertCircle}
                        label="Critical Alarms"
                        value={alarmZones}
                        colorClass="bg-gradient-to-br from-red-500 to-red-600"
                        shadowClass="shadow-red-500/20"
                    />
                </div>

                {/* Room Cards Grid - Dynamic from Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {loading ? (
                        <div className="col-span-full text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-blue-500 mb-4"></div>
                                <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">Connecting to PLC...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {[...WAREHOUSE_CONFIG.rooms].sort((a, b) => (a.row - b.row) || (a.column - b.column)).map((room) => {
                                // Mock Logic to map global PLC signals to specific rooms for demo purposes
                                // In a real scenario, plcData would contain per-room data

                                let isPanic = false;
                                let isDoor = false;
                                let isEmergency = false;
                                let isPower = true;
                                let alertMessage = null;
                                let alertType = 'normal';

                                // Map signals to specific rooms (simulating the previous hardcoded behavior)
                                if (room.id === 'Room-501') {
                                    isPanic = plcData?.panic;
                                    isEmergency = plcData?.emergency;
                                    if (isPanic) { alertMessage = "PANIC BUTTON"; alertType = 'critical'; }
                                    else if (isEmergency) { alertMessage = "EMERGENCY STOP"; alertType = 'critical'; }
                                }

                                if (room.id === 'Room-104') {
                                    isDoor = plcData?.door;
                                    if (isDoor) { alertMessage = "DOOR OPEN"; alertType = 'warning'; }
                                }

                                return (
                                    <div
                                        key={room.id}
                                        className="col-span-1"
                                    >
                                        <RoomCard
                                            roomId={room.id}
                                            roomName={room.label}
                                            temperature={`${room.tempSetpoint}°C`}
                                            sensors={{
                                                panic: isPanic,
                                                power: isPower,
                                                temperature: false,
                                                evacuation: isEmergency
                                            }}
                                            alertMessage={alertMessage}
                                            alertType={alertType}
                                        />
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Today's Events Table */}
                <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`px-4 py-2 border-b flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <div className={`p-1.5 rounded-lg border shadow-sm transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <Clock size={16} className={`transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                        </div>
                        <h2 className={`font-bold uppercase tracking-widest text-xs transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Today's Events</h2>
                        <div className="ml-auto">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide transition-colors duration-300 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                {events.length} LOGS
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-48 overflow-y-auto custom-scrollbar">
                        <table className="w-full relative">
                            <thead className={`text-[9px] uppercase tracking-widest font-bold sticky top-0 z-10 transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                                <tr>
                                    <th className={`px-4 py-2 text-left transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>Timestamp</th>
                                    <th className={`px-4 py-2 text-left transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>Event Type</th>
                                    <th className={`px-4 py-2 text-left transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>Zone Location</th>
                                    <th className={`px-4 py-2 text-left transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>Current Status</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y transition-colors duration-300 ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                {events.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <CheckCircle size={32} className="text-emerald-500" />
                                                <span className={`font-medium text-xs uppercase tracking-wide transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>System Healthy - No Active Events</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event, idx) => (
                                        <tr key={idx} className={`transition-colors group ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                                            <td className={`px-4 py-2 text-xs font-mono group-hover:text-slate-900 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600'}`}>
                                                {event.time}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors duration-300 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                                    {event.type}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {event.room}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-red-100 text-red-600 rounded border border-red-200">
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
