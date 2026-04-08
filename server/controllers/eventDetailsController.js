import db from "../config/db.js";
import { randomUUID } from "crypto";
import { sendEmail } from "../utils/mail.js";

const getBodyValue = (body, key) => String(body?.[key] ?? "").trim();

const getBodyBoolean = (body, key) => String(body?.[key] ?? "").toLowerCase() === "true";

const getBodyNumber = (body, key) => {
  const rawValue = String(body?.[key] ?? "").trim();
  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);
  return Number.isNaN(parsed) ? null : parsed;
};

const getUploadedFilePath = (files, fieldName) => {
  const uploadedFile = files?.[fieldName]?.[0];
  if (!uploadedFile) {
    return null;
  }

  return `/uploads/event-details/${uploadedFile.filename}`;
};

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerReviewNotification = ({ eventRow, nextStatus, rejectionMessage }) => {
  if (!eventRow?.owner_email) {
    return false;
  }

  const eventName = eventRow.event_name || `Event #${eventRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your event "${eventName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${eventRow.owner_name || "Faculty"},`,
    "",
    `Your event "${eventName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: eventRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeEventRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  status: row.status,
  rejectionMessage: row.rejection_message,
  createdAt: row.created_at,
  reviewedAt: row.reviewed_at,
  approvedAt: row.approved_at,
  rejectedAt: row.rejected_at,
  eventName: row.event_name,
  majorReason: row.major_reason,
  quarter: row.quarter,
  fromDate: row.from_date,
  toDate: row.to_date,
  ownerName: row.owner_name,
  ownerEmail: row.owner_email,
  reviewerName: row.reviewer_name,
  faculty1: row.faculty_1,
  faculty2: row.faculty_2,
  faculty3: row.faculty_3,
  facultyApplied: row.faculty_applied,
});

const baseEventSelect = `
  SELECT
    ed.id,
    ed.user_id,
    ed.status,
    ed.rejection_message,
    ed.created_at,
    ed.reviewed_at,
    ed.approved_at,
    ed.rejected_at,
    COALESCE(ed.program_details->>'programActivityName', '') AS event_name,
    COALESCE(ed.program_details->>'aboutEvent', '') AS major_reason,
    COALESCE(ed.program_details->>'quarter', '') AS quarter,
    COALESCE(ed.duration_details->>'fromDate', '') AS from_date,
    COALESCE(ed.duration_details->>'toDate', '') AS to_date,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name,
    COALESCE(ed.faculty->>'faculty1', '') AS faculty_1,
    COALESCE(ed.faculty->>'faculty2', '') AS faculty_2,
    COALESCE(ed.faculty->>'faculty3', '') AS faculty_3,
    COALESCE(ed.bip_portal->>'facultyApplied', '') AS faculty_applied
  FROM event_details ed
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN ed.user_id ~ '^[0-9]+$' THEN ed.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = ed.reviewed_by
`;

export async function createEventDetails(request, response, next) {
  try {
    const { body, files } = request;
    const bodyUserId = getBodyValue(body, "userId");
    const userId = String(request.user?.id ?? (bodyUserId || randomUUID()));

    const faculty = {
      faculty1: getBodyValue(body, "faculty1"),
      faculty2: getBodyValue(body, "faculty2"),
      faculty3: getBodyValue(body, "faculty3"),
    };

    const programDetails = {
      previousAcademicYear: getBodyValue(body, "previousAcademicYear"),
      currentAcademicYear: getBodyValue(body, "currentAcademicYear"),
      quarter: getBodyValue(body, "quarter"),
      programDrivenBy: getBodyValue(body, "programDrivenBy"),
      programActivityName: getBodyValue(body, "programActivityName"),
      programType: getBodyValue(body, "programType"),
      activityLedBy: getBodyValue(body, "activityLedBy"),
      programTheme: getBodyValue(body, "programTheme"),
      aboutEvent: getBodyValue(body, "aboutEvent"),
      studentParticipants: getBodyNumber(body, "studentParticipants"),
      facultyParticipants: getBodyNumber(body, "facultyParticipants"),
      externalParticipants: getBodyNumber(body, "externalParticipants"),
      expenditureAmount: getBodyNumber(body, "expenditureAmount"),
      modeOfSession: getBodyValue(body, "modeOfSession"),
      eventType: getBodyValue(body, "eventType"),
    };

    const durationDetails = {
      durationManual: getBodyBoolean(body, "durationManual"),
      fromDate: getBodyValue(body, "fromDate"),
      toDate: getBodyValue(body, "toDate"),
      durationHours: getBodyNumber(body, "durationHours"),
    };

    const overview = {
      objective: getBodyValue(body, "objective"),
      benefitLearning: getBodyValue(body, "benefitLearning"),
      outcomeObtained: getBodyValue(body, "outcomeObtained"),
      remark: getBodyValue(body, "remark"),
    };

    const speakerDetails = {
      speakerName: getBodyValue(body, "speakerName"),
      speakerDesignation: getBodyValue(body, "speakerDesignation"),
      speakerOrganization: getBodyValue(body, "speakerOrganization"),
      aboutSpeaker: getBodyValue(body, "aboutSpeaker"),
      sessionVideoUrl: getBodyValue(body, "sessionVideoUrl"),
      publishedSocialMediaUrl: getBodyValue(body, "publishedSocialMediaUrl"),
    };

    const brochureProofFile = getUploadedFilePath(files, "brochureProofName");
    const brochureWithLogo =
      getUploadedFilePath(files, "brochureWithLogo") || brochureProofFile || null;

    const attachments = {
      feedbackDescription: getUploadedFilePath(files, "feedbackDescription"),
      attendanceSheet: getUploadedFilePath(files, "attendanceSheet"),
      photograph1: getUploadedFilePath(files, "photograph1"),
      photograph2: getUploadedFilePath(files, "photograph2"),
      overallReport: getUploadedFilePath(files, "overallReport"),
      offlineEventProof1: getUploadedFilePath(files, "offlineEventProof1"),
      offlineEventProof2: getUploadedFilePath(files, "offlineEventProof2"),
      onlineEventProof1: getUploadedFilePath(files, "onlineEventProof1"),
      onlineEventProof2: getUploadedFilePath(files, "onlineEventProof2"),
      sessionScheduleWithHeader: getUploadedFilePath(files, "sessionScheduleWithHeader"),
      sessionSchedule: getUploadedFilePath(files, "sessionSchedule"),
      brochureWithLogo,
      brochureProofName: brochureProofFile || getBodyValue(body, "brochureProofName"),
      attendanceSheetWithHeader: getUploadedFilePath(files, "attendanceSheetWithHeader"),
      attendanceSheetName: getBodyValue(body, "attendanceSheetName"),
      uploadedReport: getUploadedFilePath(files, "uploadedReport"),
    };

    const socialMedia = {
      promoteTwitter: getBodyBoolean(body, "promoteTwitter"),
      twitterUrl: getBodyValue(body, "twitterUrl"),
      promoteFacebook: getBodyBoolean(body, "promoteFacebook"),
      facebookUrl: getBodyValue(body, "facebookUrl"),
      promoteInstagram: getBodyBoolean(body, "promoteInstagram"),
      instagramUrl: getBodyValue(body, "instagramUrl"),
      promoteLinkedin: getBodyBoolean(body, "promoteLinkedin"),
      linkedinUrl: getBodyValue(body, "linkedinUrl"),
    };

    const bipPortal = {
      facultyApplied: getBodyValue(body, "facultyApplied"),
      taskId: getBodyValue(body, "taskId"),
      departmentsInvolved: getBodyValue(body, "departmentsInvolved"),
      department: getBodyValue(body, "department"),
      specialLabsInvolved: getBodyValue(body, "specialLabsInvolved"),
      specialLabs: getBodyValue(body, "specialLabs"),
      clubInvolved: getBodyValue(body, "clubInvolved"),
      club: getBodyValue(body, "club"),
      firstFacultyInvolved: getBodyValue(body, "firstFacultyInvolved"),
      secondFacultyInvolved: getBodyValue(body, "secondFacultyInvolved"),
      thirdFacultyInvolved: getBodyValue(body, "thirdFacultyInvolved"),
      iqacVerification: getBodyValue(body, "iqacVerification") || "Initiated",
    };

    const insertedRows = await db`
      INSERT INTO event_details (
        user_id,
        program_details,
        duration_details,
        overview,
        speaker_details,
        attachments,
        social_media,
        bip_portal,
        faculty
      )
      VALUES (
        ${userId},
        ${db.json(programDetails)},
        ${db.json(durationDetails)},
        ${db.json(overview)},
        ${db.json(speakerDetails)},
        ${db.json(attachments)},
        ${db.json(socialMedia)},
        ${db.json(bipPortal)},
        ${db.json(faculty)}
      )
      RETURNING id, user_id, created_at
    `;

    response.status(201).json({
      message: "Event details uploaded successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedEventsForAdmin(request, response, next) {
  try {
    const quarter = getQueryValue(request.query, "quarter");
    const date = getQueryValue(request.query, "date");
    const fromDate = getQueryValue(request.query, "fromDate");
    const toDate = getQueryValue(request.query, "toDate");
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();

    const conditions = ["ed.status = 'approved'"];
    const params = [];

    if (quarter) {
      params.push(quarter);
      conditions.push(`LOWER(COALESCE(ed.program_details->>'quarter', '')) = LOWER($${params.length})`);
    }

    if (date) {
      params.push(date);
      conditions.push(`
        (
          NULLIF(ed.duration_details->>'fromDate', '')::date <= $${params.length}::date
          AND NULLIF(ed.duration_details->>'toDate', '')::date >= $${params.length}::date
        )
      `);
    } else {
      if (fromDate) {
        params.push(fromDate);
        conditions.push(`NULLIF(ed.duration_details->>'toDate', '')::date >= $${params.length}::date`);
      }

      if (toDate) {
        params.push(toDate);
        conditions.push(`NULLIF(ed.duration_details->>'fromDate', '')::date <= $${params.length}::date`);
      }
    }

    if (facultyName) {
      const facultySearchPattern = `%${facultyName}%`;
      params.push(facultySearchPattern);
      const index = params.length;
      conditions.push(`
        (
          LOWER(COALESCE(owner.name, '')) LIKE $${index}
          OR LOWER(COALESCE(owner.email, '')) LIKE $${index}
          OR LOWER(COALESCE(ed.faculty->>'faculty1', '')) LIKE $${index}
          OR LOWER(COALESCE(ed.faculty->>'faculty2', '')) LIKE $${index}
          OR LOWER(COALESCE(ed.faculty->>'faculty3', '')) LIKE $${index}
          OR LOWER(COALESCE(ed.bip_portal->>'facultyApplied', '')) LIKE $${index}
        )
      `);
    }

    const approvedEvents = await db.unsafe(
      `${baseEventSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY ed.approved_at DESC NULLS LAST, ed.created_at DESC`,
      params
    );

    response.status(200).json({
      message: "Approved events fetched successfully.",
      data: approvedEvents.map(normalizeEventRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedEventFilterOptionsForAdmin(_request, response, next) {
  try {
    const quarterRows = await db.unsafe(
      `
      SELECT DISTINCT TRIM(COALESCE(ed.program_details->>'quarter', '')) AS quarter
      FROM event_details ed
      WHERE ed.status = 'approved'
        AND TRIM(COALESCE(ed.program_details->>'quarter', '')) <> ''
      ORDER BY quarter
      `
    );

    const facultyRows = await db.unsafe(
      `
      SELECT DISTINCT name
      FROM (
        SELECT TRIM(value) AS name
        FROM event_details ed
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN ed.user_id ~ '^[0-9]+$' THEN ed.user_id::bigint
            ELSE NULL
          END
        CROSS JOIN LATERAL UNNEST(
          ARRAY[
            COALESCE(owner.name, ''),
            COALESCE(ed.faculty->>'faculty1', ''),
            COALESCE(ed.faculty->>'faculty2', ''),
            COALESCE(ed.faculty->>'faculty3', ''),
            COALESCE(ed.bip_portal->>'facultyApplied', '')
          ]
        ) AS value
        WHERE ed.status = 'approved'
      ) names
      WHERE name <> ''
      ORDER BY name
      `
    );

    response.status(200).json({
      message: "Approved filter options fetched successfully.",
      data: {
        quarters: quarterRows.map((row) => row.quarter),
        faculties: facultyRows.map((row) => row.name),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyEventsForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const events = await db.unsafe(
      `${baseEventSelect}
       WHERE ed.user_id = $1
       ORDER BY ed.created_at DESC`,
      [userId]
    );

    response.status(200).json({
      message: "Faculty events fetched successfully.",
      data: events.map(normalizeEventRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviewQueueForAdmin(_request, response, next) {
  try {
    const events = await db.unsafe(
      `${baseEventSelect}
       WHERE ed.status IN ('pending', 'rejected')
       ORDER BY CASE ed.status WHEN 'pending' THEN 0 ELSE 1 END, ed.created_at DESC`
    );

    response.status(200).json({
      message: "Review queue fetched successfully.",
      data: events.map(normalizeEventRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventById(request, response, next) {
  try {
    const eventId = Number(request.params?.eventId);

    if (!Number.isFinite(eventId) || eventId <= 0) {
      response.status(400).json({ message: "Invalid event id." });
      return;
    }

    const eventRows = await db.unsafe(
      `
      SELECT
        ed.id,
        ed.user_id,
        ed.status,
        ed.rejection_message,
        ed.reviewed_at,
        ed.approved_at,
        ed.rejected_at,
        ed.created_at,
        ed.program_details,
        ed.duration_details,
        ed.overview,
        ed.speaker_details,
        ed.attachments,
        ed.social_media,
        ed.bip_portal,
        ed.faculty,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM event_details ed
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN ed.user_id ~ '^[0-9]+$' THEN ed.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = ed.reviewed_by
      WHERE ed.id = $1
      LIMIT 1
      `,
      [eventId]
    );

    const eventRow = eventRows[0];
    if (!eventRow) {
      response.status(404).json({ message: "Event not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(eventRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "Event details fetched successfully.",
      data: {
        id: eventRow.id,
        userId: eventRow.user_id,
        status: eventRow.status,
        rejectionMessage: eventRow.rejection_message,
        reviewedAt: eventRow.reviewed_at,
        approvedAt: eventRow.approved_at,
        rejectedAt: eventRow.rejected_at,
        createdAt: eventRow.created_at,
        eventName: eventRow.program_details?.programActivityName || "",
        majorReason: eventRow.program_details?.aboutEvent || "",
        quarter: eventRow.program_details?.quarter || "",
        ownerName: eventRow.owner_name,
        ownerEmail: eventRow.owner_email,
        reviewerName: eventRow.reviewer_name,
        programDetails: eventRow.program_details,
        durationDetails: eventRow.duration_details,
        overview: eventRow.overview,
        speakerDetails: eventRow.speaker_details,
        attachments: eventRow.attachments,
        socialMedia: eventRow.social_media,
        bipPortal: eventRow.bip_portal,
        faculty: eventRow.faculty,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewEventByAdmin(request, response, next) {
  try {
    const eventId = Number(request.params?.eventId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(eventId) || eventId <= 0) {
      response.status(400).json({ message: "Invalid event id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const eventRows = await db.unsafe(
      `
      SELECT
        ed.id,
        ed.user_id,
        COALESCE(ed.program_details->>'programActivityName', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM event_details ed
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN ed.user_id ~ '^[0-9]+$' THEN ed.user_id::bigint
          ELSE NULL
        END
      WHERE ed.id = $1
      LIMIT 1
      `,
      [eventId]
    );

    const eventRow = eventRows[0];
    if (!eventRow) {
      response.status(404).json({ message: "Event not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const nextIqacStatus = nextStatus === "approved" ? "Approved" : "Rejected";
    const updatedRows = await db.unsafe(
      `
      UPDATE event_details
      SET
        status = $1,
        rejection_message = $2,
        reviewed_by = $3,
        reviewed_at = NOW(),
        approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
        rejected_at = CASE WHEN $1 = 'rejected' THEN NOW() ELSE NULL END,
        bip_portal = jsonb_set(COALESCE(bip_portal, '{}'::jsonb), '{iqacVerification}', to_jsonb($5::text), true)
      WHERE id = $4
      RETURNING id, status, rejection_message, reviewed_at, approved_at, rejected_at
      `,
      [
        nextStatus,
        nextStatus === "rejected" ? rejectionMessage || null : null,
        adminUserId,
        eventId,
        nextIqacStatus,
      ]
    );

    const updatedEvent = updatedRows[0];
    const emailQueued = triggerReviewNotification({ eventRow, nextStatus, rejectionMessage });

    response.status(200).json({
      message: `Event ${nextStatus} successfully.`,
      data: {
        ...updatedEvent,
        iqacVerification: nextIqacStatus,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}
