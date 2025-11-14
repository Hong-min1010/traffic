import Image from "next/image";
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
import { addDays, format, subDays } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Space_Mono } from 'next/font/google';
import instance from './axiosInstance'
import KakaoMapModal from "@/components/kakaoMap";

ChartJS.register(...registerables, ChartDataLabels);

// x축 하단 데이터라벨
// 배열의 길이가 {length: 24}인 빈 배열 생성
const labels = Array.from({ length:24 }, (_, i) => 
  String(i + 1).padStart(2, "0"));

  type TrafficInfo = {
    time: string,
    highway: number // 고속
    urbanHighway: number // 도시고속
    national: number // 국도
    city: number // 시내
  }

  // ColumnDef<TrafficInfo>[] -> ColumnDef<T> = react/table 라이브러리 사용법
  // ColumnDef<T>를 통해 열의 데이터 타입 지정 가능 TrafficInfo 타입의 데이터만 가능
  const columns: ColumnDef<TrafficInfo>[] =  [
    { accessorKey: "time", header: "시간" },
    { accessorKey: "highway", header: "고속도로" },
    { accessorKey: "urbanHighway", header: "도시고속" },
    { accessorKey: "national", header: "국도" },
    { accessorKey: "city", header: "시내도로" },
  ];

  const legends = {
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

  // Key, Value를 통해 도로 종류 확인 후, 속도에 따른 스타일 적용
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
  // datePicker 상태관리
  const [isOpen, setIsOpen] = useState(false);
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = React.useState<TrafficInfo[]>([]);
  const [selectedTab, setselectedTab] = useState<1 | 3 | 6>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullTable, setShowFullTable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [showDonutModal, setShowDonutModal] = useState(false);
  const [showKakaoMap, setShowKakaoMap] = useState(false);


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

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; }
  }, [showModal]);

  // 시간 필터 (1, 3, 6시간)
  const aggregatedData = useMemo(() => {
    if(!data || data.length === 0){
      return [];
    }
    if(selectedTab === 1) {
      return data;
    }
    const groupSize = selectedTab;
    const result: TrafficInfo[] =[];

    for(let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize);
      // 평균 계산
      const avgHighway =
        group.reduce((sum, d) => sum + d.highway, 0) / group.length;
      const avgUrban =
        group.reduce((sum, d) => sum + d.urbanHighway, 0) / group.length;
      const avgNational =
        group.reduce((sum, d) => sum + d.national, 0) / group.length;
      const avgCity = group.reduce((sum, d) => sum + d.city, 0) / group.length;

      const startHour = String(i).padStart(2, "0");
      const endHour = String(Math.min(i + groupSize - 1, 23)).padStart(2, "0");

      result.push({
        time: `${startHour}시 ~ ${endHour}시`,
        highway: Math.round(avgHighway),
        urbanHighway: Math.round(avgUrban),
        national: Math.round(avgNational),
        city: Math.round(avgCity),
      });
    }
    return result;
  }, [data, selectedTab]);

  const chartData = useMemo(() => ({
    labels: aggregatedData.map(d => d.time),
    datasets: [
      {
        type: 'line' as const,
        label: '고속도로',
        borderColor: '#000',
        fill: false,
        data: aggregatedData.map(d => d.highway),
        tension: 0
      },
      {
        type: 'line' as const,
        label: '도시고속',
        borderColor: '#FFDD00',
        fill: false,
        data: aggregatedData.map(d => d.urbanHighway),
        tension: 0
      },
      {
        type: 'line' as const,
        label: '국도',
        borderColor: '#FF7B00',
        fill: false,
        data: aggregatedData.map(d => d.national),
        tension: 0
      },
      {
        type: 'line' as const,
        label: '시내',
        borderColor: '#0048FF',
        fill: false,
        data: aggregatedData.map(d => d.city),
        tension: 0
      }
    ]
  }), [aggregatedData]);

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
      plugins: {
        datalabels: {
          display: false
        },
        // 맨 위 데이터라벨
        legend: {
            position: 'bottom',
        },
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
            offset: true,
            ticks: {
              maxRotation: 0,
              minRotation: 0,
            },
              stacked: true,
          },
          y: {
              type: "linear",
              beginAtZero: true,
          },
      }
  }

  // Donut
  const donutData = useMemo(() => {
    if (data.length === 0) return { labels: [], datasets: [] };

    const avgHighway = data.reduce((sum, d) => sum + d.highway, 0) / data.length;
    const avgUrban = data.reduce((sum, d) => sum + d.urbanHighway, 0) / data.length;
    const avgNational = data.reduce((sum, d) => sum + d.national, 0) / data.length;
    const avgCity = data.reduce((sum, d) => sum + d.city, 0) / data.length;

    return {
      labels: ["고속도로", "도시고속", "국도", "시내도로"],
      datasets: [
        {
          data: [avgHighway, avgUrban, avgNational, avgCity],
          backgroundColor: ["#000000", "#FFDD00", "#FF7B00", "#0048FF"],
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  // 도넛 차트 옵션
  const donutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      datalabels: {
        color: "#fff",
        formatter: (value) => value.toFixed(1),
      },
    },
  };

  // toggle 표
  // const displayTableData = useMemo(() => {
  //   if (showFullTable) return data;
  //   return data.slice(0, 3);
  // }, [showFullTable, data]);

  return (
    <div className="font-sans flex flex-col items-center justify-items-center h-screen px-2 py-3 w-full bg-white">
      {/* header */}
      <div className="flex flex-row w-full h-fit border-b-2 border-gray-200 drop-shadow-gray-500">
        <div className="flex w-full justify-center items-center">
          <div className="text-black font-bold text-[28px]">이천시 교통 정보 모니터링</div>
        </div>
        <div className="flex items-end justify-end pr-20">
          <span className="material-symbols-outlined justify-center items-center cursor-pointer !text-[32px]">lists</span>
        </div>
      </div>
      
      <main className="flex flex-row flex-1 items-start justify-start w-full p-10 overflow-visible">
        {/* 좌측 메뉴 */}
          <div className="flex flex-col w-1/4 h-full items-stretch">
            <div className="mt-2 bg-gray-200 p-3 rounded-xl mb-3 w-full relative">
              <button
                onClick={() => setIsLegendOpen(!isLegendOpen)}
                className="w-full bg-white font-bold rounded-lg p-2 flex justify-between items-center"
              >
                통계표 범례
                <span className="material-symbols-outlined text-lg cursor-pointer">
                  {isLegendOpen ? "expand_less" : "expand_more"}
                </span>
              </button>
              {isLegendOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg p-3 space-y-4 border shadow-lg z-50 w-full">
                  {Object.entries(legends).map(([roadType, items]) => (
                    <div key={roadType}>
                      <h3 className="font-bold text-gray-700 mb-1">
                        {roadType === "highway" && "고속도로"}
                        {roadType === "urbanHighway" && "도시고속"}
                        {roadType === "national" && "국도"}
                        {roadType === "city" && "시내도로"}
                      </h3>
                      <ul className="pl-2 space-y-1">
                        {items.map((item) => (
                          <li key={item.label} className="flex justify-between text-sm">
                            <span>{item.label}</span>
                            <span className="text-gray-600">{item.condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-200 w-full h-fit py-3 px-2 rounded-xl flex items-center justify-center mb-3">
              {/* 토글 */}
              <div className='flex w-full h-full justify-center'>
                <div className='flex flex-col gap-2 items-center border-3 border-gray-200 bg-white w-full justify-center p-1 rounded-2xl shadow-2xs'>
                  {/* 1번 */}
                  <button
                  onClick={() => setActiveTab('traffic')} 
                  className={
                    `px-4 py-2 rounded-xl text-[14px] font-bold transition cursor-pointer
                    ${activeTab === 'traffic'
                      ? "bg-gray-400 text-black shadow-md w-full"
                      : " text-gray-950"
                    }`}
                  >시간대별 소통정보</button>
                  {/* 2번 */}
                  <button
                  onClick={() => setActiveTab('congestion')} 
                  className={
                    `px-4 py-2 rounded-xl text-[14px] font-bold transition cursor-pointer
                    ${activeTab === 'congestion'
                      ? "bg-gray-400 text-black shadow-md w-full"
                      : " text-gray-950"
                    }`}
                  >주요구간 혼잡정보</button>
                </div>
              </div>
            </div>
            {/* DatePicker */}
            <div className="bg-gray-200 w-full h-fit py-5 px-3 rounded-xl flex items-center justify-center">
              <div className='gap-4 flex items-center mt-2'>
              <span 
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="material-symbols-outlined cursor-pointer text-[32px]">keyboard_arrow_left</span>
              <div className='relative'>
                {/* date */}
                <button onClick={() => {setIsOpen(!isOpen)}}
                  className='px-4 py-2 bg-white text-black rounded cursor-pointer'>
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
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="material-symbols-outlined cursor-pointer text-[32px]">keyboard_arrow_right</span>
            </div>
            </div>
            {/* Filter */}
            <div className="py-5 px-3 flex flex-col w-full h-fit bg-gray-200 rounded-xl mt-2 items-center justify-center">
              <div className="flex flex-col gap-4 w-full h-fit">
                {[1, 3, 6].map((hour) => (
                  <div
                    key={hour}
                    onClick={() => setselectedTab(hour as 1 | 3 | 6)}
                    className={`
                      cursor-pointer px-4 py-2 rounded-lg font-bold text-center border-2
                      ${selectedTab === hour
                        ? 'bg-gray-400 text-black border-gray-600 shadow-md'
                        : 'bg-white text-gray-900 border-gray-400 hover:bg-gray-100'
                      }`}>{hour}시간</div>
                ))}
              </div>
            </div>
            {/* KakaoMap API */}
            <div className="flex flex-row w-full h-fit bg-gray-200 
            mt-5 rounded-xl items-center justify-center p-3 cursor-pointer"
            onClick={() => setShowKakaoMap(true)}>
              <span className=" bg-white rounded-xl flex items-center justify-center px-8 py-3">
                <div className="font-bold">지도 소통정보 조회</div>
              </span>
            </div>
            {showKakaoMap && (
              <KakaoMapModal onClose={() => setShowKakaoMap(false)} />
            )}
          </div>
        <div className="flex flex-col h-full w-full bg-gray-200 p-10 rounded-xl mx-10">
          <div className="flex flex-col bg-white w-full h-fit mb-2 p-4 rounded-xl shadow">
            <div className="flex flex-row w-full h-fit gap-10 mb-4">
              <button onClick={() => setShowModal(true)}
                className="bg-gray-400  font-bold px-4 py-2 rounded-lg w-1/2 hover:bg-gray-600 text-white cursor-pointer">
                통계표 보기
              </button>
              <button onClick={() => setShowDonutModal(true)} 
                className="bg-gray-400 text-white font-bold px-4 py-2 hover:bg-gray-600 w-1/2 h-fit rounded-lg cursor-pointer">
                도로별 평균 속도 보기
              </button>
            </div>
            {showDonutModal && (
              <div className="fixed inset-0 z-[60] flex justify-center items-center bg-transparent">
                <div className="relative bg-white rounded-2xl shadow-2xl 
                    w-[800px] max-h-[90vh] flex flex-col overflow-hidden m-5">
                  <div className="flex justify-between items-center px-5 py-3 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold">평균 속도 도넛 그래프</h2>
                    <button
                      onClick={() => setShowDonutModal(false)}
                      className="text-gray-600 hover:text-black text-xl font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex justify-center items-center flex-1 p-6">
                    <Chart
                      type="doughnut"
                      data={donutData}
                      options={donutOptions}
                      className="w-[90%] h-[90%] max-w-[600px] max-h-[600px]"
                    />
                  </div>
                </div>
              </div>
            )}
            <table className="w-full border text-center text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">시간</th>
                  <th className="border px-2 py-1">고속도로</th>
                  <th className="border px-2 py-1">도시고속</th>
                  <th className="border px-2 py-1">국도</th>
                  <th className="border px-2 py-1">시내도로</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 3).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-black">
                    <td className="border px-2 py-1 border-black font-bold">{row.time}</td>
                    <td className={`border border-black px-2 py-1 ${getSpeedClass("highway", row.highway)}`}>
                      {getSpeedLabel("highway", row.highway)}
                    </td>
                    <td className={`border border-black px-2 py-1 ${getSpeedClass("urbanHighway", row.urbanHighway)}`}>
                      {getSpeedLabel("urbanHighway", row.urbanHighway)}
                    </td>
                    <td className={`border border-black px-2 py-1 ${getSpeedClass("national", row.national)}`}>
                      {getSpeedLabel("national", row.national)}
                    </td>
                    <td className={`border border-black px-2 py-1 ${getSpeedClass("city", row.city)}`}>
                      {getSpeedLabel("city", row.city)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {showModal && (
              <div className="fixed inset-0 z-[50] flex justify-center items-center bg-transparent">
                <div className="relative bg-white rounded-2xl shadow-2xl
                    w-[720px] max-h-[500px] flex flex-col overflow-hidden p-5 ">
                  <div className="flex justify-between items-center px-5 py-3 
                      to-white sticky top-0 z-10">
                    <h2 className="text-lg font-bold">시간대별 소통정보</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-600 hover:text-black text-xl font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <table className="w-full text-center text-sm">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="border px-2 py-1">시간</th>
                          <th className="border px-2 py-1">고속도로</th>
                          <th className="border px-2 py-1">도시고속</th>
                          <th className="border px-2 py-1">국도</th>
                          <th className="border px-2 py-1">시내도로</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 border-black">
                            <td className="border px-2 py-1 border-black font-bold">{row.time}</td>
                            <td className={`border border-black px-2 py-1 ${getSpeedClass("highway", row.highway)}`}>
                              {getSpeedLabel("highway", row.highway)}
                            </td>
                            <td className={`border border-black px-2 py-1 ${getSpeedClass("urbanHighway", row.urbanHighway)}`}>
                              {getSpeedLabel("urbanHighway", row.urbanHighway)}
                            </td>
                            <td className={`border border-black px-2 py-1 ${getSpeedClass("national", row.national)}`}>
                              {getSpeedLabel("national", row.national)}
                            </td>
                            <td className={`border border-black px-2 py-1 ${getSpeedClass("city", row.city)}`}>
                              {getSpeedLabel("city", row.city)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-row bg-white justify-center items-center drop-shadow-gray-950 w-full flex-1 overflow-auto rounded-xl">
            <Chart type='bar' data={chartData} options={options} className='p-6 min-w-[800px]' />
          </div>
        </div>
      </main>
    </div>
  );
}
