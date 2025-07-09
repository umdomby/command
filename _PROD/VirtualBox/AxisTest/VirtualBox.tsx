"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VirtualBoxWithPermission = () => {
    const [alpha, setAlpha] = useState<number | null>(null);
    const [beta, setBeta] = useState<number | null>(null);
    const [gamma, setGamma] = useState<number | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const requestPermissions = useCallback(async () => {
        try {
            if (
                typeof DeviceOrientationEvent !== "undefined" &&
                typeof DeviceOrientationEvent.requestPermission === "function"
            ) {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === "granted") {
                    setPermissionGranted(true);
                } else {
                    setError("Разрешение не получено");
                }
            } else {
                // Android или десктоп, разрешение не требуется
                setPermissionGranted(true);
            }
        } catch (err) {
            console.error(err);
            setError("Ошибка при запросе разрешения");
        }
    }, []);

    useEffect(() => {
        if (!permissionGranted) return;

        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.alpha !== null) setAlpha(event.alpha);
            if (event.beta !== null) setBeta(event.beta);
            if (event.gamma !== null) setGamma(event.gamma);
        };

        window.addEventListener("deviceorientation", handleOrientation);

        return () => {
            window.removeEventListener("deviceorientation", handleOrientation);
        };
    }, [permissionGranted]);

    return (
        <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
            <h2>Ориентация устройства</h2>

            {!permissionGranted ? (
                <button onClick={requestPermissions} style={{ padding: "0.5rem 1rem", fontSize: "16px" }}>
                    Разрешить доступ к сенсорам
                </button>
            ) : (
                <div>
                    <p>Alpha (ось Z — азимут): {alpha !== null ? alpha.toFixed(2) : "Ожидание..."}</p>
                    <p>Beta (ось X — наклон вперёд/назад): {beta !== null ? beta.toFixed(2) : "Ожидание..."}</p>
                    <p>Gamma (ось Y — наклон вбок): {gamma !== null ? gamma.toFixed(2) : "Ожидание..."}</p>
                </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default VirtualBoxWithPermission;
