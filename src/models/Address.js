import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
}, {
    timestamps: true
});

// INDEXING
addressSchema.index({ user: 1 });

export const Address = mongoose.model('Address', addressSchema);