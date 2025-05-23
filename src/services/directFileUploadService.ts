// This file is now deprecated. All functionality has been moved to fileUploadService.ts.
// Keeping it for backward compatibility.

import { 
  ensureBucket as ensureBucketExists, 
  uploadImage as uploadFile,
  getMimeType as detectMimeTypeFromExtension,
  getCacheBustedUrl
} from "./fileUploadService";

// Re-export functions for backward compatibility
export {
  ensureBucketExists,
  uploadFile as uploadFileDirectly,
  detectMimeTypeFromExtension,
  getCacheBustedUrl
};
