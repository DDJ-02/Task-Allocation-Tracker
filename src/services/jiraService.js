require('dotenv').config();
const {findContactByEmail, findEmailByFname} = require('../services/googleSheetService');
const {sendWhatsAppMessage} = require('../services/twilioService');
const axios = require('axios');

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

const JQL_QUERY = `project = ${JIRA_PROJECT_KEY} AND duedate <= now() AND statusCategory != Done`;

const getPendingJiraTasks = async () => {
  try {
    // DEBUG logs
    console.log('JIRA_BASE_URL:', JIRA_BASE_URL);
    console.log('JIRA_EMAIL:', JIRA_EMAIL);
    console.log('JIRA_API_TOKEN:', JIRA_API_TOKEN ? '✅ Token present' : '❌ Missing token');
    console.log('JIRA_PROJECT_KEY:', JIRA_PROJECT_KEY);
    console.log('JQL_QUERY:', JQL_QUERY);

    const response = await axios.get(`${JIRA_BASE_URL}/rest/api/3/search`, {
      params: { jql: JQL_QUERY },
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    const issues = response.data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      dueDate: issue.fields.duedate,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
    }));

    return issues;
  } catch (error) {
    console.error('❌ Error fetching Jira tasks:', error.message);
    throw error;
  }
};

//Creating a new Jira issue phase 1 function
async function createJiraIssue(jobText) {
  try {
    const lines = jobText.trim().split("\n").map(l => l.trim()).filter(Boolean);
    const jobId= jobText.match(/JOB ID\s*:\s*(\d+)/i)?.[1] || "";
    const client = jobText.split("\n")[1]?.trim() || "";
    const reportercategory = lines[lines.length - 1];
    let reporter = "";
    if(reportercategory.toLowerCase() == 'a'){
      reporter = "DINAN";
    }else if(reportercategory.toLowerCase() == 'b'){
      reporter = "LALITH";
    }else{
      return;
    }
    const reporterAccountId = await getJiraUserAccountId(await findEmailByFname(reporter));
    
    const issueData = {
      fields: {
        project: {
          key: JIRA_PROJECT_KEY              
        },
        summary: `Job ${jobId} - ${client}`,
        description: convertToADF(parseJobText(jobText)),
        issuetype: {
          name: "Task"              // or Bug, Story, etc.
        },
        reporter: { id: reporterAccountId },
        ...(reporterAccountId && { assignee: { id: reporterAccountId } })

      }  
    };

    const response = await axios.post(
      `${JIRA_BASE_URL}/rest/api/3/issue`,
      issueData,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Issue created successfully:", response.data);
    return true;
  } catch (error) {
    console.error("Error creating issue:", error.response?.data || error.message);
  }
}
function parseJobText(jobText) {
  const lines = jobText.trim().split("\n").map(l => l.trim()).filter(Boolean);
  const reporterCategory = lines[lines.length - 1] || "";

  let reporter = "";
  if (reporterCategory.toLowerCase() === "a") {
    reporter = "DINAN";
  } else if (reporterCategory.toLowerCase() === "b") {
    reporter = "LALITH";
  }

  return {
    jobId: jobText.match(/JOB ID\s*:\s*(\d+)/i)?.[1] || "",
    client: jobText.split("\n")[1]?.trim() || "",
    location: jobText.match(/LOCATION\s*:\s*(.*)/i)?.[1]?.trim() || "",
    fault: jobText.match(/FAULT\s*:\s*(.*)/i)?.[1]?.trim() || "",
    reportedTime: jobText.match(/JOB REPORTED TIME\s*:\s*(.*)/i)?.[1]?.trim() || "",
    reportedBy: jobText.match(/REPORTED BY\s*:\s*(.*)/i)?.[1]?.trim() || "",
    reporter // mapped from last line A → DINAN, B → CHAMAL
  };
}

// 2️⃣ Convert job object into ADF JSON
function convertToADF(jobObj) {
  const { jobId, client, location, fault, reportedTime, reportedBy, reporter } = jobObj;

  const fields = [
    { label: "Job ID", value: jobId },
    { label: "Client", value: client },
    { label: "Location", value: location },
    { label: "Fault", value: fault },
    { label: "Reported Time", value: reportedTime },
    { label: "Reported By", value: reportedBy },
    { label: "Reporter", value: reporter }
  ];

  return {
    version: 1,
    type: "doc",
    content: fields.map(f => ({
      type: "paragraph",
      content: [{ type: "text", text: `${f.label}: ${f.value}` }]
    }))
  };
}

async function transitionJiraIssue(issueKey, transitionName) {
    try {
        // Get available transitions
        const transitionsRes = await axios.get(
            `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const transitions = transitionsRes.data.transitions;
        const transition = transitions.find(t => t.name.toLowerCase() === transitionName.toLowerCase());

        if (!transition) {
            throw new Error(`Transition "${transitionName}" not found for issue ${issueKey}`);
        }

        // Apply transition
        await axios.post(
            `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
            { transition: { id: transition.id } },
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log(`✅ Issue ${issueKey} transitioned to "${transitionName}"`);
        return true;
    } catch (err) {
        console.error("❌ Error transitioning Jira issue:", err.response?.data || err.message);
        return false;
    }
}

async function updateJiraIssueStatus(issueKey, transitionId) {
    return axios.post(
        `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
        { transition: { id: transitionId } },
        {
            headers: {
                Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        }
    );
}
/*
async function getJiraUserAccountId(email) {
  try {
    const response = await axios.get(
      `${process.env.JIRA_BASE_URL}/rest/api/3/user/search?query=${email}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json'
        }
      }
    );

    if (response.data.length === 0) {
      throw new Error(`No Jira user found for email: ${email}`);
    }

    return response.data[0].accountId; // first matching accountId
  } catch (err) {
    console.error('❌ Error fetching Jira accountId:', err.message);
    throw err;
  }
}*/
async function getJiraUserAccountId(email) {
  try {
    console.log('Searching Jira user for email:', email);
    const response = await axios.get(
      `${process.env.JIRA_BASE_URL}/rest/api/3/user/search`,
      {
        params: { query: email }, // safer than manual query string
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json'
        }
      }
    );

    
    console.log('Searching Jira user for email:', email);
    const users = response.data;

    if (!users || users.length === 0) {
      throw new Error(`No Jira user found for email: ${email}`);
    }
    console.log('📩 Jira user search response:', users);
    // ✅ Get the last user in the array
    const lastUser = users[users.length - 1];

    return lastUser.accountId;
  } catch (err) {
    console.error('❌ Error fetching Jira accountId:', err.response?.data || err.message);
    console.log('⚠️ Full error response:', '❌ Error fetching Jira accountId:', err.response?.data || err.message);
    throw err;
  }
}


async function assignJiraIssue(issueKey, assigneeEmail) {
  try {
    const accountId = await getJiraUserAccountId(assigneeEmail);

    const response = await axios.put(
      `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/assignee`,
      { accountId }, // assign using accountId
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Issue ${issueKey} assigned to ${assigneeEmail}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Failed to assign issue ${issueKey}:`, err.message);
    throw err;
  }
}

// 🔑 Jira Auth Helper
function getJiraAuthHeader() {
  return {
    Authorization: `Basic ${Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString('base64')}`,
    Accept: 'application/json',
  };
}
// 🔎 Fetch Jira User Email from accountId
async function getJiraUserEmail(accountId) {
  try {
    const url = `${process.env.JIRA_BASE_URL}/rest/api/3/user?accountId=${accountId}`;
    const response = await axios.get(url, { headers: getJiraAuthHeader() });

    console.log('📩 Jira user lookup response:', response.data);

    return response.data.emailAddress || null;
  } catch (err) {
    console.error(
      '❌ Error fetching Jira user email:',
      err.response?.data || err.message
    );
    return null;
  }
}
async function getIssueReporter(issueKey) {
  try {
    const url = `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueKey}?fields=reporter`;
    const response = await axios.get(url, { headers: getJiraAuthHeader() });

    return response.data.fields.reporter.emailAddress; // Jira Cloud returns email for reporter
  } catch (err) {
    console.error('❌ Error fetching reporter:', err.response?.data || err.message);
    return null;
  }
}

function adfToPlainText(adf) {
  if (!adf || !adf.content) return "";

  return adf.content
    .map(block =>
      block.content
        ?.map(x => x.text || "")
        .join("")
    )
    .join("\n");
}

async function getIssueDetails(issueKey) {
  try {
    const response = await axios.get(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`,
      {
        auth: {
          username: process.env.JIRA_EMAIL,
          password: process.env.JIRA_API_TOKEN
        }
      }
    );

    const fields = response.data.fields;
    console.log("Fetched issue details:", fields);
    console.log(fields.description)
    return {
      description: fields.description || "No description provided",
      status: fields.status?.name || "Unknown",
      assignee: fields.assignee?.displayName || "Unassigned",
      reporterEmail: fields.reporter?.emailAddress || null
    };
  } catch (err) {
    console.error("❌ Error fetching Jira issue details:", err.message);
    return null;
  }
}

// Notify reporter
async function notifyReporter(issueKey) {
  const issue = await getIssueDetails(issueKey);
  if (!issue) return;

  const reporterPhone = await findContactByEmail(issue.reporterEmail);
  if (!reporterPhone) return;

  const msg = `ℹ️ Update on Jira Task *${issueKey}*:
- Status: ${issue.status}
- Assigned to: ${issue.assignee}
- Summary: ${adfToPlainText(issue.description) || 'No description provided'}`;

  await sendWhatsAppMessage(reporterPhone, msg, issueKey);

  console.log(`📲 Notified reporter ${issue.reporterEmail} at ${reporterPhone}`);
}
async function checkIfJiraIssueExists(jobText) {
    try {
        const jobId = jobText.match(/JOB ID\s*:\s*(\d+)/i)?.[1] || "";
        const issue = await getJiraIssue(jobId); // fetch issue by key
        return issue !== null; // returns true if it exists
    } catch (err) {
        return false;
    }
}
async function getJiraIssue(jobId) {
    try {
        // Extract actual issue key if you prepend "JOB ID" text
        const issueKey = jobId.replace("JOB ID", "").trim();

        const response = await axios.get(
          `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`,
          {
            headers: {
              Authorization: `Basic ${Buffer
                .from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`)
                .toString('base64')}`,
              Accept: 'application/json'
            }
          }
        );//await jiraApi.get(`/issue/${issueKey}`);
        return response.data; // issue exists
    } catch (err) {
        if (err.response && err.response.status === 404) {
            return null; // issue not found
        }
        console.error(`⚠️ Error fetching Jira issue ${jobId}:`, err.message);
        throw err;
    }
}

async function isJiraIssueDone(issueKey) {
  try {
    const response = await axios.get(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`,
      {
        headers: {
          Authorization: `Basic ${Buffer
            .from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`)
            .toString('base64')}`,
          Accept: 'application/json'
        }
      }
    );

    // Get current status name (e.g., "To Do", "In Progress", "Done")
    const currentStatus = response.data.fields.status.name;

    // Return true if status is "Done", else false
    return currentStatus.toLowerCase() === "done";

  } catch (err) {
    console.error(`Error checking issue ${issueKey}:`, err.message);
    return false; // safe fallback
  }
}

async function getJiraIssueTimelineWithDurations(issueKey) {
  try {
    const response = await axios.get(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}?expand=changelog`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json'
        }
      }
    );

    const fields = response.data.fields;
    const changelog = response.data.changelog.histories;

    // Build status transition history
    const statusChanges = [];

    changelog.forEach(entry => {
      entry.items.forEach(item => {
        if (item.field === "status") {
          statusChanges.push({
            from: item.fromString || "Unspecified",
            to: item.toString,
            changedAt: new Date(entry.created)
          });
        }
      });
    });

    // Sort by time to be safe
    statusChanges.sort((a, b) => a.changedAt - b.changedAt);

    // Calculate durations
    const timeInStatus = {};
    let lastStatus = statusChanges.length > 0 ? statusChanges[0].from : fields.status.name;
    let lastChangeTime = statusChanges.length > 0 ? statusChanges[0].changedAt : new Date(fields.created);

    statusChanges.forEach(change => {
      // Accumulate time spent in previous status
      const diffMs = change.changedAt - lastChangeTime;
      timeInStatus[lastStatus] = (timeInStatus[lastStatus] || 0) + diffMs;

      // Move to next status
      lastStatus = change.to;
      lastChangeTime = change.changedAt;
    });

    // Add time from last status until now
    const now = new Date();
    const diffMs = now - lastChangeTime;
    timeInStatus[lastStatus] = (timeInStatus[lastStatus] || 0) + diffMs;

    // Convert ms to human readable
    const readable = Object.fromEntries(
      Object.entries(timeInStatus).map(([status, ms]) => [
        status,
        msToReadable(ms)
      ])
    );

    return {
      issueKey,
      currentStatus: fields.status.name,
      timeline: statusChanges,
      timeInStatus: readable
    };

  } catch (err) {
    console.error(`❌ Error fetching timeline for ${issueKey}:`, err.response?.data || err.message);
    return null;
  }
}

function msToReadable(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ${minutes % 60}m`;
}


module.exports = { getJiraIssue,checkIfJiraIssueExists,transitionJiraIssue,getJiraUserEmail,createJiraIssue,isJiraIssueDone,updateJiraIssueStatus, getJiraUserAccountId,assignJiraIssue ,getPendingJiraTasks,getIssueReporter,notifyReporter,getJiraIssueTimelineWithDurations,adfToPlainText};
