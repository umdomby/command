useWebRTC.ts:579 Ошибка входа в комнату: Error: WebSocket закрыт
at checkConnection (useWebRTC.ts:556:32)

Ошибка входа в комнату: WebSocket закрыт


1 of 1 error
Next.js (15.1.3) out of date (learn more)

Console Error

Error: WebSocket закрыт

Source
components/webrtc/hooks/useWebRTC.ts (556:32) @ checkConnection

554 |                         resolve(true);
555 |                     } else if (ws.current?.readyState === WebSocket.CLOSED) {
> 556 |                         reject(new Error('WebSocket закрыт'));
|                                ^
557 |                     } else {
558 |                         setTimeout(checkConnection, 100);
559 |                     }
