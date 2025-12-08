const twilio = require('twilio');
const { saveMappingToSheet,getJiraKeyFromSheet } = require('./googleSheetService');
require('dotenv').config();

//This can be replaced with a database or any persistent storage
const messageTaskMap = {};  //This will map relavant task ID with the message ID in whatapp

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//template msg with job details
async function sendWhatsAppTemplateWithActionButton(to, assigneeName, issueKey) {
  try {
    
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      contentSid: process.env.TWILIO_TEMPLATE_SID_ACTION,   // <--- IMPORTANT
      contentVariables: JSON.stringify({
        "1": assigneeName,
      })
    });

    console.log("Template message sent:", result.sid);
    sendTaskPrompt(result.sid, issueKey);
    return true;
  } catch (error) {
    console.error("Twilio template send error:", error);
    return false;
  }
}

//template msg with job details need to erase
async function sendWhatsAppTemplate(to, assigneeName, issueDescription) {
  try {
    const cleanedDescription = issueDescription
      .replace(/\n/g, ' ')  // remove newlines
      //.replace(/\s\s+/g, ' ')  // remove extra spaces
      .trim();
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      contentSid: process.env.TWILIO_TEMPLATE_SID,   // <--- IMPORTANT
      contentVariables: JSON.stringify({
        "1": assigneeName,
        "2": cleanedDescription
      })
    });

    console.log("Template message sent:", result.sid);
    sendTaskPrompt(result.sid, issue);
    return true;
  } catch (error) {
    console.error("Twilio template send error:", error);
    return false;
  }
}
/*
async function sendWhatsAppMessage(to, message, issueKey) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      statusCallback: `${process.env.SERVER_URL}/api/whatsapp/status`
    });

    console.log('📩 WhatsApp message queued, SID:', result.sid);
    sendTaskPrompt(result.sid, issueKey); // store SID with task
    return result.sid;
  } catch (err) {
    console.error('❌ Error sending WhatsApp message:', err.message);
    // fallback only if API call itself fails
    await sendWhatsAppTemplateWithActionButton(to, assigneeName, issueKey);
    return false;
  }
}
*/

//General sending whatsapp message function
// This function sends a WhatsApp message using Twilio's API

async function sendWhatsAppMessage(to, message, issueKey) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      statusCallback: `${process.env.SERVER_URL}/api/whatsapp/status`
    });

    console.log('📩 WhatsApp message queued. SID:', result.sid);

    // Save mapping
    await sendTaskPrompt(result.sid, issueKey);

    return result.sid;
  } catch (err) {
    console.error('❌ Error sending WhatsApp message:', err.message);
    return false;
  }
}
/*
async function sendWhatsAppMessage(to, message,issue) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      statusCallback: `${process.env.SERVER_URL}/api/whatsapp/status`
    });
    console.log('📩 WhatsApp message sent, SID:', result.sid,statusCallback);
    //console.log('✅ WhatsApp message sent:', result.sid);
    sendTaskPrompt(result.sid, issue); // Store the message SID with the task
    console.log('️📤 WhatsApp SID created:', result.sid);
    return result.sid;
    //return result.sid
    //return true;  
  } catch (err) {
    console.error('❌ Error sending WhatsApp message:', err.message);
    return false;
  }
}*/

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



module.exports = {sendWhatsAppMessage, sendTaskPrompt, identifyTagReply,getMessageTaskMap, sendWhatsAppTemplate, sendWhatsAppTemplateWithActionButton };