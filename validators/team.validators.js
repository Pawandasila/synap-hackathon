import { z } from "zod";

// Team Creation Validator
export const createTeamValidator = z.object({
    teamName: z
        .string({ required_error: "Team name is required" })
        .min(2, "Team name must be at least 2 characters long")
        .max(50, "Team name cannot exceed 50 characters")
        .trim()
        .refine((name) => name.length > 0, "Team name cannot be empty"),
    
    eventId: z
        .number({ required_error: "Event ID is required" })
        .int("Event ID must be an integer")
        .positive("Event ID must be positive")
});

// Team Update Validator
export const updateTeamValidator = z.object({
    teamName: z
        .string({ required_error: "Team name is required" })
        .min(2, "Team name must be at least 2 characters long")
        .max(50, "Team name cannot exceed 50 characters")
        .trim()
        .refine((name) => name.length > 0, "Team name cannot be empty")
});

// Team Join Validator (for params)
export const teamIdValidator = z.object({
    teamId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid team ID")
});

// Member ID Validator (for removing members)
export const memberIdValidator = z.object({
    memberId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid member ID")
});

// Event ID Validator (for getting teams by event)
export const eventIdValidator = z.object({
    eventId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid event ID")
});

// Pagination Validator
export const paginationValidator = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val) : 1)
        .refine((val) => !isNaN(val) && val > 0, "Page must be a positive integer"),
    
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val) : 10)
        .refine((val) => !isNaN(val) && val > 0 && val <= 100, "Limit must be between 1 and 100")
});

// Combined validators for complex operations
export const createTeamWithValidation = z.object({
    body: createTeamValidator
});

export const updateTeamWithValidation = z.object({
    params: teamIdValidator,
    body: updateTeamValidator
});

export const joinTeamWithValidation = z.object({
    params: teamIdValidator
});

export const leaveTeamWithValidation = z.object({
    params: teamIdValidator
});

export const getTeamWithValidation = z.object({
    params: teamIdValidator
});

export const removeMemberWithValidation = z.object({
    params: teamIdValidator.merge(memberIdValidator)
});

export const deleteTeamWithValidation = z.object({
    params: teamIdValidator
});

export const getTeamsByEventWithValidation = z.object({
    params: eventIdValidator,
    query: paginationValidator
});
