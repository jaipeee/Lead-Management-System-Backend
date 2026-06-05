const sgMail = require('../config/sendgrid');
const analyticsService = require('./analytics.service');

async function sendNewLeadAlert(lead) {
    try {
        await sgMail.send({
            to: process.env.ADMIN_EMAIL,
            from: process.env.FROM_EMAIL,
            subject: `New lead from ${lead.source}: ${lead.name}`,
            html: `
                <h2>New Lead Received</h2>
                <p><strong>Name:</strong> ${lead.name}</p>
                <p><strong>Email:</strong> ${lead.email}</p>
                <p><strong>Phone:</strong> ${lead.phone}</p>
                <p><strong>Service:</strong> ${lead.service}</p>
                <p><strong>Source:</strong> ${lead.source}</p>
                <p><strong>Campaign:</strong> ${lead.campaign || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(lead.createdAt).toLocaleDateString('en-IN')}</p>
            `
        });
    } catch (error) {
        console.log('Email send failed:', error.message);
    }
}

async function sendDailySummary() {
    try {
        const stats = await analyticsService.getLeadsStats();
        const sourcePerf = await analyticsService.getSourcePerformance();
        const campaignPerf = await analyticsService.getCampaignPerformance();

        const sourceRows = sourcePerf.map(s => `
            <tr>
                <td>${s.source}</td>
                <td>${s.total}</td>
                <td>${s.converted}</td>
                <td>${s.conversionRate.toFixed(2)}%</td>
            </tr>
        `).join('');

        const campaignRows = campaignPerf.slice(0, 5).map(c => `
            <tr>
                <td>${c.campaign || 'Direct'}</td>
                <td>${c.total}</td>
                <td>${c.converted}</td>
                <td>${c.conversionRate.toFixed(2)}%</td>
            </tr>
        `).join('');

        const html = `
            <h2>Daily Lead Summary</h2>
            <p>Date: ${new Date().toLocaleDateString('en-IN')}</p>
            
            <h3>Overall Statistics</h3>
            <ul>
                <li><strong>Total Leads:</strong> ${stats.totalLeads}</li>
                <li><strong>Today's Leads:</strong> ${stats.todayLeads}</li>
                <li><strong>Conversion Rate:</strong> ${stats.conversionRate}%</li>
                <li><strong>Status - New:</strong> ${stats.byStatus.new || 0}</li>
                <li><strong>Status - Contacted:</strong> ${stats.byStatus.contacted || 0}</li>
                <li><strong>Status - Converted:</strong> ${stats.byStatus.converted || 0}</li>
                <li><strong>Status - Lost:</strong> ${stats.byStatus.lost || 0}</li>
            </ul>

            <h3>Source Performance</h3>
            <table style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid #ddd; padding: 8px;">Source</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Converted</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Conversion Rate</th>
                </tr>
                ${sourceRows}
            </table>

            <h3>Top Campaigns</h3>
            <table style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid #ddd; padding: 8px;">Campaign</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Converted</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Conversion Rate</th>
                </tr>
                ${campaignRows}
            </table>
        `;

        await sgMail.send({
            to: process.env.ADMIN_EMAIL,
            from: process.env.FROM_EMAIL,
            subject: `Daily Lead Summary - ${new Date().toLocaleDateString('en-IN')}`,
            html
        });

        console.log('Daily summary sent successfully');
    } catch (error) {
        console.log('Daily summary send failed:', error.message);
    }
}

module.exports = { 
    sendNewLeadAlert,
    sendDailySummary
};