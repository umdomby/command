# В одном терминале:
wscat -c wss://anybet.site/ws
> {"event":"join","data":""}

# В другом терминале:
wscat -c wss://anybet.site/ws
> {"event":"join","data":"396cda0b-6e36-48d8-afa8-12a0746aaea2"}
