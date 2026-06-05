const express = require('express')
const router = express.Router()
const leadController = require('../controllers/lead.controller')
const { requireAuth } = require('../middleware/auth.middleware')
const { leadValidator } = require('../validators/lead.validator')
const { validateRequest } = require('../middleware/validate.middleware')

router.post('/', leadValidator, validateRequest, leadController.createLead)
router.get('/', requireAuth, leadController.getAllLeads)
router.get('/:id', requireAuth, leadController.getLeadById)
router.put('/:id', requireAuth, leadController.updateLead)
router.delete('/:id', requireAuth, leadController.deleteLead)

module.exports = router
