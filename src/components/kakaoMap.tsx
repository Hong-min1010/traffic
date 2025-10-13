"use client";
import React, { useEffect, useRef } from "react";

interface KakaoMapModalProps {
  onClose: () => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMapModal({ onClose }: KakaoMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 카카오 스크립트가 로드된 후에 실행
    if (!window.kakao || !mapRef.current) return;

    window.kakao.maps.load(() => {
      const center = new window.kakao.maps.LatLng(37.2726, 127.4342);

      const options = {
        center,
        level: 5,
      };

      const map = new window.kakao.maps.Map(mapRef.current, options);

      // 마커 추가
      new window.kakao.maps.Marker({
        map,
        position: center,
      });

      // ✅ 모달 렌더 후 지도 리사이즈 및 센터 고정
      setTimeout(() => {
        window.kakao.maps.event.trigger(map, "resize");
        map.setCenter(center);
      }, 200);
    });
  }, []);


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-[600px] h-[500px] rounded-lg shadow-lg flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">지도</h2>
          <button onClick={onClose}>닫기</button>
        </div>
        <div ref={mapRef} className="flex-1 min-h-[400px] rounded-b-lg" />
      </div>
    </div>
  );
}