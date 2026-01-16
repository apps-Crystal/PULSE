// Warehouse configuration based on user's grid diagram
// Layout: 4 columns with rooms arranged in a clean grid - Sorted logically

export const WAREHOUSE_CONFIG = {
    rooms: [
        // Column 1 (Left) - 50x Series
        {
            id: 'Room-501',
            label: 'Room 501',
            column: 0,
            row: 0,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -20
        },
        {
            id: 'Room-502',
            label: 'Room 502',
            column: 1,
            row: 0,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -20
        },
        {
            id: 'Room-503',
            label: 'Room 503',
            column: 2,
            row: 0,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -20
        },

        // Column 2 - 40x Series
        {
            id: 'Room-401',
            label: 'Room 401',
            column: 0,
            row: 1,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 2
        },
        {
            id: 'Room-402',
            label: 'Room 402',
            column: 1,
            row: 1,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 2
        },
        {
            id: 'Room-107',
            label: 'Room 107',
            column: 2,
            row: 1,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 2
        },

        // Column 3 - 10x Series (First Batch)
        {
            id: 'Room-101',
            label: 'Room 101',
            column: 0,
            row: 2,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 4
        },
        {
            id: 'Room-102',
            label: 'Room 102',
            column: 1,
            row: 2,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 4
        },
        {
            id: 'Room-103',
            label: 'Room 103',
            column: 2,
            row: 2,
            rowSpan: 1,
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: 4
        },

        // Column 4 (Right) - 10x Series (Second Batch)
        {
            id: 'Room-104',
            label: 'Room 104',
            column: 3,
            row: 0,
            rowSpan: 1,
            sensors: ['temp', 'door'],
            tempSetpoint: 10
        },
        {
            id: 'Room-105',
            label: 'Room 105',
            column: 3,
            row: 1,
            rowSpan: 1,
            sensors: ['temp', 'door'],
            tempSetpoint: 10
        },
        {
            id: 'Room-106',
            label: 'Room 106',
            column: 3,
            row: 2,
            rowSpan: 1,
            sensors: ['temp', 'door'],
            tempSetpoint: 10
        }
    ],

    // Grid layout settings
    gridColumns: 4,
    gridRows: 3
};
