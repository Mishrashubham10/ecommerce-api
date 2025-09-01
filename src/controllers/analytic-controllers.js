import Order from '../models/Order.js';

// TOTAL REVENUE
// METHOD: GET
// ROUTE : PRIVATE
export const getTotalRevenue = async (req, res) => {
  try {
    // TAKE DATA FROM PARAMS FOR FILTERING
    const { from, to, granularity = 'daily' } = req.query;

    const matchStage = {};
    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = new Date(from);
      if (to) matchStage.createdAt.$lte = new Date(from);
    }

    const dateFormatMap = {
      daily: '%Y-%m-%d',
      weekly: '%Y-%U',
      monthly: '%Y-%m',
    };

    const groupFormat = dateFormatMap[granularity] || dateFormatMap.daily;

    const revenue = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.status(200).json(revenue);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching revenue', err });
  }
};

// TOP SELLING PRODUCTS
// METHOD: GET
// ROUTE : PRIVATE
export const getTopSellingProducts = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items_product',
          totalSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: 'product' },
      { $project: { _id: 0, name: '$products.name', totalSold: 1 } },
    ]);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching top products', err });
  }
};

// TOP SPENDING USERS
// METHOD: GET
// ROUTE : PRIVATE
export const getTopSpendingUsers = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $match: { paymentStatus: 'Sold' } },
      { $group: { _id: 'user', totalSpent: { $sum: '$totalAmount' } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          form: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: 'user' },
      { $project: { id: 0, username: '$user.username', totalSpent: 1 } },
    ]);

    res.status(200).json(result);
  } catch {
    res.status(500).json({ message: 'Error fetching top users', err });
  }
};

// MONTHLY SALES
// METHOD: GET
// ROUTE : PRIVATE
export const getMonthlySales = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          monthlyRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching monthly sales', err });
  }
};

// ORDER BY CATEGORY
// METHOD: GET
// ROUTE : PRIVATE
export const getOrdersByCategory = async (req, res) => {
  try {
    const { start, end } = req.query;

    const match = {};
    if (start && end) {
      match.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const data = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          orderCount: { $sum: 1 },
        },
      },
      {
        $project: {
          category: '$_id',
          orderCount: 1,
          _id: 0,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOP USERS
// METHOD: GET
// ROUTE : PRIVATE
export const getTopUsers = async (req, res) => {
  try {
    const { start, end, limit = 5 } = req.query;

    const match = {};
    if (start && end) {
      match.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const topUsers = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          username: '$user.username',
          email: '$user.email',
          totalSpent: 1,
          orders: 1,
        },
      },
    ]);

    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOP PRODUCTS
// METHOD: GET
// ROUTE : PRIVATE
export const getTopProducts = async (req, res) => {
  try {
    const { start, end, limit = 5 } = req.query;

    const match = {};
    if (start && end) {
      match.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const topProducts = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          productId: '$product._id',
          name: '$product.name',
          totalSold: 1,
        },
      },
    ]);

    res.json(topProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};