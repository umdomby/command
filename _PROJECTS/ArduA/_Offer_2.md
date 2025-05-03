Хорошо, я понял идею. 
Вы хотите придерживаться структуры первого варианта кода, где 
лидер постоянно находится в комнате, но добавить механизм, который заставляет лидера "перезайти" в комнату (создать новое WebRTC соединение), 
как только подключается новый ведомый. Это может помочь решить проблемы с "зависшим" видео, 
так как каждая сессия для ведомого будет начинаться с абсолютно чистого WebRTC состояния у лидера.

Этот подход действительно проще, чем логика с "ожидающим" лидером, и может быть эффективным решением проблемы.

Давайте возьмем ваш первый предоставленный код за основу и внедрим эту логику "перезахода" лидера.

Изменения:

handlePeerJoin: Когда подключается ведомый (!isLeader) к комнате, где уже есть лидер:
Логика замены старого ведомого (если он был) остается.
Создается Peer и PeerConnection для нового ведомого.
Вместо того, чтобы просто просить лидера отправить оффер, сервер отправляет лидеру новую команду, например, {"type": "rejoin_and_offer", "room": roomID}.
Клиент Лидера (Android - требуется ваша доработка): Должен обработать команду rejoin_and_offer:
Закрыть текущий RTCPeerConnection.
Создать новый RTCPeerConnection.
Добавить медиа треки к новому соединению.
Создать новый offer.
Отправить этот offer серверу сообщением {"type": "offer", ...}.
handleWebSocket (Сервер):
При получении сообщения offer от лидера, сервер пересылает его ведомому в той же комнате.
При получении answer от ведомого, сервер пересылает его лидеру.
При получении ice_candidate, сервер пересылает его другому участнику комнаты.
Важно: Сервер не будет пересоздавать объект peer.pc для лидера на своей стороне. Мы предполагаем, что новый цикл offer/answer и обмен ICE кандидатами через тот же WebSocket будет достаточен для установки нового WebRTC соединения, инициированного клиентом лидера.


Пояснения к изменениям:


При подключении ведомого, если лидер уже есть, вместо create_offer_for_new_follower теперь отправляется команда {"type": "rejoin_and_offer", "room": roomID} клиенту лидера.
Остальная логика handlePeerJoin (проверки, создание PeerConnection для подключающегося, замена старого ведомого) осталась прежней.
handleWebSocket:
Цикл чтения и основная структура остались прежними.
Логика пересылки сообщений (offer, answer, ice_candidate) уточнена: она проверяет роли отправителя и получателя (как в исправленной версии ранее), чтобы гарантировать правильную маршрутизацию, и пересылает сообщение только если второй участник (targetPeer) найден в комнате.
Убрана любая логика, где сервер пытался сам создать или повторно отправить оффер (типа resend_offer). Вся инициатива по созданию оффера теперь лежит на клиенте лидера после получения команды rejoin_and_offer.
Клиент Лидера (Важно!): Вам необходимо доработать код вашего Android-клиента (лидера), чтобы он слушал и обрабатывал новое сообщение {"type": "rejoin_and_offer"} от сервера. При получении этого сообщения клиент должен выполнить шаги, описанные выше: закрыть старый RTCPeerConnection, создать новый, добавить треки, создать новый offer и отправить его на сервер.
Этот вариант сохраняет простоту управления комнатами из первого кода, но добавляет механизм принудительного обновления WebRTC-сессии со стороны лидера при каждом подключении ведомого, что, как вы надеетесь, решит проблему с задержками видео на мобильных браузерах.


### 
Пояснения к основным изменениям:

handleWebSocketMessage:

Удалена обработка сообщения "offer". Лидер не принимает офферы.
Добавлена обработка нового сообщения "rejoin_and_offer".
Извлекается followerUsername ( предполагается, что сервер его присылает!).
Вызывается новый метод resetAndInitiateOffer(followerUsername).
Обработка "answer" теперь проверяет, совпадает ли caller с currentFollowerUsername.
Обработка "ice_candidate" теперь добавляет кандидат, только если currentFollowerUsername не null (т.е. мы ожидаем кандидата от конкретного ведомого).
resetAndInitiateOffer(targetUsername: String?):

Новый метод.
Проверяет targetUsername.
Выполняет полный сброс WebRTC через cleanupWebRTCResources() и initializeWebRTC(). Это гарантирует абсолютно чистое состояние PeerConnection и пере-добавление локальных треков.
Сохраняет targetUsername в currentFollowerUsername.
Вызывает createOffer(targetUsername) после небольшой задержки.
createOffer(targetUsername: String):

Теперь принимает targetUsername в качестве параметра.
Удалена ручная модификация SDP для H264 (это ненадежно, лучше настраивать кодеки через PeerConnectionFactory или setCodecPreferences, если необходимо). Оставлена стандартная генерация оффера.
В onCreateSuccess вызывает setLocalDescription(offerDescription, targetUsername).
setLocalDescription(desc: SessionDescription, targetUsername: String):

Новый метод.
Принимает targetUsername.
Устанавливает локальное описание.
В onSetSuccess вызывает sendSdpOffer(desc, targetUsername).
sendSdpOffer(desc: SessionDescription, targetUsername: String):

Новый метод (заменяет старый sendSessionDescription для оффера).
Принимает targetUsername.
Формирует JSON с полем "target": targetUsername и отправляет на сервер.
Удалены handleOffer и createAnswer: Эти методы больше не нужны Лидеру.

handleAnswer:

Добавлена проверка if (caller == currentFollowerUsername).
Удален вызов createOffer() при ошибке onSetFailure. Теперь просто логируется ошибка и закрывается соединение (webRTCClient.closePeerConnection).
sendIceCandidate(candidate: IceCandidate, targetUsername: String?):

Теперь принимает targetUsername.
Отправляет кандидата только если targetUsername не null и совпадает с currentFollowerUsername.
Включает "target": targetUsername в JSON.
createPeerConnectionObserver:

onIceCandidate теперь вызывает sendIceCandidate(it, currentFollowerUsername).
onConnectionChange при состояниях FAILED, CLOSED, DISCONNECTED теперь сбрасывает currentFollowerUsername.
Адаптация качества (bandwidthEstimationRunnable и связанные методы):

Логика адаптации качества немного улучшена (использует availableOutgoingBitrate, проверяет количество пакетов).
ВАЖНО: Для работы этой логики вам нужно добавить методы getCurrentMaxBitrate(), getCurrentCaptureWidth() и changeCaptureFormat(width, height, fps) в ваш класс WebRTCClient.kt.
Сброс PeerConnection: Вместо добавления recreatePeerConnection() в WebRTCClient, я использовал существующую связку cleanupWebRTCResources() + initializeWebRTC() в resetAndInitiateOffer, так как это проще и гарантирует полный сброс. Если вы предпочитаете более гранулярный контроль, можете добавить recreatePeerConnection в WebRTCClient.

Напоминание: Убедитесь, что ваш сервер Go действительно отправляет followerUsername в сообщении rejoin_and_offer. Без этого Android не будет знать, кому отправлять оффер.