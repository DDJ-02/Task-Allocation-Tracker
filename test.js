const { google } = require('googleapis');
const path = require('path');

async function testSheets() {
  /*const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1yQQuMlVKZ_-X44IBbuwUQy1h4tKKVMALRQ2DFLlqLdY',
    range: 'Sheet1!A1:D5',
  });

  console.log('✅ Google Sheets response:', res.data.values);
}*/
const msg = `Job ID : 16333287
DURDANS HOSPITAL - COLOMBO - 03
Location : 03 Alfred Place COLOMBO - 03
Fault : Activate The DOD /DID Facility with the below extension (Ex- 3819)
Job Reported Time : 2025-08-19 / 14:41 PM
Reported By  : Mr Nilika
Report : Dinan`

const client = msg.split("\n")[1]?.trim() || "";
console.log(`Client: ${client}`);
}
testSheets().catch(err => console.error('❌ ERROR:', err));
