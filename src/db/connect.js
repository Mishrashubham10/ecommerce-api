import mongoose from 'mongoose';

export async function connectDb() {
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
      console.error(
        '❌ MONGODB_URI is not defined in the environment variables'
      );
      process.exit(1);
    }

    console.log(
      `DB HOST :: ${db.connection.host} : MongoDB connected successfully`
    );
  } catch (err) {
    console.log(`Error occured while connecting to MongoDB`, err.message);
    process.exit(1);
  }
}