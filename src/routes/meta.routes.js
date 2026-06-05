const express = require('express');
const router = express.Router();
const metaController = require('../controllers/meta.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/webhook', metaController.verifyWebhook);
router.post('/webhook', metaController.receiveWebhook);

router.get('/leads', requireAuth, metaController.getMetaLeads);
router.get('/status', requireAuth, metaController.getWebhookStatus);
router.post('/sync/:leadGenId', requireAuth, metaController.syncMetaLead);

module.exports = router;
