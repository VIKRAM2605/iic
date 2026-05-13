import db from "../config/db.js";
import { randomUUID } from "crypto";
import { sendEmail } from "../utils/mail.js";

const getBodyValue = (body, key) => String(body?.[key] ?? "").trim();
const getUploadedFilePath = (files, key) => files?.[key]?.[0]?.path || null;

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerReviewNotification = ({ appliedRow, nextStatus, rejectionMessage }) => {
  if (!appliedRow?.owner_email) {
    return false;
  }

  const entryName = appliedRow.event_name || `IIC Applied #${appliedRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your IIC Applied entry "${entryName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${appliedRow.owner_name || "Faculty"},`,
    "",
    `Your IIC Applied entry "${entryName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: appliedRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeAppliedRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  status: row.status,
  rejectionMessage: row.rejection_message,
  createdAt: row.created_at,
  reviewedAt: row.reviewed_at,
  approvedAt: row.approved_at,
  rejectedAt: row.rejected_at,
  eventName: row.event_name,
  majorReason: "",
  quarter: "",
  ownerName: row.owner_name,
  ownerEmail: row.owner_email,
  reviewerName: row.reviewer_name,
  serviceRole: row.service_role,
  serviceFocusArea: row.service_focus_area,
  equipments: row.equipments,
  fromDate: row.from_date,
  toDate: row.to_date,
  eventObjective: row.event_objective,
  outcomeSkill: row.outcome_skill,
  iicVerification: row.iic_verification,
  brochureFile: row.brochure_file,
});

const baseAppliedSelect = `
  SELECT
    ia.id,
    ia.user_id,
    ia.status,
    ia.rejection_message,
    ia.created_at,
    ia.reviewed_at,
    ia.approved_at,
    ia.rejected_at,
    COALESCE(ia.applied_details->>'serviceName', '') AS event_name,
    '' AS major_reason,
    '' AS quarter,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name,
    COALESCE(ia.applied_details->>'serviceRole', '') AS service_role,
    COALESCE(ia.applied_details->>'serviceFocusArea', '') AS service_focus_area,
    COALESCE(ia.applied_details->>'equipments', '') AS equipments,
    COALESCE(ia.applied_details->>'fromDate', '') AS from_date,
    COALESCE(ia.applied_details->>'toDate', '') AS to_date,
    COALESCE(ia.applied_details->>'eventObjective', '') AS event_objective,
    COALESCE(ia.applied_details->>'outcomeSkill', '') AS outcome_skill,
    COALESCE(ia.applied_details->>'iicVerification', '') AS iic_verification,
    COALESCE(ia.attachments->>'brochureFile', '') AS brochure_file
  FROM iic_applied ia
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN ia.user_id ~ '^[0-9]+$' THEN ia.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = ia.reviewed_by
`;

export async function createIicApplied(request, response, next) {
  try {
    const { body, files } = request;
    const bodyUserId = getBodyValue(body, "userId");
    const userId = String(request.user?.id ?? (bodyUserId || randomUUID()));
    const brochureFile = getUploadedFilePath(files, "brochureFile");

    const appliedDetails = {
      serviceName: getBodyValue(body, "serviceName"),
      serviceRole: getBodyValue(body, "serviceRole"),
      serviceFocusArea: getBodyValue(body, "serviceFocusArea"),
      equipments: getBodyValue(body, "equipments"),
      fromDate: getBodyValue(body, "fromDate"),
      toDate: getBodyValue(body, "toDate"),
      eventObjective: getBodyValue(body, "eventObjective"),
      outcomeSkill: getBodyValue(body, "outcomeSkill"),
      iicVerification: getBodyValue(body, "iicVerification") || "Initiated",
    };
    const attachments = {
      brochureFile,
    };
    const requiredValues = [
      appliedDetails.serviceName,
      appliedDetails.serviceRole,
      appliedDetails.serviceFocusArea,
      appliedDetails.equipments,
      appliedDetails.fromDate,
      appliedDetails.toDate,
      appliedDetails.eventObjective,
      appliedDetails.outcomeSkill,
      appliedDetails.iicVerification,
    ];

    if (requiredValues.some((value) => !value) || !brochureFile) {
      response.status(400).json({ message: "Please fill all mandatory IIC Applied fields." });
      return;
    }

    if (new Date(appliedDetails.fromDate) > new Date(appliedDetails.toDate)) {
      response.status(400).json({ message: "To Date must be after or equal to From Date." });
      return;
    }

    const insertedRows = await db`
      INSERT INTO iic_applied (
        user_id,
        applied_details,
        overview,
        attachments
      )
      VALUES (
        ${userId},
        ${db.json(appliedDetails)},
        ${db.json({})},
        ${db.json(attachments)}
      )
      RETURNING id, user_id, created_at
    `;

    response.status(201).json({
      message: "IIC Applied entry submitted successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedIicAppliedForAdmin(request, response, next) {
  try {
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";

    const conditions = [
      includeRejected ? "ia.status IN ('approved', 'rejected')" : "ia.status = 'approved'",
    ];
    const params = [];

    if (facultyName) {
      params.push(`%${facultyName}%`);
      conditions.push(
        `(LOWER(COALESCE(owner.name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(owner.email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(ia.applied_details->>'serviceName', '')) LIKE $${params.length}
          OR LOWER(COALESCE(ia.applied_details->>'serviceRole', '')) LIKE $${params.length}
          OR LOWER(COALESCE(ia.applied_details->>'serviceFocusArea', '')) LIKE $${params.length}
          OR LOWER(COALESCE(ia.applied_details->>'equipments', '')) LIKE $${params.length}
          OR LOWER(COALESCE(ia.applied_details->>'eventObjective', '')) LIKE $${params.length}
          OR LOWER(COALESCE(ia.applied_details->>'outcomeSkill', '')) LIKE $${params.length}
          OR LOWER(COALESCE(ia.applied_details->>'iicVerification', '')) LIKE $${params.length})`,
      );
    }

    const entries = await db.unsafe(
      `${baseAppliedSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY ia.approved_at DESC NULLS LAST, ia.created_at DESC`,
      params,
    );

    response.status(200).json({
      message: "Approved IIC Applied entries fetched successfully.",
      data: entries.map(normalizeAppliedRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedIicAppliedFilterOptionsForAdmin(
  request,
  response,
  next,
) {
  try {
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";
    const statusFilter = includeRejected ? "IN ('approved', 'rejected')" : "= 'approved'";

    const facultyRows = await db.unsafe(
      `
      SELECT DISTINCT name
      FROM (
        SELECT TRIM(value) AS name
        FROM iic_applied ia
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN ia.user_id ~ '^[0-9]+$' THEN ia.user_id::bigint
            ELSE NULL
          END
        CROSS JOIN LATERAL UNNEST(
          ARRAY[
            COALESCE(owner.name, ''),
            COALESCE(ia.applied_details->>'serviceName', ''),
            COALESCE(ia.applied_details->>'serviceRole', ''),
            COALESCE(ia.applied_details->>'serviceFocusArea', ''),
            COALESCE(ia.applied_details->>'equipments', ''),
            COALESCE(ia.applied_details->>'eventObjective', ''),
            COALESCE(ia.applied_details->>'outcomeSkill', ''),
            COALESCE(ia.applied_details->>'iicVerification', '')
          ]
        ) AS value
        WHERE ia.status ${statusFilter}
      ) names
      WHERE name <> ''
      ORDER BY name
      `,
    );

    response.status(200).json({
      message: "IIC Applied filter options fetched successfully.",
      data: {
        faculties: facultyRows.map((row) => row.name),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyIicAppliedForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const entries = await db.unsafe(
      `${baseAppliedSelect}
       WHERE ia.user_id = $1
       ORDER BY ia.created_at DESC`,
      [userId],
    );

    response.status(200).json({
      message: "Faculty IIC Applied entries fetched successfully.",
      data: entries.map(normalizeAppliedRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getIicAppliedReviewQueueForAdmin(_request, response, next) {
  try {
    const entries = await db.unsafe(
      `${baseAppliedSelect}
       WHERE ia.status IN ('pending', 'rejected')
       ORDER BY CASE ia.status WHEN 'pending' THEN 0 ELSE 1 END, ia.created_at DESC`,
    );

    response.status(200).json({
      message: "IIC Applied review queue fetched successfully.",
      data: entries.map(normalizeAppliedRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getIicAppliedById(request, response, next) {
  try {
    const appliedId = Number(request.params?.appliedId);

    if (!Number.isFinite(appliedId) || appliedId <= 0) {
      response.status(400).json({ message: "Invalid IIC Applied id." });
      return;
    }

    const rows = await db.unsafe(
      `
      SELECT
        ia.id,
        ia.user_id,
        ia.status,
        ia.rejection_message,
        ia.reviewed_at,
        ia.approved_at,
        ia.rejected_at,
        ia.created_at,
        ia.applied_details,
        ia.overview,
        ia.attachments,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM iic_applied ia
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN ia.user_id ~ '^[0-9]+$' THEN ia.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = ia.reviewed_by
      WHERE ia.id = $1
      LIMIT 1
      `,
      [appliedId],
    );

    const row = rows[0];
    if (!row) {
      response.status(404).json({ message: "IIC Applied entry not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(row.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "IIC Applied details fetched successfully.",
      data: {
        id: row.id,
        userId: row.user_id,
        status: row.status,
        rejectionMessage: row.rejection_message,
        reviewedAt: row.reviewed_at,
        approvedAt: row.approved_at,
        rejectedAt: row.rejected_at,
        createdAt: row.created_at,
        eventName: row.applied_details?.serviceName || "",
        majorReason: "",
        quarter: "",
        ownerName: row.owner_name,
        ownerEmail: row.owner_email,
        reviewerName: row.reviewer_name,
        appliedDetails: row.applied_details,
        overview: {},
        attachments: row.attachments || {},
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewIicAppliedByAdmin(request, response, next) {
  try {
    const appliedId = Number(request.params?.appliedId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(appliedId) || appliedId <= 0) {
      response.status(400).json({ message: "Invalid IIC Applied id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const rows = await db.unsafe(
      `
      SELECT
        ia.id,
        COALESCE(ia.applied_details->>'serviceName', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM iic_applied ia
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN ia.user_id ~ '^[0-9]+$' THEN ia.user_id::bigint
          ELSE NULL
        END
      WHERE ia.id = $1
      LIMIT 1
      `,
      [appliedId],
    );

    const row = rows[0];
    if (!row) {
      response.status(404).json({ message: "IIC Applied entry not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE iic_applied
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
      [nextStatus, rejectionMessage || null, adminUserId, appliedId],
    );

    const updatedEntry = updatedRows[0];
    const emailQueued = triggerReviewNotification({
      appliedRow: row,
      nextStatus,
      rejectionMessage,
    });

    response.status(200).json({
      message: `IIC Applied ${nextStatus} successfully.`,
      data: {
        ...updatedEntry,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}
