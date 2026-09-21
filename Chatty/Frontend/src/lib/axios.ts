import axios from "axios";

export const BACKEND_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development" ? "http://localhost:5000" : "https://tiktalkk.onrender.com");

export const AxiosInstance = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    withCredentials: true,
});