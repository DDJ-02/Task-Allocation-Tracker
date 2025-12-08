const express = require('express');
const router = express.Router();
const { sendWhatsAppTemplateWithActionButton } = require('../services/twilioService');
const { getJiraKeyFromSheet } = require('../services/googleSheetService');

router.post('/status', express.urlencoded({ extended: false }), async (req, res) => {
  const { MessageSid, MessageStatus, To } = req.body;
  console.log(`📩 Status callback: SID=${MessageSid}, Status=${MessageStatus}`);

  if (MessageStatus === 'undelivered' || MessageStatus === 'failed') {
    const issueKey = await getJiraKeyFromSheet(MessageSid);
    if (!issueKey) return res.sendStatus(200);

    console.log(`🔄 Sending fallback template for issue ${issueKey} to ${To}`);
    await sendWhatsAppTemplateWithActionButton(To.replace('whatsapp:', ''), 'Assignee', issueKey);
  }

  res.sendStatus(200);
});

/*
// webhook endpoint to track message delivery
router.post('/status', async (req, res) => {
  const { MessageSid, MessageStatus } = req.body;

  console.log(`Status update for SID ${MessageSid}: ${MessageStatus}`);

  // If message failed, send the template
  if (["failed", "undelivered"].includes(MessageStatus)) {
    const issueKey = await getJiraKeyFromSheet(MessageSid);
    const task = getTaskBySID(MessageSid); // your function to find task by SID
    if (task) {
      console.warn(`Message failed, sending fallback template for task ${task.issueKey}`);
      await sendWhatsAppTemplateWithActionButton(task.phoneNumber, task.assigneeName, task.issueKey);
    }
  }

  res.sendStatus(200); // Twilio requires 200 OK
});


/*
router.post('/status', async (req, res) => {
  const { MessageSid, MessageStatus, To } = req.body;

  console.log(`📩 WhatsApp status callback: SID=${MessageSid} status=${MessageStatus} to=${To}`);

  if (MessageStatus === 'undelivered' || MessageStatus === 'failed') {
    const issueKey = await getJiraKeyFromSheet(MessageSid);
    if (!issueKey) {
      console.warn(`⚠️ No Jira task found for message SID ${MessageSid}`);
      return res.sendStatus(200);
    }

    console.log(`🔄 Sending fallback template for issue ${issueKey} to ${To}`);
    await sendWhatsAppTemplateWithActionButton(To.replace('whatsapp:', ''), 'Assignee', issueKey);
  }

  res.sendStatus(200);
});*/

module.exports = router;
