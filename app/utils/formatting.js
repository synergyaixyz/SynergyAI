/**
 * Formatting utility functions
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'USD')
 * @param {string} locale - The locale to use for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a number with specified decimal places
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 2) {
  return Number(value).toFixed(decimals);
}

/**
 * Format a date
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @param {string} locale - The locale to use for formatting (default: 'en-US')
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}, locale = 'en-US') {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Truncate a string to a specified length
 * @param {string} str - The string to truncate
 * @param {number} length - Maximum length (default: 30)
 * @param {string} suffix - String to append after truncation (default: '...')
 * @returns {string} Truncated string
 */
export function truncateString(str, length = 30, suffix = '...') {
  if (!str || str.length <= length) {
    return str;
  }
  return `${str.substring(0, length)}${suffix}`;
}

/**
 * Format an Ethereum address
 * @param {string} address - The Ethereum address to format
 * @param {number} startChars - Number of starting characters to show (default: 6)
 * @param {number} endChars - Number of ending characters to show (default: 4)
 * @returns {string} Formatted address
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length < (startChars + endChars + 3)) {
    return address;
  }
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Format token amount with symbol
 * @param {number|string} amount - The token amount
 * @param {string} symbol - The token symbol
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted token amount
 */
export function formatTokenAmount(amount, symbol, decimals = 4) {
  return `${formatNumber(amount, decimals)} ${symbol}`;
}

/**
 * Format date as a readable string
 * @param {Date|string|number} date - The date to format
 * @param {boolean} includeTime - Whether to include the time part
 * @returns {string} Formatted date string
 */
export const formatDateReadable = (date, includeTime = false) => {
  if (!date) return 'N/A';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Truncate long string and add ellipsis in the middle
 * @param {string} str - The string to truncate
 * @param {number} startChars - Number of characters to keep at the beginning
 * @param {number} endChars - Number of characters to keep at the end
 * @returns {string} Truncated string
 */
export const truncateStringMiddle = (str, startChars = 6, endChars = 4) => {
  if (!str) return '';

  const strValue = String(str);

  if (strValue.length <= startChars + endChars) {
    return strValue;
  }

  const midLength = strValue.length - (startChars + endChars);
  const midStr = '...';

  return `${strValue.substring(0, startChars)}${midStr}${strValue.substring(strValue.length - endChars)}`;
};

/**
 * Format file size as a readable string
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format byte size as a readable string (alias for formatFileSize)
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size string
 */
export const bytesToSize = formatFileSize;

/**
 * Format transaction hash for display
 * @param {string} hash - Transaction hash
 * @param {number} prefixLength - Length of prefix
 * @param {number} suffixLength - Length of suffix
 * @returns {string} Formatted transaction hash
 */
export const formatTxHash = (hash, prefixLength = 8, suffixLength = 8) => {
  return truncateStringMiddle(hash, prefixLength, suffixLength);
};

/**
 * Format token amount as a readable string
 * @param {string|number} amount - Token amount (possibly a large number string)
 * @param {number} decimals - Token decimal places
 * @param {number} displayDecimals - Display decimal places
 * @returns {string} Formatted token amount string
 */
export const formatTokenAmountReadable = (amount, decimals = 18, displayDecimals = 4) => {
  if (!amount) return '0';

  try {
    // Convert large number string to number, considering decimal places
    const rawAmount = typeof amount === 'string' ? amount : amount.toString();

    // Handle numbers in scientific notation
    if (rawAmount.includes('e')) {
      const [base, exponent] = rawAmount.split('e');
      const exp = parseInt(exponent, 10);

      if (exp < 0) {
        const abs = Math.abs(exp);
        const zeros = '0'.repeat(abs - 1);
        return `0.${zeros}${base.replace('.', '')}`;
      }

      const baseWithoutDot = base.replace('.', '');
      const zeros = '0'.repeat(exp - (baseWithoutDot.length - 1));
      return `${baseWithoutDot}${zeros}`;
    }

    // Normal handling of large numbers
    const value = parseFloat(rawAmount) / Math.pow(10, decimals);

    // Use toFixed to control decimal places, then remove trailing zeros and possible decimal point
    return value.toFixed(displayDecimals).replace(/\.?0+$/, '');
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};

/**
 * Get file type details based on mime type or extension
 * @param {string} fileType - The file type (mime type or extension)
 * @returns {Object} File type details including category and icon type
 */
export const getFileTypeDetails = (fileType) => {
  // Default file type
  const defaultType = {
    category: 'Other',
    iconType: 'file'
  };

  if (!fileType) return defaultType;

  const mimeType = fileType.toLowerCase();

  // Image files
  if (mimeType.includes('image/') ||
      /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(mimeType)) {
    return {
      category: 'Image',
      iconType: 'file-image'
    };
  }

  // Document files
  if (mimeType.includes('text/') ||
      mimeType.includes('application/pdf') ||
      mimeType.includes('application/msword') ||
      mimeType.includes('application/vnd.ms-excel') ||
      mimeType.includes('application/vnd.openxmlformats') ||
      /\.(txt|pdf|doc|docx|xls|xlsx|ppt|pptx|csv|md|rtf)$/i.test(mimeType)) {
    return {
      category: 'Document',
      iconType: 'file-text'
    };
  }

  // Audio files
  if (mimeType.includes('audio/') ||
      /\.(mp3|wav|ogg|flac|aac)$/i.test(mimeType)) {
    return {
      category: 'Audio',
      iconType: 'file-audio'
    };
  }

  // Video files
  if (mimeType.includes('video/') ||
      /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(mimeType)) {
    return {
      category: 'Video',
      iconType: 'file-video'
    };
  }

  // Archive files
  if (mimeType.includes('application/zip') ||
      mimeType.includes('application/x-rar') ||
      mimeType.includes('application/x-7z') ||
      /\.(zip|rar|7z|tar|gz)$/i.test(mimeType)) {
    return {
      category: 'Archive',
      iconType: 'file-zip'
    };
  }

  // Code files
  if (mimeType.includes('application/json') ||
      mimeType.includes('text/html') ||
      mimeType.includes('text/css') ||
      mimeType.includes('text/javascript') ||
      /\.(json|xml|html|css|js|ts|jsx|tsx|py|java|c|cpp|php|rb|go|swift|sol)$/i.test(mimeType)) {
    return {
      category: 'Code',
      iconType: 'file-code'
    };
  }

  // Data files
  if (mimeType.includes('application/vnd.ms-excel') ||
      mimeType.includes('text/csv') ||
      /\.(csv|xls|xlsx|json|xml|db|sql|parquet|avro)$/i.test(mimeType)) {
    return {
      category: 'Data',
      iconType: 'database'
    };
  }

  return defaultType;
};
