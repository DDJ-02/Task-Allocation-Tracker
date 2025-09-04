// routes/jiraWebhook.js
const express = require('express');
const axios = require('axios');
const { sendWhatsAppMessage } = require('../services/twilioService');
const { findContactByEmail } = require('../services/googleSheetService');
const {getJiraUserEmail} = require('../services/jiraService');
const router = express.Router();

router.post('/webhook', express.json(), async (req, res) => {
  const payload = req.body;

  console.log('📩 Jira webhook received:', JSON.stringify(payload, null, 2));

  const issue = payload.issue;
  const changelog = payload.changelog;

  // ✅ Detect assignee change
  const assigneeChanged = changelog?.items.some(
    (item) => item.field === 'assignee'
  );

  if (assigneeChanged) {
    const assigneeName = issue.fields.assignee?.displayName;
    const assigneeAccountId = issue.fields.assignee?.accountId;
    const issueKey = issue.key;
    //const issueSummary = issue.fields.summary;
    const issueDescription = issue.fields.description || 'No description provided';

    console.log(
      `👤 Issue ${issueKey} assigned to ${assigneeName} (accountId: ${assigneeAccountId})`
    );

    // 🔎 Step 1: Get assignee email
    const assigneeEmail = await getJiraUserEmail(assigneeAccountId);
    console.log(`📧 Jira returned email: ${assigneeEmail}`);

    if (!assigneeEmail) {
      console.warn(`⚠️ Could not fetch email for ${assigneeName}`);
      return res.status(200).send('No email found');
    }

    // 🔎 Step 2: Look up phone number in Google Sheets
    const phoneNumber = await findContactByEmail(assigneeEmail);
    console.log(`📞 Found phone number for ${assigneeEmail}: ${phoneNumber}`);

    if (!phoneNumber) {
      console.warn(`⚠️ No phone number found in sheet for ${assigneeEmail}`);
      return res.status(200).send('No phone number found');
    }

    // 📲 Step 3: Send WhatsApp message
    const message = `👋 Hi ${assigneeName},\n\nYou have been assigned a new Jira task:\n${issueDescription}`;
    console.log(message)
    await sendWhatsAppMessage(phoneNumber, message, issueKey);

    console.log(`✅ WhatsApp message sent to ${assigneeName} (${phoneNumber})`);
  }

  res.status(200).send('Webhook processed');
});

module.exports = router;
