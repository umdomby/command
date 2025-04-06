Service – это компонент приложения, который используется для выполнения долгих фоновых операций без взаимодействия с пользователем. 
Любой компонент приложения может запустить сервис, который продолжит работу, даже если пользователь перейдет в другое приложение.

Started service 
   `startService`
   `stopService` or `stopSelf`
   `class MyService : Service(){ }`
   `onStartCommand`
   `START_STICKY`
   `START_NOT_STICKY`
   `START_REDELIVER_INTENT`

Foreground service
   `FOREGGROUND_SERVICE` add manifest
   `startForegroundService` `startService`
   `startForeground` add message

Bound service
   Binder, Message, AIDL
   `onBind`
   on service `bindService`
   `unbindService`

1. Foreground Service -
2. Background Service -
3. Bound Service -
   3.1 Local -
   3.2 IPC -