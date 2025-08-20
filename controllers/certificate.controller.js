import { AsyncHandler } from "../middlewares/AsyncHandler.middleware.js";
import Certificate from "../models/certificate.model.js";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { HTTPSTATUS } from "../config/Https.config.js";
import { validateReferences } from "../utils/validation.util.js";

/**
 * Issue a certificate to a user
 * POST /certificates
 * Organizers only
 */
export const issueCertificate = AsyncHandler(async (req, res) => {
  const { eventId, userId, certificateUrl } = req.body;
  const organizerId = req.user.userid;

  if (!eventId || !userId || !certificateUrl) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event ID, user ID, and certificate URL are required",
    });
  }

  const validationErrors = await validateReferences({ eventId, userId });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  const organizerCheck = `
    SELECT COUNT(*) as count FROM events 
    WHERE EventID = @eventId AND OrganizerID = @organizerId
  `;
  const isOrganizer = await executeParameterizedQuery(organizerCheck, {
    eventId,
    organizerId,
  });

  if (isOrganizer.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to issue certificates for this event",
    });
  }

  const enrollmentCheck = `
    SELECT COUNT(*) as count FROM event_enrollments 
    WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
  `;
  const wasEnrolled = await executeParameterizedQuery(enrollmentCheck, {
    eventId,
    userId,
  });

  if (wasEnrolled.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "User was not enrolled in this event",
    });
  }

  const existingCertificate = await Certificate.findOne({ eventId, userId });

  if (existingCertificate) {
    return res.status(HTTPSTATUS.CONFLICT).json({
      success: false,
      message: "Certificate already issued for this user in this event",
    });
  }

  const certificate = new Certificate({
    eventId,
    userId,
    certificateUrl,
  });

  await certificate.save();

  const detailsQuery = `
    SELECT u.name as UserName, u.email as UserEmail, e.Name as EventName
    FROM users u, events e
    WHERE u.userid = @userId AND e.EventID = @eventId
  `;

  const detailsResult = await executeParameterizedQuery(detailsQuery, {
    userId,
    eventId,
  });

  const certificateWithDetails = {
    ...certificate.toObject(),
    userDetails: detailsResult.recordset[0] || null,
  };

  res.status(HTTPSTATUS.CREATED).json({
    success: true,
    message: "Certificate issued successfully",
    data: certificateWithDetails,
  });
});

/**
 * Get certificates for an event
 * GET /certificates/event/:eventId
 * Organizers and judges only
 */
export const getCertificatesByEvent = AsyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.userid;
  const userRole = req.user.role;

  const validationErrors = await validateReferences({
    eventId: parseInt(eventId),
  });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event not found",
      errors: validationErrors,
    });
  }

  let hasAccess = false;

  if (userRole === "judge") {
    hasAccess = true;
  } else {
    const organizerCheck = `
      SELECT COUNT(*) as count FROM events 
      WHERE EventID = @eventId AND OrganizerID = @userId
    `;
    const isOrganizer = await executeParameterizedQuery(organizerCheck, {
      eventId,
      userId,
    });
    hasAccess = isOrganizer.recordset[0].count > 0;
  }

  if (!hasAccess) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to view certificates for this event",
    });
  }

  const certificates = await Certificate.find({
    eventId: parseInt(eventId),
  }).sort({ issuedAt: -1 });

  const certificatesWithUserDetails = await Promise.all(
    certificates.map(async (certificate) => {
      const userQuery = `
        SELECT name, email FROM users WHERE userid = @userId
      `;

      const userResult = await executeParameterizedQuery(userQuery, {
        userId: certificate.userId,
      });

      return {
        ...certificate.toObject(),
        userDetails: userResult.recordset[0] || null,
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Certificates retrieved successfully",
    data: certificatesWithUserDetails,
    count: certificatesWithUserDetails.length,
  });
});

/**
 * Get user's certificates
 * GET /certificates/my-certificates
 */
export const getMyCertificates = AsyncHandler(async (req, res) => {
  const userId = req.user.userid;

  const certificates = await Certificate.find({ userId }).sort({
    issuedAt: -1,
  });

  const certificatesWithEventDetails = await Promise.all(
    certificates.map(async (certificate) => {
      const eventQuery = `
        SELECT Name as EventName, StartDate, EndDate FROM events WHERE EventID = @eventId
      `;

      const eventResult = await executeParameterizedQuery(eventQuery, {
        eventId: certificate.eventId,
      });

      return {
        ...certificate.toObject(),
        eventDetails: eventResult.recordset[0] || null,
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Your certificates retrieved successfully",
    data: certificatesWithEventDetails,
    count: certificatesWithEventDetails.length,
  });
});

/**
 * Get certificate by ID
 * GET /certificates/:id
 */
export const getCertificateById = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userid;

  const certificate = await Certificate.findById(id);

  if (!certificate) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Certificate not found",
    });
  }

  const accessCheck = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 WHERE @userId = @certificateUserId
      UNION
      SELECT 1 FROM events WHERE EventID = @eventId AND OrganizerID = @userId
    ) as access_check
  `;

  const hasAccess = await executeParameterizedQuery(accessCheck, {
    userId,
    certificateUserId: certificate.userId,
    eventId: certificate.eventId,
  });

  if (hasAccess.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You don't have access to this certificate",
    });
  }

  const detailsQuery = `
    SELECT u.name as UserName, u.email as UserEmail, 
           e.Name as EventName, e.StartDate, e.EndDate
    FROM users u, events e
    WHERE u.userid = @userId AND e.EventID = @eventId
  `;

  const detailsResult = await executeParameterizedQuery(detailsQuery, {
    userId: certificate.userId,
    eventId: certificate.eventId,
  });

  const certificateWithDetails = {
    ...certificate.toObject(),
    details: detailsResult.recordset[0] || null,
  };

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Certificate retrieved successfully",
    data: certificateWithDetails,
  });
});

/**
 * Update certificate URL
 * PATCH /certificates/:id
 * Organizers only
 */
export const updateCertificate = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { certificateUrl } = req.body;
  const organizerId = req.user.userid;

  if (!certificateUrl) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Certificate URL is required",
    });
  }

  const certificate = await Certificate.findById(id);

  if (!certificate) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Certificate not found",
    });
  }

  const organizerCheck = `
    SELECT COUNT(*) as count FROM events 
    WHERE EventID = @eventId AND OrganizerID = @organizerId
  `;
  const isOrganizer = await executeParameterizedQuery(organizerCheck, {
    eventId: certificate.eventId,
    organizerId,
  });

  if (isOrganizer.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to update this certificate",
    });
  }

  const updatedCertificate = await Certificate.findByIdAndUpdate(
    id,
    { certificateUrl },
    { new: true, runValidators: true }
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Certificate updated successfully",
    data: updatedCertificate,
  });
});

/**
 * Delete certificate
 * DELETE /certificates/:id
 * Organizers only
 */
export const deleteCertificate = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizerId = req.user.userid;

  const certificate = await Certificate.findById(id);

  if (!certificate) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Certificate not found",
    });
  }

  const organizerCheck = `
    SELECT COUNT(*) as count FROM events 
    WHERE EventID = @eventId AND OrganizerID = @organizerId
  `;
  const isOrganizer = await executeParameterizedQuery(organizerCheck, {
    eventId: certificate.eventId,
    organizerId,
  });

  if (isOrganizer.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to delete this certificate",
    });
  }

  await Certificate.findByIdAndDelete(id);

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Certificate deleted successfully",
  });
});

/**
 * Bulk issue certificates
 * POST /certificates/bulk-issue
 * Organizers only
 */
export const bulkIssueCertificates = AsyncHandler(async (req, res) => {
  const { eventId, userIds, certificateUrl } = req.body;
  const organizerId = req.user.userid;

  if (
    !eventId ||
    !userIds ||
    !Array.isArray(userIds) ||
    userIds.length === 0 ||
    !certificateUrl
  ) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event ID, user IDs array, and certificate URL are required",
    });
  }

  const validationErrors = await validateReferences({ eventId });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event not found",
      errors: validationErrors,
    });
  }

  const organizerCheck = `
    SELECT COUNT(*) as count FROM events 
    WHERE EventID = @eventId AND OrganizerID = @organizerId
  `;
  const isOrganizer = await executeParameterizedQuery(organizerCheck, {
    eventId,
    organizerId,
  });

  if (isOrganizer.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to issue certificates for this event",
    });
  }

  const results = {
    issued: [],
    skipped: [],
    errors: [],
  };

  for (const userId of userIds) {
    try {
      const userValidationErrors = await validateReferences({ userId });
      if (userValidationErrors.length > 0) {
        results.errors.push({ userId, error: "User not found" });
        continue;
      }

      const enrollmentCheck = `
        SELECT COUNT(*) as count FROM event_enrollments 
        WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
      `;
      const wasEnrolled = await executeParameterizedQuery(enrollmentCheck, {
        eventId,
        userId,
      });

      if (wasEnrolled.recordset[0].count === 0) {
        results.errors.push({
          userId,
          error: "User was not enrolled in this event",
        });
        continue;
      }

      const existingCertificate = await Certificate.findOne({
        eventId,
        userId,
      });

      if (existingCertificate) {
        results.skipped.push({ userId, reason: "Certificate already exists" });
        continue;
      }

      const certificate = new Certificate({
        eventId,
        userId,
        certificateUrl,
      });

      await certificate.save();
      results.issued.push({ userId, certificateId: certificate._id });
    } catch (error) {
      results.errors.push({ userId, error: error.message });
    }
  }

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Bulk certificate issuance completed",
    data: results,
    summary: {
      total: userIds.length,
      issued: results.issued.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
    },
  });
});

/**
 * Get certificate templates
 * GET /certificates/templates
 * All authenticated users
 */
export const getTemplates = AsyncHandler(async (req, res) => {
  const templates = [
    {
      id: "template1",
      name: "Classic Blue",
      preview: "/cert_templates/Template1.png",
    },
    {
      id: "template2",
      name: "Ocean Blue",
      preview: "/cert_templates/Template2.png",
    },
    {
      id: "template3",
      name: "Elegant Black",
      preview: "/cert_templates/Template3.png",
    },
    {
      id: "template4",
      name: "Simple White",
      preview: "/cert_templates/Template4.jpeg",
    },
    {
      id: "template5",
      name: "Royal Red",
      preview: "/cert_templates/Template5.png",
    },
    {
      id: "template6",
      name: "Purple Galaxy",
      preview: "/cert_templates/Template6.png",
    },
    {
      id: "template7",
      name: "Sunset Orange",
      preview: "/cert_templates/Template7.png",
    },
    {
      id: "template8",
      name: "Purple Professional",
      preview: "/cert_templates/Template8.png",
    },
    {
      id: "template9",
      name: "Cyber Blue",
      preview: "/cert_templates/Template9.gif",
    },
    {
      id: "template10",
      name: "Modern Gradient",
      preview: "/cert_templates/Template10.jpg",
    },
    {
      id: "template11",
      name: "Clean Minimal",
      preview: "/cert_templates/Template11.png",
    },
  ];

  res.status(HTTPSTATUS.OK).json({
    success: true,
    count: templates.length,
    data: templates,
  });
});

/**
 * Generate certificate data (for frontend preview/download)
 * POST /certificates/generate
 * Organizers only
 */
export const generateCertificate = AsyncHandler(async (req, res) => {
  const {
    recipientName,
    eventId,
    template,
    heading,
    description,
    authorName,
    logoUrl,
    certificateType,
  } = req.body;

  if (!recipientName || !eventId || !template) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Recipient name, event ID, and template are required",
    });
  }

  const organizerId = req.user.userid;
  const organizerCheck = `
    SELECT COUNT(*) as count FROM events 
    WHERE EventID = @eventId AND OrganizerID = @organizerId
  `;
  const isOrganizer = await executeParameterizedQuery(organizerCheck, {
    eventId,
    organizerId,
  });

  if (isOrganizer.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to generate certificates for this event",
    });
  }

  const certificateData = {
    id: `cert_${Date.now()}`,
    recipientName,
    eventId,
    template,
    heading: heading || "Certificate of Achievement",
    description:
      description || "for outstanding participation and contribution",
    authorName: authorName || req.user.name,
    logoUrl,
    certificateType: certificateType || "participant",
    generatedBy: req.user.userid,
    generatedAt: new Date(),
    downloadUrl: `/certificates/download/${Date.now()}.pdf`,
  };

  res.status(HTTPSTATUS.CREATED).json({
    success: true,
    message: "Certificate generated successfully",
    data: certificateData,
  });
});
