import db from "../config/db.js";
import { randomUUID } from "crypto";
import { sendEmail } from "../utils/mail.js";

const getBodyValue = (body, key) => String(body?.[key] ?? "").trim();

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerReviewNotification = ({ equipmentRow, nextStatus, rejectionMessage }) => {
  if (!equipmentRow?.owner_email) {
    return false;
  }

  const equipmentName = equipmentRow.event_name || `R&D Equipment Service #${equipmentRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your R&D equipment service "${equipmentName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${equipmentRow.owner_name || "Faculty"},`,
    "",
    `Your R&D Equipments Services entry "${equipmentName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: equipmentRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeEquipmentRow = (row) => ({
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
  department: row.department,
  utilizationRate: row.utilization_rate,
  suitableDays: row.suitable_days,
});

const baseEquipmentSelect = `
  SELECT
    re.id,
    re.user_id,
    re.status,
    re.rejection_message,
    re.created_at,
    re.reviewed_at,
    re.approved_at,
    re.rejected_at,
    COALESCE(re.equipment_details->>'equipmentName', '') AS event_name,
    '' AS major_reason,
    '' AS quarter,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name,
    COALESCE(re.equipment_details->>'department', '') AS department,
    COALESCE(re.equipment_details->>'utilizationRate', '') AS utilization_rate,
    COALESCE(re.equipment_details->>'suitableDays', '') AS suitable_days
  FROM rd_equipments_services re
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN re.user_id ~ '^[0-9]+$' THEN re.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = re.reviewed_by
`;

export async function createRdEquipmentsService(request, response, next) {
  try {
    const { body } = request;
    const bodyUserId = getBodyValue(body, "userId");
    const userId = String(request.user?.id ?? (bodyUserId || randomUUID()));

    const equipmentDetails = {
      equipmentName: getBodyValue(body, "equipmentName"),
      department: getBodyValue(body, "department"),
      utilizationRate: getBodyValue(body, "utilizationRate"),
      suitableDays: getBodyValue(body, "suitableDays"),
    };

    const insertedRows = await db`
      INSERT INTO rd_equipments_services (
        user_id,
        equipment_details,
        overview,
        attachments
      )
      VALUES (
        ${userId},
        ${db.json(equipmentDetails)},
        ${db.json({})},
        ${db.json({})}
      )
      RETURNING id, user_id, created_at
    `;

    response.status(201).json({
      message: "R&D Equipments Services entry submitted successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdEquipmentsServicesForAdmin(request, response, next) {
  try {
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";

    const conditions = [
      includeRejected ? "re.status IN ('approved', 'rejected')" : "re.status = 'approved'",
    ];
    const params = [];

    if (facultyName) {
      params.push(`%${facultyName}%`);
      conditions.push(
        `(LOWER(COALESCE(owner.name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(owner.email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(re.equipment_details->>'equipmentName', '')) LIKE $${params.length}
          OR LOWER(COALESCE(re.equipment_details->>'department', '')) LIKE $${params.length}
          OR LOWER(COALESCE(re.equipment_details->>'utilizationRate', '')) LIKE $${params.length}
          OR LOWER(COALESCE(re.equipment_details->>'suitableDays', '')) LIKE $${params.length})`,
      );
    }

    const equipments = await db.unsafe(
      `${baseEquipmentSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY re.approved_at DESC NULLS LAST, re.created_at DESC`,
      params,
    );

    response.status(200).json({
      message: "Approved R&D Equipments Services fetched successfully.",
      data: equipments.map(normalizeEquipmentRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdEquipmentsServicesFilterOptionsForAdmin(
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
        FROM rd_equipments_services re
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN re.user_id ~ '^[0-9]+$' THEN re.user_id::bigint
            ELSE NULL
          END
        CROSS JOIN LATERAL UNNEST(
          ARRAY[
            COALESCE(owner.name, ''),
            COALESCE(re.equipment_details->>'equipmentName', ''),
            COALESCE(re.equipment_details->>'department', ''),
            COALESCE(re.equipment_details->>'utilizationRate', ''),
            COALESCE(re.equipment_details->>'suitableDays', '')
          ]
        ) AS value
        WHERE re.status ${statusFilter}
      ) names
      WHERE name <> ''
      ORDER BY name
      `,
    );

    response.status(200).json({
      message: "R&D Equipments Services filter options fetched successfully.",
      data: {
        faculties: facultyRows.map((row) => row.name),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyRdEquipmentsServicesForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const equipments = await db.unsafe(
      `${baseEquipmentSelect}
       WHERE re.user_id = $1
       ORDER BY re.created_at DESC`,
      [userId],
    );

    response.status(200).json({
      message: "Faculty R&D Equipments Services fetched successfully.",
      data: equipments.map(normalizeEquipmentRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdEquipmentsServicesReviewQueueForAdmin(_request, response, next) {
  try {
    const equipments = await db.unsafe(
      `${baseEquipmentSelect}
       WHERE re.status IN ('pending', 'rejected')
       ORDER BY CASE re.status WHEN 'pending' THEN 0 ELSE 1 END, re.created_at DESC`,
    );

    response.status(200).json({
      message: "R&D Equipments Services review queue fetched successfully.",
      data: equipments.map(normalizeEquipmentRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdEquipmentsServiceById(request, response, next) {
  try {
    const equipmentId = Number(request.params?.equipmentId);

    if (!Number.isFinite(equipmentId) || equipmentId <= 0) {
      response.status(400).json({ message: "Invalid equipment service id." });
      return;
    }

    const equipmentRows = await db.unsafe(
      `
      SELECT
        re.id,
        re.user_id,
        re.status,
        re.rejection_message,
        re.reviewed_at,
        re.approved_at,
        re.rejected_at,
        re.created_at,
        re.equipment_details,
        re.overview,
        re.attachments,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM rd_equipments_services re
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN re.user_id ~ '^[0-9]+$' THEN re.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = re.reviewed_by
      WHERE re.id = $1
      LIMIT 1
      `,
      [equipmentId],
    );

    const equipmentRow = equipmentRows[0];
    if (!equipmentRow) {
      response.status(404).json({ message: "R&D Equipments Services entry not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(equipmentRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "R&D Equipments Services details fetched successfully.",
      data: {
        id: equipmentRow.id,
        userId: equipmentRow.user_id,
        status: equipmentRow.status,
        rejectionMessage: equipmentRow.rejection_message,
        reviewedAt: equipmentRow.reviewed_at,
        approvedAt: equipmentRow.approved_at,
        rejectedAt: equipmentRow.rejected_at,
        createdAt: equipmentRow.created_at,
        eventName: equipmentRow.equipment_details?.equipmentName || "",
        majorReason: "",
        quarter: "",
        ownerName: equipmentRow.owner_name,
        ownerEmail: equipmentRow.owner_email,
        reviewerName: equipmentRow.reviewer_name,
        equipmentDetails: equipmentRow.equipment_details,
        overview: {},
        attachments: {},
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewRdEquipmentsServiceByAdmin(request, response, next) {
  try {
    const equipmentId = Number(request.params?.equipmentId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(equipmentId) || equipmentId <= 0) {
      response.status(400).json({ message: "Invalid equipment service id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const equipmentRows = await db.unsafe(
      `
      SELECT
        re.id,
        COALESCE(re.equipment_details->>'equipmentName', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM rd_equipments_services re
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN re.user_id ~ '^[0-9]+$' THEN re.user_id::bigint
          ELSE NULL
        END
      WHERE re.id = $1
      LIMIT 1
      `,
      [equipmentId],
    );

    const equipmentRow = equipmentRows[0];
    if (!equipmentRow) {
      response.status(404).json({ message: "R&D Equipments Services entry not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE rd_equipments_services
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
      [nextStatus, rejectionMessage || null, adminUserId, equipmentId],
    );

    const updatedEquipment = updatedRows[0];
    const emailQueued = triggerReviewNotification({
      equipmentRow,
      nextStatus,
      rejectionMessage,
    });

    response.status(200).json({
      message: `R&D Equipments Services ${nextStatus} successfully.`,
      data: {
        ...updatedEquipment,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}
