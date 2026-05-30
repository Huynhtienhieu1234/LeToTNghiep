const SHEET_NAME = "Sheet1";

function doGet(e) {
  const params = e.parameter || {};
  const callback = params.callback || "";
  const action = params.action || "submit";
  const name = (params.name || "").trim();

  let result;
  try {
    if (action !== "submit") {
      result = { ok: false, message: "Unsupported action" };
    } else {
      result = submitAttendance(name);
    }
  } catch (error) {
    result = { ok: false, message: error.message || String(error) };
  }

  if (callback) {
    return ContentService.createTextOutput(
      `${callback}(${JSON.stringify(result)});`,
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function submitAttendance(name) {
  if (!name) {
    return { ok: false, message: "Missing name" };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return { ok: false, message: `Missing sheet: ${SHEET_NAME}` };
  }

  const normalizedName = normalizeName(name);
  const lastRow = sheet.getLastRow();
  const existingNames =
    lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
      : [];

  const matchedName = existingNames.find(
    (existingName) => normalizeName(existingName) === normalizedName,
  );

  if (matchedName) {
    return {
      ok: true,
      duplicate: true,
      name: matchedName,
      message: "Name already submitted",
    };
  }

  sheet.appendRow([name, new Date()]);
  return {
    ok: true,
    duplicate: false,
    name,
    message: "Saved",
  };
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
