import UserService from '../services/user.service.js';
import { AppError } from '../utils/AppError.js';
import AsyncHandler from '../middlewares/AsyncHandler.middleware.js';

/**
 * User Controller with SQL examples
 */
export class UserController {
  
  // Get user by ID
  static getUser = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const user = await UserService.getUserById(id);
    
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  });

  // Get all users with pagination
  static getAllUsers = AsyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const users = await UserService.getAllUsers(
      parseInt(page), 
      parseInt(limit)
    );
    
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length
      }
    });
  });

  // Create new user
  static createUser = AsyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 409, 'USER_EXISTS');
    }
    
    const result = await UserService.createUser({ name, email, password });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: result.rowsAffected[0] }
    });
  });

  // Update user
  static updateUser = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if user exists
    const existingUser = await UserService.getUserById(id);
    if (!existingUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    const result = await UserService.updateUser(id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { rowsAffected: result.rowsAffected[0] }
    });
  });

  // Delete user
  static deleteUser = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await UserService.getUserById(id);
    if (!existingUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    await UserService.deleteUser(id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  // Search users
  static searchUsers = AsyncHandler(async (req, res) => {
    const { q: searchTerm, active = 'true', limit = '20' } = req.query;
    
    if (!searchTerm) {
      throw new AppError('Search term is required', 400, 'SEARCH_TERM_REQUIRED');
    }
    
    const users = await UserService.searchUsers(
      searchTerm, 
      active === 'true', 
      parseInt(limit)
    );
    
    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: users
    });
  });

  // Get users by role
  static getUsersByRole = AsyncHandler(async (req, res) => {
    const { role } = req.params;
    
    const users = await UserService.getUsersByRole(role);
    
    res.status(200).json({
      success: true,
      message: `Users with role '${role}' retrieved successfully`,
      data: users
    });
  });
}

export default UserController;
