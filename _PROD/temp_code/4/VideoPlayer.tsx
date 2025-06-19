import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui";

interface VideoPlayerProps {
    stream: MediaStream | null;
    muted?: boolean;
    className?: string;
    transform?: string;
    videoRef?: React.RefObject<HTMLVideoElement | null>;
}

type VideoSettings = {
    rotation: number;
    flipH: boolean;
    flipV: boolean;
};

export const VideoPlayer = ({ stream, muted = true, className, transform, videoRef }: VideoPlayerProps) => {
    const internalVideoRef = useRef<HTMLVideoElement>(null);
    const [computedTransform, setComputedTransform] = useState<string>('');
    const [isRotated, setIsRotated] = useState(false);
    const actualVideoRef = videoRef || internalVideoRef;
    const [isMuted, setIsMuted] = useState(muted);

    // Обработка transform
    useEffect(() => {
        if (typeof transform === 'string') {
            setComputedTransform(transform);
            setIsRotated(transform.includes('rotate(90deg') || transform.includes('rotate(270deg)'));
        } else {
            try {
                const saved = localStorage.getItem('videoSettings');
                if (saved) {
                    const { rotation, flipH, flipV } = JSON.parse(saved) as VideoSettings;
                    let fallbackTransform = '';
                    if (rotation !== 0) fallbackTransform += `rotate(${rotation}deg) `;
                    fallbackTransform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;
                    setComputedTransform(fallbackTransform);
                    setIsRotated(rotation === 90 || rotation === 270);
                } else {
                    setComputedTransform('');
                    setIsRotated(false);
                }
            } catch (e) {
                console.error('Error parsing saved video settings:', e);
                setComputedTransform('');
                setIsRotated(false);
            }
        }
    }, [transform]);

    // Привязка потока и автопроигрывание
    useEffect(() => {
        const video = actualVideoRef.current;
        if (!video) return;

        console.log('Привязка потока к видеоэлементу:', {
            streamId: stream?.id,
            videoTracks: stream?.getVideoTracks().length,
            audioTracks: stream?.getAudioTracks().length,
            videoTrackEnabled: stream?.getVideoTracks()[0]?.enabled,
            videoTrackReadyState: stream?.getVideoTracks()[0]?.readyState,
            videoTrackId: stream?.getVideoTracks()[0]?.id,
        });

        const handleCanPlay = () => {
            console.log('Видео готово к воспроизведению');
            if (stream) {
                video.play().catch((e) => {
                    console.warn('Initial play failed:', e);
                    if (!isMuted) {
                        setIsMuted(true);
                        video.muted = true;
                        video.play().catch((e2) => console.error('Muted playback failed:', e2));
                    }
                });
            }
        };

        const handleError = () => {
            console.error('Ошибка видеоэлемента:', video.error);
        };

        const handleLoadedMetadata = () => {
            console.log('Метаданные видео загружены:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
            });
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.warn('Пустой видеотрек: размеры видео равны нулю');
            }
        };

        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        if (stream && stream.getVideoTracks().length > 0) {
            video.srcObject = stream;
            video.muted = isMuted;
        } else {
            video.srcObject = null;
            console.warn('Поток отсутствует или не содержит видеотреков');
        }

        return () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.srcObject = null;
        };
    }, [stream, actualVideoRef, isMuted]);

    // Автоматическое включение звука через 2 секунды после загрузки метаданных
    useEffect(() => {
        const video = actualVideoRef.current;
        if (!video || !stream) return;

        const handleLoadedMetadata = () => {
            console.log('Запуск таймера для включения звука через 2 секунды');
            const timer = setTimeout(() => {
                if (video) {
                    video.muted = false;
                    setIsMuted(false);
                    console.log('Звук включён автоматически');
                    // Включаем аудиотреки в потоке
                    stream.getAudioTracks().forEach((track) => {
                        track.enabled = true;
                    });
                }
            }, 2000); // 2 секунды

            return () => clearTimeout(timer); // Очистка таймера
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [stream, actualVideoRef]);

    // Функция для переключения звука
    const toggleMute = () => {
        const video = actualVideoRef.current;
        if (video) {
            const newMutedState = !isMuted;
            video.muted = newMutedState;
            setIsMuted(newMutedState);
            console.log('Звук переключён:', newMutedState ? 'отключён' : 'включён');

            if (stream) {
                stream.getAudioTracks().forEach((track) => {
                    track.enabled = !newMutedState;
                });
            }
        }
    };

    return (
        <div className="relative w-full h-full">
            <video
                ref={actualVideoRef}
                playsInline
                autoPlay
                muted={isMuted}
                className={`${className || ''} ${isRotated ? 'rotated' : ''}`}
                style={{
                    transform: computedTransform,
                    transformOrigin: 'center center',
                    background: 'black',
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%',
                }}
            />
            {stream && (
                <Button
                    onClick={toggleMute}
                    className="absolute bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1 z-10"
                    title={isMuted ? 'Включить звук' : 'Отключить звук'}
                >
                    {isMuted ? '🔈 Включить звук' : '🔇 Отключить звук'}
                </Button>
            )}
        </div>
    );
};