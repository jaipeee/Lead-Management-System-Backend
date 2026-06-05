const crypto = require('crypto');
const axios = require('axios');

const META_API_VERSION = 'v18.0';
const META_GRAPH_API_URL = `https://graph.instagram.com/${META_API_VERSION}`;

function verifyMetaWebhookSignature(payload, signature) {
    const secret = process.env.META_APP_SECRET;
    
    if (!secret) {
        console.error('META_APP_SECRET not configured');
        return false;
    }

    const hash = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return hash === signature;
}


function parseMetaLeadData(leadData) {
    try {
        leadFields.forEach(field => {
            const name = field.name?.toLowerCase() || '';
            const value = field.value || '';

            switch (name) {
                case 'name':
                case 'full_name':
                    leadObject.name = value;
                    break;
                case 'email':
                    leadObject.email = value;
                    break;
                case 'phone_number':
                case 'phone':
                    leadObject.phone = value;
                    break;
                case 'service':
                case 'interested_in':
                case 'product':
                    leadObject.service = value;
                    break;
                case 'campaign_name':
                    leadObject.campaign = value;
                    break;
                case 'message':
                case 'comments':
                    leadObject.notes = value;
                    break;
                default:
                    if (!leadObject.notes) {
                        leadObject.notes = '';
                    }
                    leadObject.notes += `${name}: ${value}\n`;
            }
        });

        return leadObject;
    } catch (error) {
        console.error('Error parsing Meta lead data:', error);
        throw new Error('Failed to parse lead data');
    }
}


async function processMetaLead(metaLeadData, source = 'meta') {
    try {
        const leadId = metaLeadData.id;
        const formId = metaLeadData.form_id;
        const campaignId = metaLeadData.campaign_id;
        const adId = metaLeadData.ad_id;

        const parsedLead = parseMetaLeadData(metaLeadData);
        if (!parsedLead.name || !parsedLead.email || !parsedLead.phone) {
            throw new Error('Missing required fields: name, email, or phone');
        }

        let leadSource = source;
        if (source === 'meta') {
            leadSource = 'meta'; 
        }

        parsedLead.source = leadSource;
        parsedLead.campaign = parsedLead.campaign || `Form: ${formId}`;
        parsedLead.keyword = adId ? `Ad: ${adId}` : null;

        parsedLead.notes = parsedLead.notes || '';
        parsedLead.notes += `\n--- ${source.toUpperCase()} Lead Details ---\nLead ID: ${leadId}\nForm ID: ${formId}\nCampaign ID: ${campaignId}`;

        return parsedLead;
    } catch (error) {
        console.error('Error processing Meta lead:', error);
        throw error;
    }
}


function getAccessToken(source = 'facebook') {
    if (source === 'instagram') {
        return process.env.IG_ACCESS_TOKEN;
    }
    return process.env.FB_PAGE_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
}


function getPageAccessToken() {
    return process.env.FB_PAGE_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
}


async function getLeadGenData(leadGenId, accessToken) {
    try {
        const url = `${META_GRAPH_API_URL}/${leadGenId}/?fields=id,form_id,field_data,campaign_id,ad_id,created_time&access_token=${accessToken}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching lead gen data from Meta:', error.response?.data || error.message);
        throw new Error('Failed to fetch lead data from Meta');
    }
}


async function sendLeadToWebhook(lead, webhookUrl) {
    try {
        if (!webhookUrl) return;

        await axios.post(webhookUrl, {
            event: 'lead.created',
            lead: lead,
            source: 'meta',
            timestamp: new Date().toISOString()
        }, {
            timeout: 5000
        });
    } catch (error) {
        console.error('Error sending lead to external webhook:', error.message);
    }
}


function formatLeadForDB(leadData) {
    return {
        name: leadData.name?.trim() || '',
        email: leadData.email?.trim().toLowerCase() || '',
        phone: leadData.phone ? String(leadData.phone).replace(/\D/g, '') : '',
        service: leadData.service?.trim() || 'Not specified',
        source: leadData.source || 'meta',
        campaign: leadData.campaign?.trim() || '',
        keyword: leadData.keyword || '',
        notes: leadData.notes?.trim() || ''
    };
}

module.exports = {
    verifyMetaWebhookSignature,
    parseMetaLeadData,
    processMetaLead,
    getPageAccessToken,
    getAccessToken,
    getLeadGenData,
    sendLeadToWebhook,
    formatLeadForDB
};
