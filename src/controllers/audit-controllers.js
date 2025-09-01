import ProductAudit from '../models/ProductAudit.js';

export const getProductAuditLogs = async (req, res) => {
  const { productId, userId, limit = 50, page = 1 } = req.query;

  const query = {};
  if (productId) query.productId = productId;
  if (userId) query.updatedBy = userId;

  try {
    const skip = (page - 1) * limit;

    const logs = await ProductAudit.find(query)
      .populate('productId', 'name')
      .populate('updatedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await ProductAudit.countDocuments(query);

    res.status(200).json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || 'Error fetching audit logs' });
  }
};