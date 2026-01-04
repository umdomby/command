void onMessageCallback(WebsocketsMessage message) {
    uint8_t* data = (uint8_t*)message.c_str();  // или message.data()
    size_t len = message.length();
    if (len < 1) return;

    uint8_t cmd = data[0];
    switch(cmd) {
        case 0: stopMotors(); break;
        case 1: // SPD
            if(len >= 3) {
                uint8_t motor = data[1];  // 0=A, 1=B
                uint8_t speed = data[2];
                analogWrite(motor == 0 ? enA : enB, speed);
            }
            break;
        // Добавьте другие команды аналогично
    }
    // Ack можно отправить binary или простым текстом
}