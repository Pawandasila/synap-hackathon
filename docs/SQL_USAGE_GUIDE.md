# SQL Usage Guide

This guide shows you how to write and execute SQL commands in your Node.js application with Azure SQL Database.

## 1. Basic SQL Utilities (`utils/sql.util.js`)

The SQL utility file provides several helper functions:

### Simple Queries

```javascript
import { executeQuery, getOne, getMany } from './utils/sql.util.js';

// Execute raw SQL query
const result = await executeQuery('SELECT * FROM Users');

// Get single record
const user = await getOne('SELECT * FROM Users WHERE id = @id', { id: 1 });

// Get multiple records
const users = await getMany('SELECT * FROM Users WHERE active = @active', { active: true });
```

### Parameterized Queries

```javascript
import { executeParameterizedQuery } from './utils/sql.util.js';

// Safe parameterized query (prevents SQL injection)
const query = `
  SELECT u.*, p.profile_pic 
  FROM Users u 
  LEFT JOIN Profiles p ON u.id = p.user_id 
  WHERE u.email = @email AND u.active = @active
`;

const result = await executeParameterizedQuery(query, {
  email: 'user@example.com',
  active: true
});
```

### CRUD Operations

```javascript
import { insertRecord, updateRecord, deleteRecord } from './utils/sql.util.js';

// Insert
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  created_at: new Date()
};
await insertRecord('Users', userData);

// Update
await updateRecord(
  'Users', 
  { name: 'Jane Doe', updated_at: new Date() }, 
  'id = @id', 
  { id: 1 }
);

// Delete
await deleteRecord('Users', 'id = @id', { id: 1 });
```

## 2. Common SQL Query Examples

### Select Queries

```javascript
// Basic select
const query1 = 'SELECT * FROM Users';

// Select with WHERE clause
const query2 = 'SELECT * FROM Users WHERE age > @minAge';

// Select with JOIN
const query3 = `
  SELECT u.name, u.email, r.role_name 
  FROM Users u 
  JOIN UserRoles ur ON u.id = ur.user_id 
  JOIN Roles r ON ur.role_id = r.id
`;

// Select with pagination
const query4 = `
  SELECT * FROM Users 
  ORDER BY created_at DESC 
  OFFSET @offset ROWS 
  FETCH NEXT @limit ROWS ONLY
`;

// Complex select with multiple conditions
const query5 = `
  SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_spent
  FROM Users u
  LEFT JOIN Orders o ON u.id = o.user_id
  WHERE u.created_at >= @startDate
    AND u.active = @active
  GROUP BY u.id, u.name, u.email
  HAVING COUNT(o.id) > @minOrders
  ORDER BY total_spent DESC
`;
```

### Insert Queries

```javascript
// Simple insert
const insertQuery1 = `
  INSERT INTO Users (name, email, password, created_at) 
  VALUES (@name, @email, @password, @created_at)
`;

// Insert with return ID
const insertQuery2 = `
  INSERT INTO Users (name, email, password) 
  OUTPUT INSERTED.id
  VALUES (@name, @email, @password)
`;

// Bulk insert
const bulkInsertQuery = `
  INSERT INTO Products (name, price, category_id)
  VALUES 
    (@name1, @price1, @category1),
    (@name2, @price2, @category2),
    (@name3, @price3, @category3)
`;
```

### Update Queries

```javascript
// Simple update
const updateQuery1 = `
  UPDATE Users 
  SET name = @name, updated_at = GETDATE() 
  WHERE id = @id
`;

// Conditional update
const updateQuery2 = `
  UPDATE Users 
  SET last_login = GETDATE(), login_count = login_count + 1 
  WHERE email = @email AND active = 1
`;

// Update with JOIN
const updateQuery3 = `
  UPDATE u 
  SET u.status = @status 
  FROM Users u 
  JOIN UserRoles ur ON u.id = ur.user_id 
  WHERE ur.role_id = @roleId
`;
```

### Delete Queries

```javascript
// Simple delete
const deleteQuery1 = 'DELETE FROM Users WHERE id = @id';

// Conditional delete
const deleteQuery2 = `
  DELETE FROM Users 
  WHERE created_at < @cutoffDate 
    AND active = 0
`;

// Delete with JOIN
const deleteQuery3 = `
  DELETE u 
  FROM Users u 
  JOIN UserSessions us ON u.id = us.user_id 
  WHERE us.expires_at < GETDATE()
`;
```

## 3. Advanced SQL Operations

### Stored Procedures

```javascript
import { executeProcedure } from './utils/sql.util.js';

// Execute stored procedure
const result = await executeProcedure('sp_GetUsersByRole', {
  roleName: 'admin',
  isActive: true
});

// Procedure with output parameters
const result2 = await executeProcedure('sp_CreateUserWithRole', {
  name: 'John Doe',
  email: 'john@example.com',
  roleName: 'user'
});
```

### Transactions

```javascript
import sql from 'mssql';
import poolPromise from '../config/sql.config.js';

const executeTransaction = async () => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const request1 = new sql.Request(transaction);
    await request1
      .input('userId', sql.Int, 1)
      .input('amount', sql.Decimal(10, 2), 100.00)
      .query('UPDATE Users SET balance = balance - @amount WHERE id = @userId');
    
    const request2 = new sql.Request(transaction);
    await request2
      .input('userId', sql.Int, 2)
      .input('amount', sql.Decimal(10, 2), 100.00)
      .query('UPDATE Users SET balance = balance + @amount WHERE id = @userId');
    
    await transaction.commit();
    console.log('Transaction completed successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('Transaction failed:', error);
    throw error;
  }
};
```

### Aggregation Queries

```javascript
// Count, Sum, Average
const statsQuery = `
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN active = 1 THEN 1 END) as active_users,
    AVG(CAST(age as float)) as average_age,
    MIN(created_at) as first_user_date,
    MAX(last_login) as last_activity
  FROM Users
`;

// Group by with aggregation
const groupQuery = `
  SELECT 
    YEAR(created_at) as year,
    MONTH(created_at) as month,
    COUNT(*) as user_count,
    COUNT(CASE WHEN active = 1 THEN 1 END) as active_count
  FROM Users
  GROUP BY YEAR(created_at), MONTH(created_at)
  ORDER BY year DESC, month DESC
`;
```

## 4. Data Types and Parameters

When using parameters, you can specify SQL Server data types:

```javascript
import sql from 'mssql';

const typedQuery = async () => {
  const pool = await poolPromise;
  const request = pool.request();
  
  request.input('id', sql.Int, 1);
  request.input('name', sql.NVarChar(50), 'John Doe');
  request.input('email', sql.NVarChar(100), 'john@example.com');
  request.input('price', sql.Decimal(10, 2), 99.99);
  request.input('isActive', sql.Bit, true);
  request.input('birthDate', sql.Date, new Date('1990-01-01'));
  request.input('metadata', sql.NText, JSON.stringify({key: 'value'}));
  
  const result = await request.query(`
    INSERT INTO Products (name, email, price, active, birth_date, metadata)
    VALUES (@name, @email, @price, @isActive, @birthDate, @metadata)
  `);
  
  return result;
};
```

## 5. Error Handling

```javascript
import { executeQuery } from './utils/sql.util.js';

const safeQuery = async () => {
  try {
    const result = await executeQuery('SELECT * FROM Users WHERE id = @id', { id: 1 });
    return result;
  } catch (error) {
    console.error('Database error:', error.message);
    
    // Handle specific error types
    if (error.number === 2) {
      console.error('Connection timeout');
    } else if (error.number === 18456) {
      console.error('Login failed');
    }
    
    throw error;
  }
};
```

## 6. Usage in Services and Controllers

See the example files:
- `services/user.service.js` - Service layer with SQL operations
- `controllers/user.controller.js` - Controller layer handling HTTP requests
- `routes/user.routes.js` - Route definitions

## 7. Testing SQL Queries

You can test individual queries by creating a test file:

```javascript
// test-sql.js
import { executeQuery, getOne } from './utils/sql.util.js';

const testQueries = async () => {
  try {
    // Test connection
    const testResult = await executeQuery('SELECT 1 as test');
    console.log('Connection test:', testResult.recordset[0]);
    
    // Test table query (replace with your actual table)
    const users = await executeQuery('SELECT TOP 5 * FROM Users');
    console.log('Users:', users.recordset);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testQueries();
```

Run with: `node test-sql.js`

This setup provides a robust foundation for working with SQL Server/Azure SQL in your Node.js application.
