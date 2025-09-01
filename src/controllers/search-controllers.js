import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

// @desc GLOBAL SEARCH
// @route GLOBAL /search
// @access Public
export const globalSearch = async (req, res) => {
  const { query } = req.query;

  if (!query) return res.status(400).json({ message: 'Missing query' });

  try {
    const products = await Product.find({
      name: { $regex: query, $options: 'i' },
    }).limit(10);

    const categories = await Category.find({
      name: { $regex: query, $options: 'i' },
    }).limit(10);

    res.status(200).json({ products, categories });
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};