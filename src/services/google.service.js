const axios = require('axios');

const GOOGLE_ADS_API_VERSION = 'v13';
const GOOGLE_ADS_ENDPOINT = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

async function getGoogleAccessToken(refreshToken) {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    return response.data.access_token;
  } catch (error) {
    console.log('Error getting Google access token:', error.message);
    throw error;
  }
}

async function getCampaigns(accessToken) {
  try {
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
    
    const response = await axios.post(
      `${GOOGLE_ADS_ENDPOINT}/customers/${customerId}/googleAds:search`,
      {
        query: `
          SELECT 
            campaign.id,
            campaign.name,
            campaign.status,
            metrics.clicks,
            metrics.impressions
          FROM campaign
          WHERE campaign.status = ENABLED
        `
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          'login-customer-id': customerId
        }
      }
    );

    return response.data.results || [];
  } catch (error) {
    console.log('Error fetching campaigns:', error.message);
    return [];
  }
}

async function getLeadFormSubmissions(accessToken, leadFormId) {
  try {
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
    
    const response = await axios.post(
      `${GOOGLE_ADS_ENDPOINT}/customers/${customerId}/googleAds:search`,
      {
        query: `
          SELECT 
            lead_form.id,
            lead_form.name,
            lead_form.business_name,
            metrics.lead_form_submissions
          FROM lead_form
          WHERE lead_form.id = ${leadFormId}
        `
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          'login-customer-id': customerId
        }
      }
    );

    return response.data.results || [];
  } catch (error) {
    console.log('Error fetching lead form submissions:', error.message);
    return [];
  }
}

async function parseGoogleLeadData(formData) {
  try {
    const leadData = {
      name: formData.first_name && formData.last_name 
        ? `${formData.first_name} ${formData.last_name}`
        : formData.name || 'Not Provided',
      email: formData.email || '',
      phone: formData.phone_number ? parseInt(formData.phone_number.replace(/\D/g, '')) : 0,
      service: formData.service_interest || formData.interested_in || 'General',
      source: 'google',
      campaign: formData.campaign_name || 'Direct',
      keyword: formData.keyword || null,
      notes: formData.message || formData.additional_info || ''
    };

    return leadData;
  } catch (error) {
    console.log('Error parsing Google lead data:', error.message);
    return null;
  }
}

async function formatLeadForDB(leadData) {
  return {
    ...leadData,
    status: 'new',
    source: 'google'
  };
}

module.exports = {
  getGoogleAccessToken,
  getCampaigns,
  getLeadFormSubmissions,
  parseGoogleLeadData,
  formatLeadForDB
};
