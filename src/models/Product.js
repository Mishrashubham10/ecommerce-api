import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: 1,
    },
    storage: [String],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    images: [String],
    reviews: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
    ratings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// INDEXING FOR SPEED UP QUERY
productSchema.index({ name: 'text' }); // FOR FULL TEXT SEARCH
productSchema.index({ category: 1 }); // CATEGORY FILTER
productSchema.index({ seller: 1 }); // FOR SELLER/ADMIN FILTER
productSchema.index({ price: 1 }); // FOR PRICE FILTER
productSchema.index({ createdAt: -1 }); // FOR LATEST PRODUCT

export const Product = mongoose.model('Product', productSchema);