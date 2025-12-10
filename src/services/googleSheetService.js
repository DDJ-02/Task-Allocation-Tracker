// services/googleSheetService.js
const { google } = require('googleapis');
const path = require('path');
/*
async function getSheetData(range = 'Sheet1!A:D') {
  try {
    console.log('🔑 Authenticating with Google Sheets API...');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    console.log('✅ Google Sheets API authenticated. Got Client.');

    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('📄 Fetching data from Google Sheet...');

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yQQuMlVKZ_-X44IBbuwUQy1h4tKKVMALRQ2DFLlqLdY',
      range,
    });

    console.log('✅ Google Sheets response:', res.data.values);
    return res.data.values || [];

  } catch (err) {
    console.error('❌ Error fetching Google Sheet:', err.message);
    return [];
  }
}*/


async function getSheetData(range = 'Sheet1!A:D') {
  try {
    // Create GoogleAuth instance
    console.log('🔑 Check THIS Authenticating with Google Sheets API...')  ;
    
      
    const auth = new google.auth.GoogleAuth({
      client_email: "google-sheet-access-service@metro-469109.iam.gserviceaccount.com",
      private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUCAv13FaiYSNJ\nh5ndp5TslEgVPi7otF6e4CS/OPSeMq3fqDPxLjWTMBwy3srzXEyKggbSDUEYEApx\nmKTqjoTF+b+jHuqxXuY4NRVete3hbiJhFbwPQUZp0lKdIt80srfdrwo4NpUOfd0F\nGheSfSGdRD2bTRme9WFSpeiZhvinvlchUSjqd6HLFrk36zuKWgfxOfX5bfYo8jPK\nSl7jDQAXvEeH0Ssa9CqtrwjX697fOCThiuKlyKfCJPp8hnyOzAKNcwXVymhWz41q\nT8NQ36+xT9jRyshOIEzAqoaqrqJGX8WCY+rh0Tm5KbKLob8ARUtClN1+MeXKbgnv\n3OcytRshAgMBAAECggEAV79kw8EGEXlF0z5NDRA3b5kGI9RyMVfD+NgmHQUDJx0u\nG+tOY7eN8HXulZbiQsil3IRnMjLOB5lL2SskxPVqOUxcZLN8yR7PA9/kEigUZEDh\n9W+7PkzzSQQDsIgn+3Ui5pl0D0N3eGHaQCxGKRej+6OsI0NLIR/HwR5sHm1fJnu7\n0JIGVZds/Q9jdYpyFEzVIKlhbo/RHEq48N6hJbYxuf5yJpJ5excQvkgMvpwWB4Zl\nbysTWQAKn8TQp+Na4bYZIfoATNO6IEYXViB9ZO/SQ6aG7+dWZq691Fh08cgucYnE\n1B8HlVNtKuV5wDhLWCrwl3JUWlBNmOYTv8I2xD9ASQKBgQD68pJnZHdrCLwkj+Rn\nUxpR25E3e5CyUY4HB4+9v93DAIqAvsFUzG91gzkP14pm7+K0SgQEuEZCEiUKmbfE\n8rUVJlZT78o9Q512GecKN9XJnHwVEYkAGa1H9CKRrh3QbmGYK9zsPDPGxaHtvOe7\nuixZj1mlDjyuEAECMeJJGEAjvwKBgQDYTOTv2lRiSVgtpqsbIdU/JCcEE0Ts48um\ni1iUJXmVjK/46jSEFGhki6eJJSWGoBmlK5kxNx6ACuHSu3KMmKnYIH+5erzNwz8o\neMo/48X3MINlmqGVVFKoWELG7D6pd5BTE1L9UnfguMu9uzTpFg0U8OozDRbgnYb7\nHU/AOtT5HwKBgCDoQk6QnCBLCvD4dYkfGqp1UnumFnlrvGYrlavaRyhVH9R2L0AB\ndvQ/+vGa4ClTd7UQp6o+x+fOHVFgivqmoRxe5J8pKKoT/cgI6YUrgTto69SPchmz\nREfVOdtEq+AzOVUNG3FXC6sbK3rTdMfnR/2OkMDWNxrUOm2hQP040uBdAoGBAMC7\nY5NFG8OoTuX+iKBYeUcV054R/WyHXcM8juUSr0/OWE6Xgcve01YkClhtvQ5EQhWm\nz43G62p0R9waImuc7FokOyrubqV5wCEz4CMlthQYKjyymCATTsOqQXY2s28Vlogv\nw9btUNvwTbr1wKOgfm+Wa1ip5SSnuMqwx4sl4PdJAoGBAOWt5tkgqPa5frfVr/1b\ncARrA8+bsSQT9ZSUP8OsL1mrjivNJRUPG0N06Sdo0hPoO5ixQiAsfEAtmwiHKElU\nQ1v1EeoriZYaCXOwta6ZUs/PBxW/y/PTVtTBZpXZ3DeVMmt1KxuA3CBqjjyqsXnm\nBbz+Dzry9bIdfQaaE1UKWY8l\n-----END PRIVATE KEY-----\n`,


      //keyFile: process.env.GOOGLE_CREDENTIALS_PATH,// path.join(__dirname, 'google-credentials.json'), // <- your JSON key
      //scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    console.log('Got authentocated');

    try{
        
      // Get an authenticated client
      const client = await auth.getClient();
      console.log('✅ Google Sheets API authenticated. Got Client.');
    }catch(err){
      console.log('xxxxxxxxxxxxxxxxxError in getting authenticated client:', err.message);
    }
    // Pass the authenticated client to the Sheets API
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('📄 Fetching data from Google Sheet...');
    try{
      const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yQQuMlVKZ_-X44IBbuwUQy1h4tKKVMALRQ2DFLlqLdY', // <- your sheet ID
      range,
    });
    }catch(err){
      console.log('xxxxxxxxxxxxxxxxxError in fetching sheet data:', err.message);
    }

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
