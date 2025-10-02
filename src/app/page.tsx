// 브라우저 전용 API를 사용하기 위해 use client 선언 要
"use client";
import type { ChartOptions, InteractionItem } from 'chart.js'
import {
  Chart as ChartJS,
  registerables
} from "chart.js";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Chart } from 'react-chartjs-2'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import { addMonths, format, subMonths } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Space_Mono } from 'next/font/google';
import instance from './axiosInstance';

ChartJS.register(...registerables, ChartDataLabels);



// x축 하단 데이터라벨
// 배열의 길이가 {length: 24}인 빈 배열 생성
const labels = Array.from({ length:24 }, (_, i) => 
  // 숫자를 문자열로 변환, padStart(2, "0") -> 2자리 숫자로 만듦, 2자리가 아닌 수 ex) 1 = 01로 앞에 0을 붙여 2자리수로 만듦
  String(i + 1).padStart(2, "0"));

  // 소통정보 표 타입 지정
  type TrafficInfo = {
    time: string,
    highway: number // 고속
    urbanHighway: number // 도시고속
    national: number // 국도
    city: number // 시내
  }

  const columns: ColumnDef<TrafficInfo>[] =  [
    { accessorKey: "time", header: "시간" },
    { accessorKey: "highway", header: "고속도로" },
    { accessorKey: "urbanHighway", header: "도시고속" },
    { accessorKey: "national", header: "국도" },
    { accessorKey: "city", header: "시내도로" },
  ];

  function getSpeedLabel(type: keyof TrafficInfo, value: number) {
    switch (type) {
    case "highway":
      if (value >= 80) return "원할";
      if (value >= 60) return "서행";
      return "정체";
    case "urbanHighway":
      if (value >= 60) return "원할";
      if (value >= 40) return "서행";
      return "정체";
    case "national":
      if (value >= 50) return "원할";
      if (value >= 30) return "서행";
      return "정체";
    case "city":
      if (value >= 30) return "원할";
      if (value >= 20) return "서행";
      return "정체";
    default:
      return "";
  }
  }

  function getSpeedClass(type: keyof TrafficInfo, value: number) {
  switch (type) {
    case "highway":
      if (value >= 80) return "text-green-600";
      if (value >= 60) return "text-yellow-600";
      return "text-red-600";
    case "urbanHighway":
      if (value >= 60) return "text-green-600";
      if (value >= 40) return "text-yellow-600";
      return "text-red-600";
    case "national":
      if (value >= 50) return "text-green-600";
      if (value >= 30) return "text-yellow-600";
      return "text-red-600";
    case "city":
      if (value >= 30) return "text-green-600";
      if (value >= 20) return "text-yellow-600";
      return "text-red-600";
    default:
      return "";
  }
}

export default function Home() {
  // 문자열의 형태(enum)으로 상태관리
  const [activeTab, setActiveTab] = useState<"traffic" | "congestion">("traffic");
  // datePicker Library 사용
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  // const [trafficData, setTrafficData] = useState<any>(null);
  const [data, setData] = React.useState<TrafficInfo[]>([]);
  const [openTab, setOpenTab] = useState<1 | 3 | 6>(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })


  // 달력 옆 클릭 시 달력 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const d = String(selectedDate.getDate()).padStart(2, "0");
        const dateStr = `${y}${m}${d}`;

        const res = await instance.get("/getTimeTrafInfo", {params: { date: dateStr }});
        const json = res.data;

        if(json && json.data && Array.isArray(json.data.trafficList)) {
          const apiData: TrafficInfo[] = json.data.trafficList.map((item: any) => ({
            time: `${String(item.hour).padStart(2, "0")}시`,
            highway: item.highway,
            urbanHighway: item.urbanHighway,
            national: item.national,
            city: item.city
          }));
          setData(apiData);
          return;
        }
        throw new Error("API response 에러")
      } catch (e) {
        console.log("API 요청 실패", e)
        const dummy: TrafficInfo[] = Array.from({ length: 24 }, (_, i) => ({
          time: `${String(i).padStart(2, "0")}시`,
          highway: Math.floor(Math.random() * 60) + 40,
          urbanHighway: Math.floor(Math.random() * 40) + 30,
          national: Math.floor(Math.random() * 40) + 30,
          city: Math.floor(Math.random() * 20) + 15,
        }));
        setData(dummy);
      }
    }
    fetchData();
  },[selectedDate]);

  const filteredData = useMemo(() => {
    if(!data){
      return [];
    }
    if(openTab === 1) {
      return data;
    }
    const start = currentIndex * openTab;
    const end = start + openTab;
    return data.slice(start, end);
  }, [data, openTab, currentIndex]);

  const range = useMemo(() => {
    if(openTab === 1) {
      return "1시간 단위"
    };
    const startHour = filteredData[0]?.time;
    const endHour = filteredData[filteredData.length - 1]?.time ?? '';
    return `${startHour} ~ ${endHour}`
  }, [openTab, currentIndex, filteredData]);

  const chartData = useMemo(() => ({
    labels: filteredData.map(d => d.time),
    datasets: [
      {
        type: 'line' as const,
        label: '고속도로',
        borderColor: '#000',
        fill: false,
        data: filteredData.map(d => d.highway)
      },
      {
        type: 'line' as const,
        label: '도시고속',
        borderColor: '#FFDD00',
        fill: false,
        data: filteredData.map(d => d.urbanHighway)
      },
      {
        type: 'line' as const,
        label: '국도',
        borderColor: '#FF7B00',
        fill: false,
        data: filteredData.map(d => d.national)
      },
      {
        type: 'line' as const,
        label: '시내',
        borderColor: '#0048FF',
        fill: false,
        data: filteredData.map(d => d.city)
      }
    ]
  }), [filteredData]);

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
      plugins: {
        datalabels: {
          display: false
        },
        // 맨 위 데이터라벨
        legend: {
            position: 'bottom',
        },
        // 도넛차트 내부 데이터 표시
        tooltip: {
            callbacks: {
                label(tooltipItem: any) {
                  const dataset = chartData.datasets[tooltipItem.datasetIndex];
                  const label = dataset.label || '';
                  const value = tooltipItem.formattedValue;
                  return [`${label}: ${value}`]
                },
            },
        },
      },
      scales: {
          x: {
              // type:"category",
              stacked: true,
          },
          y: {
              type: "linear",
              beginAtZero: true,
              // stacked: true,
          },
      }
  }

  return (
    <div className="font-sans items-center justify-items-center min-h-screen border-1 mx-8">
      <main className="flex flex-col gap-3 row-start-2 items-center w-full m-7">
        <div className="font-mono text-3xl text-center w-full">
          <span className='text-blue-500 font-bold text-[28px]'>이천시 교통 정보 모니터링</span>
        </div>
        {/* 토글 */}
        <div className='flex w-full justify-center'>
          <div className='flex flex-row gap-2 items-center border-3 border-blue-300 bg-blue-200 w-fit justify-center p-2 rounded-2xl shadow-2xs'>
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
        </div>
        {/* 날짜(datePicker 사용) */}
        <div className='gap-4 flex items-center mt-2'>
          <span 
          onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
          className="material-symbols-outlined cursor-pointer text-[32px]">keyboard_arrow_left</span>
          <div className='relative'>
            {/* date */}
            <button onClick={() => {setIsOpen(!isOpen)}}
              className='px-4 py-2 bg-blue-500 text-white rounded cursor-pointer'>
                {format(selectedDate, "yyyy-MM-dd")}
            </button>
            {isOpen && (
              <div ref={datePickerRef} className="absolute left-1/2 -translate-x-1/2 mt-2 shadow-lg h-full z-50">
              <DatePicker 
                selected={selectedDate} onChange={(date) => {
                if(date) setSelectedDate(date);
                setIsOpen(false)
              }} locale={ko} inline
              calendarClassName="!m-0 !p-0 !shadow-none !rounded-lg"
              filterDate={(date) => date.getMonth() === selectedDate.getMonth()}
              dayClassName={(date) => 
                date.getMonth() !== selectedDate.getMonth()
                ? "text-gray-400 pointer-events-none"
                : "text-black cursor-pointer"
              } />
              </div>
            )}
          </div>
          <span 
          onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
          className="material-symbols-outlined cursor-pointer text-[32px]">keyboard_arrow_right</span>
        </div>
        {/* Tab 추가 (시간 단위 차트 렌더링) */}
        <div className='flex justify-end w-full'>
          <div className='flex bg-gray-100 rounded-lg overflow-hidden mr-5 shadow-md border-black border-1 divide-x divide-gray-500'>
            {[1, 3, 6].map((tab) => (
              <button
                key={tab}
                onClick={() => setOpenTab(tab as 1 | 3 | 6)}
                className={`px-4 py-2 font-bold text-sm cursor-pointer
                  ${openTab === tab
                    ? "bg-blue-500 text-white"
                    : "text-gray-700"
                  }`}>
                    {tab}시간
                  </button>
            ))}
          </div>
        </div>
        {/* 시간 좌 -> 우 넘기기 버튼 */}
        {openTab !== 1 && (
          <div className='flex justify-center items-center gap-3 mt-3'>
          {currentIndex > 0 && (
            <button
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            className='px-3 py-1 bg-gray-200 rounded cursor-pointer'>◀</button>
          )}
          <span className='font-bold'>{range}</span>
          {currentIndex < Math.ceil(data.length / openTab) -1 && (
            <button
            onClick={() => setCurrentIndex(i => i + 1)}
            className='px-3 py-1 bg-gray-200 rounded cursor-pointer'>▶</button>
          )}
        </div>
        )}
        <Chart type='bar' data={chartData} options={options} />
        {/* <div className='flex flex-row justify-end items-end w-full mr-10 font-bold'>
        <span className='text-green-600 mr-3'>원할</span>
        <span className='text-yellow-600 mr-3'>서행</span>
        <span className='text-red-600'>정체</span>
        </div> */}
        {/* 표 */}
        <div className='w-full max-h-60 overflow-y-scroll'>
          <table className='w-full border'>
            <thead className='bg-blue-300 text-white'>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    // <th key={header.id} 
                    // title={
                    //   header.column.id === 'highway'
                    //   ? "고속도로 기준\n원활: 80km 이상\n서행: 60~79km\n정체: 59km 이하"
                    //   : header.column.id === "urbanHighway"
                    //   ? "도시고속 기준\n원활: 60km 이상\n서행: 40~59km\n정체: 39km 이하"
                    //   : header.column.id === "national"
                    //   ? "국도 기준\n원활: 50km 이상\n서행: 30~49km\n정체: 29km 이하"
                    //   : header.column.id === "city"
                    //   ? "시내도로 기준\n원활: 30km 이상\n서행: 20~29km\n정체: 19km 이하"
                    //   : "" 
                    // }
                    // className='px-4 py-2 text-center border-1 border-gray-300 hover:bg-blue-500'>
                    //   {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    // </th>
                    const colKey = header.column.id;
                    if(colKey === "시간") {
                      return (
                        <th
                        key={header.id}
                        className='px-4 py-2 text-center border-1 border-gray-300 bg-gray-100'>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      )
                    }

                    const tipsMap: Record<string, { label: string; condition: string }[]> = {
                      highway: [
                        { label: "원활", condition: "80km 이상" },
                        { label: "서행", condition: "60~79km" },
                        { label: "정체", condition: "59km 이하" },
                      ],
                      urbanHighway: [
                        { label: "원활", condition: "60km 이상" },
                        { label: "서행", condition: "40~59km" },
                        { label: "정체", condition: "39km 이하" },
                      ],
                      national: [
                        { label: "원활", condition: "50km 이상" },
                        { label: "서행", condition: "30~49km" },
                        { label: "정체", condition: "29km 이하" },
                      ],
                      city: [
                        { label: "원활", condition: "30km 이상" },
                        { label: "서행", condition: "20~29km" },
                        { label: "정체", condition: "19km 이하" },
                      ],
                    };
                    return (
                      <th
                      key={header.id}
                      className='relative group px-4 py-2 text-center border-1 border-gray-300 hover:bg-blue-500'>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {tipsMap[colKey] && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 
                                          hidden group-hover:block bg-gray-900 text-white 
                                          rounded-lg shadow-xl z-50 p-2 w-44">
                            <table className="text-xs w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-700">
                                  <th className="px-2 py-1 border border-gray-600">구분</th>
                                  <th className="px-2 py-1 border border-gray-600">기준</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tipsMap[colKey].map((t, idx) => (
                                  <tr key={idx} className="hover:bg-gray-800">
                                    <td className="px-2 py-1 border border-gray-600">{t.label}</td>
                                    <td className="px-2 py-1 border border-gray-600">{t.condition}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="even:bg-gray-100">
                  {row.getVisibleCells().map(cell => {
                    const colKey = cell.column.id as keyof TrafficInfo;
                    const value = row.original[colKey];
                    const isNumber = typeof value === "number";
                    return (
                      <td
                        key={cell.id}
                        className={`px-4 py-2 text-center font-bold border-1 border-gray-300 ${
                          isNumber ? getSpeedClass(colKey, value) : ""
                        }`}
                      >
                        {isNumber ? getSpeedLabel(colKey, value) : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
