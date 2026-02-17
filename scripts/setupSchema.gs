/**
 * PULSE — Google Sheets Schema Setup
 * 
 * Run setupSchema() to create/reset all 3 sheets:
 *   1. Event_Ledger  (signal change logs with ON/OFF pairing)
 *   2. Rooms         (room master data)
 *   3. Config        (thresholds & settings)
 * 
 * ⚠️ WARNING: This will DELETE existing data in these sheets!
 */

function setupSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── 1. Event_Ledger ──────────────────────────────────────
  const ledger = _getOrCreateSheet(ss, 'Event_Ledger');
  ledger.clear();

  const ledgerHeaders = [
    'Event_ID', 'Timestamp', 'Event_Type', 'Room_ID', 'Signal_State',
    'Paired_Event_ID', 'Duration_Sec', 'Severity',
    'Acknowledged', 'Ack_By', 'Ack_At', 'Notes'
  ];
  ledger.getRange(1, 1, 1, ledgerHeaders.length).setValues([ledgerHeaders]);
  _formatHeader(ledger, ledgerHeaders.length, '#1a1a2e', '#e0e0ff');

  // Column widths
  ledger.setColumnWidth(1, 160);  // Event_ID
  ledger.setColumnWidth(2, 200);  // Timestamp
  ledger.setColumnWidth(3, 150);  // Event_Type
  ledger.setColumnWidth(4, 150);  // Room_ID
  ledger.setColumnWidth(5, 110);  // Signal_State
  ledger.setColumnWidth(6, 160);  // Paired_Event_ID
  ledger.setColumnWidth(7, 110);  // Duration_Sec
  ledger.setColumnWidth(8, 80);   // Severity
  ledger.setColumnWidth(9, 110);  // Acknowledged
  ledger.setColumnWidth(10, 120); // Ack_By
  ledger.setColumnWidth(11, 200); // Ack_At
  ledger.setColumnWidth(12, 200); // Notes

  // Data validation for Event_Type
  const eventTypes = ['DOOR', 'PANIC', 'EMERGENCY_DOOR_1', 'EMERGENCY_DOOR_2', 'POWER_FAILURE'];
  const eventTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(eventTypes, true)
    .setAllowInvalid(false)
    .build();
  ledger.getRange('C2:C1000').setDataValidation(eventTypeRule);

  // Data validation for Signal_State
  const stateRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['ON', 'OFF'], true)
    .setAllowInvalid(false)
    .build();
  ledger.getRange('E2:E1000').setDataValidation(stateRule);

  // Data validation for Severity
  const sevRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['LOW', 'MED', 'HIGH', 'CRIT'], true)
    .setAllowInvalid(false)
    .build();
  ledger.getRange('H2:H1000').setDataValidation(sevRule);

  // Data validation for Acknowledged
  const ackRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .build();
  ledger.getRange('I2:I1000').setDataValidation(ackRule);

  // Conditional formatting: ON = red bg, OFF = green bg
  _addConditionalFormat(ledger, 'E2:E1000', 'ON', '#ffcccc');
  _addConditionalFormat(ledger, 'E2:E1000', 'OFF', '#ccffcc');

  // Conditional formatting: Severity colors
  _addConditionalFormat(ledger, 'H2:H1000', 'CRIT', '#ff4444', '#ffffff');
  _addConditionalFormat(ledger, 'H2:H1000', 'HIGH', '#ff8800', '#ffffff');
  _addConditionalFormat(ledger, 'H2:H1000', 'MED', '#ffcc00');
  _addConditionalFormat(ledger, 'H2:H1000', 'LOW', '#88cc88');

  // Freeze header
  ledger.setFrozenRows(1);

  // ── 2. Rooms ─────────────────────────────────────────────
  const rooms = _getOrCreateSheet(ss, 'Rooms');
  rooms.clear();

  const roomHeaders = ['Room_ID', 'Label', 'Type', 'Slave_ID', 'Temp_Setpoint', 'Sensors', 'Active'];
  rooms.getRange(1, 1, 1, roomHeaders.length).setValues([roomHeaders]);
  _formatHeader(rooms, roomHeaders.length, '#0d3b66', '#cce5ff');

  const roomData = [
    ['Chiller_Room_1', 'Chiller Room 1', 'Chiller', 1, -20, 'temp,door,panic', 'TRUE'],
    ['Chiller_Room_2', 'Chiller Room 2', 'Chiller', 2, -20, 'temp,door,panic', 'TRUE'],
    ['Chiller_Room_3', 'Chiller Room 3', 'Chiller', 3, -18, 'temp,door,panic', 'TRUE'],
    ['Chiller_Room_4', 'Chiller Room 4', 'Chiller', 4, 2, 'temp,door,panic', 'TRUE'],
    ['Chiller_Room_5', 'Chiller Room 5', 'Chiller', 5, 4, 'temp,door,panic', 'TRUE'],
    ['Chiller_Room_6', 'Chiller Room 6', 'Chiller', 6, 10, 'temp,door,panic', 'TRUE'],
    ['Frozen_Room_1', 'Frozen Room 1', 'Frozen', 8, -25, 'temp,door,panic', 'TRUE'],
    ['Frozen_Room_2', 'Frozen Room 2', 'Frozen', 9, -25, 'temp,door,panic', 'TRUE'],
    ['Frozen_Room_3', 'Frozen Room 3', 'Frozen', 10, -25, 'temp,door,panic', 'TRUE'],
    ['Frozen_Room_4', 'Frozen Room 4', 'Frozen', 11, -30, 'temp,door,panic', 'TRUE'],
    ['Frozen_Room_5', 'Frozen Room 5', 'Frozen', 12, -30, 'temp,door,panic', 'TRUE'],
    ['GLOBAL', 'Global Signals', 'Global', 7, '', 'emergency_door_1,emergency_door_2,power', 'TRUE']
  ];
  rooms.getRange(2, 1, roomData.length, roomHeaders.length).setValues(roomData);

  rooms.setColumnWidth(1, 150);
  rooms.setColumnWidth(2, 160);
  rooms.setColumnWidth(3, 80);
  rooms.setColumnWidth(4, 80);
  rooms.setColumnWidth(5, 120);
  rooms.setColumnWidth(6, 250);
  rooms.setColumnWidth(7, 60);
  rooms.setFrozenRows(1);

  // Type validation
  const typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Chiller', 'Frozen', 'Global'], true)
    .build();
  rooms.getRange('C2:C50').setDataValidation(typeRule);

  // ── 3. Config ────────────────────────────────────────────
  const config = _getOrCreateSheet(ss, 'Config');
  config.clear();

  const configHeaders = ['Key', 'Value', 'Description'];
  config.getRange(1, 1, 1, configHeaders.length).setValues([configHeaders]);
  _formatHeader(config, configHeaders.length, '#3d0066', '#e6ccff');

  const configData = [
    ['POLLING_INTERVAL_MS', '2000', 'Modbus poll frequency in ms'],
    ['DOOR_WARN_THRESHOLD_SEC', '300', 'Door open WARNING after 5 min'],
    ['DOOR_CRIT_THRESHOLD_SEC', '900', 'Door open CRITICAL after 15 min'],
    ['POWER_CRIT_THRESHOLD_SEC', '60', 'Power outage CRITICAL after 1 min']
  ];
  config.getRange(2, 1, configData.length, configHeaders.length).setValues(configData);

  config.setColumnWidth(1, 250);
  config.setColumnWidth(2, 100);
  config.setColumnWidth(3, 350);
  config.setFrozenRows(1);

  // ── Cleanup: delete default "Sheet1" if it exists ────────
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }

  // Also clean up old schema sheets if they exist
  const oldSheets = ['Sensor_Log', 'Alarms', 'Users', 'Audit_Log'];
  oldSheets.forEach(name => {
    const old = ss.getSheetByName(name);
    if (old) ss.deleteSheet(old);
  });

  SpreadsheetApp.getUi().alert(
    '✅ PULSE Schema Ready!\n\n' +
    '• Event_Ledger — signal change logs\n' +
    '• Rooms — 11 rooms + GLOBAL\n' +
    '• Config — 4 threshold settings\n\n' +
    'Old sheets (Sheet1, Sensor_Log, Alarms, Users, Audit_Log) cleaned up.'
  );
}


// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function _getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function _formatHeader(sheet, colCount, bgColor, fontColor) {
  const headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange
    .setBackground(bgColor)
    .setFontColor(fontColor || '#ffffff')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, '#666666', SpreadsheetApp.BorderStyle.SOLID);
}

function _addConditionalFormat(sheet, range, value, bgColor, fontColor) {
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(value)
    .setBackground(bgColor);

  if (fontColor) {
    rule.setFontColor(fontColor);
  }

  const rules = sheet.getConditionalFormatRules();
  rules.push(rule.setRanges([sheet.getRange(range)]).build());
  sheet.setConditionalFormatRules(rules);
}
