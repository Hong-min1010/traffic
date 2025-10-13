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
    const scriptId = "kakao-map-sdk";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      if (window.kakao && window.kakao.maps) {
        initMap();
      } else {
        existingScript.addEventListener("load", initMap);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);

    function initMap() {
      if (!window.kakao || !mapRef.current) return;

      window.kakao.maps.load(() => {
        const center = new window.kakao.maps.LatLng(37.2726, 127.4342);
        const options = { center, level: 5 };
        const map = new window.kakao.maps.Map(mapRef.current, options);

        new window.kakao.maps.Marker({ map, position: center });

        setTimeout(() => {
          window.kakao.maps.event.trigger(map, "resize");
          map.setCenter(center);
        }, 200);
      });
    }

    return () => {
      script.removeEventListener("load", initMap);
    };
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
