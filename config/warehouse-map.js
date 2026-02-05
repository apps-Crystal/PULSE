// Warehouse configuration matching ModbusPal slaves
// Chiller_Room_1 through Chiller_Room_6 with Slave IDs 1-6

export const WAREHOUSE_CONFIG = {
    rooms: [
        // Row 1
        {
            id: 'Chiller_Room_1',
            label: 'Chiller Room 1',
            column: 0,
            row: 0,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -20
        },
        {
            id: 'Chiller_Room_2',
            label: 'Chiller Room 2',
            column: 1,
            row: 0,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -20
        },
        {
            id: 'Chiller_Room_3',
            label: 'Chiller Room 3',
            column: 2,
            row: 0,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -18
        },

        // Row 2
        {
            id: 'Chiller_Room_4',
            label: 'Chiller Room 4',
            column: 0,
            row: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 2
        },
        {
            id: 'Chiller_Room_5',
            label: 'Chiller Room 5',
            column: 1,
            row: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 4
        },
        {
            id: 'Chiller_Room_6',
            label: 'Chiller Room 6',
            column: 2,
            row: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 10
        },

        // Row 3 - Frozen Rooms
        {
            id: 'Frozen_Room_1',
            label: 'Frozen Room 1',
            column: 0,
            row: 2,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -25
        },
        {
            id: 'Frozen_Room_2',
            label: 'Frozen Room 2',
            column: 1,
            row: 2,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -25
        },
        {
            id: 'Frozen_Room_3',
            label: 'Frozen Room 3',
            column: 2,
            row: 2,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -25
        },
        {
            id: 'Frozen_Room_4',
            label: 'Frozen Room 4',
            column: 0,
            row: 3,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -30
        },
        {
            id: 'Frozen_Room_5',
            label: 'Frozen Room 5',
            column: 1,
            row: 3,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -30
        }
    ],

    // Grid layout settings
    gridColumns: 3,
    gridRows: 4
};
