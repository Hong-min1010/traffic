import axios from "axios"
import instance from "@/app/axiosInstance";
import { NextResponse } from "next/server";

export async function GET() {
    const serviceKey = process.env.API_KEY;
    const date = new Date();
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    const today = `${year}/${month}/${day}`

    console.log(today)
    console.log('serviceKey', serviceKey); 

    try {
        const res = await instance.get('/getTimeTrafInfo', {
            params: {
                serviceKey,
                apiType: "json",
                seaerchDt: today,
            },
        })
        console.log('response ===', res);

        return NextResponse.json(res.data);
    } catch(e) {
        console.log("API 오류", e);
        return NextResponse.json(
            {error : '실패'}
        )
    }
}