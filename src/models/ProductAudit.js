import mongoose from 'mongoose';

const productAuditSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // optional
    },
    oldData: { type: Object, required: true },
    newData: { type: Object, required: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('ProductAudit', productAuditSchema);