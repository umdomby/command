} else {
               // Устанавливаем значения по умолчанию
               setServo1MinAngle(0);
               setServo1MaxAngle(180);
               setServo2MinAngle(0);
               setServo2MaxAngle(180);
               setButton1State(false);
               setButton2State(false);
               setShowServos(true);
               setServo1MinInput('0');
               setServo1MaxInput('180');
               setServo2MinInput('0');
               setServo2MaxInput('180');
               addLog('Настройки устройства не найдены, применены значения по умолчанию', 'info');