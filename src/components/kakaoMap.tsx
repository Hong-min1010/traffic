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
  const initMap = () => {
      if (!window.kakao || !mapRef.current) return;

      window.kakao.maps.load(() => {
      const options = {
          center: new window.kakao.maps.LatLng(37.2726, 127.4342),
          level: 5,
      };
      const map = new window.kakao.maps.Map(mapRef.current, options);

      new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(37.2726, 127.4342),
      });
      });
  };

  // kakao 객체가 로드될 때까지 기다림
  if (window.kakao && window.kakao.maps) {
      initMap();
  } else {
      const checkInterval = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
          clearInterval(checkInterval);
          initMap();
      }
      }, 100);
      return () => clearInterval(checkInterval);
  }
  }, []);


  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[70]">
      <div className="bg-white w-[800px] h-[600px] rounded-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-600 hover:text-black text-xl font-bold cursor-pointer"
        >
          ✕
        </button>
        <div ref={mapRef} className="w-full h-full rounded-2xl" />
      </div>
    </div>
  );
}