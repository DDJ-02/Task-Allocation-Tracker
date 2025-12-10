// services/googleSheetService.js
const { google } = require('googleapis');
const path = require('path');

async function getSheetData(range = 'Sheet1!A:D') {
  try {
    // Create GoogleAuth instance
    console.log('🔑 Check THIS Authenticating with Google Sheets API...')  ;
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'google-credentials.json'), // <- your JSON key
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    console.log('Got authentocated');

    // Get an authenticated client
    const client = await auth.getClient();
    console.log('✅ Google Sheets API authenticated. Got Client.');
    // Pass the authenticated client to the Sheets API
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('📄 Fetching data from Google Sheet...');
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yQQuMlVKZ_-X44IBbuwUQy1h4tKKVMALRQ2DFLlqLdY', // <- your sheet ID
      range,
    });

    console.log('✅ Google Sheets response:', res.data.values);
    return res.data.values || [];
  } catch (err) {
    console.error('❌ Error fetching Google Sheet:', err.message);
    throw err;
  }
}

async function findContactByPhone(phone) {
  const rows = await getSheetData();
  if (!rows.length) return null;

  const headers = rows.shift();
  const phoneIndex = headers.indexOf('phone');
  if (phoneIndex === -1) {
    throw new Error("❌ 'phone' column not found in Google Sheet");
  }

  const row = rows.find(row => row[phoneIndex] === phone);
  return row || null;
}

async function findContactByEmail(email) {
  console.log(`🔍 Searching for contact with email: ${email}`);
  const rows = await getSheetData();
  if (!rows.length) return null;

  const headers = rows.shift();
  const emailIndex = headers.indexOf('email');
  const phoneIndex = headers.indexOf('phone');

  if (emailIndex === -1 || phoneIndex === -1) {
    throw new Error("❌ 'email' or 'phone' column not found in Google Sheet");
  }

  const row = rows.find(row => row[emailIndex] === email);
  if (!row) return null;

  const phoneNumber = row[phoneIndex];
  if (!phoneNumber) return null;

  const formatted = phoneNumber.startsWith('+94') ? phoneNumber: '+94' + phoneNumber.replace(/^0/, '');
  console.log(`📞 Contact found for email ${email}:`, formatted);
  return formatted;

}
async function findContactByFname(fname) {
  console.log(`🔍 Searching for contact with first`);
  const rows = await getSheetData();
  if (!rows.length) return null;

  const headers = rows.shift();
  const fnameIndex = headers.indexOf('f_name');
  const phoneIndex = headers.indexOf('phone');

  if (fnameIndex === -1 || phoneIndex === -1) {
    throw new Error("❌ 'fname' or 'phone' column not found in Google Sheet");
  }

  const row = rows.find(row => row[fnameIndex].toLowerCase() === fname.toLowerCase());
  if (!row) return null;

  const phoneNumber = row[phoneIndex];
  if (!phoneNumber) return null;

  // Ensure the number starts with +94
  const formatted = phoneNumber.startsWith('+94') ? phoneNumber : '+94' + phoneNumber.replace(/^0/, '');
  console.log(`📞 Contact found for first name ${fname}:`, formatted);
  return formatted;
}

async function findEmailByFname(fname) {
  console.log(`🔍 Searching for email with first name: ${fname}`);
  const rows = await getSheetData();
  if (!rows.length) return null;

  const headers = rows.shift();
  const fnameIndex = headers.indexOf('f_name');
  const emailIndex = headers.indexOf('email');

  if (fnameIndex === -1 || emailIndex === -1) {
    throw new Error("❌ 'f_name' or 'email' column not found in Google Sheet");
  }

  const row = rows.find(r => r[fnameIndex].toLowerCase() === fname.toLowerCase());
  if (!row) return null;

  const email = row[emailIndex];
  console.log(`📧 Contact found for first name ${fname}: ${email}`);
  return email || null;
}


// Function to append row
async function saveMappingToSheet(msgid, jiraKey) {
  const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'google-credentials.json'), // <- your JSON key
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

    // Get an authenticated client
    const client = await auth.getClient();

    // Pass the authenticated client to the Sheets API
    const sheets = google.sheets({ version: 'v4', auth: client });

    const res = sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: "1sNzLjnWx2bK7m035zXG0ti1lpUTVJ1ksXeQx861xvZY",
    range: "Sheet1!A:B", // assuming first 2 columns
    valueInputOption: "RAW",
    requestBody: {
      values: [[msgid, jiraKey]],
    },
  });

  console.log(`✅ Saved mapping to Google Sheet: ${msgid} -> ${jiraKey}`);
  return jiraKey
}

async function getJiraKeyFromSheet(msgsid) {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "google-credentials.json"), // your service account JSON
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const client = await auth.getClient();

  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    auth: client,
    spreadsheetId: "1sNzLjnWx2bK7m035zXG0ti1lpUTVJ1ksXeQx861xvZY",
    range: "Sheet1!A:B", // assuming MsgID in column A, JiraKey in column B
  });

  const rows = res.data.values || [];
  for (let row of rows) {
    if (row[0] === msgsid) {
      return row[1]; // JiraKey
    }
  }
  return null;
}

module.exports = { getSheetData, findContactByPhone, findContactByEmail, findContactByFname, findEmailByFname,saveMappingToSheet,getJiraKeyFromSheet };
