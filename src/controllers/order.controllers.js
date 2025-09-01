import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { Product } from '../models/Product.js';

// @desc CREATE ORDER
// @route POST /orders
// @access PRIVATE
// FOR - CUSTOMERS
export const createOrder = async (req, res) => {
  try {
    // CHECKING IF USER IS LOGGED IN
    if (!req.user || !req.user.id || req.user.role === 'Customer') {
      return res.status(400).json({ success: false, message: 'Unauthorized' });
    }

    // TAKING THE DATA THAT REQUIRES TO CREATE ORDER
    const { items, shippingAddress, paymentMethod, paymentId } = req.body;

    // CALCULATE TOTAL AMOUNT OF THE CART
    const products = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }
        return {
          price: product.price,
          quantity: item.quantity,
        };
      })
    );

    const totalAmount = products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // AUTHENTICATION
    if (
      !items ||
      !items.length ||
      !totalAmount ||
      !shippingAddress ||
      !paymentId
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // CREATE NEW ORDER
    const newOrder = await Order.create({
      user: req.user.id,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentId,
    });

    res.status(201).json({ success: true, newOrder });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc CREATE ORDER
// @route GET /orders/my-orders
// @access PRIVATE
// FOR - CUSTOMERS
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate(
      'items.product'
    );

    if (!orders) {
      res.status(400).json({ message: 'There is no order.' });
    }

    res.status(200).json({ success: true, orders });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: err.message || 'Server Error' });
  }
};

// @desc GET ORDERS
// @route GET /orders
// @access PRIVATE
// FOR - ADMIN
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate(
      'items.product'
    );

    if (!orders) {
      res.status(400).json({ message: 'There is no order.' });
    }

    res.status(200).json({ success: true, orders });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: err.message || 'Server Error' });
  }
};

// @desc GET ORDER
// @route POST /orders/:id
// @access PRIVATE
// FOR - AMDIN & ORDER OWNER
export const getOrder = async (req, res) => {
  // TAKING ID FROM PARAMS
  const { orderId } = req.params;

  // ID VALIDATION WITH MONGOOSE
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: 'Id is required' });
  }
  try {
    // GETTING THE ORDER FROM DB
    const order = await Order.findById(orderId).populate('items.product');

    // CHECKING IF ORDER IS EMPTY
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'Admin' && String(order.user) !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // SENDING THE ORDER WITH RES
    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc UPDATE ORDER
// @route PUT /orders/:id
// @access PRIVATE
// FOR - CUSTOMERS
export const updateOrder = async (req, res) => {
  try {
    // TAKING STATUS & ID
    const { status } = req.body;
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ status: false, message: 'Id is required' });
    }

    // STATUS CHECKING
    if (!['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid status value' });
    }

    // GETTING THE ORDER FORM DB
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'Admin' && req.user.role !== 'Seller') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    order.orderStatus = status;
    await order.save();

    res.json({ success: true, message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc DELETE ORDER
// @route DELETE /orders/:id
// @access PRIVATE
// FOR - AMDIN ONLY
export const deleteOrder = async (req, res) => {
  // TAKING ID FROM PARAMS
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ status: false, message: 'Id is required' });
  }
  try {
    // ONLY ADMIN CAN DELETE
    if (req.user.role !== 'Admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Only admin can delete orders' });
    }

    // ORDER FROM DB
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc UPDATE OWNER ORDER
// @route PUT /orders/:id
// @access PRIVATE
// FOR - CUSTOMER ONLY
export const updateMyOrder = async (req, res) => {
  // DATAS FROM PARAMS OR BODY
  const { orderId } = req.params;
  const { items, shippingAddress } = req.body;

  console.log("Yeee got the orderId", orderId)
  console.log("Yeee got the userId", req.user.id)

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ status: false, message: 'Id is required' });
  }

  try {
    const order = await Order.findOne({ _id: orderId, user: req.user.id });

    // NULL CHECKING
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be updated after processing',
      });
    }

    // UPDATING ITEMS & SHIPPING ADDRESS
    if (items) {
      order.items = items;

      const products = await Promise.all(
        items.map(async (item) => {
          const product = await Product.findById(item.product);

          if (!product) {
            return res.status(404).json({
              success: false,
              message: `Product not found: ${item.product}`,
            });
          }

          return {
            price: product.price,
            quantity: item.quantity,
          };
        })
      );
      const totalAmount = products.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    if (shippingAddress) {
      order.shippingAddress = shippingAddress;
    }

    await order.save();

    res
      .status(200)
      .json({ status: true, message: `Order: ${order} updated successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc CANCEL ORDER
// @route PUT /orders/:id
// @access PRIVATE
// FOR - CUSTOMER ONLY
export const cancelOrder = async (req, res) => {
  // DATAS FROM PARAMS OR BODY
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ status: false, message: 'Id is required' });
  }

  try {
    // FIND ORDER WITH ID AND USER ID
    const order = await Order.findOne({ _id: orderId, user: req.user.id });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    // CHECK FOR ORDERS STATUS SO WE CAN MOVE FORWARD
    if (order.orderStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled',
      });
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc TRACK ORDER
// @route PUT /orders/:id
// @access PRIVATE
// FOR - CUSTOMER ONLY
export const trackOrder = async (req, res) => {
  // DATAS FROM PARAMS OR BODY
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ status: false, message: 'Id is required' });
  }

  try {
    // FIND ORDER WITH ID AND USER ID
    const order = await Order.findOne({ _id: orderId, user: req.user.id });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Order found',
      orderStatus: order.orderStatus,
      updatedAt: order.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};