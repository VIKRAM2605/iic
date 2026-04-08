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

  return `/uploads/prototype-details/${uploadedFile.filename}`;
};

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerReviewNotification = ({ prototypeRow, nextStatus, rejectionMessage }) => {
  if (!prototypeRow?.owner_email) {
    return false;
  }

  const prototypeName = prototypeRow.event_name || `Prototype #${prototypeRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your Prototype "${prototypeName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${prototypeRow.owner_name || "Faculty"},`,
    "",
    `Your Prototype "${prototypeName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: prototypeRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizePrototypeRow = (row) => ({
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

const basePrototypeSelect = `
  SELECT
    id.id,
    id.user_id,
    id.status,
    id.rejection_message,
    id.created_at,
    id.reviewed_at,
    id.approved_at,
    id.rejected_at,
    COALESCE(id.program_details->>'programActivityName', '') AS event_name,
    COALESCE(id.program_details->>'aboutEvent', '') AS major_reason,
    COALESCE(id.program_details->>'quarter', '') AS quarter,
    COALESCE(id.duration_details->>'fromDate', '') AS from_date,
    COALESCE(id.duration_details->>'toDate', '') AS to_date,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name,
    COALESCE(id.faculty->>'faculty1', '') AS faculty_1,
    COALESCE(id.faculty->>'faculty2', '') AS faculty_2,
    COALESCE(id.faculty->>'faculty3', '') AS faculty_3,
    COALESCE(id.bip_portal->>'facultyApplied', '') AS faculty_applied
  FROM prototype_details id
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN id.user_id ~ '^[0-9]+$' THEN id.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = id.reviewed_by
`;

export async function createPrototypeDetails(request, response, next) {
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
      problemRelevance: getBodyValue(body, "problemRelevance"),
      solutionDescription: getBodyValue(body, "solutionDescription"),
      uniquenessFeatures: getBodyValue(body, "uniquenessFeatures"),
      competitorDifference: getBodyValue(body, "competitorDifference"),
    };

    const speakerDetails = {
      speakerName: getBodyValue(body, "speakerName"),
      speakerDesignation: getBodyValue(body, "speakerDesignation"),
      speakerOrganization: getBodyValue(body, "speakerOrganization"),
      aboutSpeaker: getBodyValue(body, "aboutSpeaker"),
      sessionVideoUrl: getBodyValue(body, "sessionVideoUrl"),
      publishedSocialMediaUrl: getBodyValue(body, "publishedSocialMediaUrl"),
    };

    const attachments = {
      ipPatentAssociated: getBodyValue(body, "ipPatentAssociated"),
      ipPatentDocument: getUploadedFilePath(files, "ipPatentDocument"),
      innovationGrantSupport: getBodyValue(body, "innovationGrantSupport"),
      innovationGrantDocument: getUploadedFilePath(files, "innovationGrantDocument"),
      recognitionsObtained: getBodyValue(body, "recognitionsObtained"),
      latestAchievementDocument: getUploadedFilePath(files, "latestAchievementDocument"),
      commercializedSolution: getBodyValue(body, "commercializedSolution"),
      startupRegistrationDocument: getUploadedFilePath(files, "startupRegistrationDocument"),
      incubationSupportReceived: getBodyValue(body, "incubationSupportReceived"),
      incubationUnitName: getBodyValue(body, "incubationUnitName"),
      innovationVideoUrl: getBodyValue(body, "innovationVideoUrl"),
      innovationPhotograph: getUploadedFilePath(files, "innovationPhotograph"),
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
      iqacVerification: getBodyValue(body, "iqacVerification"),
    };

    const insertedRows = await db`
      INSERT INTO prototype_details (
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
      message: "Prototype details uploaded successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedPrototypesForAdmin(request, response, next) {
  try {
    const quarter = getQueryValue(request.query, "quarter");
    const date = getQueryValue(request.query, "date");
    const fromDate = getQueryValue(request.query, "fromDate");
    const toDate = getQueryValue(request.query, "toDate");
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();
    const includeRejected = getQueryValue(request.query, "includeRejected").toLowerCase() === "true";

    const conditions = [
      includeRejected ? "id.status IN ('approved', 'rejected')" : "id.status = 'approved'",
    ];
    const params = [];

    if (quarter) {
      params.push(quarter);
      conditions.push(`LOWER(COALESCE(id.program_details->>'quarter', '')) = LOWER($${params.length})`);
    }

    if (date) {
      params.push(date);
      conditions.push(`
        (
          NULLIF(id.duration_details->>'fromDate', '')::date <= $${params.length}::date
          AND NULLIF(id.duration_details->>'toDate', '')::date >= $${params.length}::date
        )
      `);
    } else {
      if (fromDate) {
        params.push(fromDate);
        conditions.push(`NULLIF(id.duration_details->>'toDate', '')::date >= $${params.length}::date`);
      }

      if (toDate) {
        params.push(toDate);
        conditions.push(`NULLIF(id.duration_details->>'fromDate', '')::date <= $${params.length}::date`);
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
          OR LOWER(COALESCE(id.faculty->>'faculty1', '')) LIKE $${index}
          OR LOWER(COALESCE(id.faculty->>'faculty2', '')) LIKE $${index}
          OR LOWER(COALESCE(id.faculty->>'faculty3', '')) LIKE $${index}
          OR LOWER(COALESCE(id.bip_portal->>'facultyApplied', '')) LIKE $${index}
        )
      `);
    }

    const approvedPrototypes = await db.unsafe(
      `${basePrototypeSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY id.approved_at DESC NULLS LAST, id.created_at DESC`,
      params
    );

    response.status(200).json({
      message: "Approved prototypes fetched successfully.",
      data: approvedPrototypes.map(normalizePrototypeRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedPrototypeFilterOptionsForAdmin(_request, response, next) {
  try {
    const includeRejected =
      getQueryValue(response.req?.query, "includeRejected").toLowerCase() === "true";
    const statusFilter = includeRejected ? "IN ('approved', 'rejected')" : "= 'approved'";

    const quarterRows = await db.unsafe(
      `
      SELECT DISTINCT TRIM(COALESCE(id.program_details->>'quarter', '')) AS quarter
      FROM prototype_details id
      WHERE id.status ${statusFilter}
        AND TRIM(COALESCE(id.program_details->>'quarter', '')) <> ''
      ORDER BY quarter
      `
    );

    const facultyRows = await db.unsafe(
      `
      SELECT DISTINCT name
      FROM (
        SELECT TRIM(value) AS name
        FROM prototype_details id
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN id.user_id ~ '^[0-9]+$' THEN id.user_id::bigint
            ELSE NULL
          END
        CROSS JOIN LATERAL UNNEST(
          ARRAY[
            COALESCE(owner.name, ''),
            COALESCE(id.faculty->>'faculty1', ''),
            COALESCE(id.faculty->>'faculty2', ''),
            COALESCE(id.faculty->>'faculty3', ''),
            COALESCE(id.bip_portal->>'facultyApplied', '')
          ]
        ) AS value
        WHERE id.status ${statusFilter}
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

export async function getMyPrototypesForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const prototypes = await db.unsafe(
      `${basePrototypeSelect}
       WHERE id.user_id = $1
       ORDER BY id.created_at DESC`,
      [userId]
    );

    response.status(200).json({
      message: "Faculty prototypes fetched successfully.",
      data: prototypes.map(normalizePrototypeRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviewQueueForAdmin(request, response, next) {
  try {
    const prototypes = await db.unsafe(
      `${basePrototypeSelect}
       WHERE id.status IN ('pending', 'rejected')
       ORDER BY CASE id.status WHEN 'pending' THEN 0 ELSE 1 END, id.created_at DESC`
    );

    response.status(200).json({
      message: "Prototype review queue fetched successfully.",
      data: prototypes.map(normalizePrototypeRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPrototypeById(request, response, next) {
  try {
    const prototypeId = Number(request.params?.prototypeId);

    if (!Number.isFinite(prototypeId) || prototypeId <= 0) {
      response.status(400).json({ message: "Invalid prototype id." });
      return;
    }

    const prototypeRows = await db.unsafe(
      `
      SELECT
        id.id,
        id.user_id,
        id.status,
        id.rejection_message,
        id.reviewed_at,
        id.approved_at,
        id.rejected_at,
        id.created_at,
        id.program_details,
        id.duration_details,
        id.overview,
        id.speaker_details,
        id.attachments,
        id.social_media,
        id.bip_portal,
        id.faculty,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM prototype_details id
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN id.user_id ~ '^[0-9]+$' THEN id.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = id.reviewed_by
      WHERE id.id = $1
      LIMIT 1
      `,
      [prototypeId]
    );

    const prototypeRow = prototypeRows[0];
    if (!prototypeRow) {
      response.status(404).json({ message: "Prototype not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(prototypeRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "Prototype details fetched successfully.",
      data: {
        id: prototypeRow.id,
        userId: prototypeRow.user_id,
        status: prototypeRow.status,
        rejectionMessage: prototypeRow.rejection_message,
        reviewedAt: prototypeRow.reviewed_at,
        approvedAt: prototypeRow.approved_at,
        rejectedAt: prototypeRow.rejected_at,
        createdAt: prototypeRow.created_at,
        eventName: prototypeRow.program_details?.programActivityName || "",
        majorReason: prototypeRow.program_details?.aboutEvent || "",
        quarter: prototypeRow.program_details?.quarter || "",
        ownerName: prototypeRow.owner_name,
        ownerEmail: prototypeRow.owner_email,
        reviewerName: prototypeRow.reviewer_name,
        programDetails: prototypeRow.program_details,
        durationDetails: prototypeRow.duration_details,
        overview: prototypeRow.overview,
        speakerDetails: prototypeRow.speaker_details,
        attachments: prototypeRow.attachments,
        socialMedia: prototypeRow.social_media,
        bipPortal: prototypeRow.bip_portal,
        faculty: prototypeRow.faculty,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewPrototypeByAdmin(request, response, next) {
  try {
    const prototypeId = Number(request.params?.prototypeId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(prototypeId) || prototypeId <= 0) {
      response.status(400).json({ message: "Invalid prototype id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const prototypeRows = await db.unsafe(
      `
      SELECT
        id.id,
        id.user_id,
        COALESCE(id.program_details->>'programActivityName', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM prototype_details id
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN id.user_id ~ '^[0-9]+$' THEN id.user_id::bigint
          ELSE NULL
        END
      WHERE id.id = $1
      LIMIT 1
      `,
      [prototypeId]
    );

    const prototypeRow = prototypeRows[0];
    if (!prototypeRow) {
      response.status(404).json({ message: "Prototype not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE prototype_details
      SET
        status = $1,
        rejection_message = $2,
        reviewed_by = $3,
        reviewed_at = NOW(),
        approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
        rejected_at = CASE WHEN $1 = 'rejected' THEN NOW() ELSE NULL END
      WHERE id = $4
      RETURNING id, status, rejection_message, reviewed_at, approved_at, rejected_at
      `,
      [nextStatus, nextStatus === "rejected" ? rejectionMessage || null : null, adminUserId, prototypeId]
    );

    const updatedPrototype = updatedRows[0];
    const emailQueued = triggerReviewNotification({ prototypeRow, nextStatus, rejectionMessage });

    response.status(200).json({
      message: `Prototype ${nextStatus} successfully.`,
      data: {
        ...updatedPrototype,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}

