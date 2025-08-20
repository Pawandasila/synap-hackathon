import { z } from "zod";

// Chat Message Creation Validator
export const createChatMessageValidator = z.object({
    eventId: z
        .number({ required_error: "Event ID is required" })
        .int("Event ID must be an integer")
        .positive("Event ID must be positive"),
    
    message: z
        .string({ required_error: "Message is required" })
        .min(1, "Message cannot be empty")
        .max(1000, "Message cannot exceed 1000 characters")
        .trim()
        .refine((msg) => msg.length > 0, "Message cannot be empty")
});

// Chat Reply Validator
export const addReplyValidator = z.object({
    message: z
        .string({ required_error: "Message is required" })
        .min(1, "Message cannot be empty")
        .max(1000, "Message cannot exceed 1000 characters")
        .trim()
        .refine((msg) => msg.length > 0, "Message cannot be empty")
});

// Chat Update Validator
export const updateChatMessageValidator = z.object({
    message: z
        .string({ required_error: "Message is required" })
        .min(1, "Message cannot be empty")
        .max(1000, "Message cannot exceed 1000 characters")
        .trim()
        .refine((msg) => msg.length > 0, "Message cannot be empty")
});

// Chat ID Validator (for params using :id)
export const chatIdValidator = z.object({
    id: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid chat message ID format")
});

// Chat ID Validator (for params using :chatId)
export const chatIdParamValidator = z.object({
    chatId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid chat message ID format")
});

// Chat and Reply ID Validator (for reply operations)
export const chatReplyIdValidator = z.object({
    chatId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid chat message ID format"),
    
    replyId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid reply ID format")
});

// Event ID Validator (for getting chat by event)
export const eventIdValidator = z.object({
    eventId: z
        .string()
        .transform((val) => parseInt(val))
        .refine((val) => !isNaN(val) && val > 0, "Invalid event ID")
});

// Pagination Query Validator
export const chatPaginationValidator = z.object({
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
        .default("20")
        .optional()
});

// Validation middleware functions
export const createChatMessageWithValidation = {
    body: createChatMessageValidator
};

export const addReplyWithValidation = {
    body: addReplyValidator,
    params: chatIdParamValidator
};

export const updateChatMessageWithValidation = {
    body: updateChatMessageValidator,
    params: chatIdValidator
};

export const getChatWithValidation = {
    params: chatIdValidator
};

export const getChatByEventWithValidation = {
    params: eventIdValidator,
    query: chatPaginationValidator
};

export const deleteChatWithValidation = {
    params: chatIdValidator
};

export const updateReplyWithValidation = {
    body: addReplyValidator,
    params: chatReplyIdValidator
};

export const deleteReplyWithValidation = {
    params: chatReplyIdValidator
};
