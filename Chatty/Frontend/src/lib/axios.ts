import axios from "axios";

export const AxiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
    withCredentials: true,
})