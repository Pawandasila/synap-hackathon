import { z } from "zod";

// Announcement Creation Validator
export const createAnnouncementValidator = z.object({
    eventId: z
        .number({ required_error: "Event ID is required" })
        .int("Event ID must be an integer")
        .positive("Event ID must be positive"),
    
    title: z
        .string({ required_error: "Title is required" })
        .min(3, "Title must be at least 3 characters long")
        .max(200, "Title cannot exceed 200 characters")
        .trim()
        .refine((title) => title.length > 0, "Title cannot be empty"),
    
    message: z
        .string({ required_error: "Message is required" })
        .min(5, "Message must be at least 5 characters long")
        .max(1000, "Message cannot exceed 1000 characters")
        .trim()
        .refine((msg) => msg.length > 0, "Message cannot be empty"),
    
    priority: z
        .enum(['low', 'medium', 'high'], { 
            required_error: "Priority is required",
            invalid_type_error: "Priority must be low, medium, or high"
        })
        .default('medium')
        .optional(),
    
    isImportant: z
        .boolean()
        .default(false)
        .optional()
});

// Announcement Update Validator
export const updateAnnouncementValidator = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters long")
        .max(200, "Title cannot exceed 200 characters")
        .trim()
        .optional(),
        
    message: z
        .string()
        .min(5, "Message must be at least 5 characters long")
        .max(1000, "Message cannot exceed 1000 characters")
        .trim()
        .optional(),
        
    priority: z
        .enum(['low', 'medium', 'high'], { 
            invalid_type_error: "Priority must be low, medium, or high"
        })
        .optional(),
    
    isImportant: z
        .boolean()
        .optional()
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
});

// Announcement ID Validator (for params)
export const announcementIdValidator = z.object({
    id: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid announcement ID format")
});

// Event ID Validator (for getting announcements by event)
export const eventIdValidator = z.object({
    eventId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid event ID")
});

// Query Parameters Validator for filtering announcements
export const announcementQueryValidator = z.object({
    important: z
        .string()
        .refine((val) => val === 'true' || val === 'false', "Important must be 'true' or 'false'")
        .optional()
});

// Validation middleware functions
export const createAnnouncementWithValidation = {
    body: createAnnouncementValidator
};

export const updateAnnouncementWithValidation = {
    body: updateAnnouncementValidator,
    params: announcementIdValidator
};

export const getAnnouncementWithValidation = {
    params: announcementIdValidator
};

export const getAnnouncementsByEventWithValidation = {
    params: eventIdValidator,
    query: announcementQueryValidator
};

export const deleteAnnouncementWithValidation = {
    params: announcementIdValidator
};
