import jwt from "jsonwebtoken";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { HTTPSTATUS } from "../config/Https.config.js";
import { Env } from "../config/env.config.js";

export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Access token required"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, Env.JWT_SECRET);
    
    // Query database to verify user still exists
    const getUserQuery = `SELECT userid, name, email, role, authprovider FROM users WHERE userid = @userid`;
    const result = await executeParameterizedQuery(getUserQuery, { userid: decoded.userId });
    
    if (result.recordset.length === 0) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid token - user not found"
      });
    }

    // Attach user info to request object
    req.user = result.recordset[0];
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid token"
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Token expired"
      });
    }

    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

// Middleware to check specific roles
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Insufficient permissions"
      });
    }

    next();
  };
};

