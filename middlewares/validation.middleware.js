import { HTTPSTATUS } from "../config/Https.config.js";

export const validate = (schema) => {
    return async (req, res, next) => {
        try {
            const validatedData = {};

            // Validate body if schema has body validator
            if (schema.body) {
                validatedData.body = await schema.body.parseAsync(req.body);
                req.body = validatedData.body;
            }

            // Validate params if schema has params validator
            if (schema.params) {
                validatedData.params = await schema.params.parseAsync(req.params);
                Object.assign(req.params, validatedData.params);
            }

            // Validate query if schema has query validator
            if (schema.query) {
                validatedData.query = await schema.query.parseAsync(req.query);
                Object.assign(req.query, validatedData.query);
            }

            next();
        } catch (error) {
            console.error('Validation error:', error); // Debug log
            
            if (error.name === 'ZodError' && error.errors) {
                const errorMessages = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(HTTPSTATUS.BAD_REQUEST).json({
                    success: false,
                    message: "Validation failed",
                    errors: errorMessages
                });
            }

            return res.status(HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "Invalid request data",
                error: error.message || 'Unknown validation error'
            });
        }
    };
};
