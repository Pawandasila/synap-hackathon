import { z } from "zod";

// Event Creation Validator
export const createEventValidator = z.object({
    organizerID: z
        .number({ required_error: "Organizer ID is required" })
        .int("Organizer ID must be an integer")
        .positive("Organizer ID must be positive"),
    
    name: z
        .string({ required_error: "Event name is required" })
        .min(3, "Event name must be at least 3 characters long")
        .max(255, "Event name cannot exceed 255 characters")
        .trim()
        .refine((name) => name.length > 0, "Event name cannot be empty"),
    
    description: z
        .string()
        .max(2000, "Description cannot exceed 2000 characters")
        .optional(),
    
    theme: z
        .string()
        .max(255, "Theme cannot exceed 255 characters")
        .optional(),
    
    mode: z
        .enum(["Online", "Offline"], { required_error: "Mode is required" }),
    
    startDate: z
        .string({ required_error: "Start date is required" })
        .datetime("Start date must be a valid ISO datetime"),
    
    endDate: z
        .string({ required_error: "End date is required" })
        .datetime("End date must be a valid ISO datetime"),
    
    submissionDeadline: z
        .string()
        .datetime("Submission deadline must be a valid ISO datetime")
        .optional(),
    
    resultDate: z
        .string()
        .datetime("Result date must be a valid ISO datetime")
        .optional(),
    
    rules: z
        .string()
        .max(5000, "Rules cannot exceed 5000 characters")
        .optional(),
    
    timeline: z
        .string()
        .max(3000, "Timeline cannot exceed 3000 characters")
        .optional(),
    
    tracks: z
        .string()
        .max(2000, "Tracks cannot exceed 2000 characters")
        .optional(),
    
    prizes: z
        .string()
        .max(2000, "Prizes cannot exceed 2000 characters")
        .optional(),
    
    maxTeamSize: z
        .number()
        .int("Max team size must be an integer")
        .positive("Max team size must be positive")
        .max(10, "Max team size cannot exceed 10")
        .optional(),
    
    sponsors: z
        .string()
        .max(2000, "Sponsors cannot exceed 2000 characters")
        .optional()
}).refine((data) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
}, {
    message: "End date must be after start date",
    path: ["endDate"]
});

// Event Update Validator
export const updateEventValidator = z.object({
    name: z
        .string()
        .min(3, "Event name must be at least 3 characters long")
        .max(255, "Event name cannot exceed 255 characters")
        .trim()
        .optional(),
    
    description: z
        .string()
        .max(2000, "Description cannot exceed 2000 characters")
        .optional(),
    
    theme: z
        .string()
        .max(255, "Theme cannot exceed 255 characters")
        .optional(),
    
    mode: z
        .enum(["Online", "Offline"])
        .optional(),
    
    startDate: z
        .string()
        .datetime("Start date must be a valid ISO datetime")
        .optional(),
    
    endDate: z
        .string()
        .datetime("End date must be a valid ISO datetime")
        .optional(),
    
    submissionDeadline: z
        .string()
        .datetime("Submission deadline must be a valid ISO datetime")
        .optional(),
    
    resultDate: z
        .string()
        .datetime("Result date must be a valid ISO datetime")
        .optional(),
    
    rules: z
        .string()
        .max(5000, "Rules cannot exceed 5000 characters")
        .optional(),
    
    timeline: z
        .string()
        .max(3000, "Timeline cannot exceed 3000 characters")
        .optional(),
    
    tracks: z
        .string()
        .max(2000, "Tracks cannot exceed 2000 characters")
        .optional(),
    
    prizes: z
        .string()
        .max(2000, "Prizes cannot exceed 2000 characters")
        .optional(),
    
    maxTeamSize: z
        .number()
        .int("Max team size must be an integer")
        .positive("Max team size must be positive")
        .max(10, "Max team size cannot exceed 10")
        .optional(),
    
    sponsors: z
        .string()
        .max(2000, "Sponsors cannot exceed 2000 characters")
        .optional(),
    
    isActive: z
        .boolean()
        .optional()
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
});

// Event ID Validator (for params)
export const eventIdValidator = z.object({
    id: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid event ID")
});

// Event Enrollment Validator
export const enrollEventValidator = z.object({
    eventId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid event ID")
});

// Search Query Validator
export const eventSearchValidator = z.object({
    query: z
        .string()
        .min(2, "Search query must be at least 2 characters")
        .max(100, "Search query cannot exceed 100 characters")
        .optional(),
    
    mode: z
        .enum(["Online", "Offline"])
        .optional(),
    
    theme: z
        .string()
        .min(1, "Theme cannot be empty")
        .max(255, "Theme cannot exceed 255 characters")
        .optional(),
    
    page: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Page must be a positive number")
        .default("1")
        .optional(),
    
    limit: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0 && val <= 100, "Limit must be between 1 and 100")
        .default("10")
        .optional()
});

// Validation middleware functions
export const createEventWithValidation = {
    body: createEventValidator
};

export const updateEventWithValidation = {
    body: updateEventValidator,
    params: eventIdValidator
};

export const getEventWithValidation = {
    params: eventIdValidator
};

export const deleteEventWithValidation = {
    params: eventIdValidator
};

export const enrollEventWithValidation = {
    params: enrollEventValidator
};

export const searchEventWithValidation = {
    query: eventSearchValidator
};
