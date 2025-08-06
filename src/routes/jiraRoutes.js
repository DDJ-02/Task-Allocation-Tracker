const express = require('express');
const router = express.Router();
const { getPendingJiraTasks } = require('../services/jiraService');

router.get('/pending-tasks', async (req, res) => {
  try {
    console.log('🔍 Fetching pending Jira tasks...');
    const tasks = await getPendingJiraTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
