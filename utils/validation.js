// Form validation utility functions

/**
 * Validates an email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL format (with or without protocol)
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidUrl(url) {
  try {
    // Add protocol if missing to allow for simple domain entries
    const urlToTest = url.startsWith('http') ? url : `https://${url}`;
    new URL(urlToTest);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validates a hexadecimal color code
 * @param {string} color - Color code to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidHexColor(color) {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * Validates form data based on content mapping rules
 * @param {object} formData - The form data to validate
 * @returns {object} - Object with isValid boolean and errors object
 */
export function validateContentForm(formData) {
  const errors = {};
  
  // Validate required fields
  if (!formData.rendered_title) {
    errors.rendered_title = 'Site title is required';
  }
  
  // Validate color fields
  if (formData.primary_color && !isValidHexColor(formData.primary_color)) {
    errors.primary_color = 'Invalid color format. Use hexadecimal format (#RRGGBB)';
  }
  
  if (formData.accent_color && !isValidHexColor(formData.accent_color)) {
    errors.accent_color = 'Invalid color format. Use hexadecimal format (#RRGGBB)';
  }
  
  if (formData.text_color && !isValidHexColor(formData.text_color)) {
    errors.text_color = 'Invalid color format. Use hexadecimal format (#RRGGBB)';
  }
  
  if (formData.background_color && !isValidHexColor(formData.background_color)) {
    errors.background_color = 'Invalid color format. Use hexadecimal format (#RRGGBB)';
  }
  
  // Validate URL fields
  if (formData.profile_image_url && !isValidUrl(formData.profile_image_url)) {
    errors.profile_image_url = 'Invalid URL format';
  }
  
  if (formData.banner_1_image_url && !isValidUrl(formData.banner_1_image_url)) {
    errors.banner_1_image_url = 'Invalid URL format';
  }
  
  if (formData.banner_2_image_url && !isValidUrl(formData.banner_2_image_url)) {
    errors.banner_2_image_url = 'Invalid URL format';
  }
  
  if (formData.banner_3_image_url && !isValidUrl(formData.banner_3_image_url)) {
    errors.banner_3_image_url = 'Invalid URL format';
  }
  
  if (formData.client_website && !isValidUrl(formData.client_website)) {
    errors.client_website = 'Invalid URL format';
  }
  
  // Check if there are any errors
  const isValid = Object.keys(errors).length === 0;
  
  return { isValid, errors };
}
