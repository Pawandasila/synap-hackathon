import { z } from "zod";

// Event ID parameter validation
export const eventIdValidator = z.object({
    eventId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid event ID")
});

// Enrollment status query validation
export const enrollmentStatusValidator = z.object({
    status: z
        .enum(['Enrolled', 'Cancelled', 'Waitlisted'])
        .optional()
        .default('Enrolled')
});

// Team association body validation
export const updateTeamAssociationValidator = z.object({
    teamId: z
        .number({ required_error: "Team ID is required" })
        .int("Team ID must be an integer")
        .positive("Team ID must be positive")
        .optional()
});

// Pagination with status validation
export const enrollmentPaginationValidator = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val) : 1)
        .refine((val) => !isNaN(val) && val > 0, "Page must be a positive integer"),
    
    limit: z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val) : 20)
        .refine((val) => !isNaN(val) && val > 0 && val <= 100, "Limit must be between 1 and 100"),
    
    status: z
        .enum(['Enrolled', 'Cancelled', 'Waitlisted'])
        .optional()
        .default('Enrolled')
});

// Combined validators for routes
export const enrollToEventValidator = z.object({
    params: eventIdValidator
});

export const cancelEnrollmentValidator = z.object({
    params: eventIdValidator
});

export const getUserEnrollmentsValidator = z.object({
    query: enrollmentStatusValidator
});

export const getEventEnrollmentsValidator = z.object({
    params: eventIdValidator,
    query: enrollmentPaginationValidator
});

export const getEnrollmentStatsValidator = z.object({
    params: eventIdValidator
});

export const updateEnrollmentTeamValidator = z.object({
    params: eventIdValidator,
    body: updateTeamAssociationValidator
});
