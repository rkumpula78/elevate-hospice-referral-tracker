/**
 * Utility functions for formatting form inputs
 */

/**
 * Format phone number as (XXX) XXX-XXXX
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

/**
 * Format date as MM/DD/YYYY
 */
export const formatDate = (value: string): string => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
};

/**
 * Format medical record number to uppercase
 */
export const formatMedicalRecordNumber = (value: string): string => {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
};

/**
 * Format zip code as XXXXX or XXXXX-XXXX
 */
export const formatZipCode = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
};

/**
 * Parse formatted phone number to raw digits
 */
export const parsePhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Parse formatted date to raw digits
 */
export const parseDate = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (value: string): boolean => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length === 10;
};

/**
 * Validate date format MM/DD/YYYY
 */
export const isValidDate = (value: string): boolean => {
  const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!dateRegex.test(value)) return false;
  
  const [month, day, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};
