                            // Выбираем голос (например, мужской)
                            val preferredVoice = voices.firstOrNull { voice ->
                                voice.name.contains("male", ignoreCase = true) ||
                                        voice.name.contains("ru-RU-Standard-B") || // Пример: мужской голос Google TTS
                                        voice.name.contains("ru-RU-Wavenet-B")
                            } ?: voices.firstOrNull() // Если предпочтительный голос не найден, берём первый доступный