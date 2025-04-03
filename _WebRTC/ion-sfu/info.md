
https://github.com/ionorg/ion-examples/tree/master/ion-sfu

pub-sub-in-browser : демонстрирует, как можно публиковать и подписываться на поток с помощью ion-sfu из браузера.
pub-from-browser : Демонстрирует, как можно опубликовать поток в ion-sfu из браузера.
pub-from-disk : Демонстрирует, как отправлять видео и/или аудио в ion-sfu из файлов на диске.
sub-to-browser : Демонстрирует, как можно подписаться на поток из ion-sfu.
pub-mediadevice : демонстрирует, как можно считывать данные с камеры с помощью библиотеки Pion Mediadevice и публиковать поток на ion-sfuсервере.
custom-signaling : демонстрирует, как можно публиковать данные в экземпляре ion-sfu из браузера с помощью пользовательского интерфейса сигнализации.
pub-from-disk-using-grpc : Демонстрирует, как отправлять видео и/или аудио в ion-sfu из файлов на диске.
sub-to-disk-using-grpc : Демонстрирует, как подписаться на поток из ion-sfu и сохранить VP8/Opus на диск.


1. Нужен самый простой и важно!!! рабочий проект: GO-lang React WebRTC SFU-сервер Документация: pion/ion-sfu https://github.com/ionorg/ion-sfu
   можно вообще без комнат, главное чтобы работал!!! и без ошибок запускался.
   Server GO:
   module server

go 1.24.1

2. React раздели на 2 файла: 1) App.js соединение и логика, 2) выбор устройств (оптимизируй чтобы устройства можно было выбрать на всех устройствах
   во всех современных браузерах и мобильных устройствах)

3. SFU-сервер - я его ни разу не устанавливал, расскажи по порядку как его настроить и в коде над каждой функцией пиши русский комментарий.
   Дай полные файлы для каждой части, чтобы заходя на сайт активизировалась стандартная камера и звук,

4. а потом в работе сразу можно было переключать камеру и устройство звука.
   rc\components\Icons.jsx используй иконки
   import React from 'react';

export const VideoOnIcon = ({ className = '' }) => (
<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<polygon points="23 7 16 12 23 17 23 7"></polygon>
<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
</svg>
);

export const VideoOffIcon = ({ className = '' }) => (
<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
<line x1="1" y1="1" x2="23" y2="23"></line>
</svg>
);

export const MicOnIcon = ({ className = '' }) => (
<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
<line x1="12" y1="19" x2="12" y2="23"></line>
<line x1="8" y1="23" x2="16" y2="23"></line>
</svg>
);

export const MicOffIcon = ({ className = '' }) => (
<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<line x1="1" y1="1" x2="23" y2="23"></line>
<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
<path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
<line x1="12" y1="19" x2="12" y2="23"></line>
<line x1="8" y1="23" x2="16" y2="23"></line>
</svg>
);

export const SendIcon = ({ className = '' }) => (
<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<line x1="22" y1="2" x2="11" y2="13"></line>
<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
</svg>
);