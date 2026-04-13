import db from "../config/db.js";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
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

  return `/uploads/idea-details/${uploadedFile.filename}`;
};

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const ideaUploadDirectory = path.join(process.cwd(), "uploads", "idea-details");

const getIdeaAttachmentPaths = (attachments) => {
  const attachmentValues = [
    attachments?.ipPatentDocument,
    attachments?.innovationGrantDocument,
    attachments?.latestAchievementDocument,
    attachments?.startupRegistrationDocument,
    attachments?.innovationPhotograph,
  ];

  return attachmentValues.filter((value) => typeof value === "string" && value.startsWith("/uploads/idea-details/"));
};

const deleteIdeaAttachmentFiles = async (attachmentPaths = []) => {
  await Promise.all(
    attachmentPaths.map(async (attachmentPath) => {
      const fileName = path.basename(attachmentPath);
      const resolvedPath = path.resolve(ideaUploadDirectory, fileName);

      if (!resolvedPath.startsWith(ideaUploadDirectory)) {
        return;
      }

      try {
        await fs.unlink(resolvedPath);
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    })
  );
};

const triggerReviewNotification = ({ ideaRow, nextStatus, rejectionMessage }) => {
  if (!ideaRow?.owner_email) {
    return false;
  }

  const ideaName = ideaRow.event_name || `Idea #${ideaRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your idea "${ideaName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${ideaRow.owner_name || "Faculty"},`,
    "",
    `Your idea "${ideaName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: ideaRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeIdeaRow = (row) => ({
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

const baseIdeaSelect = `
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
  FROM idea_details id
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN id.user_id ~ '^[0-9]+$' THEN id.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = id.reviewed_by
`;

export async function createIdeaDetails(request, response, next) {
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
      INSERT INTO idea_details (
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
      message: "Idea details uploaded successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedIdeasForAdmin(request, response, next) {
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

    const approvedIdeas = await db.unsafe(
      `${baseIdeaSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY id.approved_at DESC NULLS LAST, id.created_at DESC`,
      params
    );

    response.status(200).json({
      message: "Approved ideas fetched successfully.",
      data: approvedIdeas.map(normalizeIdeaRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedIdeaFilterOptionsForAdmin(_request, response, next) {
  try {
    const includeRejected =
      getQueryValue(response.req?.query, "includeRejected").toLowerCase() === "true";
    const statusFilter = includeRejected ? "IN ('approved', 'rejected')" : "= 'approved'";

    const quarterRows = await db.unsafe(
      `
      SELECT DISTINCT TRIM(COALESCE(id.program_details->>'quarter', '')) AS quarter
      FROM idea_details id
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
        FROM idea_details id
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

export async function getMyIdeasForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const ideas = await db.unsafe(
      `${baseIdeaSelect}
       WHERE id.user_id = $1
       ORDER BY id.created_at DESC`,
      [userId]
    );

    response.status(200).json({
      message: "Faculty ideas fetched successfully.",
      data: ideas.map(normalizeIdeaRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviewQueueForAdmin(request, response, next) {
  try {
    const ideas = await db.unsafe(
      `${baseIdeaSelect}
       WHERE id.status IN ('pending', 'rejected')
       ORDER BY CASE id.status WHEN 'pending' THEN 0 ELSE 1 END, id.created_at DESC`
    );

    response.status(200).json({
      message: "Idea review queue fetched successfully.",
      data: ideas.map(normalizeIdeaRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getIdeaById(request, response, next) {
  try {
    const ideaId = Number(request.params?.ideaId);

    if (!Number.isFinite(ideaId) || ideaId <= 0) {
      response.status(400).json({ message: "Invalid idea id." });
      return;
    }

    const ideaRows = await db.unsafe(
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
      FROM idea_details id
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN id.user_id ~ '^[0-9]+$' THEN id.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = id.reviewed_by
      WHERE id.id = $1
      LIMIT 1
      `,
      [ideaId]
    );

    const ideaRow = ideaRows[0];
    if (!ideaRow) {
      response.status(404).json({ message: "Idea not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(ideaRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "Idea details fetched successfully.",
      data: {
        id: ideaRow.id,
        userId: ideaRow.user_id,
        status: ideaRow.status,
        rejectionMessage: ideaRow.rejection_message,
        reviewedAt: ideaRow.reviewed_at,
        approvedAt: ideaRow.approved_at,
        rejectedAt: ideaRow.rejected_at,
        createdAt: ideaRow.created_at,
        eventName: ideaRow.program_details?.programActivityName || "",
        majorReason: ideaRow.program_details?.aboutEvent || "",
        quarter: ideaRow.program_details?.quarter || "",
        ownerName: ideaRow.owner_name,
        ownerEmail: ideaRow.owner_email,
        reviewerName: ideaRow.reviewer_name,
        programDetails: ideaRow.program_details,
        durationDetails: ideaRow.duration_details,
        overview: ideaRow.overview,
        speakerDetails: ideaRow.speaker_details,
        attachments: ideaRow.attachments,
        socialMedia: ideaRow.social_media,
        bipPortal: ideaRow.bip_portal,
        faculty: ideaRow.faculty,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewIdeaByAdmin(request, response, next) {
  try {
    const ideaId = Number(request.params?.ideaId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(ideaId) || ideaId <= 0) {
      response.status(400).json({ message: "Invalid idea id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const ideaRows = await db.unsafe(
      `
      SELECT
        id.id,
        id.user_id,
        COALESCE(id.program_details->>'programActivityName', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM idea_details id
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN id.user_id ~ '^[0-9]+$' THEN id.user_id::bigint
          ELSE NULL
        END
      WHERE id.id = $1
      LIMIT 1
      `,
      [ideaId]
    );

    const ideaRow = ideaRows[0];
    if (!ideaRow) {
      response.status(404).json({ message: "Idea not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE idea_details
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
      [nextStatus, nextStatus === "rejected" ? rejectionMessage || null : null, adminUserId, ideaId]
    );

    const updatedIdea = updatedRows[0];
    const emailQueued = triggerReviewNotification({ ideaRow, nextStatus, rejectionMessage });

    response.status(200).json({
      message: `Idea ${nextStatus} successfully.`,
      data: {
        ...updatedIdea,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteIdeaByAdmin(request, response, next) {
  try {
    const ideaId = Number(request.params?.ideaId);

    if (!Number.isFinite(ideaId) || ideaId <= 0) {
      response.status(400).json({ message: "Invalid idea id." });
      return;
    }

    const ideaRows = await db.unsafe(
      `
      SELECT
        id.id,
        id.attachments,
        COALESCE(id.program_details->>'programActivityName', '') AS event_name,
        COALESCE(owner.name, '') AS owner_name
      FROM idea_details id
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN id.user_id ~ '^[0-9]+$' THEN id.user_id::bigint
          ELSE NULL
        END
      WHERE id.id = $1
      LIMIT 1
      `,
      [ideaId]
    );

    const ideaRow = ideaRows[0];
    if (!ideaRow) {
      response.status(404).json({ message: "Idea not found." });
      return;
    }

    await db`
      DELETE FROM idea_details
      WHERE id = ${ideaId}
    `;

    await deleteIdeaAttachmentFiles(getIdeaAttachmentPaths(ideaRow.attachments));

    response.status(200).json({
      message: "Idea deleted successfully.",
      data: {
        id: ideaRow.id,
        eventName: ideaRow.event_name,
        ownerName: ideaRow.owner_name,
      },
    });
  } catch (error) {
    next(error);
  }
}
