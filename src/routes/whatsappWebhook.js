// routes/whatsappWebhook.js
const express = require('express');
const { updateJiraIssueStatus, assignJiraIssue, notifyReporter, createJiraIssue } = require('../services/jiraService');
const { identifyTagReply } = require('../services/twilioService');
const {findContactByFname, findEmailByFname} = require('../services/googleSheetService');
const { getJiraUserEmail } = require('../services/jiraService');
const { transitionJiraIssue } = require('../services/jiraService');
const { checkIfJiraIssueExists } = require('../services/jiraService');
const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('log.txt', { flags: 'a' }); // append mode
const logStdout = process.stdout;

console.log = function (...args) {
    logFile.write(util.format(...args) + '\n');
    logStdout.write(util.format(...args) + '\n');
};

const router = express.Router();
//const { getMessageTaskMap,identifyTagReply } = require('../services/twilioService');
//const taskAssignments = await getMessageTaskMap();

router.post('/whatsapp-webhook', express.urlencoded({ extended: false }), async (req, res) => {
    
    console.log('📩 WhatsApp webhook received:');
    const from = req.body.From.replace('whatsapp:', '');
    const message = req.body.Body.trim().toUpperCase();

    console.log(`💬 Message from ${from}: ${message} `);
    const originalMessageSid = req.body.OriginalRepliedMessageSid;
    //console.log(`📩 Original Message SID: ${originalMessageSid}`);
    
    if (message.startsWith("JOB ID")) {
        // Check if the issue already exists in Jira
        const exists = await checkIfJiraIssueExists(message);
        console.log(`🔍 Checking if job ${message} exists in Jira: ${exists}`);
        if (exists) {
            console.log(`⚠️ Job ${message} already exists in Jira`);
            res.send(`<Response><Message>⚠️ Task ${message} already exists in Jira.</Message></Response>`);
            return;
        }

        const success = await createJiraIssue(message);
        if (success) {
            res.send(`<Response><Message>✅ Task created.</Message></Response>`);
        } else {
            res.send(`<Response><Message>❌ Could not create task </Message></Response>`);
        }
        return;
    }

    // If user sends a message without replying
    if (!originalMessageSid) {
        console.log(`⚠️ User sent a message without replying`);
        res.send(`<Response><Message>❗ Make sure to reply to a message to perform an action.</Message></Response>`);
        return;
    }

    // Identify the issue key from replied message
    const issueKey = await identifyTagReply(originalMessageSid);
    console.log(`🔍 Identified issue key: ${issueKey}`);
    
    if (message.startsWith("ASSIGN ")) {
        console.log("🔄 Assigning task...");
        const assigneeName = message.replace("ASSIGN ", "").trim();
        const assigneeNumber = await findContactByFname(assigneeName);
        console.log(`🔍 Found assignee number: ${assigneeNumber}`);
        const assigneeEmail = await findEmailByFname(assigneeName);
        console.log(`🔍 Assignee Name: ${assigneeName}, Number: ${assigneeNumber}, Email: ${assigneeEmail}`);
        if (assigneeNumber) {
            // Update Jira issue
            await assignJiraIssue(issueKey, assigneeEmail);
            res.send(`<Response><Message>✅ Task ${issueKey} assigned to ${assigneeName}.</Message></Response>`);
        } else {
            res.send(`<Response><Message>❌ Could not find number for ${assigneeName}.</Message></Response>`);
        }
    } else if (message === "START"|| message === "CONTINUE") {
        console.log("▶️ Starting task...");
        const success = await transitionJiraIssue(issueKey, "In Progress");
        if (success) {
            res.send(`<Response><Message>✅ Task ${issueKey} moved to In Progress.</Message></Response>`);
            await notifyReporter(issueKey);
        } else {
            res.send(`<Response><Message>❌ Could not move task ${issueKey} to In Progress.</Message></Response>`);
        }
    } else if (message === "PAUSE") {
        console.log("▶️ PAUSING task...");
        const success = await transitionJiraIssue(issueKey, "PAUSE");
        if (success) {
            res.send(`<Response><Message>✅ Task ${issueKey} moved to PAUSE.</Message></Response>`);
            await notifyReporter(issueKey);
        } else {
            res.send(`<Response><Message>❌ Could not move task ${issueKey} to PAUSE.</Message></Response>`);
        }
    } else if (message === "DONE") {
        console.log("▶️ Completing task...");
        const success = await transitionJiraIssue(issueKey, "DONE");
        if (success) {
            res.send(`<Response><Message>✅ Task ${issueKey} moved to DONE.</Message></Response>`);
            await notifyReporter(issueKey);
        } else {
            res.send(`<Response><Message>❌ Could not move task ${issueKey} to DONE.</Message></Response>`);
        }
    } else if (message === "WORKSHOP") {
        console.log("▶️ Workshop task...");
        const success = await transitionJiraIssue(issueKey, "WORKSHOP");
        if (success) {
            res.send(`<Response><Message>✅ Task ${issueKey} moved to WORKSHOP.</Message></Response>`);
            await notifyReporter(issueKey);
        } else {
            res.send(`<Response><Message>❌ Could not move task ${issueKey} to WORKSHOP.</Message></Response>`);
        }
    } else {
        res.send(`<Response><Message>❓ Unknown command. Use "ASSIGN Name".</Message></Response>`);
    }
    }
    /*
    pendingAction  = "Yes"
    //const { issueKey, pendingAction } = taskAssignments[from];
    
    try {
        const issuekey = identifyTagReply(req.body.OriginalRepliedMessageSid);
        // 1️⃣ If awaiting confirmation
        if (pendingAction) {
            if (message === 'yes') {
                if (pendingAction.type === 'accept') {
                    await updateJiraIssueStatus(issueKey, '11'); // "In Progress"
                    res.send(`<Response><Message>✅ Task ${issueKey} marked as In Progress.</Message></Response>`);
                } else if (pendingAction.type === 'assign') {
                    await assignJiraIssue(issueKey, pendingAction.assignee);
                    res.send(`<Response><Message>🔄 Task ${issueKey} assigned to ${pendingAction.assignee}.</Message></Response>`);
                }
                taskAssignments[from].pendingAction = null; // clear
                return;
            } else if (message === 'no') {
                taskAssignments[from].pendingAction = null; // cancel
                res.send(`<Response><Message>❌ Action cancelled for ${issueKey}.</Message></Response>`);
                return;
            } else {
                res.send(`<Response><Message>Please reply with "yes" or "no" to confirm.</Message></Response>`);
                return;
            }
        }

        // 2️⃣ New commands
        if (message === 'accept') {
            taskAssignments[from].pendingAction = { type: 'accept' };
            res.send(`<Response><Message>⚠️ Confirm: Mark task ${issueKey} as In Progress? Reply "yes" or "no".</Message></Response>`);
        } else if (message.startsWith('assign ')) {
            const newAssignee = message.replace('assign ', '').trim();
            taskAssignments[from].pendingAction = { type: 'assign', assignee: newAssignee };
            res.send(`<Response><Message>⚠️ Confirm: Assign task ${issueKey} to ${newAssignee}? Reply "yes" or "no".</Message></Response>`);
        } else {
            res.send(`<Response><Message>❓ Unknown command. Reply with "accept" or "assign [name]".</Message></Response>`);
        }

    } catch (err) {
        res.send(`<Response><Message>⚠️ Error: ${err.message}</Message></Response>`);
    }*/
);

module.exports.router = router;
