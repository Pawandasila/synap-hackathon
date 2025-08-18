import poolPromise from '../config/sql.config.js';

/**
 * Execute a SQL query
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise} Query result
 */
export const executeQuery = async (query, params = []) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    
    // Add parameters if provided
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('SQL Query Error:', error);
    throw error;
  }
};

/**
 * Execute a stored procedure
 * @param {string} procedureName - Name of the stored procedure
 * @param {Object} params - Parameters object {paramName: value}
 * @returns {Promise} Procedure result
 */
export const executeProcedure = async (procedureName, params = {}) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    console.error('Stored Procedure Error:', error);
    throw error;
  }
};

/**
 * Execute a parameterized query with named parameters
 * @param {string} query - SQL query with named parameters (@param1, @param2, etc.)
 * @param {Object} params - Parameters object {param1: value1, param2: value2}
 * @returns {Promise} Query result
 */
export const executeParameterizedQuery = async (query, params = {}) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    
    // Add named parameters
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('Parameterized Query Error:', error);
    throw error;
  }
};

/**
 * Get a single record
 * @param {string} query - SQL query string
 * @param {Object} params - Parameters object
 * @returns {Promise} Single record or null
 */
export const getOne = async (query, params = {}) => {
  try {
    const result = await executeParameterizedQuery(query, params);
    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (error) {
    console.error('Get One Error:', error);
    throw error;
  }
};

/**
 * Get multiple records
 * @param {string} query - SQL query string
 * @param {Object} params - Parameters object
 * @returns {Promise} Array of records
 */
export const getMany = async (query, params = {}) => {
  try {
    const result = await executeParameterizedQuery(query, params);
    return result.recordset;
  } catch (error) {
    console.error('Get Many Error:', error);
    throw error;
  }
};

/**
 * Insert a record
 * @param {string} table - Table name
 * @param {Object} data - Data object {column: value}
 * @returns {Promise} Insert result
 */
export const insertRecord = async (table, data) => {
  try {
    const columns = Object.keys(data).join(', ');
    const values = Object.keys(data).map(key => `@${key}`).join(', ');
    const query = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
    
    const result = await executeParameterizedQuery(query, data);
    return result;
  } catch (error) {
    console.error('Insert Error:', error);
    throw error;
  }
};

/**
 * Update a record
 * @param {string} table - Table name
 * @param {Object} data - Data object {column: value}
 * @param {string} whereClause - WHERE clause (without WHERE keyword)
 * @param {Object} whereParams - WHERE parameters
 * @returns {Promise} Update result
 */
export const updateRecord = async (table, data, whereClause, whereParams = {}) => {
  try {
    const setClause = Object.keys(data).map(key => `${key} = @${key}`).join(', ');
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    
    const allParams = { ...data, ...whereParams };
    const result = await executeParameterizedQuery(query, allParams);
    return result;
  } catch (error) {
    console.error('Update Error:', error);
    throw error;
  }
};

/**
 * Delete a record
 * @param {string} table - Table name
 * @param {string} whereClause - WHERE clause (without WHERE keyword)
 * @param {Object} whereParams - WHERE parameters
 * @returns {Promise} Delete result
 */
export const deleteRecord = async (table, whereClause, whereParams = {}) => {
  try {
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    const result = await executeParameterizedQuery(query, whereParams);
    return result;
  } catch (error) {
    console.error('Delete Error:', error);
    throw error;
  }
};

export default {
  executeQuery,
  executeProcedure,
  executeParameterizedQuery,
  getOne,
  getMany,
  insertRecord,
  updateRecord,
  deleteRecord
};
