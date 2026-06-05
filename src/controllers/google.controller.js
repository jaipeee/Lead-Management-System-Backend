const Lead = require('../models/lead.model');
const googleService = require('../services/google.service');
const { sendNewLeadAlert } = require('../services/email.service');

async function receiveWebhook(req, res) {
  try {
    res.status(200).json({ success: true });

    const formData = req.body.lead_form_data || req.body;
    
    processGoogleLead(formData);
  } catch (error) {
    console.log('Webhook error:', error.message);
    res.status(200).json({ success: true });
  }
}

async function processGoogleLead(formData) {
  try {
    const leadData = await googleService.parseGoogleLeadData(formData);
    
    if (!leadData || !leadData.email) {
      console.log('Invalid lead data from Google');
      return;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingLead = await Lead.findOne({
      email: leadData.email.toLowerCase(),
      createdAt: { $gte: oneHourAgo }
    });

    if (existingLead) {
      console.log('Duplicate lead detected:', leadData.email);
      return;
    }

    const formattedLead = await googleService.formatLeadForDB(leadData);
    const newLead = new Lead(formattedLead);
    await newLead.save();

    await sendNewLeadAlert(newLead);
  } catch (error) {
    console.log('Error processing Google lead:', error.message);
  }
}

async function getGoogleLeads(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const leads = await Lead.find({ source: 'google' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Lead.countDocuments({ source: 'google' });

    res.status(200).json({
      leads,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
}

async function getCampaignData(req, res) {
  try {
    const refreshToken = req.body.refresh_token;
    
    if (!refreshToken) {
      return res.status(400).json({ msg: 'Refresh token required' });
    }

    const accessToken = await googleService.getGoogleAccessToken(refreshToken);
    const campaigns = await googleService.getCampaigns(accessToken);

    res.status(200).json({ campaigns });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
}

async function syncGoogleLead(req, res) {
  try {
    const { leadId } = req.params;
    const { formData } = req.body;

    const leadData = await googleService.parseGoogleLeadData(formData);
    
    if (!leadData) {
      return res.status(400).json({ msg: 'Invalid lead data' });
    }

    let lead = await Lead.findById(leadId);
    
    if (!lead) {
      lead = new Lead(await googleService.formatLeadForDB(leadData));
    } else {
      Object.assign(lead, leadData);
    }

    await lead.save();
    await sendNewLeadAlert(lead);

    res.status(200).json({ lead });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
}

module.exports = {
  receiveWebhook,
  getGoogleLeads,
  getCampaignData,
  syncGoogleLead
};
