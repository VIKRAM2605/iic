import db from "../config/db.js";
import { randomUUID } from "crypto";
import { sendEmail } from "../utils/mail.js";

const getBodyValue = (body, key) => String(body?.[key] ?? "").trim();

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerReviewNotification = ({ projectRow, nextStatus, rejectionMessage }) => {
  if (!projectRow?.owner_email) {
    return false;
  }

  const projectName = projectRow.event_name || `R&D Project Output #${projectRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your R&D project/output "${projectName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${projectRow.owner_name || "Faculty"},`,
    "",
    `Your R&D Projects & Outputs entry "${projectName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: projectRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeProjectRow = (row) => ({
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
  principalInvestigation: row.principal_investigation,
  department: row.department,
  trlLevel: row.trl_level,
  ipStatus: row.ip_status,
  projectStatus: row.project_status,
});

const baseProjectSelect = `
  SELECT
    rp.id,
    rp.user_id,
    rp.status,
    rp.rejection_message,
    rp.created_at,
    rp.reviewed_at,
    rp.approved_at,
    rp.rejected_at,
    COALESCE(rp.project_details->>'projectName', '') AS event_name,
    '' AS major_reason,
    '' AS quarter,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name,
    COALESCE(rp.project_details->>'principalInvestigation', '') AS principal_investigation,
    COALESCE(rp.project_details->>'department', '') AS department,
    COALESCE(rp.project_details->>'trlLevel', '') AS trl_level,
    COALESCE(rp.project_details->>'ipStatus', '') AS ip_status,
    COALESCE(rp.project_details->>'projectStatus', '') AS project_status
  FROM rd_projects_outputs rp
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN rp.user_id ~ '^[0-9]+$' THEN rp.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = rp.reviewed_by
`;

export async function createRdProjectsOutput(request, response, next) {
  try {
    const { body } = request;
    const bodyUserId = getBodyValue(body, "userId");
    const userId = String(request.user?.id ?? (bodyUserId || randomUUID()));

    const projectDetails = {
      projectName: getBodyValue(body, "projectName"),
      principalInvestigation: getBodyValue(body, "principalInvestigation"),
      department: getBodyValue(body, "department"),
      trlLevel: getBodyValue(body, "trlLevel"),
      ipStatus: getBodyValue(body, "ipStatus"),
      projectStatus: getBodyValue(body, "projectStatus"),
    };

    const insertedRows = await db`
      INSERT INTO rd_projects_outputs (
        user_id,
        project_details,
        overview,
        attachments
      )
      VALUES (
        ${userId},
        ${db.json(projectDetails)},
        ${db.json({})},
        ${db.json({})}
      )
      RETURNING id, user_id, created_at
    `;

    response.status(201).json({
      message: "R&D Projects & Outputs entry submitted successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdProjectsOutputsForAdmin(request, response, next) {
  try {
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";

    const conditions = [
      includeRejected ? "rp.status IN ('approved', 'rejected')" : "rp.status = 'approved'",
    ];
    const params = [];

    if (facultyName) {
      params.push(`%${facultyName}%`);
      conditions.push(
        `(LOWER(COALESCE(owner.name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(owner.email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(rp.project_details->>'projectName', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rp.project_details->>'principalInvestigation', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rp.project_details->>'department', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rp.project_details->>'trlLevel', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rp.project_details->>'ipStatus', '')) LIKE $${params.length}
          OR LOWER(COALESCE(rp.project_details->>'projectStatus', '')) LIKE $${params.length})`,
      );
    }

    const projects = await db.unsafe(
      `${baseProjectSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY rp.approved_at DESC NULLS LAST, rp.created_at DESC`,
      params,
    );

    response.status(200).json({
      message: "Approved R&D Projects & Outputs fetched successfully.",
      data: projects.map(normalizeProjectRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedRdProjectsOutputsFilterOptionsForAdmin(
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
        FROM rd_projects_outputs rp
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN rp.user_id ~ '^[0-9]+$' THEN rp.user_id::bigint
            ELSE NULL
          END
        CROSS JOIN LATERAL UNNEST(
          ARRAY[
            COALESCE(owner.name, ''),
            COALESCE(rp.project_details->>'projectName', ''),
            COALESCE(rp.project_details->>'principalInvestigation', ''),
            COALESCE(rp.project_details->>'department', ''),
            COALESCE(rp.project_details->>'trlLevel', ''),
            COALESCE(rp.project_details->>'ipStatus', ''),
            COALESCE(rp.project_details->>'projectStatus', '')
          ]
        ) AS value
        WHERE rp.status ${statusFilter}
      ) names
      WHERE name <> ''
      ORDER BY name
      `,
    );

    response.status(200).json({
      message: "R&D Projects & Outputs filter options fetched successfully.",
      data: {
        faculties: facultyRows.map((row) => row.name),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyRdProjectsOutputsForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const projects = await db.unsafe(
      `${baseProjectSelect}
       WHERE rp.user_id = $1
       ORDER BY rp.created_at DESC`,
      [userId],
    );

    response.status(200).json({
      message: "Faculty R&D Projects & Outputs fetched successfully.",
      data: projects.map(normalizeProjectRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdProjectsOutputsReviewQueueForAdmin(_request, response, next) {
  try {
    const projects = await db.unsafe(
      `${baseProjectSelect}
       WHERE rp.status IN ('pending', 'rejected')
       ORDER BY CASE rp.status WHEN 'pending' THEN 0 ELSE 1 END, rp.created_at DESC`,
    );

    response.status(200).json({
      message: "R&D Projects & Outputs review queue fetched successfully.",
      data: projects.map(normalizeProjectRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getRdProjectsOutputById(request, response, next) {
  try {
    const projectId = Number(request.params?.projectId);

    if (!Number.isFinite(projectId) || projectId <= 0) {
      response.status(400).json({ message: "Invalid project output id." });
      return;
    }

    const projectRows = await db.unsafe(
      `
      SELECT
        rp.id,
        rp.user_id,
        rp.status,
        rp.rejection_message,
        rp.reviewed_at,
        rp.approved_at,
        rp.rejected_at,
        rp.created_at,
        rp.project_details,
        rp.overview,
        rp.attachments,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM rd_projects_outputs rp
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN rp.user_id ~ '^[0-9]+$' THEN rp.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = rp.reviewed_by
      WHERE rp.id = $1
      LIMIT 1
      `,
      [projectId],
    );

    const projectRow = projectRows[0];
    if (!projectRow) {
      response.status(404).json({ message: "R&D Projects & Outputs entry not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(projectRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "R&D Projects & Outputs details fetched successfully.",
      data: {
        id: projectRow.id,
        userId: projectRow.user_id,
        status: projectRow.status,
        rejectionMessage: projectRow.rejection_message,
        reviewedAt: projectRow.reviewed_at,
        approvedAt: projectRow.approved_at,
        rejectedAt: projectRow.rejected_at,
        createdAt: projectRow.created_at,
        eventName: projectRow.project_details?.projectName || "",
        majorReason: "",
        quarter: "",
        ownerName: projectRow.owner_name,
        ownerEmail: projectRow.owner_email,
        reviewerName: projectRow.reviewer_name,
        projectDetails: projectRow.project_details,
        overview: {},
        attachments: {},
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewRdProjectsOutputByAdmin(request, response, next) {
  try {
    const projectId = Number(request.params?.projectId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(projectId) || projectId <= 0) {
      response.status(400).json({ message: "Invalid project output id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const projectRows = await db.unsafe(
      `
      SELECT
        rp.id,
        COALESCE(rp.project_details->>'projectName', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM rd_projects_outputs rp
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN rp.user_id ~ '^[0-9]+$' THEN rp.user_id::bigint
          ELSE NULL
        END
      WHERE rp.id = $1
      LIMIT 1
      `,
      [projectId],
    );

    const projectRow = projectRows[0];
    if (!projectRow) {
      response.status(404).json({ message: "R&D Projects & Outputs entry not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE rd_projects_outputs
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
      [nextStatus, rejectionMessage || null, adminUserId, projectId],
    );

    const updatedProject = updatedRows[0];
    const emailQueued = triggerReviewNotification({
      projectRow,
      nextStatus,
      rejectionMessage,
    });

    response.status(200).json({
      message: `R&D Projects & Outputs ${nextStatus} successfully.`,
      data: {
        ...updatedProject,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}
