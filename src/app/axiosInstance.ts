import axios, { AxiosInstance } from "axios";

export const instance: AxiosInstance = axios.create({
    baseURL: "https://apis.data.go.kr/4070000/IcTrafApi",
    headers: {
        "Content-Type": "application/json"
    }
})

export default instance;