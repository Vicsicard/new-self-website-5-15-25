/**
 * Utility functions for API requests
 */

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint
 * @returns {Promise<object>} - Response data
 */
export async function fetchAPI(endpoint) {
  try {
    const res = await fetch(endpoint);
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint
 * @param {object} data - Data to send
 * @returns {Promise<object>} - Response data
 */
export async function postAPI(endpoint, data) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Make a PUT request to the API
 * @param {string} endpoint - API endpoint
 * @param {object} data - Data to send
 * @returns {Promise<object>} - Response data
 */
export async function putAPI(endpoint, data) {
  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error putting to ${endpoint}:`, error);
    throw error;
  }
}
