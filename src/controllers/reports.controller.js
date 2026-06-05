const Lead = require('../models/lead.model');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const analyticsService = require('../services/analytics.service');

async function exportLeadsExcel(req, res) {
  try {
    const { source, status, startDate, endDate } = req.query;
    
    let filter = {};
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 });

    const worksheet = xlsx.utils.json_to_sheet(leads.map(lead => ({
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone,
      Service: lead.service,
      Source: lead.source,
      Campaign: lead.campaign || '-',
      Keyword: lead.keyword || '-',
      Status: lead.status,
      Date: new Date(lead.createdAt).toLocaleDateString('en-IN')
    })));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Leads');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="leads_${Date.now()}.xlsx"`);
    
    return xlsx.write(workbook, { type: 'buffer' });
  } catch (error) {
    console.log('Error exporting Excel:', error.message);
    throw error;
  }
}

async function exportLeadsPDF(req, res) {
  try {
    const { source, status, startDate, endDate } = req.query;
    
    let filter = {};
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    const stats = await analyticsService.getLeadsStats();
    const sourcePerf = await analyticsService.getSourcePerformance();

    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="leads_report_${Date.now()}.pdf"`);
    
    doc.pipe(res);

    doc.fontSize(20).text('Lead Management Report', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Summary Statistics', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Leads: ${stats.totalLeads}`);
    doc.text(`Today's Leads: ${stats.todayLeads}`);
    doc.text(`Conversion Rate: ${stats.conversionRate}%`);
    doc.moveDown();

    doc.fontSize(12).text('Source Performance', { underline: true });
    sourcePerf.forEach(perf => {
      doc.fontSize(10);
      doc.text(`${perf.source}: ${perf.total} leads (${perf.conversionRate.toFixed(2)}% conversion)`);
    });
    doc.moveDown();

    doc.fontSize(12).text('Recent Leads', { underline: true });
    const tableData = leads.slice(0, 20).map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.source,
      lead.status
    ]);

    if (tableData.length > 0) {
      const table = {
        title: '',
        headers: ['Name', 'Email', 'Phone', 'Source', 'Status'],
        rows: tableData
      };

      doc.fontSize(9);
      let y = doc.y;
      
      table.headers.forEach((header, i) => {
        doc.text(header, 50 + (i * 80), y, { width: 80 });
      });
      
      doc.moveTo(50, y + 15).lineTo(500, y + 15).stroke();
      y += 25;

      table.rows.forEach((row) => {
        row.forEach((cell, i) => {
          doc.text(cell.toString().substring(0, 15), 50 + (i * 80), y, { width: 80 });
        });
        y += 20;
      });
    }

    doc.end();
  } catch (error) {
    console.log('Error exporting PDF:', error.message);
    res.status(500).json({ msg: error.message });
  }
}

async function getAnalyticsDashboard(req, res) {
  try {
    const stats = await analyticsService.getLeadsStats();
    const sourcePerf = await analyticsService.getSourcePerformance();
    const campaignPerf = await analyticsService.getCampaignPerformance();
    const leadsOverTime = await analyticsService.getLeadsOverTime(30);

    res.status(200).json({
      stats,
      sourcePerformance: sourcePerf,
      campaignPerformance: campaignPerf,
      leadsOverTime
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
}

module.exports = {
  exportLeadsExcel,
  exportLeadsPDF,
  getAnalyticsDashboard
};
