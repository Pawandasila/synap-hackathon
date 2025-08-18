import express from 'express';
import UserController from '../controllers/user.controller.js';

const router = express.Router();

/**
 * User Routes with SQL operations
 */

// GET /api/v1/users - Get all users with pagination
router.get('/', UserController.getAllUsers);

// GET /api/v1/users/search - Search users
router.get('/search', UserController.searchUsers);

// GET /api/v1/users/role/:role - Get users by role
router.get('/role/:role', UserController.getUsersByRole);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', UserController.getUser);

// POST /api/v1/users - Create new user
router.post('/', UserController.createUser);

// PUT /api/v1/users/:id - Update user
router.put('/:id', UserController.updateUser);

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', UserController.deleteUser);

export default router;
