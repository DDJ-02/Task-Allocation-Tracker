const { sendWhatsAppMessage, sendWhatsAppTemplateWithActionButton } = require('./twilioService');
const { findContactByEmail } = require('./googleSheetService');
const { getJiraUserEmail } = require('./jiraService');

async function notifyAssignee(issueKey, assigneeAccountId, assigneeName, issueDescription) {
  // 1. Get email
  const assigneeEmail = await getJiraUserEmail(assigneeAccountId);

  if (!assigneeEmail) {
    console.warn(`⚠️ Cannot get email for ${assigneeName}`);
    return false;
  }

  // 2. Get phone number
  const phoneNumber = await findContactByEmail(assigneeEmail);
  if (!phoneNumber) {
    console.warn(`⚠️ No phone number found for ${assigneeEmail}`);
    return false;
  }

  // 3. Try normal WhatsApp message
  const msgText = `A new Jira task has been assigned.\n\nAssignee: ${assigneeName}\n\nDetails: ${issueDescription}`;

  const sid = await sendWhatsAppMessage(phoneNumber, msgText, issueKey);
  console.log(`WhatsApp SID: ${sid}`);

    // Immediate fallback only if Twilio API call failed
  if (!sid) {
    console.warn(`❌ Twilio API failed, sending template immediately`);
    await sendWhatsAppTemplateWithActionButton(phoneNumber, assigneeName, issueKey);
  }

  return true;
}

module.exports = { notifyAssignee };
