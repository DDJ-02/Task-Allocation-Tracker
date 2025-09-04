const twilio = require('twilio');
const { saveMappingToSheet,getJiraKeyFromSheet } = require('./googleSheetService');
require('dotenv').config();

//This can be replaced with a database or any persistent storage
const messageTaskMap = {};  //This will map relavant task ID with the message ID in whatapp

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//General sending whatsapp message function
// This function sends a WhatsApp message using Twilio's API
async function sendWhatsAppMessage(to, message,issue) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`
    });
    console.log('✅ WhatsApp message sent:', result.sid);
    sendTaskPrompt(result.sid, issue); // Store the message SID with the task
    //return result.sid
  } catch (err) {
    console.error('❌ Error sending WhatsApp message:', err.message);
  }
}

//This function keeps recods of the whatsapp message sent for a specific task
// It maps the message SID to the Jira task key
async function sendTaskPrompt(msgid, jiraKey) {
  saveMappingToSheet(msgid, jiraKey);
  //messageTaskMap[msgid] = { jiraKey };
  //console.log(`📩 Task prompt sent for ${jiraKey} with message SID: ${msgid}`);
  //return jiraKey;
}

async function getMessageTaskMap(){
  return messageTaskMap;
}

//tagreply msg
async function identifyTagReply(msgsid) {
  const issueKey = await getJiraKeyFromSheet(msgsid);

  if (issueKey) {
    console.log(`🔍 Identified task for message SID ${msgsid}: ${issueKey}`);
    return issueKey;
  } else {
    console.log(`❌ No JiraKey found for message SID: ${msgsid}`);
    return null;
  }  
}



module.exports = {sendWhatsAppMessage, sendTaskPrompt, identifyTagReply,getMessageTaskMap };