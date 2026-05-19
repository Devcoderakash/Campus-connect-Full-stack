const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Retrieve credentials securely from environment, supporting both standard and custom variants
const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
const baseFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

let oauth2Client;
let drive;

try {
  oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  );

  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  drive = google.drive({
    version: "v3",
    auth: oauth2Client,
  });
} catch (err) {
  console.error("❌ Google Drive OAuth Client Initialization Failed:", err.message);
}

/**
 * Validates access to Google Drive API.
 */
async function validateDriveAccess() {
  try {
    if (!refreshToken) {
      throw new Error("GOOGLE_REFRESH_TOKEN is missing in environment variables.");
    }
    // Test connection by listing a single file/folder
    await drive.files.list({ pageSize: 1 });
    return { success: true, message: "Google Drive Access Verified." };
  } catch (error) {
    console.error("❌ Google Drive Validation Error:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Generates the clean embedding preview URL for a Google Drive file.
 */
function generatePreviewUrl(fileId) {
  if (!fileId) return "";
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Generates the direct download/source stream URL for a Google Drive file.
 */
function generateDownloadUrl(fileId) {
  if (!fileId) return "";
  return `https://drive.google.com/uc?id=${fileId}`;
}

/**
 * Creates a folder inside a parent folder if it doesn't already exist.
 * Returns the folder ID.
 */
async function createFolderIfNotExists(folderName, parentFolderId = null) {
  try {
    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const searchResponse = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      return searchResponse.data.files[0].id;
    }

    // Otherwise, create the new folder
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    return folder.data.id;
  } catch (error) {
    console.error(`❌ Error creating folder "${folderName}":`, error.message);
    throw new Error(`Failed to create Google Drive folder: ${error.message}`);
  }
}

/**
 * Gets or initializes the complete Campus Connect verification folder structure.
 * Campus Connect Verification Docs/
 * ├── Pending Seniors/
 * ├── Approved Seniors/
 * └── Rejected Seniors/
 */
async function getVerificationFolderStructure() {
  try {
    // 1. Create Base Folder under parent folder (if GOOGLE_DRIVE_FOLDER_ID is set) or root
    const rootId = baseFolderId || null;
    const baseId = await createFolderIfNotExists("Campus Connect Verification Docs", rootId);

    // 2. Create status subfolders
    const pendingId = await createFolderIfNotExists("Pending Seniors", baseId);
    const approvedId = await createFolderIfNotExists("Approved Seniors", baseId);
    const rejectedId = await createFolderIfNotExists("Rejected Seniors", baseId);

    return {
      baseFolderId: baseId,
      pendingFolderId: pendingId,
      approvedFolderId: approvedId,
      rejectedFolderId: rejectedId,
    };
  } catch (error) {
    console.error("❌ Error setting up verification folder structure:", error.message);
    throw error;
  }
}

/**
 * Uploads a file to Google Drive and shares it as "anyone with link can view".
 */
async function uploadFileToDrive(filePath, mimeType, fileName, parentFolderId = null) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file not found at path: ${filePath}`);
    }

    const fileMetadata = {
      name: fileName,
    };
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    const fileId = driveResponse.data.id;

    // Make the file publicly readable by anyone so it can be previewed/downloaded seamlessly
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return {
      driveFileId: fileId,
      previewUrl: generatePreviewUrl(fileId),
      downloadUrl: generateDownloadUrl(fileId),
    };
  } catch (error) {
    console.error("❌ Google Drive Upload File Error:", error.message);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
}

/**
 * Deletes a file from Google Drive.
 */
async function deleteDriveFile(fileId) {
  try {
    if (!fileId) return;
    await drive.files.delete({ fileId: fileId });
    return true;
  } catch (error) {
    console.error(`❌ Error deleting Google Drive file ${fileId}:`, error.message);
    // Return false instead of crashing to allow database recovery
    return false;
  }
}

/**
 * Moves a file from one parent folder to another.
 */
async function moveFileBetweenFolders(fileId, currentFolderId, targetFolderId) {
  try {
    if (!fileId || !targetFolderId) {
      throw new Error("Missing parameters for moving files on Google Drive.");
    }

    // If we don't know the current folder ID, retrieve the file parents first
    let removeParents = currentFolderId;
    if (!removeParents) {
      const fileData = await drive.files.get({
        fileId: fileId,
        fields: "parents",
      });
      if (fileData.data.parents && fileData.data.parents.length > 0) {
        removeParents = fileData.data.parents.join(",");
      }
    }

    const updateParams = {
      fileId: fileId,
      addParents: targetFolderId,
      fields: "id, parents",
    };

    if (removeParents) {
      updateParams.removeParents = removeParents;
    }

    const response = await drive.files.update(updateParams);
    return response.data;
  } catch (error) {
    console.error(`❌ Error moving file ${fileId} to folder ${targetFolderId}:`, error.message);
    throw new Error(`Failed to move file on Google Drive: ${error.message}`);
  }
}

module.exports = {
  validateDriveAccess,
  createFolderIfNotExists,
  getVerificationFolderStructure,
  uploadFileToDrive,
  deleteDriveFile,
  moveFileBetweenFolders,
  generatePreviewUrl,
  generateDownloadUrl,
  drive,
};
