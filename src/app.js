require('dotenv').config();
const express = require('express');
const jiraRoutes = require('./routes/jiraRoutes');
const jiraWebhookRoutes = require('./routes/jiraWebhook');
const whatsappWebhook = require('./routes/whatsappWebhook').router;
const googleSheetRoutes = require('./routes/googleSheetRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Logging middleware
app.use((req, res, next) => {
  //console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});
app.use((req, res, next) => {
  //console.log('Here")')
  //console.log('Incoming request:', req.method, req.url, req.body);
  //console.log('Here")')
  next();
});

// Routes
app.use('/api/jira', jiraRoutes);
app.use('/api/jira', jiraWebhookRoutes);
app.use('/api/whatsapp', whatsappWebhook);
app.use('/api/sheets', googleSheetRoutes);

app.get('/', (req, res) => {
  res.send('Server running...');
});

// Start the server AFTER all middleware and routes
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
