// routes/contactRoutes.js
const express = require('express');
const { findContactByPhone } = require('../services/googleSheetService');
const router = express.Router();

router.get('/contact/:phone', async (req, res) => {
  console.log(`🔍 Fetching contact for phone: ${req.params.phone}`);
  try {
    const contact = await findContactByPhone(req.params.phone);

    if (!contact) {
      console.warn(`⚠️ Contact not found for phone: ${req.params.phone}`);
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ contact });
    console.log(`📞 Contact found:`, contact);
  } catch (err) {
    console.error('❌ Error in /contact route:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
