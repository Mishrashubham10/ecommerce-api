import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import mongoose from 'mongoose';
import ProductAudit from '../models/ProductAudit.js';

// @desc PRODUCTS
// @route GET /
// @access PRIVATE
export const createProduct = async (req, res) => {
  // GET THE PRODUCT DATA
  const { name, description, price, category, stock, images } = req.body;

  // VALIDATE REQUIRED FIELD
  if (!name || !price || !stock || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let categoryId;

    //   CHECKING IF CATEGORY IS A VALID ID
    if (!category.match(/^[0-9a-fA-F]{24}$/)) {
      let categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        categoryDoc = await Category.create({ name: category });
      }
      categoryId = categoryDoc._id;
    }

    // VALIDATE PRICE & STOCK
    if (price < 0 || stock < 0) {
      return res
        .status(400)
        .json({ message: 'Price and stock can not be non-negative' });
    }

    // CREATE PRODUCT
    const product = new Product({
      name,
      description,
      price,
      stock,
      category: categoryId,
      images,
      createdBy: req.user_id,
    });

    // SAVE PRODUCT
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// @desc PRODUCTS
// @route GET /
// @access Public
export const getProducts = async (req, res) => {
  const {
    search,
    minPrice,
    maxPrice,
    sortBy,
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const query = {};

    // SARCH
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    // SORT BY PRICE
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };

    const skip = (page - 1) * limit;

    // FIND THE PRODUCT FROM DB
    const products = await Product.find(query)
      .populate('category')
      .sort(sortBy ? { [sortBy]: 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments(query);

    // VALIDATION FOR PRODUCTS
    if (products.length === 0) {
      return res.status(400).json({ message: 'No product found' });
    }

    res.status(200).json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc PRODUCT
// @route GET /:ID
// @access PUBLIC
export const getProduct = async (req, res) => {
  // GET THE ID FROM PARAMS
  const { id } = req.params;

  // ID VALIDATION
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(401)
      .json({ message: 'Id required THIS IS WHERE THE ERROR IS COMING FROM' });
  }
  try {
    // FIND THE PRODUCT WITH ATTACHED ID
    const product = await Product.findById(id).populate('category').lean();

    // PRODUCT NULL CHECK
    if (!product) {
      return res.status(400).json({ message: 'Product not found!' });
    }

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc UPDATE PRODUCT
// @route GET /:ID
// @access PRIVATE
export const updateProduct = async (req, res) => {
  // ID FROM PARAMS
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Id required!' });
  }

  // FIELDS THAT A SELLER CAN UPDATE
  const allowedFieldsToUpdate = [
    'name',
    'description',
    'price',
    'stock',
    'category',
    'brand',
    'images',
    'tags',
    'status',
  ];

  const filteredUpdates = {};
  Object.keys(updates).forEach((key) => {
    if (allowedFieldsToUpdate.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });
  try {
    // GET THE PRODUCT BY ID
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, {
      $set: filteredUpdates,
      new: true,
      runValidators: true,
    })
      .populate('category')
      .lean();

    // Audit log (optional: save to a DB or file)
    console.log(
      `[AUDIT] Product ${id} updated by user: ${req.user?.id || 'unknown'}`
    );
    console.log('Changes:', filteredUpdates);

    // SAVE AUDIT INTO DB
    await ProductAudit.create({
      productId: id,
      updatedBy: req.user_id || null,
      oldData: existingProduct,
      newData: updatedProduct,
    });

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc DELETE PRODUCT
// @route GET /:ID
// @access PRIVATE
export const deleteProduct = async (req, res) => {
  // ID FROM PARAMS
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Id required' });
  }
  try {
    // GET THE PRODUCT WITH ATTACHED ID AND DELETE
    const product = await Product.findByIdAndDelete(id).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // AUDIT LOGGING (OPTIONAL BUT RECOMMENDED)
    await ProductAudit.create({
      productId: id,
      updatedBy: req.user_id || null,
      oldData: product,
      newData: null,
      action: 'DELETE',
    });

    res.status(200).json({
      message: `Product with id ${product._id} deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc DELETE PRODUCT
// @route GET /:ID
// @access PRIVATE
export const seller = async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(400).json({ message: 'User must be logged in' });
  }

  try {
    const products = await Product.find({ createdBy: userId })
      .populate('category')
      .lean();

    if (!products.length) {
      return res.status(404).json({ message: 'No product found!' });
    }

    res.status(200).json({ count: products.length, products });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};