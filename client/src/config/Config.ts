export const BASE_URL = "http://127.0.0.1:5050";

export const getHeaders = (userData) => {
    return {
        headers: {
            "x-auth-token": userData.token
        }
    }
};
