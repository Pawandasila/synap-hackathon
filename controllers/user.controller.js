import { UserModel } from "../models/User.model.js";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { 
  createUserSchema,
  loginSchema, 
  updateUserSchema
} from "../validator/user.validator.js";
import { HTTPSTATUS } from "../config/Https.config.js";
import { hashPassword, comparePassword } from "../utils/Bcrypt.util.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.middleware.js";
import { AppError } from "../utils/AppError.js";
import jwt from "jsonwebtoken";


export const initializeUserTable = async () => {
  try {
    await UserModel();
    console.log("✅ Users table initialized successfully");
  } catch (error) {
    console.error('❌ Failed to initialize users table:', error);
    throw error;
  }
};

export const createUser = async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const { name, email, password, authprovider, role } = validatedData;

    const checkEmailQuery = `SELECT COUNT(*) as count FROM users WHERE email = @email`;
    const emailCheck = await executeParameterizedQuery(checkEmailQuery, { email });
    
    if (emailCheck.recordset[0].count > 0) {
      return res.status(HTTPSTATUS.CONFLICT).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashedPassword = await hashPassword(password);

    const createUserQuery = `
      INSERT INTO users (name, email, password, authprovider, role)
      OUTPUT INSERTED.*
      VALUES (@name, @email, @password, @authprovider, @role)
    `;

    const result = await executeParameterizedQuery(createUserQuery, {
      name,
      email,
      password: hashedPassword,
      authprovider,
      role
    });

    const newUser = result.recordset[0];
    
    const { password: _, ...safeUser } = newUser;

    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      message: "User created successfully",
      data: safeUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create user",
      error: error.message
    });
  }
};

export const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const { email, password } = validatedData;

        const getUserQuery = `SELECT * FROM users WHERE email = @email`;
        const result = await executeParameterizedQuery(getUserQuery, { email });

        if (result.recordset.length === 0) {
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = result.recordset[0];
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const accessToken = jwt.sign({ userId: user.userid, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Remove password from user object
        const { password: _, ...safeUser } = user;

        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: "Login successful",
            data: { safeUser, accessToken }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to login",
            error: error.message
        });
    }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userIdNum = parseInt(id);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const getUserQuery = `SELECT * FROM users WHERE userid = @id`;
    const result = await executeParameterizedQuery(getUserQuery, { id: userIdNum });

    if (result.recordset.length === 0) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
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
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve user",
      error: error.message
    });
  }
};

export const getAllUsers = AsyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (page < 1 || limit < 1 || limit > 100) {
    throw new AppError("Invalid pagination parameters", HTTPSTATUS.BAD_REQUEST, "INVALID_PAGINATION");
  }

  try {
    const getUsersQuery = `
      SELECT * FROM users 
      ORDER BY createdat DESC
      OFFSET @offset ROWS 
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const result = await executeParameterizedQuery(getUsersQuery, { offset, limit });
    
    const countQuery = `SELECT COUNT(*) as total FROM users`;
    const countResult = await executeParameterizedQuery(countQuery);
    const total = countResult.recordset[0].total;
    
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


export const updateUser = AsyncHandler(async (req, res, next) => {
  const { userid } = req.params;
  
  const userIdNum = parseInt(userid);
  if (isNaN(userIdNum) || userIdNum <= 0) {
    throw new AppError("Invalid user ID", HTTPSTATUS.BAD_REQUEST, "INVALID_USER_ID");
  }

  const validatedData = updateUserSchema.parse(req.body);
  
  try {

    const checkUserQuery = `SELECT COUNT(*) as count FROM users WHERE userid = @userid`;
    const userCheck = await executeParameterizedQuery(checkUserQuery, { userid: userIdNum });
    
    if (userCheck.recordset[0].count === 0) {
      throw new AppError("User not found", HTTPSTATUS.NOT_FOUND, "USER_NOT_FOUND");
    }

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

export const searchUsers = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Search term must be at least 2 characters"
      });
    }

    const searchQuery = `
      SELECT * FROM users 
      WHERE name LIKE @searchTerm OR email LIKE @searchTerm
      ORDER BY createdat DESC
    `;
    
    const result = await executeParameterizedQuery(searchQuery, { 
      searchTerm: `%${searchTerm.trim()}%` 
    });
    
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
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to search users",
      error: error.message
    });
  }
};

// // Get users by role - SQL injection safe
// export const getUsersByRole = AsyncHandler(async (req, res, next) => {
//   const { role } = req.params;
  
//   // Validate role
//   const allowedRoles = ['participant', 'organizer', 'judge'];
//   if (!allowedRoles.includes(role)) {
//     throw new AppError("Invalid role", HTTPSTATUS.BAD_REQUEST, "INVALID_ROLE");
//   }

//   try {
//     const getRoleUsersQuery = `SELECT * FROM users WHERE role = @role ORDER BY createdat DESC`;
//     const result = await executeParameterizedQuery(getRoleUsersQuery, { role });
    
//     // Remove passwords from all users
//     const safeUsers = result.recordset.map(user => {
//       const { password: _, ...safeUser } = user;
//       return safeUser;
//     });

//     res.status(HTTPSTATUS.OK).json({
//       success: true,
//       message: `Users with role '${role}' retrieved successfully`,
//       data: safeUsers,
//       role,
//       count: safeUsers.length
//     });

//   } catch (error) {
//     console.error('Get users by role error:', error);
//     throw new AppError("Failed to retrieve users by role", HTTPSTATUS.INTERNAL_SERVER_ERROR, "ROLE_USERS_ERROR");
//   }
// });
