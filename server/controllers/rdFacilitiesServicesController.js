import db from "../config/db.js";
import { randomUUID } from "crypto";
import { sendEmail } from "../utils/mail.js";

const getBodyValue = (body, key) => String(body?.[key] ?? "").trim();

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerReviewNotification = ({ facilityRow, nextStatus, rejectionMessage }) => {
  if (!facilityRow?.owner_email) {
    return false;
  }

  const facilityName = facilityRow.event_name || `R&D Facility #${facilityRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your R&D facility/service "${facilityName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${facilityRow.owner_name || "Faculty"},`,
    "",
    `Your R&D Facilities and Services entry "${facilityName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: facilityRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeFacilityRow = (row) => ({
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
  serviceRole: row.service_role,
  serviceFocusArea: row.service_focus_area,
  equipments: row.equipments,
  contactName: row.contact_name,
  contactEmail: row.contact_email,
  phoneNumber: row.phone_number,
});

const baseFacilitySelect = `
  SELECT
    rf.id,
    rf.user_id,
    rf.status,
    rf.rejection_message,
    rf.created_at,
    rf.reviewed_at,
    rf.approved_at,
    rf.rejected_at,
    COALESCE(rf.facility_details->>'serviceName', '') AS event_name,
    '' AS major_reason,
    '' AS quarter,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name,
    COALESCE(rf.facility_details->>'serviceRole', '') AS service_role,
    COALESCE(rf.facility_details->>'serviceFocusArea', '') AS service_focus_area,
    COALESCE(rf.facility_details->>'equipments', '') AS equipments,
    COALESCE(rf.facility_details->>'contactName', '') AS contact_name,
    COALESCE(rf.facility_details->>'contactEmail', '') AS contact_email,
    COALESCE(rf.facility_details->>'phoneNumber', '') AS phone_number
  FROM rd_facilities_services rf
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN rf.user_id ~ '^[0-9]+$' THEN rf.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = rf.reviewed_by
`;

export async function createRdFacilitiesService(request, response, next) {
  try {
    const { body } = request;
    const bodyUserId = getBodyValue(body, "userId");
    const userId = String(request.user?.id ?? (bodyUserId || randomUUID()));

    const facilityDetails = {
      serviceName: getBodyValue(body, "serviceName"),
      serviceRole: getBodyValue(body, "serviceRole"),
      serviceFocusArea: getBodyValue(body, "serviceFocusArea"),
      equipments: getBodyValue(body, "equipments"),
      contactName: getBodyValue(body, "contactName"),
      contactEmail: getBodyValue(body, "contactEmail"),
      phoneNumber: getBodyValue(body, "phoneNumber"),
    };

    const insertedRows = await db`
      INSERT INTO rd_facilities_services (
        user_id,
        facility_details,
        overview,
        attachments
      )
      VALUES (
        ${userId},
        ${db.json(facilityDetails)},
        ${db.json({})},
        ${db.json({})}
      )
      RETURNING id, user_id, created_at
    `;

    response.status(201).json({
      message: "R&D Facilities and Services entry submitted successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdFacilitiesServicesForAdmin(request, response, next) {
  try {
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";

    const conditions = [
      includeRejected ? "rf.status IN ('approved', 'rejected')" : "rf.status = 'approved'",
    ];
    const params = [];

    if (facultyName) {
      params.push(`%${facultyName}%`);
      conditions.push(
        `(LOWER(COALESCE(owner.name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(owner.email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(rf.facility_details->>'serviceName', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rf.facility_details->>'serviceRole', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rf.facility_details->>'serviceFocusArea', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rf.facility_details->>'equipments', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rf.facility_details->>'contactName', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rf.facility_details->>'contactEmail', '')) LIKE $${params.length})`,
      );
    }

    const facilities = await db.unsafe(
      `${baseFacilitySelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY rf.approved_at DESC NULLS LAST, rf.created_at DESC`,
      params,
    );

    response.status(200).json({
      message: "Approved R&D Facilities and Services fetched successfully.",
      data: facilities.map(normalizeFacilityRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdFacilitiesServicesFilterOptionsForAdmin(
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
        FROM rd_facilities_services rf
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN rf.user_id ~ '^[0-9]+$' THEN rf.user_id::bigint
            ELSE NULL
          END
        CROSS JOIN LATERAL UNNEST(
          ARRAY[
            COALESCE(owner.name, ''),
            COALESCE(rf.facility_details->>'serviceName', ''),
            COALESCE(rf.facility_details->>'serviceRole', ''),
            COALESCE(rf.facility_details->>'serviceFocusArea', ''),
            COALESCE(rf.facility_details->>'equipments', ''),
            COALESCE(rf.facility_details->>'contactName', ''),
            COALESCE(rf.facility_details->>'contactEmail', '')
          ]
        ) AS value
        WHERE rf.status ${statusFilter}
      ) names
      WHERE name <> ''
      ORDER BY name
      `,
    );

    response.status(200).json({
      message: "R&D Facilities and Services filter options fetched successfully.",
      data: {
        faculties: facultyRows.map((row) => row.name),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyRdFacilitiesServicesForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const facilities = await db.unsafe(
      `${baseFacilitySelect}
       WHERE rf.user_id = $1
       ORDER BY rf.created_at DESC`,
      [userId],
    );

    response.status(200).json({
      message: "Faculty R&D Facilities and Services fetched successfully.",
      data: facilities.map(normalizeFacilityRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdFacilitiesServicesReviewQueueForAdmin(_request, response, next) {
  try {
    const facilities = await db.unsafe(
      `${baseFacilitySelect}
       WHERE rf.status IN ('pending', 'rejected')
       ORDER BY CASE rf.status WHEN 'pending' THEN 0 ELSE 1 END, rf.created_at DESC`,
    );

    response.status(200).json({
      message: "R&D Facilities and Services review queue fetched successfully.",
      data: facilities.map(normalizeFacilityRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdFacilitiesServiceById(request, response, next) {
  try {
    const facilityId = Number(request.params?.facilityId);

    if (!Number.isFinite(facilityId) || facilityId <= 0) {
      response.status(400).json({ message: "Invalid facility id." });
      return;
    }

    const facilityRows = await db.unsafe(
      `
      SELECT
        rf.id,
        rf.user_id,
        rf.status,
        rf.rejection_message,
        rf.reviewed_at,
        rf.approved_at,
        rf.rejected_at,
        rf.created_at,
        rf.facility_details,
        rf.overview,
        rf.attachments,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM rd_facilities_services rf
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN rf.user_id ~ '^[0-9]+$' THEN rf.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = rf.reviewed_by
      WHERE rf.id = $1
      LIMIT 1
      `,
      [facilityId],
    );

    const facilityRow = facilityRows[0];
    if (!facilityRow) {
      response.status(404).json({ message: "R&D Facilities and Services entry not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(facilityRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "R&D Facilities and Services details fetched successfully.",
      data: {
        id: facilityRow.id,
        userId: facilityRow.user_id,
        status: facilityRow.status,
        rejectionMessage: facilityRow.rejection_message,
        reviewedAt: facilityRow.reviewed_at,
        approvedAt: facilityRow.approved_at,
        rejectedAt: facilityRow.rejected_at,
        createdAt: facilityRow.created_at,
        eventName: facilityRow.facility_details?.serviceName || "",
        majorReason: "",
        quarter: "",
        ownerName: facilityRow.owner_name,
        ownerEmail: facilityRow.owner_email,
        reviewerName: facilityRow.reviewer_name,
        facilityDetails: facilityRow.facility_details,
        overview: {},
        attachments: {},
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewRdFacilitiesServiceByAdmin(request, response, next) {
  try {
    const facilityId = Number(request.params?.facilityId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(facilityId) || facilityId <= 0) {
      response.status(400).json({ message: "Invalid facility id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const facilityRows = await db.unsafe(
      `
      SELECT
        rf.id,
        COALESCE(rf.facility_details->>'serviceName', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM rd_facilities_services rf
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN rf.user_id ~ '^[0-9]+$' THEN rf.user_id::bigint
          ELSE NULL
        END
      WHERE rf.id = $1
      LIMIT 1
      `,
      [facilityId],
    );

    const facilityRow = facilityRows[0];
    if (!facilityRow) {
      response.status(404).json({ message: "R&D Facilities and Services entry not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE rd_facilities_services
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
      [nextStatus, rejectionMessage || null, adminUserId, facilityId],
    );

    const updatedFacility = updatedRows[0];
    const emailQueued = triggerReviewNotification({
      facilityRow,
      nextStatus,
      rejectionMessage,
    });

    response.status(200).json({
      message: `R&D Facilities and Services ${nextStatus} successfully.`,
      data: {
        ...updatedFacility,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}
