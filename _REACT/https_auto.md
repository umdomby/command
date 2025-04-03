// Автоматическое определение протокола (wss для https, ws для http)
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.host}/ws`;