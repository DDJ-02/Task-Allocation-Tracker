const express = require('express');
const router = express.Router();

router.post('/webhook', express.json(), (req, res) => {
  const payload = req.body;

  console.log('📩 Jira webhook received:', JSON.stringify(payload, null, 2));

  // Check if issue assigned or updated
  const issue = payload.issue;
  const changelog = payload.changelog;

  // You can check if "assignee" field changed
  const assigneeChanged = changelog?.items.some(item => item.field === 'assignee');

  if (assigneeChanged) {
    const assigneeName = issue.fields.assignee?.displayName;
    const assigneeEmail = issue.fields.assignee?.emailAddress;
    const issueKey = issue.key;
    const issueSummary = issue.fields.summary;

    console.log(`👤 Issue ${issueKey} assigned to ${assigneeName} (${assigneeEmail})`);

    // TODO: Send WhatsApp message to assignee here
  }

  res.status(200).send('Webhook received');
});

module.exports = router;
