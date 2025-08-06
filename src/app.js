require('dotenv').config();
const express = require('express');
const jiraRoutes = require('./routes/jiraRoutes');
const jiraWebhookRoutes = require('./routes/jiraWebhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/jira', jiraRoutes);
app.use('/api/jira', jiraWebhookRoutes);

app.get('/', (req, res) => {
  res.send('Server running...');
});

// Start the server AFTER all middleware and routes
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
