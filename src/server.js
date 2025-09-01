import express from 'express';
import cookieParse from 'cookie-parser';
import { connectDb } from './db/connect.js';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';

// ROUTES IMPORTS
import authRoutes from './routes/auth.routes.js';
import usersRoute from './routes/user.routes.js';
import productsRoute from './routes/product.routes.js';
import auditsRoute from './routes/audits-routes.js';
import analyticsRoute from './routes/analytic-routes.js';
import ordersRoute from './routes/order.routes.js';
import searchRoutes from './routes/search-route.js';

const PORT = process.env.PORT || 5500;
const app = express();

// MIDDLEWARES
app.use(
  cors({
    origin: [
      'http://localhost:3000', // local frontend (dev)
      'https://ecommerce-two-jade-45.vercel.app', // deployed frontend (prod)
    ],
    credentials: true,
  })
);
app.use(cookieParse());
app.use(express.static('public'));
app.use(express.json({ limit: '10kb' }));

// AUTH ROUTES
app.use('/api/v1/auth', authRoutes);
// USER ROUTES
app.use('/api/v1/users', usersRoute);
// PRODUCT ROUTES
app.use('/api/v1/products', productsRoute);
// AUDITS ROUTES
app.use('/api/audits', auditsRoute);
// ANALYTIC ROUTE
app.use('/api/v1/analytics', analyticsRoute);
// ORDER ROUTE
app.use('/api/v1/orders', ordersRoute);
// SEARCH ROUTES
app.use('/api/v1/search', searchRoutes);

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
