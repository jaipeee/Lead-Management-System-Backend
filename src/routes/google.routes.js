const express = require('express');
const router = express.Router();
const googleController = require('../controllers/google.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/webhook', googleController.receiveWebhook);

router.get('/leads', requireAuth, googleController.getGoogleLeads);
router.post('/campaigns', requireAuth, googleController.getCampaignData);
router.post('/sync/:leadId', requireAuth, googleController.syncGoogleLead);

module.exports = router;
