    conn.SetPingHandler(func(appData string) error {
        log.Printf("Получен ping от %s", remoteAddr)
        err := conn.WriteMessage(websocket.PongMessage, []byte("pong"))
        if err != nil {
            log.Printf("Ошибка отправки pong: %v", err)
        }
        return nil
    })

    conn.SetPongHandler(func(appData string) error {
        log.Printf("Получен pong от %s", remoteAddr)
        return nil
    })

    // Регулярные ping-запросы клиенту
    go func() {
        ticker := time.NewTicker(30 * time.Second)
        defer ticker.Stop()

        for {
            select {
            case <-ticker.C:
                if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                    log.Printf("Ошибка отправки ping: %v", err)
                    return
                }
            }
        }
    }()