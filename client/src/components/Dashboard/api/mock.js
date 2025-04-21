import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// Create axios instance
const axiosInstance = axios.create();
const mock = new MockAdapter(axiosInstance, { onNoMatch: "passthrough" });

// Mock Data
const mockData = {
    nutrition: {
        dailyCalories: [1800, 1900, 1700, 2000, 2100, 1950, 1850],
        macros: { protein: 120, carbs: 200, fat: 70 },
        meals: [
            { date: "Apr 10", name: "Breakfast", calories: 450 },
            { date: "Apr 10", name: "Lunch", calories: 650 },
            { date: "Apr 9 ", name: "Dinner", calories: 700 },
        ],
    },
    exercise: {
        weeklyWorkouts: [3, 5, 4, 6, 2, 4, 5],
        caloriesBurned: [300, 450, 500, 350, 200, 400, 550],
        lastWorkouts: [
            { type: "Running", duration: 30, calories: 350 },
            { type: "Weight Lifting", duration: 45, calories: 250 },
            { type: "Zumba", duration: 30, calories: 280 },
        ],
    }
};

// Mock only dashboard endpoints
mock.onGet("/api/dash/nutrition").reply(200, mockData.nutrition);
mock.onGet("/api/dash/exercise").reply(200, mockData.exercise);

// All other requests will pass through to real server
export default axiosInstance;