import db from "../config/db.js";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { sendEmail } from "../utils/mail.js";

const getBodyValue = (body, key) => String(body?.[key] ?? "").trim();

const getUploadedFilePath = (files, fieldName) => {
  const uploadedFile = files?.[fieldName]?.[0];
  if (!uploadedFile) {
    return null;
  }

  return `/uploads/business-details/${uploadedFile.filename}`;
};

const getQueryValue = (query, key) => String(query?.[key] ?? "").trim();

const getNumericUserId = (requestUserId) => {
  const parsed = Number(requestUserId);
  return Number.isFinite(parsed) ? parsed : null;
};

const businessUploadDirectory = path.join(process.cwd(), "uploads", "business-details");

const getBusinessAttachmentPaths = (attachments) => {
  const attachmentValues = [
    attachments?.ipPatentDocument,
    attachments?.innovationGrantDocument,
    attachments?.innovationPhotograph,
  ];

  return attachmentValues.filter(
    (value) =>
      typeof value === "string" && value.startsWith("/uploads/business-details/"),
  );
};

const deleteBusinessAttachmentFiles = async (attachmentPaths = []) => {
  await Promise.all(
    attachmentPaths.map(async (attachmentPath) => {
      const fileName = path.basename(attachmentPath);
      const resolvedPath = path.resolve(businessUploadDirectory, fileName);

      if (!resolvedPath.startsWith(businessUploadDirectory)) {
        return;
      }

      try {
        await fs.unlink(resolvedPath);
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    }),
  );
};

const triggerReviewNotification = ({ businessRow, nextStatus, rejectionMessage }) => {
  if (!businessRow?.owner_email) {
    return false;
  }

  const businessName = businessRow.event_name || `Business #${businessRow.id}`;
  const decisionLabel = nextStatus === "approved" ? "approved" : "rejected";

  const subject = `Your business "${businessName}" was ${decisionLabel}`;
  const textParts = [
    `Hello ${businessRow.owner_name || "Faculty"},`,
    "",
    `Your business "${businessName}" has been ${decisionLabel} by admin.`,
  ];

  if (nextStatus === "rejected" && rejectionMessage) {
    textParts.push("", `Rejection message: ${rejectionMessage}`);
  }

  textParts.push("", "Regards,", "BIT IIC Admin");

  void sendEmail({
    to: businessRow.owner_email,
    subject,
    text: textParts.join("\n"),
  }).catch((error) => {
    console.error("Failed to send review notification email:", error?.message || error);
  });

  return true;
};

const normalizeBusinessRow = (row) => ({
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
});

const baseBusinessSelect = `
  SELECT
    bd.id,
    bd.user_id,
    bd.status,
    bd.rejection_message,
    bd.created_at,
    bd.reviewed_at,
    bd.approved_at,
    bd.rejected_at,
    COALESCE(bd.business_details->>'innovationTitle', '') AS event_name,
    COALESCE(bd.overview->>'problemRelevance', '') AS major_reason,
    COALESCE(bd.business_details->>'fyOfDevelopment', '') AS quarter,
    COALESCE(owner.name, '') AS owner_name,
    COALESCE(owner.email, '') AS owner_email,
    COALESCE(reviewer.name, '') AS reviewer_name
  FROM business_details bd
  LEFT JOIN users owner
    ON owner.id = CASE
      WHEN bd.user_id ~ '^[0-9]+$' THEN bd.user_id::bigint
      ELSE NULL
    END
  LEFT JOIN users reviewer ON reviewer.id = bd.reviewed_by
`;

export async function createBusinessDetails(request, response, next) {
  try {
    const { body, files } = request;
    const bodyUserId = getBodyValue(body, "userId");
    const userId = String(request.user?.id ?? (bodyUserId || randomUUID()));

    const businessDetails = {
      innovationTitle: getBodyValue(body, "innovationTitle"),
      instituteName: getBodyValue(body, "instituteName"),
      registrationType: getBodyValue(body, "registrationType"),
      fyOfDevelopment: getBodyValue(body, "fyOfDevelopment"),
      sectorDomain: getBodyValue(body, "sectorDomain"),
      developedAsPartOf: getBodyValue(body, "developedAsPartOf"),
      innovationType: getBodyValue(body, "innovationType"),
      developmentStage: getBodyValue(body, "developmentStage"),
      developmentStageMrl: getBodyValue(body, "developmentStageMrl"),
      developmentStageIrl: getBodyValue(body, "developmentStageIrl"),
    };

    const overview = {
      problemRelevance: getBodyValue(body, "problemRelevance"),
      solutionDescription: getBodyValue(body, "solutionDescription"),
      uniquenessFeatures: getBodyValue(body, "uniquenessFeatures"),
      competitorDifference: getBodyValue(body, "competitorDifference"),
    };

    const analysis = {
      ipPatentAssociated: getBodyValue(body, "ipPatentAssociated"),
      innovationGrantSupport: getBodyValue(body, "innovationGrantSupport"),
      incubationSupportReceived: getBodyValue(body, "incubationSupportReceived"),
      incubationUnitName: getBodyValue(body, "incubationUnitName"),
      instituteGrantAmount: getBodyValue(body, "instituteGrantAmount"),
      angelInvestment: getBodyValue(body, "angelInvestment"),
      investmentAmount: getBodyValue(body, "investmentAmount"),
    };

    const attachments = {
      ipPatentDocument: getUploadedFilePath(files, "ipPatentDocument"),
      innovationGrantDocument: getUploadedFilePath(files, "innovationGrantDocument"),
      innovationVideoUrl: getBodyValue(body, "innovationVideoUrl"),
      innovationPhotograph: getUploadedFilePath(files, "innovationPhotograph"),
    };

    const insertedRows = await db`
      INSERT INTO business_details (
        user_id,
        business_details,
        overview,
        analysis,
        attachments
      )
      VALUES (
        ${userId},
        ${db.json(businessDetails)},
        ${db.json(overview)},
        ${db.json(analysis)},
        ${db.json(attachments)}
      )
      RETURNING id, user_id, created_at
    `;

    response.status(201).json({
      message: "Business details uploaded successfully.",
      data: insertedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedBusinessesForAdmin(request, response, next) {
  try {
    const quarter = getQueryValue(request.query, "quarter");
    const date = getQueryValue(request.query, "date");
    const fromDate = getQueryValue(request.query, "fromDate");
    const toDate = getQueryValue(request.query, "toDate");
    const facultyName = getQueryValue(request.query, "facultyName").toLowerCase();
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";

    const conditions = [
      includeRejected ? "bd.status IN ('approved', 'rejected')" : "bd.status = 'approved'",
    ];
    const params = [];

    if (quarter) {
      params.push(quarter);
      conditions.push(
        `LOWER(COALESCE(bd.business_details->>'fyOfDevelopment', '')) = LOWER($${params.length})`,
      );
    }

    if (date) {
      params.push(date);
      conditions.push(`bd.created_at::date = $${params.length}::date`);
    } else {
      if (fromDate) {
        params.push(fromDate);
        conditions.push(`bd.created_at::date >= $${params.length}::date`);
      }

      if (toDate) {
        params.push(toDate);
        conditions.push(`bd.created_at::date <= $${params.length}::date`);
      }
    }

    if (facultyName) {
      params.push(`%${facultyName}%`);
      conditions.push(
        `(LOWER(COALESCE(owner.name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(owner.email, '')) LIKE $${params.length})`,
      );
    }

    const businesses = await db.unsafe(
      `${baseBusinessSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY bd.approved_at DESC NULLS LAST, bd.created_at DESC`,
      params,
    );

    response.status(200).json({
      message: "Approved businesses fetched successfully.",
      data: businesses.map(normalizeBusinessRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedBusinessFilterOptionsForAdmin(request, response, next) {
  try {
    const includeRejected =
      getQueryValue(request.query, "includeRejected").toLowerCase() === "true";
    const statusFilter = includeRejected ? "IN ('approved', 'rejected')" : "= 'approved'";

    const quarterRows = await db.unsafe(
      `
      SELECT DISTINCT TRIM(COALESCE(bd.business_details->>'fyOfDevelopment', '')) AS quarter
      FROM business_details bd
      WHERE bd.status ${statusFilter}
        AND TRIM(COALESCE(bd.business_details->>'fyOfDevelopment', '')) <> ''
      ORDER BY quarter
      `,
    );

    const facultyRows = await db.unsafe(
      `
      SELECT DISTINCT name
      FROM (
        SELECT TRIM(COALESCE(owner.name, '')) AS name
        FROM business_details bd
        LEFT JOIN users owner
          ON owner.id = CASE
            WHEN bd.user_id ~ '^[0-9]+$' THEN bd.user_id::bigint
            ELSE NULL
          END
        WHERE bd.status ${statusFilter}
      ) names
      WHERE name <> ''
      ORDER BY name
      `,
    );

    response.status(200).json({
      message: "Approved business filter options fetched successfully.",
      data: {
        quarters: quarterRows.map((row) => row.quarter),
        faculties: facultyRows.map((row) => row.name),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyBusinessesForFaculty(request, response, next) {
  try {
    const userId = String(request.user?.id ?? "").trim();

    if (!userId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const businesses = await db.unsafe(
      `${baseBusinessSelect}
       WHERE bd.user_id = $1
       ORDER BY bd.created_at DESC`,
      [userId],
    );

    response.status(200).json({
      message: "Faculty businesses fetched successfully.",
      data: businesses.map(normalizeBusinessRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviewQueueForAdmin(request, response, next) {
  try {
    const businesses = await db.unsafe(
      `${baseBusinessSelect}
       WHERE bd.status IN ('pending', 'rejected')
       ORDER BY CASE bd.status WHEN 'pending' THEN 0 ELSE 1 END, bd.created_at DESC`,
    );

    response.status(200).json({
      message: "Business review queue fetched successfully.",
      data: businesses.map(normalizeBusinessRow),
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessById(request, response, next) {
  try {
    const businessId = Number(request.params?.businessId);

    if (!Number.isFinite(businessId) || businessId <= 0) {
      response.status(400).json({ message: "Invalid business id." });
      return;
    }

    const businessRows = await db.unsafe(
      `
      SELECT
        bd.id,
        bd.user_id,
        bd.status,
        bd.rejection_message,
        bd.reviewed_at,
        bd.approved_at,
        bd.rejected_at,
        bd.created_at,
        bd.business_details,
        bd.overview,
        bd.analysis,
        bd.attachments,
        COALESCE(owner.name, '') AS owner_name,
        COALESCE(owner.email, '') AS owner_email,
        COALESCE(reviewer.name, '') AS reviewer_name
      FROM business_details bd
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN bd.user_id ~ '^[0-9]+$' THEN bd.user_id::bigint
          ELSE NULL
        END
      LEFT JOIN users reviewer ON reviewer.id = bd.reviewed_by
      WHERE bd.id = $1
      LIMIT 1
      `,
      [businessId],
    );

    const businessRow = businessRows[0];
    if (!businessRow) {
      response.status(404).json({ message: "Business not found." });
      return;
    }

    const requestRole = String(request.user?.role ?? "").toLowerCase();
    const requestUserId = String(request.user?.id ?? "").trim();
    if (requestRole === "faculty" && requestUserId !== String(businessRow.user_id)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    response.status(200).json({
      message: "Business details fetched successfully.",
      data: {
        id: businessRow.id,
        userId: businessRow.user_id,
        status: businessRow.status,
        rejectionMessage: businessRow.rejection_message,
        reviewedAt: businessRow.reviewed_at,
        approvedAt: businessRow.approved_at,
        rejectedAt: businessRow.rejected_at,
        createdAt: businessRow.created_at,
        eventName: businessRow.business_details?.innovationTitle || "",
        majorReason: businessRow.overview?.problemRelevance || "",
        quarter: businessRow.business_details?.fyOfDevelopment || "",
        ownerName: businessRow.owner_name,
        ownerEmail: businessRow.owner_email,
        reviewerName: businessRow.reviewer_name,
        businessDetails: businessRow.business_details,
        overview: businessRow.overview,
        analysis: businessRow.analysis,
        attachments: businessRow.attachments,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewBusinessByAdmin(request, response, next) {
  try {
    const businessId = Number(request.params?.businessId);
    const action = String(request.body?.action ?? "").trim().toLowerCase();
    const rejectionMessage = String(request.body?.rejectionMessage ?? "").trim();

    if (!Number.isFinite(businessId) || businessId <= 0) {
      response.status(400).json({ message: "Invalid business id." });
      return;
    }

    if (!["approve", "reject"].includes(action)) {
      response.status(400).json({ message: "Action must be approve or reject." });
      return;
    }

    const businessRows = await db.unsafe(
      `
      SELECT
        bd.id,
        COALESCE(bd.business_details->>'innovationTitle', '') AS event_name,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM business_details bd
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN bd.user_id ~ '^[0-9]+$' THEN bd.user_id::bigint
          ELSE NULL
        END
      WHERE bd.id = $1
      LIMIT 1
      `,
      [businessId],
    );

    const businessRow = businessRows[0];
    if (!businessRow) {
      response.status(404).json({ message: "Business not found." });
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const adminUserId = getNumericUserId(request.user?.id);

    const updatedRows = await db.unsafe(
      `
      UPDATE business_details
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
      [
        nextStatus,
        nextStatus === "rejected" ? rejectionMessage || null : null,
        adminUserId,
        businessId,
      ],
    );

    const updatedBusiness = updatedRows[0];
    const emailQueued = triggerReviewNotification({
      businessRow,
      nextStatus,
      rejectionMessage,
    });

    response.status(200).json({
      message: `Business ${nextStatus} successfully.`,
      data: {
        ...updatedBusiness,
        emailQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBusinessByAdmin(request, response, next) {
  try {
    const businessId = Number(request.params?.businessId);

    if (!Number.isFinite(businessId) || businessId <= 0) {
      response.status(400).json({ message: "Invalid business id." });
      return;
    }

    const businessRows = await db.unsafe(
      `
      SELECT
        bd.id,
        bd.attachments,
        COALESCE(bd.business_details->>'innovationTitle', '') AS event_name,
        COALESCE(owner.name, '') AS owner_name
      FROM business_details bd
      LEFT JOIN users owner
        ON owner.id = CASE
          WHEN bd.user_id ~ '^[0-9]+$' THEN bd.user_id::bigint
          ELSE NULL
        END
      WHERE bd.id = $1
      LIMIT 1
      `,
      [businessId],
    );

    const businessRow = businessRows[0];
    if (!businessRow) {
      response.status(404).json({ message: "Business not found." });
      return;
    }

    await db`
      DELETE FROM business_details
      WHERE id = ${businessId}
    `;

    await deleteBusinessAttachmentFiles(getBusinessAttachmentPaths(businessRow.attachments));

    response.status(200).json({
      message: "Business deleted successfully.",
      data: {
        id: businessRow.id,
        eventName: businessRow.event_name,
        ownerName: businessRow.owner_name,
      },
    });
  } catch (error) {
    next(error);
  }
}
