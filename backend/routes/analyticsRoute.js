import express from 'express';
import Issue from '../models/Issue.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();

    const issuesByStatus = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const issuesBySeverity = await Issue.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const issuesByCategory = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formatData = (data) => data.map(item => ({ name: item._id, value: item.count }));

    res.status(200).json({
      totalIssues,
      byStatus: formatData(issuesByStatus),
      bySeverity: formatData(issuesBySeverity),
      byCategory: formatData(issuesByCategory)
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

export default router;
