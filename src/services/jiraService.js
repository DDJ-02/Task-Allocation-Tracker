require('dotenv').config();
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

module.exports = { getPendingJiraTasks };
