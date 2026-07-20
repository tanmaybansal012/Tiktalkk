import axios from "axios";

export const AxiosInstance = axios.create({
    baseURL: 'https://tiktalkk.onrender.com/api',
    withCredentials: true,
})