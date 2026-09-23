import * as ImagePicker from 'expo-image-picker';

/**
 * Standard image compression configuration (PRD v2 & Roadmap Phase 9A)
 * Target: Max width ~1200px, 80% quality JPEG/PNG
 */
export const COMPRESSION_CONFIG = {
  quality: 0.8,
  maxWidth: 1200,
  maxHeight: 1200,
};

/**
 * Image picker options configured for optimal compression and mobile bandwidth
 */
export function getCompressedImagePickerOptions(): ImagePicker.ImagePickerOptions {
  return {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: COMPRESSION_CONFIG.quality,
  };
}

/**
 * Receipt / Payment Proof image picker options (full aspect ratio preserved)
 */
export function getReceiptImagePickerOptions(): ImagePicker.ImagePickerOptions {
  return {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: COMPRESSION_CONFIG.quality,
  };
}
