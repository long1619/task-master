import express from 'express';
import ViewController from '../controllers/viewController.js';

const router = express.Router();

// Route công khai - Render giao diện Web (Server-Side View bằng EJS)
router.get('/', ViewController.renderHome);

export default router;
