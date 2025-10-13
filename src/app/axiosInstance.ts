import axios, { AxiosInstance } from "axios";

export const instance: AxiosInstance = axios.create({
    baseURL: "https://traffic-pied.vercel.app",
    headers: {
        "Content-Type": "application/json"
    }
})

export default instance;