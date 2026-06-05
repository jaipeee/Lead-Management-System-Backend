const crypto = require('crypto');
const leadModel = require('../models/lead.model');
const metaService = require('../services/meta.service');
const emailService = require('../services/email.service');

async function verifyWebhook(req, res) {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Verification failed');
        }
    } catch (error) {
        res.status(500).json({ msg: 'Verification error' });
    }
}


async function receiveWebhook(req, res) {
    try {
        res.status(200).json({ status: 'received' });

        const signature = req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'];
        const payload = JSON.stringify(req.body);

        if (signature) {
            const isValid = metaService.verifyMetaWebhookSignature(payload, signature?.replace('sha256=', ''));
            if (!isValid) {
                console.warn('⚠️ Invalid webhook signature - but processing anyway');
            }
        }

        processWebhookData(req.body).catch(error => {
        });

    } catch (error) {
        console.error('Error in webhook receiver:', error);
        res.status(200).json({ status: 'received' }); // Still return 200 to Meta
    }
}


async function processWebhookData(webhookData) {
    try {
        const entries = webhookData.entry || [];

        for (const entry of entries) {
            const changes = entry.changes || [];

            for (const change of changes) {
                if (change.field === 'leadgen_qualifying_questions' || change.field === 'leadgen') {
                    const leadData = change.value;

                    if (leadData.leadgen_id) {
                        try {
                            const metaLeadData = await metaService.getLeadGenData(
                                leadData.leadgen_id,
                                metaService.getPageAccessToken()
                            );

                            await createLeadFromMeta(metaLeadData);
                        } catch (error) {
                            console.error('Error getting lead from Meta API:', error.message);
                            await createLeadFromMeta(leadData);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error processing webhook data:', error);
    }
}


async function createLeadFromMeta(metaLeadData, source = 'meta') {
    try {
      
        if (!source || source === 'meta') {

            source = metaLeadData.source || 'meta';
        }

        const processedLead = await metaService.processMetaLead(metaLeadData, source);
        const formattedLead = metaService.formatLeadForDB(processedLead);

    
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const existingLead = await leadModel.findOne({
            email: formattedLead.email,
            source: formattedLead.source,
            createdAt: { $gte: oneHourAgo }
        });

        if (existingLead) {
            console.log(`⚠️ Duplicate lead detected: ${formattedLead.email} (${source})`);
            return existingLead;
        }

        const lead = await leadModel.create(formattedLead);
        console.log(`✓ Lead created from ${source.toUpperCase()}: ${lead._id}`);

        try {
            await emailService.sendNewLeadAlert(lead);
        } catch (emailError) {
            console.error('Error sending lead alert email:', emailError.message);
        }

        return lead;
    } catch (error) {
        console.error(`Error creating lead from ${source}:`, error.message);
        throw error;
    }
}


async function getMetaLeads(req, res) {
    try {
        const { page = 1, limit = 20, source } = req.query;


        const filter = {};
        if (source) {
            filter.source = source;
        } else {
            filter.source = { $in: ['meta', 'facebook', 'instagram'] };
        }

        const leads = await leadModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('assignedTo', 'username email');

        const total = await leadModel.countDocuments(filter);

        res.status(200).json({
            leads,
            total,
            page: Number(page),
            limit: Number(limit),
            source: source || 'all meta sources',
            sources_available: ['meta', 'facebook', 'instagram']
        });
    } catch (error) {
        console.error('Error fetching Meta leads:', error);
        res.status(500).json({ msg: 'Failed to fetch leads' });
    }
}


async function syncMetaLead(req, res) {
    try {
        const { leadGenId } = req.params;

        if (!leadGenId) {
            return res.status(400).json({ msg: 'leadGenId is required' });
        }

        const metaLeadData = await metaService.getLeadGenData(
            leadGenId,
            metaService.getPageAccessToken()
        );

        const lead = await createLeadFromMeta(metaLeadData);

        res.status(201).json({
            msg: 'Lead synced successfully from Meta',
            lead
        });
    } catch (error) {
        console.error('Error syncing lead:', error);
        res.status(500).json({ msg: 'Failed to sync lead' });
    }
}


async function getWebhookStatus(req, res) {
    try {
        const status = {
            webhook_url: process.env.META_WEBHOOK_URL,
            verify_token_configured: !!process.env.META_VERIFY_TOKEN,
            app_id: process.env.META_APP_ID,
            api_version: 'v18.0',
            status: 'configured',
            events_subscribed: ['leadgen_qualifying_questions', 'leadgen']
        };

        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching webhook status' });
    }
}

module.exports = {
    verifyWebhook,
    receiveWebhook,
    createLeadFromMeta,
    getMetaLeads,
    syncMetaLead,
    getWebhookStatus
};
