balanced
Агент ICE начинает с создания одного RTCDtlsTransportдля обработки каждого типа добавленного контента: 
один для аудио, один для видео и один для канала данных RTC, если применимо. Если удаленный одноранговый узел не поддерживает BUNDLE, 
агент ICE выбирает одну аудиодорожку и одну видеодорожку, и эти две дорожки назначаются соответствующим RTCDtlsTransport. 
Все остальные дорожки игнорируются соединением. Это политика по умолчанию и наиболее совместимая.
max-compat
Агент ICE изначально создает один RTCDtlsTransportдля каждой медиадорожки и отдельный для RTCDataChannel, 
если таковая создана. Если удаленная конечная точка не может справиться с объединением, каждая медиадорожка 
согласовывается на своем собственном отдельном транспорте. Это вводит объединение, но откатится к отсутствию объединения, 
если удаленный одноранговый узел не может с ним справиться.
max-bundle
Агент ICE начинает с создания одного RTCDtlsTransportдля обработки всех медиаданных соединения. 
Если удаленный пир несовместим с пакетом, согласовывается только одна медиадорожка, а остальные игнорируются. 
Это максимизирует пакетирование с риском потери треков, если удаленный пир не может выполнить пакетирование.