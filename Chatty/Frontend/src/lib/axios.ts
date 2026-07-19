import axios from "axios";

export const AxiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true,
})