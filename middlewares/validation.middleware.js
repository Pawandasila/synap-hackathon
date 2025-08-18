import { HTTPSTATUS } from "../config/Https.config.js";

export const validate = (schema) => {
    return async (req, res, next) => {
        try {
            const validatedData = await schema.parseAsync({
                body: req.body,
                params: req.params,
                query: req.query
            });

            if (validatedData.body !== undefined) {
                req.body = validatedData.body;
            }
            if (validatedData.params !== undefined) {
                Object.assign(req.params, validatedData.params);
            }

            next();
        } catch (error) {
            if (error.name === 'ZodError') {
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
                error: error.message
            });
        }
    };
};
