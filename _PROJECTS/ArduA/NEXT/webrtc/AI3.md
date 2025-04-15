Ошибка установки ответа соединения: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': Failed to parse SessionDescription. m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126 Expect line: v=




1 of 1 error
Next.js (15.1.3) out of date (learn more)

Console Error

OperationError: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': Failed to parse SessionDescription. m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126 Expect line: v=

Source
components/webrtc/hooks/useWebRTC.ts (246:50) @ setRemoteDescription

244 |
245 |                                 console.log('Устанавливаем удаленное описание с ответом');
> 246 |                                 await pc.current.setRemoteDescription(
|                                                  ^
247 |                                     new RTCSessionDescription(answerDescription)
248 |                                 );





1 of 1 error
Next.js (15.1.3) out of date (learn more)

Console Error

Ошибка ICE кандидата: {}

Source
components/webrtc/hooks/useWebRTC.ts (359:25) @ error

357 |
358 |             pc.current.onicecandidateerror = (event) => {
> 359 |                 console.error('Ошибка ICE кандидата:', event);
|                         ^
360 |                 setError('Ошибка ICE кандидата');
361 |             };
> 


не подключается с кнопки Войти в комнату
WebSocket подключен
useWebRTC.ts:347 Требуется переговорный процесс
useWebRTC.ts:312 Устанавливаем локальное описание с оффером
useWebRTC.ts:175 Получено сообщение: {data: {…}, type: 'room_info'}
useWebRTC.ts:351 Состояние сигнализации изменилось: have-local-offer
useWebRTC.ts:355 Состояние сбора ICE изменилось: gathering

Состояние сигнализации изменилось: have-local-offer
useWebRTC.ts:355 Состояние сбора ICE изменилось: gathering
useWebRTC.ts:359 Ошибка ICE кандидата: RTCPeerConnectionIceErrorEvent {isTrusted: true, address: '172.30.32.x', port: 61623, hostCandidate: '172.30.32.x:61623', url: 'stun:stun.l.google.com:19302', …}
overrideMethod @ hook.js:608
error @ intercept-console-error.js:51
pc.current.onicecandidateerror @ useWebRTC.ts:359Understand this error
useWebRTC.ts:359 Ошибка ICE кандидата: RTCPeerConnectionIceErrorEvent {isTrusted: true, address: '192.168.64.x', port: 61624, hostCandidate: '192.168.64.x:61624', url: 'stun:stun.l.google.com:19302', …}
overrideMethod @ hook.js:608
error @ intercept-console-error.js:51
pc.current.onicecandidateerror @ useWebRTC.ts:359Understand this error
useWebRTC.ts:355 Состояние сбора ICE изменилось: complete


а вот рабочий момент в логах через автоматическое подключение
2useWebRTC.ts:153 WebSocket подключен
useWebRTC.ts:347 Требуется переговорный процесс
useWebRTC.ts:312 Устанавливаем локальное описание с оффером
useWebRTC.ts:175 Получено сообщение: {data: {…}, type: 'room_info'}
useWebRTC.ts:351 Состояние сигнализации изменилось: have-local-offer
useWebRTC.ts:355 Состояние сбора ICE изменилось: gathering
useWebRTC.ts:312 Устанавливаем локальное описание с оффером
useWebRTC.ts:408 Состояние ICE соединения: checking
useWebRTC.ts:175 Получено сообщение: {type: 'answer', sdp: {…}, room: 'room1', username: 'SM-J710F', target: 'browser'}
useWebRTC.ts:245 Устанавливаем удаленное описание с ответом
useWebRTC.ts:175 Получено сообщение: {type: 'ice_candidate', ice: {…}, room: 'room1', username: 'SM-J710F'}
useWebRTC.ts:175 Получено сообщение: {type: 'ice_candidate', ice: {…}, room: 'room1', username: 'SM-J710F'}
useWebRTC.ts:175 Получено сообщение: {type: 'ice_candidate', ice: {…}, room: 'room1', username: 'SM-J710F'}
useWebRTC.ts:351 Состояние сигнализации изменилось: stable
useWebRTC.ts:175 Получено сообщение: {type: 'ice_candidate', ice: {…}, room: 'room1', username: 'SM-J710F'}
useWebRTC.ts:175 Получено сообщение: {type: 'ice_candidate', ice: {…}, room: 'room1', username: 'SM-J710F'}
useWebRTC.ts:175 Получено сообщение: {type: 'ice_candidate', ice: {…}, room: 'room1', username: 'SM-J710F'}
useWebRTC.ts:355 Состояние сбора ICE изменилось: complete
useWebRTC.ts:408 Состояние ICE соединения: connected







useWebRTC.ts:368 Ошибка ICE кандидата:
RTCPeerConnectionIceErrorEvent {isTrusted: true, address: '172.30.32.x', port: 51061, hostCandidate: '172.30.32.x:51061', url: 'stun:stun.l.google.com:19302', …}

useWebRTC.ts:368 Ошибка ICE кандидата:
RTCPeerConnectionIceErrorEvent {isTrusted: true, address: '192.168.64.x', port: 51062, hostCandidate: '192.168.64.x:51062', url: 'stun:stun.l.google.com:19302', …}
1 of 1 error
Next.js (15.1.3) out of date (learn more)

Console Error

Ошибка ICE кандидата: {}

Source
components/webrtc/hooks/useWebRTC.ts (368:25) @ error

366 |
367 |             pc.current.onicecandidateerror = (event) => {
> 368 |                 console.error('Ошибка ICE кандидата:', event);
|                         ^
369 |                 // Игнорируем определенные типы ошибок
370 |                 if (event.errorCode !== 701 && event.errorCode !== 702) {
371 |                     setError('Ошибка ICE кандидата: ' + event.errorText);
> 
>


Ошибка входа в комнату: WebSocket закрыт
1 of 1 error
Next.js (15.1.3) out of date (learn more)

Console Error

Error: WebSocket закрыт

Source
components/webrtc/hooks/useWebRTC.ts (466:32) @ checkConnection

464 |                         resolve(true);
465 |                     } else if (ws.current?.readyState === WebSocket.CLOSED) {
> 466 |                         reject(new Error('WebSocket закрыт'));
|                                ^
467 |                     } else {
468 |                         setTimeout(checkConnection, 100);
469 |                     }
> 

