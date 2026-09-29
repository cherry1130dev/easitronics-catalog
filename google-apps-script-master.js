/**
 * =========================================================================
 * EASICART / EASITRONICS - MASTER GOOGLE APPS SCRIPT CLOUD BACKEND
 * =========================================================================
 * 
 * Automatically manages:
 * 1. Hardware Components & Notes Cloud Storage across all devices (Mobile, PC, Tablet)
 * 2. Real-time Project Catalog uploads (append, update, delete)
 * 
 * =========================================================================
 * 30-SECOND SETUP INSTRUCTIONS:
 * =========================================================================
 * 1. Open your Google Spreadsheet:
 *    https://docs.google.com/spreadsheets/d/1N-Y7BH0Cf3rgC3LEy2tYlRBHm46nLB3RcABcgrt3YlQ/edit
 * 2. Click "Extensions" > "Apps Script" in the top menu.
 * 3. Delete any existing code and PASTE this entire script.
 * 4. Click the blue "Deploy" button (top-right) > "New deployment".
 * 5. Select type: "Web app" (click gear icon next to Select type).
 * 6. Configuration:
 *    - Description: "EasiCart Components & Catalog Sync"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (CRITICAL: Must be "Anyone" so mobile devices & web app can connect)
 * 7. Click "Deploy", review & authorize permissions.
 * 8. Copy the "Web app URL" (it ends in /exec).
 * 9. Paste that URL in EasiCart Developer Hub (under Components & Notes or Sync Settings).
 * 
 * DONE! All components you save on any device are now stored directly in Google Sheets!
 * =========================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) || 'get_components';
    
    if (action === 'get_components') {
      return getComponentsResponse(ss);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'EasiCart Google Apps Script Webhook is active and running!',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    var action = data.action || (Array.isArray(data) ? 'catalog_append' : 'catalog_append');

    // 1. Save components for a project
    if (action === 'save_components') {
      return handleSaveComponents(ss, data);
    }

    // 2. Save all components in batch (vault sync)
    if (action === 'save_all_components') {
      return handleSaveAllComponents(ss, data);
    }

    // 3. Fetch components
    if (action === 'get_components') {
      return getComponentsResponse(ss);
    }

    // 4. Catalog Update
    if (action === 'update') {
      return handleCatalogUpdate(ss, data);
    }

    // 5. Catalog Delete
    if (action === 'delete') {
      return handleCatalogDelete(ss, data);
    }

    // Default: Catalog batch append
    return handleCatalogAppend(ss, data);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get or create a sheet tab by name
 */
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f3f4f6');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * Handle saving components for a single project
 */
function handleSaveComponents(ss, data) {
  var projectTitle = (data.projectTitle || '').trim();
  if (!projectTitle) {
    return jsonResponse({ status: 'error', message: 'Project title is required' });
  }

  var components = Array.isArray(data.components) ? data.components : [];
  var notes = data.notes || data.clientSpecialNotes || '';
  var clientPhone = data.clientPhone || '';
  var clientName = data.clientName || '';
  var budget = data.budget || '';
  var deadline = data.deadline || '';
  var now = new Date().toISOString();

  // 1. Save to human-readable "Components" sheet (easy to view & print in Google Sheets on any device)
  var compSheet = getOrCreateSheet(ss, 'Components', [
    'Project Title',
    'Component Name',
    'Quantity',
    'Category',
    'Status',
    'Component Notes',
    'Client Name',
    'Client Phone',
    'Project Notes',
    'Budget',
    'Deadline',
    'Updated At'
  ]);

  // Remove existing rows for this project title so we don't accumulate duplicates
  deleteRowsMatchingTitle(compSheet, 1, projectTitle);

  // Append new component rows
  if (components.length > 0) {
    var rowsToAppend = components.map(function(c) {
      return [
        projectTitle,
        c.name || '',
        c.quantity || 1,
        c.category || 'Sensor',
        c.status || 'pending',
        c.notes || '',
        clientName,
        clientPhone,
        notes,
        budget,
        deadline,
        now
      ];
    });
    var lastRow = compSheet.getLastRow();
    compSheet.getRange(lastRow + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  } else if (notes) {
    // Has project notes even if no components added yet
    compSheet.appendRow([
      projectTitle,
      '(No components - Notes only)',
      0,
      'Note',
      'pending',
      '',
      clientName,
      clientPhone,
      notes,
      budget,
      deadline,
      now
    ]);
  }

  // 2. Save full structured JSON to "Components_Vault" sheet for instant cross-device hydration
  var vaultSheet = getOrCreateSheet(ss, 'Components_Vault', [
    'Project Title',
    'Client Name',
    'Client Phone',
    'Component Count',
    'Components JSON',
    'Special Notes',
    'Budget',
    'Deadline',
    'Updated At'
  ]);

  deleteRowsMatchingTitle(vaultSheet, 1, projectTitle);
  vaultSheet.appendRow([
    projectTitle,
    clientName,
    clientPhone,
    components.length,
    JSON.stringify(components),
    notes,
    budget,
    deadline,
    now
  ]);

  return jsonResponse({
    status: 'success',
    message: 'Saved ' + components.length + ' components for "' + projectTitle + '" to Google Sheets!',
    projectTitle: projectTitle,
    componentsCount: components.length,
    updatedAt: now
  });
}

/**
 * Handle batch saving all components
 */
function handleSaveAllComponents(ss, data) {
  var vault = data.vault || {};
  var keys = Object.keys(vault);
  var savedCount = 0;

  for (var i = 0; i < keys.length; i++) {
    var entry = vault[keys[i]];
    if (entry && entry.projectTitle) {
      handleSaveComponents(ss, {
        projectTitle: entry.projectTitle,
        clientName: entry.clientName,
        clientPhone: entry.clientPhone,
        components: entry.components || [],
        notes: entry.clientSpecialNotes || entry.notes || '',
        budget: entry.budget || '',
        deadline: entry.deadline || ''
      });
      savedCount++;
    }
  }

  return jsonResponse({
    status: 'success',
    message: 'Batch saved ' + savedCount + ' project vaults to Google Sheets!',
    savedCount: savedCount
  });
}

/**
 * Read and return components from Google Sheets as JSON
 */
function getComponentsResponse(ss) {
  var vault = {};
  var count = 0;

  // Prefer reading from Components_Vault sheet
  var vaultSheet = ss.getSheetByName('Components_Vault');
  if (vaultSheet && vaultSheet.getLastRow() > 1) {
    var data = vaultSheet.getRange(2, 1, vaultSheet.getLastRow() - 1, 9).getValues();
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var title = String(row[0] || '').trim();
      if (!title) continue;

      var normKey = title.toLowerCase().trim();
      var clientName = String(row[1] || '');
      var clientPhone = String(row[2] || '');
      var compsRaw = String(row[4] || '[]');
      var notes = String(row[5] || '');
      var budget = String(row[6] || '');
      var deadline = String(row[7] || '');
      var updatedAt = String(row[8] || '');

      var parsedComps = [];
      try {
        parsedComps = JSON.parse(compsRaw);
      } catch (e) {}

      vault[normKey] = {
        projectTitle: title,
        clientName: clientName,
        clientPhone: clientPhone,
        components: Array.isArray(parsedComps) ? parsedComps : [],
        clientSpecialNotes: notes,
        budget: budget,
        deadline: deadline,
        updatedAt: updatedAt || new Date().toISOString()
      };
      count++;
    }
  } else {
    // Fallback: Read from human-readable Components sheet
    var compSheet = ss.getSheetByName('Components');
    if (compSheet && compSheet.getLastRow() > 1) {
      var cData = compSheet.getRange(2, 1, compSheet.getLastRow() - 1, 12).getValues();
      for (var j = 0; j < cData.length; j++) {
        var cRow = cData[j];
        var pTitle = String(cRow[0] || '').trim();
        var compName = String(cRow[1] || '').trim();
        if (!pTitle || compName === '(No components - Notes only)') continue;

        var key = pTitle.toLowerCase().trim();
        if (!vault[key]) {
          vault[key] = {
            projectTitle: pTitle,
            clientName: String(cRow[6] || ''),
            clientPhone: String(cRow[7] || ''),
            clientSpecialNotes: String(cRow[8] || ''),
            budget: String(cRow[9] || ''),
            deadline: String(cRow[10] || ''),
            components: [],
            updatedAt: String(cRow[11] || new Date().toISOString())
          };
          count++;
        }

        if (compName) {
          vault[key].components.push({
            id: 'c-gs-' + (j + 1),
            name: compName,
            quantity: parseInt(cRow[2], 10) || 1,
            category: String(cRow[3] || 'Sensor'),
            status: String(cRow[4] || 'pending'),
            notes: String(cRow[5] || '')
          });
        }
      }
    }
  }

  return jsonResponse({
    status: 'success',
    count: count,
    vault: vault,
    fetchedAt: new Date().toISOString()
  });
}

/**
 * Delete rows where column (1-indexed) matches target title (case-insensitive)
 */
function deleteRowsMatchingTitle(sheet, colIndex, title) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  var target = title.toLowerCase().trim();

  // Iterate backwards so deletions don't shift subsequent indices
  for (var i = values.length - 1; i >= 0; i--) {
    var cellVal = String(values[i][0] || '').toLowerCase().trim();
    if (cellVal === target) {
      sheet.deleteRow(i + 2);
    }
  }
}

/**
 * Catalog helper functions (for backwards compatibility)
 */
function handleCatalogAppend(ss, data) {
  var sheet = ss.getActiveSheet();
  var rows = Array.isArray(data) ? data : (data.projects || [data]);
  rows.forEach(function(p) {
    if (p && p.title) {
      sheet.appendRow([
        p.title || '',
        p.domain || '',
        p.branch || '',
        p.type || '',
        p.price || '',
        p.description || '',
        p.imageUrl || 'ADD_IMAGE_LINK',
        p.demoVideoUrl || 'ADD_VIDEO_LINK',
        Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
        p.featured ? 'TRUE' : 'FALSE'
      ]);
    }
  });
  return jsonResponse({ status: 'success', action: 'appended', count: rows.length });
}

function handleCatalogUpdate(ss, data) {
  var sheet = ss.getActiveSheet();
  var origTitle = (data.originalTitle || (data.project && data.project.title) || '').toLowerCase().trim();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonResponse({ status: 'not_found' });

  var titles = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < titles.length; i++) {
    if (String(titles[i][0] || '').toLowerCase().trim() === origTitle) {
      var p = data.project || {};
      sheet.getRange(i + 2, 1, 1, 10).setValues([[
        p.title || '',
        p.domain || '',
        p.branch || '',
        p.type || '',
        p.price || '',
        p.description || '',
        p.imageUrl || 'ADD_IMAGE_LINK',
        p.demoVideoUrl || 'ADD_VIDEO_LINK',
        Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
        p.featured ? 'TRUE' : 'FALSE'
      ]]);
      return jsonResponse({ status: 'success', action: 'updated', row: i + 2 });
    }
  }
  return jsonResponse({ status: 'not_found' });
}

function handleCatalogDelete(ss, data) {
  var sheet = ss.getActiveSheet();
  var targetTitle = (data.title || '').toLowerCase().trim();
  if (targetTitle) {
    deleteRowsMatchingTitle(sheet, 1, targetTitle);
  }
  return jsonResponse({ status: 'success', action: 'deleted' });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
