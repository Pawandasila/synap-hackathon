import { z } from "zod";

// User Creation Validator
export const createUserValidator = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .min(2, "Name must be at least 2 characters long")
        .max(255, "Name cannot exceed 255 characters")
        .trim()
        .refine((name) => name.length > 0, "Name cannot be empty"),
    
    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format")
        .max(255, "Email cannot exceed 255 characters")
        .toLowerCase()
        .trim(),
    
    password: z
        .string({ required_error: "Password is required" })
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password cannot exceed 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    
    authprovider: z
        .enum(["email", "google", "github"], { required_error: "Auth provider is required" }),
    
    role: z
        .enum(["participant", "organizer", "judge"], { required_error: "Role is required" })
});

// User Login Validator
export const loginValidator = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase()
        .trim(),
    
    password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password cannot be empty")
});

// User Update Validator
export const updateUserValidator = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters long")
        .max(255, "Name cannot exceed 255 characters")
        .trim()
        .optional(),
    
    email: z
        .string()
        .email("Invalid email format")
        .max(255, "Email cannot exceed 255 characters")
        .toLowerCase()
        .trim()
        .optional(),
    
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password cannot exceed 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
            "Password must contain at least one uppercase letter, one lowercase letter, and one number")
        .optional(),
    
    role: z
        .enum(["participant", "organizer", "judge"])
        .optional()
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
});

// User ID Validator (for params)
export const userIdValidator = z.object({
    id: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid user ID")
});

// Search Query Validator
export const userSearchValidator = z.object({
    query: z
        .string()
        .min(1, "Search query cannot be empty")
        .max(100, "Search query cannot exceed 100 characters")
        .optional(),
    
    role: z
        .enum(["participant", "organizer", "judge"])
        .optional()
});

// Validation middleware functions
export const createUserWithValidation = {
    body: createUserValidator
};

export const loginWithValidation = {
    body: loginValidator
};

export const updateUserWithValidation = {
    body: updateUserValidator,
    params: userIdValidator
};

export const getUserWithValidation = {
    params: userIdValidator
};

export const searchUserWithValidation = {
    query: userSearchValidator
};
