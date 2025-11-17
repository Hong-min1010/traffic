"use client";
import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMapView() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("KAKAO KEY", process.env.NEXT_PUBLIC_KAKAO_MAP_KEY);
    const scriptId = "kakao-map-sdk";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initMap = () => {
      console.log("KakaoMap 호출");

      if (!window.kakao) {
        console.error("[KAKAO] window.kakao 가 없습니다.");
        return;
      }
      if (!mapRef.current) {
        console.error("[KAKAO] mapRef.current 가 없습니다.");
        return;
      }

      window.kakao.maps.load(() => {
        try {
          console.log("[KAKAO] kakao.maps.load 콜백 실행");

          const center = new window.kakao.maps.LatLng(37.2726, 127.4342);
          const options = { center, level: 5 };
          const map = new window.kakao.maps.Map(mapRef.current, options);
          map.setDraggable(true);
          map.setZoomable(true);

          new window.kakao.maps.Marker({ map, position: center });

          setTimeout(() => {
            console.log("[KAKAO] resize & setCenter");
            window.kakao.maps.event.trigger(map, "resize");
            map.setCenter(center);
          }, 200);
        } catch (err) {
          console.error("[KAKAO] 지도 생성 중 에러", err);
        }
      });
    };

    if (existingScript) {
      if (window.kakao && window.kakao.maps) {
        initMap();
      } else {
        existingScript.addEventListener("load", initMap);
      }

      return () => existingScript.removeEventListener("load", initMap);
    }
    console.log("[KAKAO] 새 스크립트 추가");

    // 브라우저가 해당 스크립트를 다운로드 (지도 객체 생성(window.kakao))
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      console.log("[KAKAO] 스크립트 로드 완료");
      initMap();
    }
    script.onerror = (e) => {
      console.error("[KAKAO] 스크립트 로드 실패", e);
    }
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", initMap);
    };
  }, []);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}
