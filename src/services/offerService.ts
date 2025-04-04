
// This file re-exports all offer service functionality
// It provides backward compatibility while allowing for better code organization

// Import specific named exports from services
import { 
  generateAndDownloadOfferPdf, 
  getOfferDataForPdf, 
  generateSamplePdf 
} from './offers/offerPdf';

import { 
  isOfferSigned, 
  saveOfferSignature, 
  generateSignatureLink 
} from './offers/offerSignature';

import {
  deleteOffer,
  updateOfferStatus
} from './offers/offerStatus';

import {
  getWorkflowLogs,
  sendInfoRequest,
  processInfoResponse
} from './offers/offerWorkflow';

// Import and re-export from other offer service files
export * from './offers';

// Explicitly re-export named exports that might conflict with star exports
export {
  generateAndDownloadOfferPdf,
  getOfferDataForPdf,
  generateSamplePdf,
  isOfferSigned,
  saveOfferSignature,
  generateSignatureLink,
  deleteOffer,
  updateOfferStatus,
  getWorkflowLogs,
  sendInfoRequest,
  processInfoResponse
};

// Export functions from offerDetail directly
export * from './offers/offerDetail';

// Export utility functions
export { translateOfferType, hasCommission } from '@/utils/offerTypeTranslator';
