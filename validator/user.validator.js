import { z } from "zod";

const AuthProviderEnum = z.enum(["email", "google", "github"], {
  errorMap: () => ({
    message: "Auth provider must be email, google, or github",
  }),
});

const RoleEnum = z.enum(["participant", "organizer", "judge"], {
  errorMap: () => ({
    message: "Role must be participant, organizer, or judge",
  }),
});

const baseUserSchema = {
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters long")
    .max(255, "Name must not exceed 255 characters")
    .trim(),

  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .max(255, "Password must not exceed 255 characters"),

  authprovider: AuthProviderEnum,

  role: RoleEnum,
};

export const createUserSchema = z.object(baseUserSchema);

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(255, "Name must not exceed 255 characters")
    .trim()
    .optional(),

  email: z
    .string()
    .email("Please provide a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase()
    .optional(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(255, "Password must not exceed 255 characters")
    .optional(),

  authprovider: AuthProviderEnum.optional(),

  role: RoleEnum.optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(1, "Current password is required"),

    newPassword: z
      .string({ required_error: "New password is required" })
      .min(6, "New password must be at least 6 characters long")
      .max(255, "New password must not exceed 255 characters"),

    confirmPassword: z.string({
      required_error: "Password confirmation is required",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(255, "Name must not exceed 255 characters")
    .trim()
    .optional(),

  email: z
    .string()
    .email("Please provide a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase()
    .optional(),
});
