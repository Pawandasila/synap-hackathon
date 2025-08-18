import z from 'zod';

export const createEventSchema = z.object({
  OrganizerID: z.number().int().positive("OrganizerID must be a positive integer"),
  Name: z.string().min(1, "Event name is required").max(255, "Event name must be less than 255 characters"),
  Description: z.string().optional(),
  Theme: z.string().max(255, "Theme must be less than 255 characters").optional(),
  Mode: z.enum(['Online', 'Offline'], {
    errorMap: () => ({ message: "Mode must be either 'Online' or 'Offline'" })
  }),
  StartDate: z.string().datetime("StartDate must be a valid datetime"),
  EndDate: z.string().datetime("EndDate must be a valid datetime"),
  SubmissionDeadline: z.string().datetime("SubmissionDeadline must be a valid datetime").optional(),
  ResultDate: z.string().datetime("ResultDate must be a valid datetime").optional(),
  Rules: z.string().optional(),
  Timeline: z.string().optional(),
  Tracks: z.string().optional(),
  Prizes: z.string().optional(),
  MaxTeamSize: z.number().int().positive("MaxTeamSize must be a positive integer").optional(),
  Sponsors: z.string().optional(),
  IsActive: z.boolean().default(true)
}).refine(
  (data) => new Date(data.StartDate) < new Date(data.EndDate),
  {
    message: "EndDate must be after StartDate",
    path: ["EndDate"]
  }
).refine(
  (data) => !data.SubmissionDeadline || new Date(data.SubmissionDeadline) <= new Date(data.EndDate),
  {
    message: "SubmissionDeadline must be before or equal to EndDate",
    path: ["SubmissionDeadline"]
  }
);

export const updateEventSchema = z.object({
  OrganizerID: z.number().int().positive("OrganizerID must be a positive integer").optional(),
  Name: z.string().min(1, "Event name is required").max(255, "Event name must be less than 255 characters").optional(),
  Description: z.string().optional(),
  Theme: z.string().max(255, "Theme must be less than 255 characters").optional(),
  Mode: z.enum(['Online', 'Offline'], {
    errorMap: () => ({ message: "Mode must be either 'Online' or 'Offline'" })
  }).optional(),
  StartDate: z.string().datetime("StartDate must be a valid datetime").optional(),
  EndDate: z.string().datetime("EndDate must be a valid datetime").optional(),
  SubmissionDeadline: z.string().datetime("SubmissionDeadline must be a valid datetime").optional(),
  ResultDate: z.string().datetime("ResultDate must be a valid datetime").optional(),
  Rules: z.string().optional(),
  Timeline: z.string().optional(),
  Tracks: z.string().optional(),
  Prizes: z.string().optional(),
  MaxTeamSize: z.number().int().positive("MaxTeamSize must be a positive integer").optional(),
  Sponsors: z.string().optional(),
  IsActive: z.boolean().optional()
}).refine(
  (data) => {
    
    if (data.StartDate && data.EndDate) {
      return new Date(data.StartDate) < new Date(data.EndDate);
    }
    return true;
  },
  {
    message: "EndDate must be after StartDate",
    path: ["EndDate"]
  }
).refine(
  (data) => {
    if (data.SubmissionDeadline && data.EndDate) {
      return new Date(data.SubmissionDeadline) <= new Date(data.EndDate);
    }
    return true;
  },
  {
    message: "SubmissionDeadline must be before or equal to EndDate",
    path: ["SubmissionDeadline"]
  }
);

