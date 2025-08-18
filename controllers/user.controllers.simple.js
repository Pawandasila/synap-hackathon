import { AsyncHandler } from "../middlewares/AsyncHandler.middleware.js";
import { UserModel } from "../models/User.model.js";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { 
  createUserSchema,
  updateUserSchema,
  loginSchema 
} from "../validator/user.validator.js";
import { AppError } from "../utils/AppError.js";
import { HTTPSTATUS } from "../config/Https.config.js";

// Create users table
export const createTable = AsyncHandler(async (req, res) => {
  try {
    await UserModel();
    
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Users table created successfully"
    });
  } catch (error) {
    console.error('Create table error:', error);
    throw new AppError("Failed to create users table", HTTPSTATUS.INTERNAL_SERVER_ERROR, "TABLE_CREATION_FAILED");
  }
});

// Create new user - SQL injection safe with parameterized queries
export const createUser = AsyncHandler(async (req, res) => {
  // Validate input data
  const validatedData = createUserSchema.parse(req.body);
  const { name, email, password, authprovider, role } = validatedData;

  try {
    // Check if email already exists
    const checkEmailQuery = `SELECT COUNT(*) as count FROM users WHERE email = @email`;
    const emailCheck = await executeParameterizedQuery(checkEmailQuery, { email });
    
    if (emailCheck.recordset[0].count > 0) {
      throw new AppError("Email already exists", HTTPSTATUS.CONFLICT, "EMAIL_EXISTS");
    }

    // Create user with parameterized query
    const createUserQuery = `
      INSERT INTO users (name, email, password, authprovider, role)
      OUTPUT INSERTED.*
      VALUES (@name, @email, @password, @authprovider, @role)
    `;
    
    const result = await executeParameterizedQuery(createUserQuery, {
      name,
      email,
      password, // Remember to hash this in production
      authprovider,
      role
    });

    const newUser = result.recordset[0];
    
    // Remove password from response
    const { password: _, ...safeUser } = newUser;

    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      message: "User created successfully",
      data: safeUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create user", HTTPSTATUS.INTERNAL_SERVER_ERROR, "USER_CREATION_ERROR");
  }
});

// Get user by ID - SQL injection safe
export const getUserById = AsyncHandler(async (req, res) => {
  const { userid } = req.params;
  
  // Validate user ID is a number
  const userIdNum = parseInt(userid);
  if (isNaN(userIdNum) || userIdNum <= 0) {
    throw new AppError("Invalid user ID", HTTPSTATUS.BAD_REQUEST, "INVALID_USER_ID");
  }

  try {
    const getUserQuery = `SELECT * FROM users WHERE userid = @userid`;
    const result = await executeParameterizedQuery(getUserQuery, { userid: userIdNum });
    
    if (result.recordset.length === 0) {
      throw new AppError("User not found", HTTPSTATUS.NOT_FOUND, "USER_NOT_FOUND");
    }

    const user = result.recordset[0];
    // Remove password from response
    const { password: _, ...safeUser } = user;

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User retrieved successfully",
      data: safeUser
    });

  } catch (error) {
    console.error('Get user error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to retrieve user", HTTPSTATUS.INTERNAL_SERVER_ERROR, "USER_RETRIEVAL_ERROR");
  }
});

// Get all users with pagination - SQL injection safe
export const getAllUsers = AsyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    throw new AppError("Invalid pagination parameters", HTTPSTATUS.BAD_REQUEST, "INVALID_PAGINATION");
  }

  try {
    // Get users with pagination
    const getUsersQuery = `
      SELECT * FROM users 
      ORDER BY createdat DESC
      OFFSET @offset ROWS 
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const result = await executeParameterizedQuery(getUsersQuery, { offset, limit });
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users`;
    const countResult = await executeParameterizedQuery(countQuery);
    const total = countResult.recordset[0].total;
    
    // Remove passwords from all users
    const safeUsers = result.recordset.map(user => {
      const { password: _, ...safeUser } = user;
      return safeUser;
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Users retrieved successfully",
      data: safeUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    throw new AppError("Failed to retrieve users", HTTPSTATUS.INTERNAL_SERVER_ERROR, "USERS_RETRIEVAL_ERROR");
  }
});

// Update user - SQL injection safe
export const updateUser = AsyncHandler(async (req, res) => {
  const { userid } = req.params;
  
  // Validate user ID
  const userIdNum = parseInt(userid);
  if (isNaN(userIdNum) || userIdNum <= 0) {
    throw new AppError("Invalid user ID", HTTPSTATUS.BAD_REQUEST, "INVALID_USER_ID");
  }

  // Validate update data
  const validatedData = updateUserSchema.parse(req.body);
  
  try {
    // Check if user exists
    const checkUserQuery = `SELECT COUNT(*) as count FROM users WHERE userid = @userid`;
    const userCheck = await executeParameterizedQuery(checkUserQuery, { userid: userIdNum });
    
    if (userCheck.recordset[0].count === 0) {
      throw new AppError("User not found", HTTPSTATUS.NOT_FOUND, "USER_NOT_FOUND");
    }

    // Check if email is being updated and already exists
    if (validatedData.email) {
      const checkEmailQuery = `SELECT COUNT(*) as count FROM users WHERE email = @email AND userid != @userid`;
      const emailCheck = await executeParameterizedQuery(checkEmailQuery, { 
        email: validatedData.email, 
        userid: userIdNum 
      });
      
      if (emailCheck.recordset[0].count > 0) {
        throw new AppError("Email already exists", HTTPSTATUS.CONFLICT, "EMAIL_EXISTS");
      }
    }

    // Build dynamic update query
    const updateFields = Object.keys(validatedData);
    if (updateFields.length === 0) {
      throw new AppError("No fields to update", HTTPSTATUS.BAD_REQUEST, "NO_UPDATE_FIELDS");
    }

    const setClause = updateFields.map(field => `${field} = @${field}`).join(', ');
    const updateUserQuery = `
      UPDATE users 
      SET ${setClause}
      OUTPUT INSERTED.*
      WHERE userid = @userid
    `;

    const params = { ...validatedData, userid: userIdNum };
    const result = await executeParameterizedQuery(updateUserQuery, params);
    
    const updatedUser = result.recordset[0];
    // Remove password from response
    const { password: _, ...safeUser } = updatedUser;

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User updated successfully",
      data: safeUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update user", HTTPSTATUS.INTERNAL_SERVER_ERROR, "USER_UPDATE_ERROR");
  }
});

// Delete user - SQL injection safe
export const deleteUser = AsyncHandler(async (req, res) => {
  const { userid } = req.params;
  
  // Validate user ID
  const userIdNum = parseInt(userid);
  if (isNaN(userIdNum) || userIdNum <= 0) {
    throw new AppError("Invalid user ID", HTTPSTATUS.BAD_REQUEST, "INVALID_USER_ID");
  }

  try {
    // Check if user exists
    const checkUserQuery = `SELECT COUNT(*) as count FROM users WHERE userid = @userid`;
    const userCheck = await executeParameterizedQuery(checkUserQuery, { userid: userIdNum });
    
    if (userCheck.recordset[0].count === 0) {
      throw new AppError("User not found", HTTPSTATUS.NOT_FOUND, "USER_NOT_FOUND");
    }

    // Delete user
    const deleteUserQuery = `DELETE FROM users WHERE userid = @userid`;
    await executeParameterizedQuery(deleteUserQuery, { userid: userIdNum });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error('Delete user error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to delete user", HTTPSTATUS.INTERNAL_SERVER_ERROR, "USER_DELETION_ERROR");
  }
});

// Search users - SQL injection safe
export const searchUsers = AsyncHandler(async (req, res) => {
  const { q: searchTerm } = req.query;
  
  if (!searchTerm || searchTerm.trim().length < 2) {
    throw new AppError("Search term must be at least 2 characters", HTTPSTATUS.BAD_REQUEST, "INVALID_SEARCH");
  }

  try {
    const searchQuery = `
      SELECT * FROM users 
      WHERE name LIKE @searchTerm OR email LIKE @searchTerm
      ORDER BY createdat DESC
    `;
    
    const result = await executeParameterizedQuery(searchQuery, { 
      searchTerm: `%${searchTerm.trim()}%` 
    });
    
    // Remove passwords from all users
    const safeUsers = result.recordset.map(user => {
      const { password: _, ...safeUser } = user;
      return safeUser;
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Search completed successfully",
      data: safeUsers,
      searchTerm: searchTerm.trim(),
      count: safeUsers.length
    });

  } catch (error) {
    console.error('Search users error:', error);
    throw new AppError("Failed to search users", HTTPSTATUS.INTERNAL_SERVER_ERROR, "USER_SEARCH_ERROR");
  }
});

// Get users by role - SQL injection safe
export const getUsersByRole = AsyncHandler(async (req, res) => {
  const { role } = req.params;
  
  // Validate role
  const allowedRoles = ['participant', 'organizer', 'judge'];
  if (!allowedRoles.includes(role)) {
    throw new AppError("Invalid role", HTTPSTATUS.BAD_REQUEST, "INVALID_ROLE");
  }

  try {
    const getRoleUsersQuery = `SELECT * FROM users WHERE role = @role ORDER BY createdat DESC`;
    const result = await executeParameterizedQuery(getRoleUsersQuery, { role });
    
    // Remove passwords from all users
    const safeUsers = result.recordset.map(user => {
      const { password: _, ...safeUser } = user;
      return safeUser;
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `Users with role '${role}' retrieved successfully`,
      data: safeUsers,
      role,
      count: safeUsers.length
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    throw new AppError("Failed to retrieve users by role", HTTPSTATUS.INTERNAL_SERVER_ERROR, "ROLE_USERS_ERROR");
  }
});

export default {
  createTable,
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  searchUsers,
  getUsersByRole
};
