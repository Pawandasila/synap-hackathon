import { z } from "zod";

// Certificate Issuance Validator
export const issueCertificateValidator = z.object({
    eventId: z
        .number({ required_error: "Event ID is required" })
        .int("Event ID must be an integer")
        .positive("Event ID must be positive"),
    
    userId: z
        .number({ required_error: "User ID is required" })
        .int("User ID must be an integer")
        .positive("User ID must be positive"),
    
    certificateUrl: z
        .string({ required_error: "Certificate URL is required" })
        .url("Certificate URL must be a valid URL")
        .trim()
});

// Bulk Certificate Issuance Validator
export const bulkIssueCertificateValidator = z.object({
    eventId: z
        .number({ required_error: "Event ID is required" })
        .int("Event ID must be an integer")
        .positive("Event ID must be positive"),
    
    userIds: z
        .array(z.number().int().positive(), { required_error: "User IDs array is required" })
        .min(1, "At least one user ID is required")
        .max(100, "Cannot issue more than 100 certificates at once"),
    
    certificateUrl: z
        .string({ required_error: "Certificate URL is required" })
        .url("Certificate URL must be a valid URL")
        .trim()
});

// Certificate Update Validator
export const updateCertificateValidator = z.object({
    certificateUrl: z
        .string({ required_error: "Certificate URL is required" })
        .url("Certificate URL must be a valid URL")
        .trim()
});

// Certificate ID Validator (for params)
export const certificateIdValidator = z.object({
    id: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid certificate ID format")
});

// Event ID Validator (for getting certificates by event)
export const eventIdValidator = z.object({
    eventId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid event ID")
});

// Validation middleware functions
export const issueCertificateWithValidation = {
    body: issueCertificateValidator
};

export const bulkIssueCertificateWithValidation = {
    body: bulkIssueCertificateValidator
};

export const updateCertificateWithValidation = {
    body: updateCertificateValidator,
    params: certificateIdValidator
};

export const getCertificateWithValidation = {
    params: certificateIdValidator
};

export const getCertificatesByEventWithValidation = {
    params: eventIdValidator
};

export const deleteCertificateWithValidation = {
    params: certificateIdValidator
};
