"use client";
import Image from 'next/image';
import type { ChartOptions, InteractionItem } from 'chart.js'
import { ChartEvent } from 'chart.js';
import {
  Chart as ChartJS,
  LineController,
  DoughnutController,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  ArcElement,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { useState } from 'react';

ChartJS.register(
  LineController,
  DoughnutController,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  ArcElement
)

const labels = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
  '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24']

export default function Home() {
  // 문자열의 형태(enum)으로 상태관리
  const [activeTab, setActiveTab] = useState<"traffic" | "congestion">("traffic");
  return (
    <div className="font-sans items-center justify-items-center min-h-screen border-1">
      <header className='border-blue-100 w-full items-center justify-center'>
        <div className='w-full flex justify-end border-blue-50 h-fit mb-3'>
          <span className="material-symbols-outlined text-4xl cursor-pointer place-content-end">
            menu
          </span>
        </div>
      </header>
      <main className="flex flex-col gap-3 row-start-2 items-center border-1 w-full">
        <div className="font-mono text-3xl text-center border-1 border-amber-400 w-full">
          <span className='text-blue-500 font-bold text-[28px]'>이천시 교통 정보 모니터링</span>
        </div>
        {/* 토글 */}
        <div className='flex flex-row gap-2 items-center border-1 border-blue-300 bg-blue-200 w-fit justify-center p-3 rounded-2xl shadow-2xs'>
          {/* 1번 */}
          <button
          onClick={() => setActiveTab('traffic')} 
          className={
            `px-4 py-2 rounded-xl text-[16px] font-bold transition cursor-pointer
            ${activeTab === 'traffic'
              ? "bg-blue-500 text-white shadow-md"
              : " text-blue-950"
            }`}
          >시간대별 소통정보</button>
          {/* 2번 */}
          <button
          onClick={() => setActiveTab('congestion')} 
          className={
            `px-4 py-2 rounded-xl text-[16px] font-bold transition cursor-pointer
            ${activeTab === 'congestion'
              ? "bg-blue-500 text-white shadow-md"
              : " text-blue-950"
            }`}
          >주요구간 혼잡정보</button>
        </div>
        {/* 날짜(datePicker 사용 예정) */}
        <div className='gap-4 flex items-center'>
          <span className="material-symbols-outlined cursor-pointer text-[32px]">keyboard_arrow_left</span>
          <span className='text-[24px]'>2025-09-25</span>
          <span className="material-symbols-outlined cursor-pointer text-[32px]">keyboard_arrow_right</span>
        </div>
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
