import Image from "next/image";
"use client";
import type { ChartOptions } from "chart.js";
import {
  Chart as ChartJS,
  registerables
} from "chart.js";
import { Chart } from "react-chartjs-2";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { addDays, format, subDays } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import ChartDataLabels from "chartjs-plugin-datalabels";
import instance from "./axiosInstance";
import KakaoMapView from "@/components/KakaoMapView";

ChartJS.register(...registerables, ChartDataLabels);

type TrafficInfo = {
  time: string;
  value: number;
};

type DailyInfo = {
  title: string;
  value: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"traffic" | "congestion">("traffic");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = React.useState<TrafficInfo[]>([]);
  const [dailyData, setDailyData] = useState<DailyInfo | null>(null);
  const [selectedTab, setselectedTab] = useState<1 | 3 | 6>(1);
  const [showModal, setShowModal] = useState(false);
  const [showDonutModal, setShowDonutModal] = useState(false);
  const [showKakaoMap, setShowKakaoMap] = useState(false);
  const [noticModalOpen, setNoticeModalOpen] = useState(false);

  const today = new Date();

  const y = selectedDate.getFullYear();
  const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const d = String(selectedDate.getDate()).padStart(2, "0");
  const searchDt = `${y}/${m}/${d}`;

  // 달력 외부 클릭 시 닫기
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


        const res = await instance.get("/getTimeTrafInfo", {
          params: {
            serviceKey: process.env.NEXT_PUBLIC_DATA_API_KEY,
            apiType: "json",
            searchDt
          }
        });

        console.log("res", res.data);
        const json = res.data;

        if (json && json.header?.resultCode === "00") {
          const apiData: TrafficInfo[] = Array.from({ length: 24 }, (_, i) => {
            const key = `hour${i}` as keyof typeof json;
            const value = typeof json[key] === "number" ? (json[key] as number) : 0;

            return {
              time: `${String(i).padStart(2, "0")}시`,
              value
            };
          });

          setData(apiData);
          setNoticeModalOpen(false);
          return;
        }

        throw new Error("API response 에러: 형식 불일치");
      } catch (e) {
        console.log("API 요청 실패", e);
        setData([]);
        setNoticeModalOpen(true);
      }
    }
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    async function fetchDaily() {
      try {
        const res = await instance.get('/getDailyTrafInfo', {
          params: {
            serviceKey: process.env.NEXT_PUBLIC_DATA_API_KEY,
            apiType: 'json',
            searchDt: searchDt
          }
        })
        const json = res.data;
        if (json && json.header?.resultCode === "00") {
          const raw = (json as any).dailySped;
          const value = raw !== undefined && raw !== null ? Number(raw) : 0;
          
          setDailyData({
            title: '금일 소통정보',
            value,
          });
        } else {
          setDailyData(null);
        }
      } catch(e) {
          console.log('Daily API 요청 실패', e);
          setDailyData(null);
      }
    } 
    fetchDaily();
  }, [selectedDate])

  useEffect(() => {
    if (showModal || showDonutModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal, showDonutModal]);

  const aggregatedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const groupSize = selectedTab;

    if (groupSize === 1) {
      return data.filter((d) => d.value > 0);
    }

    const result: TrafficInfo[] = [];

    for (let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize);
      const nonZero = group.filter((g) => g.value > 0);

      if (nonZero.length === 0) continue;

      const avg =
        nonZero.reduce((sum, g) => sum + g.value, 0) / nonZero.length;

      const startHour = String(i).padStart(2, "0");
      const endHour = String(Math.min(i + groupSize - 1, 23)).padStart(2, "0");

      result.push({
        time: `${startHour}시 ~ ${endHour}시`,
        value: Math.round(avg)
      });
    }

    return result;
  }, [data, selectedTab]);

  const chartData = useMemo(
    () => ({
      labels: aggregatedData.map((d) => d.time),
      datasets: [
        {
          type: "line" as const,
          label: "이천시 소통정보",
          borderColor: "#000",
          fill: false,
          data: aggregatedData.map((d) => d.value),
          tension: 0
        }
      ]
    }),
    [aggregatedData]
  );

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false
      },
      legend: {
        position: "bottom"
      },
      tooltip: {
        callbacks: {
          label(tooltipItem: any) {
            const label = chartData.datasets[tooltipItem.datasetIndex].label || "";
            const value = tooltipItem.formattedValue;
            return [`${label}: ${value}`];
          }
        }
      }
    },
    scales: {
      x: {
        offset: true,
        ticks: {
          maxRotation: 0,
          minRotation: 0
        },
        stacked: true
      },
      y: {
        type: "linear",
        beginAtZero: true
      }
    }
  };

  const donutData = useMemo(() => {
    if (aggregatedData.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: aggregatedData.map((d) => d.time),
      datasets: [
        {
          data: aggregatedData.map((d) => d.value),
          backgroundColor: aggregatedData.map((_, idx) => {
            const colors = ["#000000", "#FFDD00", "#FF7B00", "#0048FF", "#8884d8", "#00c49f"];
            return colors[idx % colors.length];
          }),
          borderWidth: 1
        }
      ]
    };
  }, [aggregatedData]);

  const donutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom"
      },
      datalabels: {
        color: "#fff",
        formatter: (value) => value.toFixed(1)
      }
    }
  };

  return (
    <div className="font-sans flex flex-col items-center justify-items-center h-screen px-2 py-3 w-full bg-white">
      {/* header */}
      <div className="flex flex-row w-full h-fit border-b-2 border-gray-200 drop-shadow-gray-500">
        <div className="flex w-full justify-center items-center">
          <div className="text-black font-bold text-[28px]">이천시 교통 정보 모니터링</div>
        </div>
      </div>

      <main className="flex flex-row flex-1 items-start justify-start w-full p-10 overflow-visible">
        {/* 안내 모달 */}
        {noticModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[360px] max-w-[90vw] p-6">
              <h2 className="text-lg font-bold mb-3">안내</h2>
              <p className="text-sm text-gray-700 mb-5">
                현재 API 응답 오류로 인해 데이터가 표시되지 않고 있습니다.
              </p>
              <button
                onClick={() => setNoticeModalOpen(false)}
                className="w-full bg-gray-800 text-white font-semibold py-2 rounded-lg hover:bg-gray-900 cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        )}

        {/* 좌측 메뉴 */}
        <div className="flex flex-col w-1/4 h-full items-stretch">
          {/* 금일 소통정보 */}
          <div className="flex flex-row w-full h-fit bg-gray-200 rounded-xl items-center justify-center p-3 mb-5">
            <div className=" bg-white rounded-xl flex items-center justify-between px-8 py-3 w-full">
              <span className="font-bold text-lg">
                {dailyData ? dailyData.title : "금일 소통정보"}
              </span>
              <span className="font-bold text-red-400 text-2xl w-fit h-fit text-center">
                {dailyData ? dailyData.value : "-"}
              </span>
            </div>
          </div>
          <div className="bg-gray-200 w-full h-fit py-3 px-2 rounded-xl flex items-center justify-center mb-3">
            {/* 토글 */}
            <div className="flex w-full h-full justify-center">
              <div className="flex flex-col gap-2 items-center border-3 border-gray-200 bg-white w-full justify-center p-1 rounded-2xl shadow-2xs">
                <button
                  onClick={() => setActiveTab("traffic")}
                  className={`px-4 py-2 rounded-xl text-[14px] font-bold transition cursor-pointer ${
                    activeTab === "traffic"
                      ? "bg-gray-400 text-black shadow-md w-full"
                      : " text-gray-950"
                  }`}
                >
                  시간대별 소통정보
                </button>
                <button
                  onClick={() => setActiveTab("congestion")}
                  className={`px-4 py-2 rounded-xl text-[14px] font-bold transition cursor-pointer ${
                    activeTab === "congestion"
                      ? "bg-gray-400 text-black shadow-md w-full"
                      : " text-gray-950"
                  }`}
                >
                  주요구간 혼잡정보
                </button>
              </div>
            </div>
          </div>

          {/* DatePicker */}
          <div className="bg-gray-200 w-full h-fit py-5 px-3 rounded-xl flex items-center justify-center">
            <div className="gap-4 flex items-center mt-2">
              <span
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="material-symbols-outlined cursor-pointer text-[32px]"
              >
                keyboard_arrow_left
              </span>
              <div className="relative">
                <button
                  onClick={() => {
                    setIsOpen(!isOpen);
                  }}
                  className="px-4 py-2 bg-white text-black rounded cursor-pointer"
                >
                  {format(selectedDate, "yyyy-MM-dd")}
                </button>
                {isOpen && (
                  <div
                    ref={datePickerRef}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 shadow-lg h-full z-50"
                  >
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => {
                        if (date) setSelectedDate(date);
                        setIsOpen(false);
                      }}
                      locale={ko}
                      inline
                      maxDate={today}
                      filterDate={(date) =>
                        date.getMonth() === selectedDate.getMonth() && date <= today
                      }
                      calendarClassName="!m-0 !p-0 !shadow-none !rounded-lg"
                      dayClassName={(date) =>
                        date.getMonth() !== selectedDate.getMonth() || date > today
                          ? "text-gray-400 pointer-events-none"
                          : "text-black cursor-pointer"
                      }
                    />
                  </div>
                )}
              </div>
              <span
                onClick={() => {
                  const next = addDays(selectedDate, 1);
                  if (next <= today) {
                    setSelectedDate(next);
                  }
                }}
                className={`material-symbols-outlined text-[32px] ${
                  addDays(selectedDate, 1) <= today
                    ? "cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                keyboard_arrow_right
              </span>
            </div>
          </div>

          {/* Filter */}
          <div className="py-5 px-3 flex flex-col w-full h-fit bg-gray-200 rounded-xl mt-2 items-center justify-center">
            <div className="flex flex-col gap-4 w-full h-fit">
              {[1, 3, 6].map((hour) => (
                <div
                  key={hour}
                  onClick={() => setselectedTab(hour as 1 | 3 | 6)}
                  className={`cursor-pointer px-4 py-2 rounded-lg font-bold text-center border-2 ${
                    selectedTab === hour
                      ? "bg-gray-400 text-black border-gray-600 shadow-md"
                      : "bg-white text-gray-900 border-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {hour}시간
                </div>
              ))}
            </div>
          </div>

          {/* KakaoMap API */}
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex flex-col h-full w-full bg-gray-200 p-10 rounded-xl mx-10">
          <div className="flex flex-col bg-white w-full h-fit mb-2 p-4 rounded-xl shadow">
            <div className="flex flex-row w-full h-fit gap-10 mb-4">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gray-400  font-bold px-4 py-2 rounded-lg w-1/2 hover:bg-gray-600 text-white cursor-pointer"
              >
                통계표 보기
              </button>
              <button
                onClick={() => setShowDonutModal(true)}
                className="bg-gray-400 text-white font-bold px-4 py-2 hover:bg-gray-600 w-1/2 h-fit rounded-lg cursor-pointer"
              >
                도넛 그래프 보기
              </button>
            </div>

            {/* 통계표 모달 */}
            {showModal && (
              <div className="fixed inset-0 z-[50] flex justify-center items-center bg-black/30">
                <div className="relative bg-white rounded-2xl shadow-2xl w-[720px] max-h-[500px] flex flex-col overflow-hidden p-5">
                  <div className="flex justify-between items-center px-1 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold">시간대별 소통지표</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-600 hover:text-black text-xl font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mt-2">
                    <table className="w-full text-center text-base border">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="border px-2 py-2 text-lg">시간대</th>
                          <th className="border px-2 py-2 text-lg">소통지표</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-4 py-2 font-bold text-base">{row.time}</td>
                            <td className="border px-4 py-2 text-base">{row.value}</td>
                          </tr>
                        ))}
                        {aggregatedData.length === 0 && (
                          <tr>
                            <td
                              className="border px-2 py-3 text-gray-500 text-sm"
                              colSpan={2}
                            >
                              표시할 데이터가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 도넛 모달 */}
            {showDonutModal && (
              <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/30">
                <div className="relative bg-white rounded-2xl shadow-2xl w-[800px] max-h-[90vh] flex flex-col overflow-hidden m-5">
                  <div className="flex justify-between items-center px-5 py-3 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold">시간대별 소통지표 도넛 그래프</h2>
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
          </div>

          {/* 메인 차트 */}
          <div className="flex flex-row bg-white justify-center items-center drop-shadow-gray-950 w-full flex-1 overflow-auto rounded-xl">
            {activeTab === "traffic" ? (
              <Chart
                type="bar"
                data={chartData}
                options={options}
                className="p-6 min-w-[800px] w-full h-full"
              />
            ) : (
              <div className="p-6 w-full h-full">
                <KakaoMapView />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
