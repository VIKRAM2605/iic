import db from "../config/db.js";
import { randomUUID } from "crypto";

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

export async function createEventDetails(request, response, next) {
  try {
    const { body, files } = request;
    const userId = getBodyValue(body, "userId") || randomUUID();

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

    const attachments = {
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
      brochureWithLogo: getUploadedFilePath(files, "brochureWithLogo"),
      brochureProofName: getBodyValue(body, "brochureProofName"),
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
      iqacVerification: getBodyValue(body, "iqacVerification"),
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
