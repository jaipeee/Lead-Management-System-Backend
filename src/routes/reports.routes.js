const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/analytics', requireAuth, reportsController.getAnalyticsDashboard);
router.get('/export/excel', requireAuth, async (req, res) => {
  try {
    const buffer = await reportsController.exportLeadsExcel(req, res);
    res.end(buffer);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
router.get('/export/pdf', requireAuth, reportsController.exportLeadsPDF);

module.exports = router;
