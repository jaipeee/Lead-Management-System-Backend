const leadModel = require('../models/lead.model')
const { sendNewLeadAlert } = require('../services/email.service')

async function createLead(req, res) {
    try {
        const { name, email, phone, service, source, campaign, keyword } = req.body
        const lead = await leadModel.create({ name, email, phone, service, source, campaign, keyword })
        await sendNewLeadAlert(lead)
        res.status(201).json({ msg: 'Lead created successfully', lead })
    } catch (error) {
        res.status(500).json({ msg: 'Something went wrong while creating lead' })
    }
}

async function getAllLeads(req, res) {
    try {
        const { source, status, page = 1, limit = 20 } = req.query
        const filter = {}
        if (source) filter.source = source
        if (status) filter.status = status

        const leads = await leadModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('assignedTo', 'username email')

        const total = await leadModel.countDocuments(filter)
        res.status(200).json({ leads, total, page: Number(page), limit: Number(limit) })
    } catch (error) {
        res.status(500).json({ msg: 'Something went wrong while fetching leads' })
    }
}

async function getLeadById(req, res) {
    try {
        const lead = await leadModel.findById(req.params.id).populate('assignedTo', 'username email')
        if (!lead) return res.status(404).json({ msg: 'Lead not found' })
        res.status(200).json({ lead })
    } catch (error) {
        res.status(500).json({ msg: 'Something went wrong while fetching lead' })
    }
}

async function updateLead(req, res) {
    try {
        const lead = await leadModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!lead) return res.status(404).json({ 
            msg: 'Lead not found' 
        })
        res.status(200).json({ 
           msg: 'Lead updated successfully',
           lead 
        })
    } catch (error) {
        res.status(500).json({ 
            msg: 'Something went wrong while updating lead' 
        })
    }
}

async function deleteLead(req, res) {
    try {
        const lead = await leadModel.findByIdAndDelete(req.params.id)
        if (!lead) return res.status(404).json({ msg: 'Lead not found' })
        res.status(200).json({ msg: 'Lead deleted successfully' })
    } catch (error) {
        res.status(500).json({ msg: 'Something went wrong while deleting lead' })
    }
}

module.exports = { createLead, getAllLeads, getLeadById, updateLead, deleteLead }