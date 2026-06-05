const Lead = require('../models/lead.model');

async function getLeadsStats() {
  try {
    const totalLeads = await Lead.countDocuments();
    
    const bySource = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    const byStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const todayLeads = await Lead.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    const conversionRate = totalLeads > 0 
      ? ((byStatus.find(s => s._id === 'converted')?.count || 0) / totalLeads * 100).toFixed(2)
      : 0;

    return {
      totalLeads,
      todayLeads,
      bySource: Object.fromEntries(bySource.map(s => [s._id, s.count])),
      byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
      conversionRate: parseFloat(conversionRate)
    };
  } catch (error) {
    console.log('Error getting stats:', error.message);
    return null;
  }
}

async function getSourcePerformance() {
  try {
    const performance = await Lead.aggregate([
      {
        $group: {
          _id: '$source',
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
          },
          contacted: {
            $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] }
          },
          lost: {
            $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          source: '$_id',
          total: 1,
          converted: 1,
          contacted: 1,
          lost: 1,
          conversionRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$converted', '$total'] }, 100] }
            ]
          },
          _id: 0
        }
      }
    ]);

    return performance;
  } catch (error) {
    console.log('Error getting performance:', error.message);
    return [];
  }
}

async function getCampaignPerformance() {
  try {
    const performance = await Lead.aggregate([
      {
        $group: {
          _id: '$campaign',
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          campaign: '$_id',
          total: 1,
          converted: 1,
          conversionRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$converted', '$total'] }, 100] }
            ]
          },
          _id: 0
        }
      },
      { $sort: { total: -1 } }
    ]);

    return performance;
  } catch (error) {
    console.log('Error getting campaign performance:', error.message);
    return [];
  }
}

async function getLeadsOverTime(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            source: '$source'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return data;
  } catch (error) {
    console.log('Error getting leads over time:', error.message);
    return [];
  }
}

module.exports = {
  getLeadsStats,
  getSourcePerformance,
  getCampaignPerformance,
  getLeadsOverTime
};
