import axios, { AxiosInstance } from "axios";

export const instance: AxiosInstance = axios.create({
    baseURL: "https://apis.data.go.kr/AAAAAA/api",
    headers: {
        "Content-Type": "application/json"
    }
})

export default instance;