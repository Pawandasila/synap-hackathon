import { z } from "zod";

// Submission Creation Validator
export const createSubmissionValidator = z.object({
    eventId: z
        .number({ required_error: "Event ID is required" })
        .int("Event ID must be an integer")
        .positive("Event ID must be positive"),
    
    teamId: z
        .number({ required_error: "Team ID is required" })
        .int("Team ID must be an integer")
        .positive("Team ID must be positive"),
    
    title: z
        .string({ required_error: "Title is required" })
        .min(3, "Title must be at least 3 characters long")
        .max(200, "Title cannot exceed 200 characters")
        .trim()
        .refine((title) => title.length > 0, "Title cannot be empty"),
    
    description: z
        .string({ required_error: "Description is required" })
        .min(10, "Description must be at least 10 characters long")
        .max(2000, "Description cannot exceed 2000 characters")
        .trim()
        .refine((desc) => desc.length > 0, "Description cannot be empty"),
    
    track: z
        .string({ required_error: "Track is required" })
        .min(2, "Track must be at least 2 characters long")
        .max(100, "Track cannot exceed 100 characters")
        .trim(),
    
    githubUrl: z
        .string()
        .url("GitHub URL must be a valid URL")
        .optional()
        .or(z.literal("")),
    
    videoUrl: z
        .string()
        .url("Video URL must be a valid URL")
        .optional()
        .or(z.literal("")),
    
    docs: z
        .array(z.string().url("Document URL must be valid"))
        .optional()
        .default([]),
    
    round: z
        .number()
        .int("Round must be an integer")
        .positive("Round must be positive")
        .default(1)
        .optional()
});

// Submission Update Validator
export const updateSubmissionValidator = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters long")
        .max(200, "Title cannot exceed 200 characters")
        .trim()
        .optional(),
    
    description: z
        .string()
        .min(10, "Description must be at least 10 characters long")
        .max(2000, "Description cannot exceed 2000 characters")
        .trim()
        .optional(),
    
    track: z
        .string()
        .min(2, "Track must be at least 2 characters long")
        .max(100, "Track cannot exceed 100 characters")
        .trim()
        .optional(),
    
    githubUrl: z
        .string()
        .url("GitHub URL must be a valid URL")
        .optional()
        .or(z.literal("")),
    
    videoUrl: z
        .string()
        .url("Video URL must be a valid URL")
        .optional()
        .or(z.literal("")),
    
    docs: z
        .array(z.string().url("Document URL must be valid"))
        .optional(),
    
    round: z
        .number()
        .int("Round must be an integer")
        .positive("Round must be positive")
        .optional()
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
});

// Submission ID Validator (for params)
export const submissionIdValidator = z.object({
    id: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid submission ID format")
});

// Event ID Validator (for getting submissions by event)
export const eventIdValidator = z.object({
    eventId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid event ID")
});

// Team ID Validator (for getting submissions by team)
export const teamIdValidator = z.object({
    teamId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid team ID")
});

// Query Parameters Validator for filtering submissions
export const submissionQueryValidator = z.object({
    round: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid round number")
        .optional(),
    
    track: z
        .string()
        .min(1, "Track cannot be empty")
        .max(100, "Track cannot exceed 100 characters")
        .optional()
});

// Validation middleware functions
export const createSubmissionWithValidation = {
    body: createSubmissionValidator
};

export const updateSubmissionWithValidation = {
    body: updateSubmissionValidator,
    params: submissionIdValidator
};

export const getSubmissionWithValidation = {
    params: submissionIdValidator
};

export const getSubmissionsByEventWithValidation = {
    params: eventIdValidator,
    query: submissionQueryValidator
};

export const getSubmissionsByTeamWithValidation = {
    params: teamIdValidator
};

export const deleteSubmissionWithValidation = {
    params: submissionIdValidator
};
