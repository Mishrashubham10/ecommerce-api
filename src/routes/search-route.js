import express from 'express';
import { globalSearch } from '../controllers/search-controllers.js';

const router = express.Router();

router.get('/', globalSearch);

export default router;