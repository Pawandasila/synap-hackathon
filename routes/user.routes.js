import express from "express";
import { createUser, getAllUsers, getUserById, login, searchUsers, updateUser } from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post('/create', createUser);
router.post('/login', login);

// Protected routes (require authentication)
// NOTE: Specific routes MUST come before parameterized routes
router.get('/search', authenticateToken, searchUsers);
router.get('/:id', authenticateToken, getUserById);
router.patch('/update/:userid', authenticateToken, updateUser);

router.get('/', authenticateToken, getAllUsers);

export default router;