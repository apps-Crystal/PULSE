'use client';
import { useState, useEffect, useRef } from 'react';
import { WAREHOUSE_CONFIG } from '@/config/warehouse-map';
import RoomCard from './RoomCard';
import AlertModal from './AlertModal';
import SensorECG from './SensorECG';
import { AlertCircle, Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import NavbarPulse from './NavbarPulse';
import WarningSystem from './WarningSystem';

export default function WarehouseDashboard() {
    const [plcData, setPlcData] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [darkMode, setDarkMode] = useState(false);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [activeWarnings, setActiveWarnings] = useState([]);
    const [sensorStatus, setSensorStatus] = useState({ activeCount: 0, totalCount: 22 });

    // Track previous signal states to detect CHANGES only
    const prevSignals = useRef({});
    // Track start times for active alerts to calculate duration
    const alertStartTimes = useRef({});

    /**
     * Log a signal state change to the Event_Ledger via /api/alarms.
     * Only called when a signal transitions ON→OFF or OFF→ON.
     */
    const logSignalChange = async (eventType, roomId, signalState, notes = '') => {
        try {
            await fetch('/api/alarms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_type: eventType,
                    room_id: roomId,
                    signal_state: signalState,
                    notes
                })
            });
            console.log(`📝 [Ledger] ${eventType} ${signalState} → ${roomId}`);
        } catch (err) {
            console.warn('⚠️ Failed to log event:', err.message);
        }
    };

    useEffect(() => {
        // Initialize dark mode from local storage or system preference
        const isDark = localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
        // Force dark mode for better visibility of logo if needed
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

            // Check if response is ok before parsing
            if (!resModbus.ok) {
                console.warn('PLC API returned error:', resModbus.status);
                setLoading(false);
                return;
            }

            const dataModbus = await resModbus.json();

            // Check for error response from API
            if (dataModbus.error) {
                // Log connection failure to events
                const errEvent = {
                    time: new Date().toLocaleTimeString(),
                    type: 'PLC CONNECTION LOST',
                    room: 'SYSTEM',
                    status: 'OFFLINE'
                };
                setEvents(prev => [errEvent, ...prev].slice(0, 50)); // Keep last 50

                setPlcData(null);
                setLoading(false);
                setLastUpdated(new Date());
                return;
            }

            if (dataModbus && dataModbus.rooms) {
                setPlcData(dataModbus);

                // Calculate sensor health for ECG
                const rooms = Object.values(dataModbus.rooms);
                const totalSensors = WAREHOUSE_CONFIG.rooms.length * 2;
                const activeSensors = rooms.reduce((count, room) => {
                    if (room.offline) return count;
                    return count + 2;
                }, 0);
                setSensorStatus({ activeCount: activeSensors, totalCount: totalSensors });

                // ── Detect signal STATE CHANGES and log to Event_Ledger ──
                // Create a NEW object to track current state (prevents mutation issues)
                const newSignalState = {};
                const prev = prevSignals.current;
                const newEvents = [];

                // Room signals: panic + door
                Object.entries(dataModbus.rooms).forEach(([roomId, roomData]) => {
                    const roomConfig = WAREHOUSE_CONFIG.rooms.find(r => r.id === roomId);
                    const roomLabel = roomConfig ? roomConfig.label : roomId;
                    if (roomData.offline) return;

                    const panicKey = `${roomId}_panic`;
                    const doorKey = `${roomId}_door`;

                    // Panic: detect ON/OFF transitions
                    if (roomData.panic && !prev[panicKey]) {
                        logSignalChange('PANIC', roomId, 'ON', `${roomLabel} panic button pressed`);
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'PANIC BUTTON PRESSED', room: roomLabel, status: 'ALERT ACTIVE' });
                    } else if (!roomData.panic && prev[panicKey]) {
                        logSignalChange('PANIC', roomId, 'OFF', `${roomLabel} panic cleared`);
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'PANIC CLEARED', room: roomLabel, status: 'RESOLVED' });
                    }

                    // Door: detect ON/OFF transitions
                    if (roomData.door && !prev[doorKey]) {
                        logSignalChange('DOOR', roomId, 'ON', `${roomLabel} door opened`);
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'DOOR OPENED', room: roomLabel, status: 'ALERT ACTIVE' });
                    } else if (!roomData.door && prev[doorKey]) {
                        logSignalChange('DOOR', roomId, 'OFF', `${roomLabel} door closed`);
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'DOOR CLOSED', room: roomLabel, status: 'RESOLVED' });
                    }

                    // Update NEW state object (not the previous one)
                    newSignalState[panicKey] = roomData.panic;
                    newSignalState[doorKey] = roomData.door;
                });

                // Global signals
                if (dataModbus.global) {
                    const g = dataModbus.global;

                    if (g.emergencyDoor1 && !prev.emgDoor1) {
                        logSignalChange('EMERGENCY_DOOR_1', 'GLOBAL', 'ON', 'Emergency door 1 opened');
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'EMERGENCY DOOR 1 OPEN', room: 'FACILITY', status: 'ALERT ACTIVE' });
                    } else if (!g.emergencyDoor1 && prev.emgDoor1) {
                        logSignalChange('EMERGENCY_DOOR_1', 'GLOBAL', 'OFF', 'Emergency door 1 closed');
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'EMERGENCY DOOR 1 CLOSED', room: 'FACILITY', status: 'RESOLVED' });
                    }

                    if (g.emergencyDoor2 && !prev.emgDoor2) {
                        logSignalChange('EMERGENCY_DOOR_2', 'GLOBAL', 'ON', 'Emergency door 2 opened');
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'EMERGENCY DOOR 2 OPEN', room: 'FACILITY', status: 'ALERT ACTIVE' });
                    } else if (!g.emergencyDoor2 && prev.emgDoor2) {
                        logSignalChange('EMERGENCY_DOOR_2', 'GLOBAL', 'OFF', 'Emergency door 2 closed');
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'EMERGENCY DOOR 2 CLOSED', room: 'FACILITY', status: 'RESOLVED' });
                    }

                    if (g.powerFailure && !prev.powerFail) {
                        logSignalChange('POWER_FAILURE', 'GLOBAL', 'ON', 'Power failure detected');
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'POWER FAILURE', room: 'FACILITY', status: 'CRITICAL' });
                    } else if (!g.powerFailure && prev.powerFail) {
                        logSignalChange('POWER_FAILURE', 'GLOBAL', 'OFF', 'Power restored');
                        newEvents.push({ time: new Date().toLocaleTimeString(), type: 'POWER RESTORED', room: 'FACILITY', status: 'RESOLVED' });
                    }

                    // Update NEW state object (not the previous one)
                    newSignalState.emgDoor1 = g.emergencyDoor1;
                    newSignalState.emgDoor2 = g.emergencyDoor2;
                    newSignalState.powerFail = g.powerFailure;
                }

                // Replace the entire previous state with the new state
                prevSignals.current = newSignalState;

                if (newEvents.length > 0) {
                    setEvents(p => [...newEvents, ...p].slice(0, 50));
                }

                // ── Manage Signal Start Times First ──
                // This ensures we know the duration of every active signal before deciding if it's an alert or warning.
                const currentSignalIds = new Set();

                // Identify all currently active signals
                Object.entries(dataModbus.rooms).forEach(([roomId, roomData]) => {
                    if (roomData.panic) currentSignalIds.add(`${roomId}-panic`);
                    if (roomData.door) currentSignalIds.add(`${roomId}-door`);
                });
                if (dataModbus.global?.emergencyDoor1) currentSignalIds.add('emergency-door-1');
                if (dataModbus.global?.emergencyDoor2) currentSignalIds.add('emergency-door-2');
                if (dataModbus.global?.powerFailure) currentSignalIds.add('power-failure');

                // Update start times tracking
                // 1. Add new signals
                currentSignalIds.forEach(id => {
                    if (!alertStartTimes.current[id]) {
                        alertStartTimes.current[id] = Date.now();
                    }
                });
                // 2. Remove resolved signals
                Object.keys(alertStartTimes.current).forEach(id => {
                    if (!currentSignalIds.has(id)) {
                        delete alertStartTimes.current[id];
                    }
                });

                // ── Separate Alerts vs Warnings ──
                const detectedAlerts = [];
                const detectedWarnings = [];
                const now = Date.now();

                Object.entries(dataModbus.rooms).forEach(([roomId, roomData]) => {
                    const roomConfig = WAREHOUSE_CONFIG.rooms.find(r => r.id === roomId);
                    const roomName = roomConfig ? roomConfig.label : roomId;

                    // PANIC: Immediate Critical Alert
                    if (roomData.panic) {
                        const id = `${roomId}-panic`;
                        detectedAlerts.push({
                            id, roomId, roomName,
                            alertMessage: 'PANIC BUTTON',
                            alertType: 'panic',
                            startTime: alertStartTimes.current[id]
                        });
                    }

                    // DOOR: Staged Logic (5m Warning -> 10m Critical)
                    if (roomData.door) {
                        const id = `${roomId}-door`;
                        // Ensure start time exists, default to now if missing
                        if (!alertStartTimes.current[id]) {
                            alertStartTimes.current[id] = now;
                        }

                        const startTime = alertStartTimes.current[id];
                        const durationSec = (now - startTime) / 1000;

                        // Debug logging to troubleshoot visibility
                        if (roomId === '11') {
                            console.log(`[DEBUG] Door 11 Open. Duration: ${durationSec.toFixed(1)}s. Warning > 300s, Critical > 600s`);
                        }

                        if (durationSec >= 600) {
                            // > 10 Mins: Critical Alert
                            detectedAlerts.push({
                                id, roomId, roomName,
                                alertMessage: 'DOOR OPEN > 10m',
                                alertType: 'door',
                                startTime
                            });
                        } else if (durationSec >= 300) {
                            // 5-10 Mins: Warning Toast (Yellow)
                            detectedWarnings.push({
                                id, roomId, roomName,
                                message: 'Door Open > 5 min',
                                severity: 'warning',
                                startTime
                            });
                        } else {
                            // < 5 Mins: Notice Toast (Blue/Info) - Immediate Visibility
                            detectedWarnings.push({
                                id, roomId, roomName,
                                message: 'Door Open',
                                severity: 'notice',
                                startTime
                            });
                        }
                    }
                });

                // Global Alerts (Always Critical for now)
                if (dataModbus.global?.emergencyDoor1 || dataModbus.global?.emergencyDoor2) {
                    // Check specific doors to be accurate
                    if (dataModbus.global.emergencyDoor1) {
                        const id = 'emergency-door-1';
                        detectedAlerts.push({
                            id, roomId: 'FACILITY', roomName: 'EMERGENCY EXIT 1',
                            alertMessage: 'DOOR OPEN', alertType: 'emergency',
                            startTime: alertStartTimes.current[id]
                        });
                    }
                    if (dataModbus.global.emergencyDoor2) {
                        const id = 'emergency-door-2';
                        detectedAlerts.push({
                            id, roomId: 'FACILITY', roomName: 'EMERGENCY EXIT 2',
                            alertMessage: 'DOOR OPEN', alertType: 'emergency',
                            startTime: alertStartTimes.current[id]
                        });
                    }
                }
                if (dataModbus.global?.powerFailure) {
                    const id = 'power-failure';
                    detectedAlerts.push({
                        id, roomId: 'FACILITY', roomName: 'POWER SYSTEM',
                        alertMessage: 'POWER FAILURE', alertType: 'power',
                        startTime: alertStartTimes.current[id]
                    });
                }

                setActiveAlerts(detectedAlerts);
                setActiveWarnings(detectedWarnings);
            }

            setLastUpdated(new Date());
        } catch (error) {
            // Log connection failure to events
            const errEvent = {
                time: new Date().toLocaleTimeString(),
                type: 'CONNECTION ERROR',
                room: 'SYSTEM',
                status: 'RETRYING...'
            };
            setEvents(prev => [errEvent, ...prev].slice(0, 50));

            setPlcData(null);
        } finally {
            setLoading(false);
        }
    };

    // Calculate zone statistics from per-room data
    const totalZones = WAREHOUSE_CONFIG.rooms.length;
    let warningZones = 0;
    let alarmZones = 0;
    let offlineZones = 0;

    if (plcData?.rooms) {
        Object.values(plcData.rooms).forEach(room => {
            if (room.offline) {
                offlineZones++;
            } else if (room.panic) {
                alarmZones++;
            } else if (room.door) {
                warningZones++;
            }
        });
    }
    const normalZones = totalZones - warningZones - alarmZones - offlineZones;

    // Extract global signals - check if global PLC data exists
    const hasGlobalData = plcData?.global !== undefined && plcData?.global !== null;
    const globalEmergency = hasGlobalData ? (plcData.global.emergencyDoor1 || plcData.global.emergencyDoor2 || false) : null;
    const globalPower = hasGlobalData ? (plcData.global.powerFailure || false) : null;

    // SCADA Style Bold Metric Card
    const MetricCard = ({ icon: Icon, label, value, colorClass, shadowClass }) => (
        <div className={`rounded-xl shadow-lg border border-white/20 p-4 flex items-center gap-3 text-white overflow-hidden relative ${colorClass} ${shadowClass}`}>
            {/* Background Pattern for Texture */}
            <div className="absolute top-0 right-0 p-2 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                <Icon size={60} strokeWidth={3} />
            </div>

            {/* Icon */}
            <div className="relative z-10 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <Icon size={32} strokeWidth={2.5} />
            </div>

            {/* Text Content */}
            <div className="relative z-10 flex-1">
                <div className="text-xs uppercase tracking-wider font-bold opacity-90 mb-1">{label}</div>
                <div className="text-2xl font-black tracking-tight">{value}</div>
            </div>
        </div>
    );


    return (
        <>
            {/* Alert Modal - Shown when alerts are active */}
            {activeAlerts.length > 0 && (
                <AlertModal
                    alerts={activeAlerts}
                    darkMode={darkMode}
                />
            )}

            <WarningSystem warnings={activeWarnings} />

            <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                {/* Header */}
                <header className={`border-b shadow-sm sticky top-0 z-50 transition-colors duration-300 ${darkMode ? 'bg-[#252B59] border-[#3A4178]' : 'bg-white border-slate-200'}`}>
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-4">
                                    {/* Logo Group */}
                                    <div className="relative group overflow-hidden h-14 w-80 flex items-center justify-start">
                                        <img
                                            src="/pulse-logo.png"
                                            alt="Pulse Warehouse"
                                            className={`absolute top-[60%] left-0 -translate-y-1/2 h-56 max-w-none w-auto object-contain transition-all duration-300 ${darkMode ? '' : 'invert'} drop-shadow-sm hover:scale-105`}
                                        />

                                        {/* LIVE Indicator - sports broadcast style */}
                                        <div className="absolute top-3 left-4 z-10">
                                            <div className="bg-red-600 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse shadow-lg">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                <span className="text-white text-[9px] font-black uppercase tracking-wider">LIVE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Global Emergency Indicators */}
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${globalEmergency === null ? 'bg-slate-500 border-slate-600' : (globalEmergency ? 'bg-red-500 border-red-600 animate-pulse' : darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={globalEmergency === null ? 'text-white' : (globalEmergency ? 'text-white' : darkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <span className={`text-[9px] font-bold uppercase tracking-wide ${globalEmergency === null ? 'text-white' : (globalEmergency ? 'text-white' : darkMode ? 'text-slate-400' : 'text-slate-600')}`}>
                                        EMG: {globalEmergency === null ? 'OFFLINE' : (plcData?.global?.emergencyDoor1 && plcData?.global?.emergencyDoor2 ? 'Both' : plcData?.global?.emergencyDoor1 ? '1' : plcData?.global?.emergencyDoor2 ? '2' : 'OK')}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${globalPower === null ? 'bg-slate-500 border-slate-600' : (globalPower ? 'bg-red-500 border-red-600 animate-pulse' : darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={globalPower === null ? 'text-white' : (globalPower ? 'text-white' : darkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                    </svg>
                                    <span className={`text-[9px] font-bold uppercase tracking-wide ${globalPower === null ? 'text-white' : (globalPower ? 'text-white' : darkMode ? 'text-slate-400' : 'text-slate-600')}`}>
                                        PWR: {globalPower === null ? 'OFFLINE' : (globalPower ? 'FAIL' : 'OK')}
                                    </span>
                                </div>
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
                <main className="max-w-7xl mx-auto px-6 py-6">
                    {/* Status Metrics Bar - Bold SCADA Colors */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <MetricCard
                            icon={Activity}
                            label="Total Zones"
                            value={`${totalZones}/11`}
                            colorClass="bg-gradient-to-br from-[#252B59] to-[#1A1E3F]"
                            shadowClass="shadow-[#252B59]/20"
                        />
                        <MetricCard
                            icon={CheckCircle}
                            label="System Normal"
                            value={normalZones}
                            colorClass="bg-gradient-to-br from-[#F79B1E] to-[#E68A0D]"
                            shadowClass="shadow-[#F79B1E]/20"
                        />
                        <MetricCard
                            icon={AlertTriangle}
                            label="Emergency Door"
                            value={globalEmergency === null ? 'OFFLINE' : (plcData?.global?.emergencyDoor1 || plcData?.global?.emergencyDoor2 ? (plcData?.global?.emergencyDoor1 && plcData?.global?.emergencyDoor2 ? 'BOTH' : plcData?.global?.emergencyDoor1 ? 'DOOR 1' : 'DOOR 2') : 'OK')}
                            colorClass={globalEmergency === null ? "bg-gradient-to-br from-slate-500 to-slate-600" : (globalEmergency ? "bg-gradient-to-br from-amber-400 to-amber-500" : "bg-gradient-to-br from-[#F79B1E] to-[#E68A0D]")}
                            shadowClass={globalEmergency === null ? "shadow-slate-500/20" : (globalEmergency ? "shadow-amber-500/20" : "shadow-[#F79B1E]/20")}
                        />
                        <MetricCard
                            icon={AlertCircle}
                            label="Power Failure"
                            value={globalPower === null ? 'OFFLINE' : (globalPower ? 'FAIL' : 'OK')}
                            colorClass={globalPower === null ? "bg-gradient-to-br from-slate-500 to-slate-600" : (globalPower ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-[#F79B1E] to-[#E68A0D]")}
                            shadowClass={globalPower === null ? "shadow-slate-500/20" : (globalPower ? "shadow-red-500/20" : "shadow-[#F79B1E]/20")}
                        />
                    </div>

                    {/* ECG Sensor Activity Monitor */}
                    <div className="mb-6">
                        <SensorECG
                            sensorStatus={sensorStatus}
                            isConnected={plcData !== null}
                            lastUpdate={lastUpdated}
                            darkMode={darkMode}
                        />
                    </div>

                    {/* Room Cards Grid - 2 Rows Layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        {loading ? (
                            <div className="col-span-full text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-[#F79B1E] mb-4"></div>
                                    <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">Connecting to PLC...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {[...WAREHOUSE_CONFIG.rooms].sort((a, b) => (a.row - b.row) || (a.column - b.column)).map((room) => {
                                    // Get per-room PLC data from API
                                    const roomPlcData = plcData?.rooms?.[room.id];

                                    const isPanic = roomPlcData?.panic || false;
                                    const isDoor = roomPlcData?.door || false;
                                    const isPower = !roomPlcData?.offline;

                                    // Determine alert type and message
                                    let alertMessage = null;
                                    let alertType = 'normal';

                                    if (roomPlcData?.offline || !roomPlcData) {
                                        alertMessage = "Sensor Inactive";
                                        alertType = 'offline';
                                    } else if (isPanic) {
                                        alertMessage = "PANIC BUTTON";
                                        alertType = 'critical';
                                    } else if (isDoor) {
                                        alertMessage = "DOOR OPEN";
                                        alertType = 'warning';
                                    }

                                    // Generate dummy temperature based on room type
                                    const isFrozen = room.id?.startsWith('Frozen');
                                    const dummyTemp = isFrozen
                                        ? -18 - Math.floor(Math.random() * 5) // -18 to -22°C for frozen
                                        : 22 + Math.floor(Math.random() * 5);  // 22 to 26°C for regular

                                    return (
                                        <div
                                            key={room.id}
                                            className="col-span-1"
                                        >
                                            <RoomCard
                                                roomId={room.id}
                                                roomName={room.label}
                                                temperature={dummyTemp}
                                                sensors={{
                                                    panic: isPanic,
                                                    door: isDoor
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
                        <div className={`px-6 py-4 border-b flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`p-2 rounded-lg border shadow-sm transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <Clock size={20} className={`transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                            </div>
                            <h2 className={`font-bold uppercase tracking-widest text-sm transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Today's Events</h2>
                            <div className="ml-auto">
                                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide transition-colors duration-300 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                    {events.length} LOGS
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                            <table className="w-full relative">
                                <thead className={`text-xs uppercase tracking-widest font-bold sticky top-0 z-10 transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                                    <tr>
                                        <th className={`px-6 py-3 text-left transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>Timestamp</th>
                                        <th className={`px-6 py-3 text-left transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>Event Type</th>
                                        <th className={`px-6 py-3 text-left transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>Zone Location</th>
                                        <th className={`px-6 py-3 text-left transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>Current Status</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y transition-colors duration-300 ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                    {events.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-50">
                                                    <CheckCircle size={32} className="text-[#F79B1E]" />
                                                    <span className={`font-medium text-xs uppercase tracking-wide transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>System Healthy - No Active Events</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        events.map((event, idx) => (
                                            <tr key={idx} className={`transition-colors group ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                                                <td className={`px-6 py-4 text-sm font-mono group-hover:text-slate-900 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600'}`}>
                                                    {event.time}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-sm font-bold transition-colors duration-300 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                        {event.type}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {event.room}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest bg-red-100 text-red-600 rounded border border-red-200">
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
        </>
    );
}
