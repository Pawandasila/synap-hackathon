import { 
  getOne, 
  getMany, 
  insertRecord, 
  updateRecord, 
  deleteRecord,
  executeParameterizedQuery 
} from '../utils/sql.util.js';

/**
 * Example User Service showing how to use SQL utilities
 */
export class UserService {
  
  // Get user by ID
  static async getUserById(id) {
    const query = 'SELECT * FROM Users WHERE id = @id';
    return await getOne(query, { id });
  }

  // Get user by email
  static async getUserByEmail(email) {
    const query = 'SELECT * FROM Users WHERE email = @email';
    return await getOne(query, { email });
  }

  // Get all users with pagination
  static async getAllUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM Users 
      ORDER BY created_at DESC 
      OFFSET @offset ROWS 
      FETCH NEXT @limit ROWS ONLY
    `;
    return await getMany(query, { offset, limit });
  }

  // Create new user
  static async createUser(userData) {
    const { name, email, password } = userData;
    const data = {
      name,
      email,
      password,
      created_at: new Date()
    };
    return await insertRecord('Users', data);
  }

  // Update user
  static async updateUser(id, userData) {
    const whereClause = 'id = @id';
    const whereParams = { id };
    return await updateRecord('Users', userData, whereClause, whereParams);
  }

  // Delete user
  static async deleteUser(id) {
    const whereClause = 'id = @id';
    const whereParams = { id };
    return await deleteRecord('Users', whereClause, whereParams);
  }

  // Custom query example - Get users with role
  static async getUsersByRole(role) {
    const query = `
      SELECT u.*, r.role_name 
      FROM Users u 
      JOIN UserRoles ur ON u.id = ur.user_id 
      JOIN Roles r ON ur.role_id = r.id 
      WHERE r.role_name = @role
    `;
    return await getMany(query, { role });
  }

  // Complex query with multiple parameters
  static async searchUsers(searchTerm, isActive = true, limit = 20) {
    const query = `
      SELECT * FROM Users 
      WHERE (name LIKE @searchTerm OR email LIKE @searchTerm) 
      AND is_active = @isActive 
      ORDER BY name 
      OFFSET 0 ROWS 
      FETCH NEXT @limit ROWS ONLY
    `;
    const params = {
      searchTerm: `%${searchTerm}%`,
      isActive,
      limit
    };
    return await getMany(query, params);
  }

  // Transaction example (using raw query for complex operations)
  static async transferUserData(fromUserId, toUserId) {
    const query = `
      BEGIN TRANSACTION;
      
      UPDATE Users SET status = 'inactive' WHERE id = @fromUserId;
      UPDATE Users SET last_login = GETDATE() WHERE id = @toUserId;
      
      INSERT INTO UserTransfers (from_user_id, to_user_id, transfer_date)
      VALUES (@fromUserId, @toUserId, GETDATE());
      
      COMMIT TRANSACTION;
    `;
    return await executeParameterizedQuery(query, { fromUserId, toUserId });
  }
}

export default UserService;
