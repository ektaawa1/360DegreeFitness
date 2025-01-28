const axios = require("axios");

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;; // FastAPI base URL

/**
 * Calls the Python FastAPI for data analysis.
 * @param {object} data - The input data to analyze.
 * @returns {Promise<object>} - The analyzed data.
 */
const analyzeData = async (data) => {
  try {
    const response = await axios.post(`${FASTAPI_BASE_URL}/analyze`, data);
    return response.data; // Return the analyzed data
  } catch (error) {
    console.error("Error calling Python API:", error.message);
    throw new Error("Failed to analyze data via Python API");
  }
};

module.exports = { analyzeData };
