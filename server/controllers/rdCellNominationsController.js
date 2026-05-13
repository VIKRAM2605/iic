import db from "../config/db.js";
import { randomUUID } from "crypto";
import { sendEmail } from "../utils/mail.js";

const getBodyValue = (body, key) => String(body?.[key] ?? "").trim();

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerReviewNotification = ({ nominationRow, nextStatus, rejectionMessage }) => {
  if (!nominationRow?.owner_email) {
    return false;
  }

  const nominationName = nominationRow.event_name || `R&D Nomination #${nominationRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your R&D nomination "${nominationName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${nominationRow.owner_name || "Faculty"},`,
    "",
    `Your R&D Cell nomination "${nominationName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: nominationRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeNominationRow = (row) => ({
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
  ownerName: row.owner_name,
  ownerEmail: row.owner_email,
  reviewerName: row.reviewer_name,
  nomineeName: row.nominee_name,
  nomineeEmail: row.nominee_email,
  phoneNumber: row.phone_number,
});

const baseNominationSelect = `
  SELECT
    rn.id,
    rn.user_id,
    rn.status,
    rn.rejection_message,
    rn.created_at,
    rn.reviewed_at,
    rn.approved_at,
    rn.rejected_at,
    COALESCE(rn.nomination_details->>'nominationTitle', '') AS event_name,
    '' AS major_reason,
    '' AS quarter,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name,
    COALESCE(rn.nomination_details->>'nomineeName', '') AS nominee_name,
    COALESCE(rn.nomination_details->>'nomineeEmail', '') AS nominee_email,
    COALESCE(rn.nomination_details->>'phoneNumber', '') AS phone_number
  FROM rd_cell_nominations rn
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN rn.user_id ~ '^[0-9]+$' THEN rn.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = rn.reviewed_by
`;

export async function createRdCellNomination(request, response, next) {
  try {
    const { body } = request;
    const bodyUserId = getBodyValue(body, "userId");
    const userId = String(request.user?.id ?? (bodyUserId || randomUUID()));

    const nominationDetails = {
      nominationTitle: getBodyValue(body, "nominationTitle"),
      nomineeName: getBodyValue(body, "nomineeName"),
      nomineeEmail: getBodyValue(body, "nomineeEmail"),
      phoneNumber: getBodyValue(body, "phoneNumber"),
    };

    const overview = {};
    const attachments = {};

    const insertedRows = await db`
      INSERT INTO rd_cell_nominations (
        user_id,
        nomination_details,
        overview,
        attachments
      )
      VALUES (
        ${userId},
        ${db.json(nominationDetails)},
        ${db.json(overview)},
        ${db.json(attachments)}
      )
      RETURNING id, user_id, created_at
    `;

    response.status(201).json({
      message: "R&D Cell nomination submitted successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdCellNominationsForAdmin(request, response, next) {
  try {
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";

    const conditions = [
      includeRejected ? "rn.status IN ('approved', 'rejected')" : "rn.status = 'approved'",
    ];
    const params = [];

    if (facultyName) {
      params.push(`%${facultyName}%`);
      conditions.push(
        `(LOWER(COALESCE(owner.name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(owner.email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(rn.nomination_details->>'nominationTitle', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rn.nomination_details->>'nomineeName', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rn.nomination_details->>'nomineeEmail', '')) LIKE $${params.length})`,
      );
    }

    const nominations = await db.unsafe(
      `${baseNominationSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY rn.approved_at DESC NULLS LAST, rn.created_at DESC`,
      params,
    );

    response.status(200).json({
      message: "Approved R&D Cell nominations fetched successfully.",
      data: nominations.map(normalizeNominationRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdCellNominationFilterOptionsForAdmin(
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
        FROM rd_cell_nominations rn
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN rn.user_id ~ '^[0-9]+$' THEN rn.user_id::bigint
            ELSE NULL
          END
        CROSS JOIN LATERAL UNNEST(
          ARRAY[
            COALESCE(owner.name, ''),
            COALESCE(rn.nomination_details->>'nominationTitle', ''),
            COALESCE(rn.nomination_details->>'nomineeName', ''),
            COALESCE(rn.nomination_details->>'nomineeEmail', '')
          ]
        ) AS value
        WHERE rn.status ${statusFilter}
      ) names
      WHERE name <> ''
      ORDER BY name
      `,
    );

    response.status(200).json({
      message: "R&D Cell nomination filter options fetched successfully.",
      data: {
        faculties: facultyRows.map((row) => row.name),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyRdCellNominationsForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const nominations = await db.unsafe(
      `${baseNominationSelect}
       WHERE rn.user_id = $1
       ORDER BY rn.created_at DESC`,
      [userId],
    );

    response.status(200).json({
      message: "Faculty R&D Cell nominations fetched successfully.",
      data: nominations.map(normalizeNominationRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdCellNominationReviewQueueForAdmin(_request, response, next) {
  try {
    const nominations = await db.unsafe(
      `${baseNominationSelect}
       WHERE rn.status IN ('pending', 'rejected')
       ORDER BY CASE rn.status WHEN 'pending' THEN 0 ELSE 1 END, rn.created_at DESC`,
    );

    response.status(200).json({
      message: "R&D Cell nomination review queue fetched successfully.",
      data: nominations.map(normalizeNominationRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdCellNominationById(request, response, next) {
  try {
    const nominationId = Number(request.params?.nominationId);

    if (!Number.isFinite(nominationId) || nominationId <= 0) {
      response.status(400).json({ message: "Invalid nomination id." });
      return;
    }

    const nominationRows = await db.unsafe(
      `
      SELECT
        rn.id,
        rn.user_id,
        rn.status,
        rn.rejection_message,
        rn.reviewed_at,
        rn.approved_at,
        rn.rejected_at,
        rn.created_at,
        rn.nomination_details,
        rn.overview,
        rn.attachments,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM rd_cell_nominations rn
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN rn.user_id ~ '^[0-9]+$' THEN rn.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = rn.reviewed_by
      WHERE rn.id = $1
      LIMIT 1
      `,
      [nominationId],
    );

    const nominationRow = nominationRows[0];
    if (!nominationRow) {
      response.status(404).json({ message: "R&D Cell nomination not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(nominationRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "R&D Cell nomination details fetched successfully.",
      data: {
        id: nominationRow.id,
        userId: nominationRow.user_id,
        status: nominationRow.status,
        rejectionMessage: nominationRow.rejection_message,
        reviewedAt: nominationRow.reviewed_at,
        approvedAt: nominationRow.approved_at,
        rejectedAt: nominationRow.rejected_at,
        createdAt: nominationRow.created_at,
        eventName: nominationRow.nomination_details?.nominationTitle || "",
        majorReason: "",
        quarter: "",
        ownerName: nominationRow.owner_name,
        ownerEmail: nominationRow.owner_email,
        reviewerName: nominationRow.reviewer_name,
        nominationDetails: nominationRow.nomination_details,
        overview: {},
        attachments: {},
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewRdCellNominationByAdmin(request, response, next) {
  try {
    const nominationId = Number(request.params?.nominationId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(nominationId) || nominationId <= 0) {
      response.status(400).json({ message: "Invalid nomination id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const nominationRows = await db.unsafe(
      `
      SELECT
        rn.id,
        COALESCE(rn.nomination_details->>'nominationTitle', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM rd_cell_nominations rn
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN rn.user_id ~ '^[0-9]+$' THEN rn.user_id::bigint
          ELSE NULL
        END
      WHERE rn.id = $1
      LIMIT 1
      `,
      [nominationId],
    );

    const nominationRow = nominationRows[0];
    if (!nominationRow) {
      response.status(404).json({ message: "R&D Cell nomination not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE rd_cell_nominations
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
      [nextStatus, rejectionMessage || null, adminUserId, nominationId],
    );

    const updatedNomination = updatedRows[0];
    const emailQueued = triggerReviewNotification({
      nominationRow,
      nextStatus,
      rejectionMessage,
    });

    response.status(200).json({
      message: `R&D Cell nomination ${nextStatus} successfully.`,
      data: {
        ...updatedNomination,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}
