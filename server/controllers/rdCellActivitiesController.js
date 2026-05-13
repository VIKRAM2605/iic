import db from "../config/db.js";
import { randomUUID } from "crypto";
import { sendEmail } from "../utils/mail.js";

const getBodyValue = (body, key) => String(body?.[key] ?? "").trim();

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerReviewNotification = ({ activityRow, nextStatus, rejectionMessage }) => {
  if (!activityRow?.owner_email) {
    return false;
  }

  const activityName = activityRow.event_name || `R&D Activity #${activityRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your R&D activity "${activityName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${activityRow.owner_name || "Faculty"},`,
    "",
    `Your R&D Cell activity "${activityName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: activityRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeActivityRow = (row) => ({
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
  title: row.title,
  levelDuration: row.level_duration,
});

const baseActivitySelect = `
  SELECT
    ra.id,
    ra.user_id,
    ra.status,
    ra.rejection_message,
    ra.created_at,
    ra.reviewed_at,
    ra.approved_at,
    ra.rejected_at,
    COALESCE(ra.activity_details->>'subTheme', '') AS event_name,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name,
    COALESCE(ra.activity_details->>'title', '') AS title,
    COALESCE(ra.activity_details->>'levelDuration', '') AS level_duration
  FROM rd_cell_activities ra
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN ra.user_id ~ '^[0-9]+$' THEN ra.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = ra.reviewed_by
`;

export async function createRdCellActivity(request, response, next) {
  try {
    const { body } = request;
    const bodyUserId = getBodyValue(body, "userId");
    const userId = String(request.user?.id ?? (bodyUserId || randomUUID()));

    const activityDetails = {
      subTheme: getBodyValue(body, "subTheme"),
      title: getBodyValue(body, "title"),
      levelDuration: getBodyValue(body, "levelDuration"),
      description: getBodyValue(body, "description"),
    };

    const insertedRows = await db`
      INSERT INTO rd_cell_activities (
        user_id,
        activity_details,
        overview,
        attachments
      )
      VALUES (
        ${userId},
        ${db.json(activityDetails)},
        ${db.json({})},
        ${db.json({})}
      )
      RETURNING id, user_id, created_at
    `;

    response.status(201).json({
      message: "R&D Cell activity submitted successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdCellActivitiesForAdmin(request, response, next) {
  try {
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";

    const conditions = [
      includeRejected ? "ra.status IN ('approved', 'rejected')" : "ra.status = 'approved'",
    ];
    const params = [];

    if (facultyName) {
      params.push(`%${facultyName}%`);
      conditions.push(
        `(LOWER(COALESCE(owner.name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(owner.email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(ra.activity_details->>'subTheme', '')) LIKE $${params.length}
          OR LOWER(COALESCE(ra.activity_details->>'title', '')) LIKE $${params.length}
          OR LOWER(COALESCE(ra.activity_details->>'levelDuration', '')) LIKE $${params.length})`,
      );
    }

    const activities = await db.unsafe(
      `${baseActivitySelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY ra.approved_at DESC NULLS LAST, ra.created_at DESC`,
      params,
    );

    response.status(200).json({
      message: "Approved R&D Cell activities fetched successfully.",
      data: activities.map(normalizeActivityRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdCellActivityFilterOptionsForAdmin(
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
        FROM rd_cell_activities ra
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN ra.user_id ~ '^[0-9]+$' THEN ra.user_id::bigint
            ELSE NULL
          END
        CROSS JOIN LATERAL UNNEST(
          ARRAY[
            COALESCE(owner.name, ''),
            COALESCE(ra.activity_details->>'subTheme', ''),
            COALESCE(ra.activity_details->>'title', ''),
            COALESCE(ra.activity_details->>'levelDuration', '')
          ]
        ) AS value
        WHERE ra.status ${statusFilter}
      ) names
      WHERE name <> ''
      ORDER BY name
      `,
    );

    response.status(200).json({
      message: "R&D Cell activity filter options fetched successfully.",
      data: {
        faculties: facultyRows.map((row) => row.name),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyRdCellActivitiesForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const activities = await db.unsafe(
      `${baseActivitySelect}
       WHERE ra.user_id = $1
       ORDER BY ra.created_at DESC`,
      [userId],
    );

    response.status(200).json({
      message: "Faculty R&D Cell activities fetched successfully.",
      data: activities.map(normalizeActivityRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdCellActivityReviewQueueForAdmin(_request, response, next) {
  try {
    const activities = await db.unsafe(
      `${baseActivitySelect}
       WHERE ra.status IN ('pending', 'rejected')
       ORDER BY CASE ra.status WHEN 'pending' THEN 0 ELSE 1 END, ra.created_at DESC`,
    );

    response.status(200).json({
      message: "R&D Cell activity review queue fetched successfully.",
      data: activities.map(normalizeActivityRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdCellActivityById(request, response, next) {
  try {
    const activityId = Number(request.params?.activityId);

    if (!Number.isFinite(activityId) || activityId <= 0) {
      response.status(400).json({ message: "Invalid activity id." });
      return;
    }

    const activityRows = await db.unsafe(
      `
      SELECT
        ra.id,
        ra.user_id,
        ra.status,
        ra.rejection_message,
        ra.reviewed_at,
        ra.approved_at,
        ra.rejected_at,
        ra.created_at,
        ra.activity_details,
        ra.overview,
        ra.attachments,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM rd_cell_activities ra
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN ra.user_id ~ '^[0-9]+$' THEN ra.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = ra.reviewed_by
      WHERE ra.id = $1
      LIMIT 1
      `,
      [activityId],
    );

    const activityRow = activityRows[0];
    if (!activityRow) {
      response.status(404).json({ message: "R&D Cell activity not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(activityRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "R&D Cell activity details fetched successfully.",
      data: {
        id: activityRow.id,
        userId: activityRow.user_id,
        status: activityRow.status,
        rejectionMessage: activityRow.rejection_message,
        reviewedAt: activityRow.reviewed_at,
        approvedAt: activityRow.approved_at,
        rejectedAt: activityRow.rejected_at,
        createdAt: activityRow.created_at,
        eventName: activityRow.activity_details?.subTheme || "",
        majorReason: "",
        quarter: "",
        ownerName: activityRow.owner_name,
        ownerEmail: activityRow.owner_email,
        reviewerName: activityRow.reviewer_name,
        activityDetails: activityRow.activity_details,
        overview: {},
        attachments: {},
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewRdCellActivityByAdmin(request, response, next) {
  try {
    const activityId = Number(request.params?.activityId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(activityId) || activityId <= 0) {
      response.status(400).json({ message: "Invalid activity id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const activityRows = await db.unsafe(
      `
      SELECT
        ra.id,
        COALESCE(ra.activity_details->>'subTheme', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM rd_cell_activities ra
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN ra.user_id ~ '^[0-9]+$' THEN ra.user_id::bigint
          ELSE NULL
        END
      WHERE ra.id = $1
      LIMIT 1
      `,
      [activityId],
    );

    const activityRow = activityRows[0];
    if (!activityRow) {
      response.status(404).json({ message: "R&D Cell activity not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE rd_cell_activities
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
      [nextStatus, rejectionMessage || null, adminUserId, activityId],
    );

    const updatedActivity = updatedRows[0];
    const emailQueued = triggerReviewNotification({
      activityRow,
      nextStatus,
      rejectionMessage,
    });

    response.status(200).json({
      message: `R&D Cell activity ${nextStatus} successfully.`,
      data: {
        ...updatedActivity,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}
