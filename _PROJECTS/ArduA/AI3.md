} else if (data.type === "log") {
    addLog(`ESP: ${data.message}`, 'esp')
    if (data.message && data.message.includes("Heartbeat")) {
        setEspConnected(true)
    }

