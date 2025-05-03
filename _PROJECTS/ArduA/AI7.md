logs server Go
2025/04/29 23:25:24 Room 'NTKKKM96JMTPRP90' - Leader: PRA-LA1, Follower: user_285
2025/04/29 23:25:24 Room 'YNNGUT123PP5KMNB' - Leader: SM-J710F, Follower:
2025/04/29 23:25:24 SDP offer from user_285 (NTKKKM96JMTPRP90)
v=0
o=- 5398202899396445621 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS c4e05403-2cc6-43a0-be75-c5eaffe6e311
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:gScP
a=ice-pwd:GiWiINjCdvUuXwd3a0ZrEUSb
a=ice-options:trickle
a=fingerprint:sha-256 17:4A:6F:D4:45:27:F7:32:48:50:20:B0:DE:3A:74:05:4F:62:82:A7:8A:46:0F:E2:35:61:31:1B:17:29:3B:1B
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=sendrecv
a=msid:c4e05403-2cc6-43a0-be75-c5eaffe6e311 4a018e8f-65ef-4db1-8afe-a9bedb919b08
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1
a=rtpmap:63 red/48000/2
a=fmtp:63 111/111
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:126 telephone-event/8000
a=ssrc:877029469 cname:zA8QMz2Wa7sAOIIY
a=ssrc:877029469 msid:c4e05403-2cc6-43a0-be75-c5eaffe6e311 4a018e8f-65ef-4db1-8afe-a9bedb919b08
m=video 9 UDP/TLS/RTP/SAVPF 96 97 103 104 107 108 109 114 115 116 117 118 39 40 45 46 98 99 100 101 119 120 123 124 125
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:gScP
a=ice-pwd:GiWiINjCdvUuXwd3a0ZrEUSb
a=ice-options:trickle
a=fingerprint:sha-256 17:4A:6F:D4:45:27:F7:32:48:50:20:B0:DE:3A:74:05:4F:62:82:A7:8A:46:0F:E2:35:61:31:1B:17:29:3B:1B
a=setup:actpass
a=mid:1
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:13 urn:3gpp:video-orientation
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=sendrecv
a=msid:c4e05403-2cc6-43a0-be75-c5eaffe6e311 5482fcdc-e133-41de-b13e-fb9e9f5b8d2f
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:103 H264/90000
a=rtcp-fb:103 goog-remb
a=rtcp-fb:103 transport-cc
a=rtcp-fb:103 ccm fir
a=rtcp-fb:103 nack
a=rtcp-fb:103 nack pli
a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
a=rtpmap:104 rtx/90000
a=fmtp:104 apt=103
a=rtpmap:107 H264/90000
a=rtcp-fb:107 goog-remb
a=rtcp-fb:107 transport-cc
a=rtcp-fb:107 ccm fir
a=rtcp-fb:107 nack
a=rtcp-fb:107 nack pli
a=fmtp:107 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f
a=rtpmap:108 rtx/90000
a=fmtp:108 apt=107
a=rtpmap:109 H264/90000
a=rtcp-fb:109 goog-remb
a=rtcp-fb:109 transport-cc
a=rtcp-fb:109 ccm fir
a=rtcp-fb:109 nack
a=rtcp-fb:109 nack pli
a=fmtp:109 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:114 rtx/90000
a=fmtp:114 apt=109
a=rtpmap:115 H264/90000
a=rtcp-fb:115 goog-remb
a=rtcp-fb:115 transport-cc
a=rtcp-fb:115 ccm fir
a=rtcp-fb:115 nack
a=rtcp-fb:115 nack pli
a=fmtp:115 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=rtpmap:116 rtx/90000
a=fmtp:116 apt=115
a=rtpmap:117 H264/90000
a=rtcp-fb:117 goog-remb
a=rtcp-fb:117 transport-cc
a=rtcp-fb:117 ccm fir
a=rtcp-fb:117 nack
a=rtcp-fb:117 nack pli
a=fmtp:117 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f
a=rtpmap:118 rtx/90000
a=fmtp:118 apt=117
a=rtpmap:39 H264/90000
a=rtcp-fb:39 goog-remb
a=rtcp-fb:39 transport-cc
a=rtcp-fb:39 ccm fir
a=rtcp-fb:39 nack
a=rtcp-fb:39 nack pli
a=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f
a=rtpmap:40 rtx/90000
a=fmtp:40 apt=39
a=rtpmap:45 AV1/90000
a=rtcp-fb:45 goog-remb
a=rtcp-fb:45 transport-cc
a=rtcp-fb:45 ccm fir
a=rtcp-fb:45 nack
a=rtcp-fb:45 nack pli
a=fmtp:45 level-idx=5;profile=0;tier=0
a=rtpmap:46 rtx/90000
a=fmtp:46 apt=45
a=rtpmap:98 VP9/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 profile-id=0
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP9/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=fmtp:100 profile-id=2
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:119 H264/90000
a=rtcp-fb:119 goog-remb
a=rtcp-fb:119 transport-cc
a=rtcp-fb:119 ccm fir
a=rtcp-fb:119 nack
a=rtcp-fb:119 nack pli
a=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f
a=rtpmap:120 rtx/90000
a=fmtp:120 apt=119
a=rtpmap:123 red/90000
a=rtpmap:124 rtx/90000
a=fmtp:124 apt=123
a=rtpmap:125 ulpfec/90000
a=ssrc-group:FID 2646098439 3187684711
a=ssrc:2646098439 cname:zA8QMz2Wa7sAOIIY
a=ssrc:2646098439 msid:c4e05403-2cc6-43a0-be75-c5eaffe6e311 5482fcdc-e133-41de-b13e-fb9e9f5b8d2f
a=ssrc:3187684711 cname:zA8QMz2Wa7sAOIIY
a=ssrc:3187684711 msid:c4e05403-2cc6-43a0-be75-c5eaffe6e311 5482fcdc-e133-41de-b13e-fb9e9f5b8d2f
2025/04/29 23:25:24 Video in SDP: true
2025/04/29 23:25:24 ICE from user_285: 0:0 candidate:511380511 1 udp 2122260223 192.168.1.151 63357 typ host generation 0 ufrag gScP network-id 1
2025/04/29 23:25:24 ICE from user_285: 0:0 candidate:1706097428 1 udp 2122194687 172.30.32.1 63358 typ host generation 0 ufrag gScP network-id 2
2025/04/29 23:25:24 ICE from user_285: 0:0 candidate:3688686852 1 udp 2122129151 172.18.224.1 63359 typ host generation 0 ufrag gScP network-id 3
2025/04/29 23:25:24 ICE from user_285: 0:0 candidate:2972839201 1 udp 1686052607 172.20.0.1 59774 typ srflx raddr 192.168.1.151 rport 63357 generation 0 ufrag gScP network-id 1
2025/04/29 23:25:24 ICE from user_285: 0:0 candidate:2016526511 1 udp 41885695 213.184.249.66 50025 typ relay raddr 172.20.0.1 rport 59774 generation 0 ufrag gScP network-id 1
2025/04/29 23:25:24 ICE from user_285: 0:0 candidate:1622470279 1 tcp 1518280447 192.168.1.151 9 typ host tcptype active generation 0 ufrag gScP network-id 1
2025/04/29 23:25:24 ICE from user_285: 0:0 candidate:461314444 1 tcp 1518214911 172.30.32.1 9 typ host tcptype active generation 0 ufrag gScP network-id 2
2025/04/29 23:25:24 ICE from user_285: 0:0 candidate:2769487772 1 tcp 1518149375 172.18.224.1 9 typ host tcptype active generation 0 ufrag gScP network-id 3
2025/04/29 23:25:26 Connection closed by user_285: websocket: close 1005 (no status)
2025/04/29 23:25:26 User 'user_285' left room 'NTKKKM96JMTPRP90'
2025/04/29 23:25:26 Status - Connections: 2, Rooms: 2
2025/04/29 23:25:26 Room 'NTKKKM96JMTPRP90' - Leader: PRA-LA1, Follower:
2025/04/29 23:25:26 Room 'YNNGUT123PP5KMNB' - Leader: SM-J710F, Follower:
2025/04/29 23:25:26 New connection from: 172.30.32.1:51850
2025/04/29 23:25:26 User 'user_285' (isLeader: false) joining room 'NTKKKM96JMTPRP90'
2025/04/29 23:25:26 User 'user_285' joined room 'NTKKKM96JMTPRP90' as follower
2025/04/29 23:25:26 Status - Connections: 3, Rooms: 2
2025/04/29 23:25:26 Room 'YNNGUT123PP5KMNB' - Leader: SM-J710F, Follower:
2025/04/29 23:25:26 Room 'NTKKKM96JMTPRP90' - Leader: PRA-LA1, Follower: user_285
2025/04/29 23:25:26 SDP offer from user_285 (NTKKKM96JMTPRP90)
v=0
o=- 6105278380153356592 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS 02dc70e6-fe2f-488a-a132-4c5b8087ae86
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:TtHv
a=ice-pwd:UNX2Q27kpU8wBQT/XZo80TtW
a=ice-options:trickle
a=fingerprint:sha-256 CE:01:1B:72:44:83:8D:9F:FA:B2:2D:29:4A:AA:E1:60:7E:D1:E2:3C:BD:85:8C:4A:F5:50:C4:8D:0A:F9:AF:68
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=sendrecv
a=msid:02dc70e6-fe2f-488a-a132-4c5b8087ae86 aedad1e6-afb7-475f-a65e-36894509a59e
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1
a=rtpmap:63 red/48000/2
a=fmtp:63 111/111
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:126 telephone-event/8000
a=ssrc:2334120763 cname:4RI/1RWNBEJO3z+k
a=ssrc:2334120763 msid:02dc70e6-fe2f-488a-a132-4c5b8087ae86 aedad1e6-afb7-475f-a65e-36894509a59e
m=video 9 UDP/TLS/RTP/SAVPF 96 97 103 104 107 108 109 114 115 116 117 118 39 40 45 46 98 99 100 101 119 120 123 124 125
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:TtHv
a=ice-pwd:UNX2Q27kpU8wBQT/XZo80TtW
a=ice-options:trickle
a=fingerprint:sha-256 CE:01:1B:72:44:83:8D:9F:FA:B2:2D:29:4A:AA:E1:60:7E:D1:E2:3C:BD:85:8C:4A:F5:50:C4:8D:0A:F9:AF:68
a=setup:actpass
a=mid:1
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:13 urn:3gpp:video-orientation
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=sendrecv
a=msid:02dc70e6-fe2f-488a-a132-4c5b8087ae86 3b6c1c45-fef1-4596-9f9a-dcec0c88a1eb
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:103 H264/90000
a=rtcp-fb:103 goog-remb
a=rtcp-fb:103 transport-cc
a=rtcp-fb:103 ccm fir
a=rtcp-fb:103 nack
a=rtcp-fb:103 nack pli
a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
a=rtpmap:104 rtx/90000
a=fmtp:104 apt=103
a=rtpmap:107 H264/90000
a=rtcp-fb:107 goog-remb
a=rtcp-fb:107 transport-cc
a=rtcp-fb:107 ccm fir
a=rtcp-fb:107 nack
a=rtcp-fb:107 nack pli
a=fmtp:107 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f
a=rtpmap:108 rtx/90000
a=fmtp:108 apt=107
a=rtpmap:109 H264/90000
a=rtcp-fb:109 goog-remb
a=rtcp-fb:109 transport-cc
a=rtcp-fb:109 ccm fir
a=rtcp-fb:109 nack
a=rtcp-fb:109 nack pli
a=fmtp:109 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:114 rtx/90000
a=fmtp:114 apt=109
a=rtpmap:115 H264/90000
a=rtcp-fb:115 goog-remb
a=rtcp-fb:115 transport-cc
a=rtcp-fb:115 ccm fir
a=rtcp-fb:115 nack
a=rtcp-fb:115 nack pli
a=fmtp:115 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=rtpmap:116 rtx/90000
a=fmtp:116 apt=115
a=rtpmap:117 H264/90000
a=rtcp-fb:117 goog-remb
a=rtcp-fb:117 transport-cc
a=rtcp-fb:117 ccm fir
a=rtcp-fb:117 nack
a=rtcp-fb:117 nack pli
a=fmtp:117 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f
a=rtpmap:118 rtx/90000
a=fmtp:118 apt=117
a=rtpmap:39 H264/90000
a=rtcp-fb:39 goog-remb
a=rtcp-fb:39 transport-cc
a=rtcp-fb:39 ccm fir
a=rtcp-fb:39 nack
a=rtcp-fb:39 nack pli
a=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f
a=rtpmap:40 rtx/90000
a=fmtp:40 apt=39
a=rtpmap:45 AV1/90000
a=rtcp-fb:45 goog-remb
a=rtcp-fb:45 transport-cc
a=rtcp-fb:45 ccm fir
a=rtcp-fb:45 nack
a=rtcp-fb:45 nack pli
a=fmtp:45 level-idx=5;profile=0;tier=0
a=rtpmap:46 rtx/90000
a=fmtp:46 apt=45
a=rtpmap:98 VP9/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 profile-id=0
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP9/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=fmtp:100 profile-id=2
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:119 H264/90000
a=rtcp-fb:119 goog-remb
a=rtcp-fb:119 transport-cc
a=rtcp-fb:119 ccm fir
a=rtcp-fb:119 nack
a=rtcp-fb:119 nack pli
a=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f
a=rtpmap:120 rtx/90000
a=fmtp:120 apt=119
a=rtpmap:123 red/90000
a=rtpmap:124 rtx/90000
a=fmtp:124 apt=123
a=rtpmap:125 ulpfec/90000
a=ssrc-group:FID 1423853661 1940320131
a=ssrc:1423853661 cname:4RI/1RWNBEJO3z+k
a=ssrc:1423853661 msid:02dc70e6-fe2f-488a-a132-4c5b8087ae86 3b6c1c45-fef1-4596-9f9a-dcec0c88a1eb
a=ssrc:1940320131 cname:4RI/1RWNBEJO3z+k
a=ssrc:1940320131 msid:02dc70e6-fe2f-488a-a132-4c5b8087ae86 3b6c1c45-fef1-4596-9f9a-dcec0c88a1eb
2025/04/29 23:25:26 Video in SDP: true
2025/04/29 23:25:26 ICE from user_285: 0:0 candidate:438155061 1 udp 2122260223 192.168.1.151 61309 typ host generation 0 ufrag TtHv network-id 1
2025/04/29 23:25:26 ICE from user_285: 0:0 candidate:2377426250 1 udp 2122194687 172.30.32.1 61310 typ host generation 0 ufrag TtHv network-id 2
2025/04/29 23:25:26 ICE from user_285: 0:0 candidate:2428361008 1 udp 2122129151 172.18.224.1 61311 typ host generation 0 ufrag TtHv network-id 3
2025/04/29 23:25:26 ICE from user_285: 0:0 candidate:3688095871 1 udp 1686052607 172.20.0.1 54823 typ srflx raddr 192.168.1.151 rport 61309 generation 0 ufrag TtHv network-id 1
2025/04/29 23:25:26 ICE from user_285: 0:0 candidate:3508162165 1 udp 41885695 213.184.249.66 50082 typ relay raddr 172.20.0.1 rport 54823 generation 0 ufrag TtHv network-id 1
2025/04/29 23:25:27 ICE from user_285: 0:0 candidate:3837223841 1 tcp 1518280447 192.168.1.151 9 typ host tcptype active generation 0 ufrag TtHv network-id 1
2025/04/29 23:25:27 ICE from user_285: 0:0 candidate:1931375070 1 tcp 1518214911 172.30.32.1 9 typ host tcptype active generation 0 ufrag TtHv network-id 2
2025/04/29 23:25:27 ICE from user_285: 0:0 candidate:1847004580 1 tcp 1518149375 172.18.224.1 9 typ host tcptype active generation 0 ufrag TtHv network-id 3
2025/04/29 23:25:31 Connection closed by user_285: websocket: close 1005 (no status)
2025/04/29 23:25:31 User 'user_285' left room 'NTKKKM96JMTPRP90'
2025/04/29 23:25:31 Status - Connections: 2, Rooms: 2
2025/04/29 23:25:31 Room 'YNNGUT123PP5KMNB' - Leader: SM-J710F, Follower:
2025/04/29 23:25:31 Room 'NTKKKM96JMTPRP90' - Leader: PRA-LA1, Follower:
2025/04/29 23:25:31 New connection from: 172.30.32.1:51855
2025/04/29 23:25:31 User 'user_285' (isLeader: false) joining room 'NTKKKM96JMTPRP90'
2025/04/29 23:25:31 User 'user_285' joined room 'NTKKKM96JMTPRP90' as follower
2025/04/29 23:25:31 Status - Connections: 3, Rooms: 2
2025/04/29 23:25:31 Room 'YNNGUT123PP5KMNB' - Leader: SM-J710F, Follower:
2025/04/29 23:25:31 Room 'NTKKKM96JMTPRP90' - Leader: PRA-LA1, Follower: user_285
2025/04/29 23:25:31 SDP offer from user_285 (NTKKKM96JMTPRP90)
v=0
o=- 7278172126035752877 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS 39b86ab1-94f0-46b1-b9e0-40f1fdf561ca
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:ddUi
a=ice-pwd:fLCaascUqZvZ/oJvcx5rwqzx
a=ice-options:trickle
a=fingerprint:sha-256 C9:00:9A:26:F5:E8:C7:28:9F:95:97:7E:E7:A1:87:9C:E7:3B:59:33:FF:EF:4B:91:A3:4B:1E:21:FE:D8:F0:C2
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=sendrecv
a=msid:39b86ab1-94f0-46b1-b9e0-40f1fdf561ca 5e964b31-d1a5-4ec1-bb7e-60e8e290ab1a
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1
a=rtpmap:63 red/48000/2
a=fmtp:63 111/111
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:126 telephone-event/8000
a=ssrc:915449523 cname:t93nUtXusWXIkvIP
a=ssrc:915449523 msid:39b86ab1-94f0-46b1-b9e0-40f1fdf561ca 5e964b31-d1a5-4ec1-bb7e-60e8e290ab1a
m=video 9 UDP/TLS/RTP/SAVPF 96 97 103 104 107 108 109 114 115 116 117 118 39 40 45 46 98 99 100 101 119 120 123 124 125
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:ddUi
a=ice-pwd:fLCaascUqZvZ/oJvcx5rwqzx
a=ice-options:trickle
a=fingerprint:sha-256 C9:00:9A:26:F5:E8:C7:28:9F:95:97:7E:E7:A1:87:9C:E7:3B:59:33:FF:EF:4B:91:A3:4B:1E:21:FE:D8:F0:C2
a=setup:actpass
a=mid:1
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:13 urn:3gpp:video-orientation
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=sendrecv
a=msid:39b86ab1-94f0-46b1-b9e0-40f1fdf561ca a55cd453-2f03-4682-a01e-ccbdc55629c4
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:103 H264/90000
a=rtcp-fb:103 goog-remb
a=rtcp-fb:103 transport-cc
a=rtcp-fb:103 ccm fir
a=rtcp-fb:103 nack
a=rtcp-fb:103 nack pli
a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
a=rtpmap:104 rtx/90000
a=fmtp:104 apt=103
a=rtpmap:107 H264/90000
a=rtcp-fb:107 goog-remb
a=rtcp-fb:107 transport-cc
a=rtcp-fb:107 ccm fir
a=rtcp-fb:107 nack
a=rtcp-fb:107 nack pli
a=fmtp:107 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f
a=rtpmap:108 rtx/90000
a=fmtp:108 apt=107
a=rtpmap:109 H264/90000
a=rtcp-fb:109 goog-remb
a=rtcp-fb:109 transport-cc
a=rtcp-fb:109 ccm fir
a=rtcp-fb:109 nack
a=rtcp-fb:109 nack pli
a=fmtp:109 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:114 rtx/90000
a=fmtp:114 apt=109
a=rtpmap:115 H264/90000
a=rtcp-fb:115 goog-remb
a=rtcp-fb:115 transport-cc
a=rtcp-fb:115 ccm fir
a=rtcp-fb:115 nack
a=rtcp-fb:115 nack pli
a=fmtp:115 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=rtpmap:116 rtx/90000
a=fmtp:116 apt=115
a=rtpmap:117 H264/90000
a=rtcp-fb:117 goog-remb
a=rtcp-fb:117 transport-cc
a=rtcp-fb:117 ccm fir
a=rtcp-fb:117 nack
a=rtcp-fb:117 nack pli
a=fmtp:117 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f
a=rtpmap:118 rtx/90000
a=fmtp:118 apt=117
a=rtpmap:39 H264/90000
a=rtcp-fb:39 goog-remb
a=rtcp-fb:39 transport-cc
a=rtcp-fb:39 ccm fir
a=rtcp-fb:39 nack
a=rtcp-fb:39 nack pli
a=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f
a=rtpmap:40 rtx/90000
a=fmtp:40 apt=39
a=rtpmap:45 AV1/90000
a=rtcp-fb:45 goog-remb
a=rtcp-fb:45 transport-cc
a=rtcp-fb:45 ccm fir
a=rtcp-fb:45 nack
a=rtcp-fb:45 nack pli
a=fmtp:45 level-idx=5;profile=0;tier=0
a=rtpmap:46 rtx/90000
a=fmtp:46 apt=45
a=rtpmap:98 VP9/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 profile-id=0
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP9/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=fmtp:100 profile-id=2
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:119 H264/90000
a=rtcp-fb:119 goog-remb
a=rtcp-fb:119 transport-cc
a=rtcp-fb:119 ccm fir
a=rtcp-fb:119 nack
a=rtcp-fb:119 nack pli
a=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f
a=rtpmap:120 rtx/90000
a=fmtp:120 apt=119
a=rtpmap:123 red/90000
a=rtpmap:124 rtx/90000
a=fmtp:124 apt=123
a=rtpmap:125 ulpfec/90000
a=ssrc-group:FID 3442078455 2894310081
a=ssrc:3442078455 cname:t93nUtXusWXIkvIP
a=ssrc:3442078455 msid:39b86ab1-94f0-46b1-b9e0-40f1fdf561ca a55cd453-2f03-4682-a01e-ccbdc55629c4
a=ssrc:2894310081 cname:t93nUtXusWXIkvIP
a=ssrc:2894310081 msid:39b86ab1-94f0-46b1-b9e0-40f1fdf561ca a55cd453-2f03-4682-a01e-ccbdc55629c4
2025/04/29 23:25:31 Video in SDP: true
2025/04/29 23:25:31 ICE from user_285: 0:0 candidate:1587661019 1 udp 2122260223 192.168.1.151 63340 typ host generation 0 ufrag ddUi network-id 1
2025/04/29 23:25:31 ICE from user_285: 0:0 candidate:627720144 1 udp 2122194687 172.30.32.1 63341 typ host generation 0 ufrag ddUi network-id 2
2025/04/29 23:25:31 ICE from user_285: 0:0 candidate:2600870336 1 udp 2122129151 172.18.224.1 63342 typ host generation 0 ufrag ddUi network-id 3
2025/04/29 23:25:31 ICE from user_285: 0:0 candidate:4058720741 1 udp 1686052607 172.20.0.1 56293 typ srflx raddr 192.168.1.151 rport 63340 generation 0 ufrag ddUi network-id 1
2025/04/29 23:25:31 ICE from user_285: 0:0 candidate:954926187 1 udp 41885695 213.184.249.66 50008 typ relay raddr 172.20.0.1 rport 56293 generation 0 ufrag ddUi network-id 1
2025/04/29 23:25:31 ICE from user_285: 0:0 candidate:544090691 1 tcp 1518280447 192.168.1.151 9 typ host tcptype active generation 0 ufrag ddUi network-id 1
2025/04/29 23:25:31 ICE from user_285: 0:0 candidate:1537596744 1 tcp 1518214911 172.30.32.1 9 typ host tcptype active generation 0 ufrag ddUi network-id 2
2025/04/29 23:25:31 ICE from user_285: 0:0 candidate:3855205208 1 tcp 1518149375 172.18.224.1 9 typ host tcptype active generation 0 ufrag ddUi network-id 3
2025/04/29 23:25:32 Connection closed by user_285: websocket: close 1005 (no status)
2025/04/29 23:25:32 User 'user_285' left room 'NTKKKM96JMTPRP90'
2025/04/29 23:25:32 Status - Connections: 2, Rooms: 2
логи SERVER GO
после удачного соединения через гугл хром, я пытаюсь сделать трансляцию через firefox но трансляция не создается

Server go
package main

import (
"encoding/json"
"log"
"math/rand"
"net/http"
"strings"
"sync"
"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true },
}

type Peer struct {
conn     *websocket.Conn
pc       *webrtc.PeerConnection
username string
room     string
isLeader bool // true для Android (ведущий), false для браузера (ведомый)
}

type RoomInfo struct {
Users    []string `json:"users"`
Leader   string   `json:"leader"`
Follower string   `json:"follower"`
}

var (
peers   = make(map[string]*Peer)
rooms   = make(map[string]map[string]*Peer)
mu      sync.Mutex
letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
)

func init() {
rand.Seed(time.Now().UnixNano())
}

func randSeq(n int) string {
b := make([]rune, n)
for i := range b {
b[i] = letters[rand.Intn(len(letters))]
}
return string(b)
}

func getWebRTCConfig() webrtc.Configuration {
return webrtc.Configuration{
ICEServers: []webrtc.ICEServer{
{
URLs:       []string{"turn:ardua.site:3478"},
//  URLs:       []string{"turn:ardua.site:3478", "turns:ardua.site:5349"},
Username:   "user1",
Credential: "pass1",
},
{URLs: []string{"stun:ardua.site:3478"}},
//             {URLs: []string{"stun:stun.l.google.com:19301"}},
//             {URLs: []string{"stun:stun.l.google.com:19302"}},
//             {URLs: []string{"stun:stun.l.google.com:19303"}},
//             {URLs: []string{"stun:stun.l.google.com:19304"}},
//             {URLs: []string{"stun:stun.l.google.com:19305"}},
//             {URLs: []string{"stun:stun1.l.google.com:19301"}},
//             {URLs: []string{"stun:stun1.l.google.com:19302"}},
//             {URLs: []string{"stun:stun1.l.google.com:19303"}},
//             {URLs: []string{"stun:stun1.l.google.com:19304"}},
//             {URLs: []string{"stun:stun1.l.google.com:19305"}},
},
ICETransportPolicy: webrtc.ICETransportPolicyAll,
BundlePolicy:       webrtc.BundlePolicyMaxBundle,
RTCPMuxPolicy:      webrtc.RTCPMuxPolicyRequire,
SDPSemantics:       webrtc.SDPSemanticsUnifiedPlan,
}
}

func logStatus() {
mu.Lock()
defer mu.Unlock()

	log.Printf("Status - Connections: %d, Rooms: %d", len(peers), len(rooms))
	for room, roomPeers := range rooms {
		var leader, follower string
		for _, p := range roomPeers {
			if p.isLeader {
				leader = p.username
			} else {
				follower = p.username
			}
		}
		log.Printf("Room '%s' - Leader: %s, Follower: %s", room, leader, follower)
	}
}

func getUsernames(peers map[string]*Peer) []string {
usernames := make([]string, 0, len(peers))
for username := range peers {
usernames = append(usernames, username)
}
return usernames
}

func sendRoomInfo(room string) {
mu.Lock()
defer mu.Unlock()

	if roomPeers, exists := rooms[room]; exists {
		var leader, follower string
		users := make([]string, 0, len(roomPeers))

		for _, peer := range roomPeers {
			users = append(users, peer.username)
			if peer.isLeader {
				leader = peer.username
			} else {
				follower = peer.username
			}
		}

		roomInfo := RoomInfo{
			Users:    users,
			Leader:   leader,
			Follower: follower,
		}

		for _, peer := range roomPeers {
			err := peer.conn.WriteJSON(map[string]interface{}{
				"type": "room_info",
				"data": roomInfo,
			})
			if err != nil {
				log.Printf("Error sending room info to %s: %v", peer.username, err)
			}
		}
	}
}

func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn) (*Peer, error) {
mu.Lock()
defer mu.Unlock()

    if _, exists := rooms[room]; !exists {
        rooms[room] = make(map[string]*Peer)
    }

    roomPeers := rooms[room]

    // Ищем существующего ведомого для замены
    var existingFollower *Peer
    for _, p := range roomPeers {
        if !isLeader && !p.isLeader {
            existingFollower = p
            break
        }
    }

    // Если нашли ведомого для замены
    if existingFollower != nil {
        log.Printf("Replacing follower %s with new follower %s", existingFollower.username, username)

        // Отправляем команду на отключение
        existingFollower.conn.WriteJSON(map[string]interface{}{
            "type": "force_disconnect",
            "data": "You have been replaced by another viewer",
        })

        // Закрываем соединения
        if existingFollower.pc != nil {
            existingFollower.pc.Close()
        }
        existingFollower.conn.Close()

        // Удаляем из комнаты
        delete(roomPeers, existingFollower.username)
        delete(peers, existingFollower.conn.RemoteAddr().String())
    }

    // Проверяем лимит участников
    if len(roomPeers) >= 2 {
        return nil, nil
    }

    // Создаем новое PeerConnection
    peerConnection, err := webrtc.NewPeerConnection(getWebRTCConfig())
    if err != nil {
        log.Printf("Failed to create peer connection: %v", err)
        return nil, err
    }

    peer := &Peer{
        conn:     conn,
        pc:       peerConnection,
        username: username,
        room:     room,
        isLeader: isLeader,
    }

    // Добавляем обработчики ICE кандидатов
    peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
        if c == nil {
            return
        }

        candidate := c.ToJSON()
        conn.WriteJSON(map[string]interface{}{
            "type": "ice_candidate",
            "ice":  candidate,
        })
    })

    // Добавляем обработчик входящих потоков
    peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
        log.Printf("Track received: %s", track.Kind().String())
    })

    // Добавляем обработчик изменения состояния ICE соединения
    //     peerConnection.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
    //         log.Printf("ICE Connection State changed: %s", state.String())
    //     })

    peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
        log.Printf("PeerConnection state changed: %s", s.String())
        if s == webrtc.PeerConnectionStateFailed {
            // 1. Закрываем проблемное соединение
            if peerConnection != nil {
                peerConnection.Close()
            }

            // 2. Уведомляем клиента о необходимости переподключения
            if conn != nil {
                conn.WriteJSON(map[string]interface{}{
                    "type": "reconnect_request",
                    "reason": "connection_failed",
                })
            }

            // 3. Логируем инцидент
            log.Printf("Connection failed for user %s in room %s", username, room)
        }
    })

    rooms[room][username] = peer
    peers[conn.RemoteAddr().String()] = peer

    // Если это новый ведомый и есть ведущий - запрашиваем новый offer
    if !isLeader {
        if leader := getLeader(room); leader != nil {
            leader.conn.WriteJSON(map[string]interface{}{
                "type": "resend_offer",
            })
        }
    }

    return peer, nil
}

func getLeader(room string) *Peer {
for _, p := range rooms[room] {
if p.isLeader {
return p
}
}
return nil
}

func main() {
http.HandleFunc("/ws", handleWebSocket)
http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
logStatus()
w.Write([]byte("Status logged to console"))
})

	log.Println("Server started on :8080")
	logStatus()
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("WebSocket upgrade error:", err)
return
}
defer conn.Close()

	remoteAddr := conn.RemoteAddr().String()
	log.Printf("New connection from: %s", remoteAddr)

	var initData struct {
		Room     string `json:"room"`
		Username string `json:"username"`
		IsLeader bool   `json:"isLeader"`
	}

	if err := conn.ReadJSON(&initData); err != nil {
		log.Printf("Read init data error from %s: %v", remoteAddr, err)
		return
	}

	log.Printf("User '%s' (isLeader: %v) joining room '%s'", initData.Username, initData.IsLeader, initData.Room)

	peer, err := handlePeerJoin(initData.Room, initData.Username, initData.IsLeader, conn)
	if err != nil {
		conn.WriteJSON(map[string]interface{}{
			"type": "error",
			"data": "Failed to join room",
		})
		return
	}
	if peer == nil {
		conn.WriteJSON(map[string]interface{}{
			"type": "error",
			"data": "Room is full",
		})
		return
	}

	log.Printf("User '%s' joined room '%s' as %s", initData.Username, initData.Room, map[bool]string{true: "leader", false: "follower"}[initData.IsLeader])
	logStatus()
	sendRoomInfo(initData.Room)

	// Обработка входящих сообщений
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Connection closed by %s: %v", initData.Username, err)
			break
		}

		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			log.Printf("JSON error from %s: %v", initData.Username, err)
			continue
		}

		if sdp, ok := data["sdp"].(map[string]interface{}); ok {
			sdpType := sdp["type"].(string)
			sdpStr := sdp["sdp"].(string)

			log.Printf("SDP %s from %s (%s)\n%s",
				sdpType, initData.Username, initData.Room, sdpStr)

			hasVideo := strings.Contains(sdpStr, "m=video")
			log.Printf("Video in SDP: %v", hasVideo)

			if !hasVideo && sdpType == "offer" {
				log.Printf("WARNING: Offer from %s contains no video!", initData.Username)
			}
		} else if ice, ok := data["ice"].(map[string]interface{}); ok {
			log.Printf("ICE from %s: %s:%v %s",
				initData.Username,
				ice["sdpMid"].(string),
				ice["sdpMLineIndex"].(float64),
				ice["candidate"].(string))
		}

		switch data["type"].(string) {
		case "switch_camera":
		// Пересылка сообщения другому участнику комнаты
		mu.Lock()
		for _, p := range rooms[peer.room] {
			if p.username != peer.username {
				if err := p.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					log.Printf("Error sending to %s: %v", p.username, err)
				}
			}
		}
		mu.Unlock()

		case "resend_offer":
			// Логика повторной отправки offer от ведущего
			if peer.isLeader {
				// Создаем и отправляем новое offer
				offer, err := peer.pc.CreateOffer(nil)
				if err != nil {
					log.Printf("CreateOffer error: %v", err)
					continue
				}

				peer.pc.SetLocalDescription(offer)
				for _, p := range rooms[peer.room] {
					if !p.isLeader {
						p.conn.WriteJSON(map[string]interface{}{
							"type": "offer",
							"sdp":  offer,
						})
					}
				}
			}

		case "stop_receiving":
			// На клиенте должно быть обработано закрытие медиапотока
			continue
		}

		// Пересылка сообщения другому участнику комнаты
		mu.Lock()
		for username, p := range rooms[peer.room] {
			if username != peer.username {
				if err := p.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					log.Printf("Error sending to %s: %v", username, err)
				}
			}
		}
		mu.Unlock()
	}

	// Очистка при отключении
	mu.Lock()
	delete(peers, remoteAddr)
	delete(rooms[peer.room], peer.username)
	if len(rooms[peer.room]) == 0 {
		delete(rooms, peer.room)
	}
	mu.Unlock()

	log.Printf("User '%s' left room '%s'", peer.username, peer.room)
	logStatus()
	sendRoomInfo(peer.room)
}

D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCClient.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCService.kt

// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/WebRTCClient.kt
package com.example.mytest

import android.content.Context
import android.os.Build
import android.util.Log
import org.webrtc.*

class WebRTCClient(
private val context: Context,
private val eglBase: EglBase,
private val localView: SurfaceViewRenderer,
private val remoteView: SurfaceViewRenderer,
private val observer: PeerConnection.Observer
) {
lateinit var peerConnectionFactory: PeerConnectionFactory
var peerConnection: PeerConnection
private var localVideoTrack: VideoTrack? = null
private var localAudioTrack: AudioTrack? = null
internal var videoCapturer: VideoCapturer? = null
private var surfaceTextureHelper: SurfaceTextureHelper? = null

    init {
        initializePeerConnectionFactory()
        peerConnection = createPeerConnection()
        createLocalTracks()
    }

    private fun initializePeerConnectionFactory() {
        val initializationOptions = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .setFieldTrials("WebRTC-VP8-Forced-Fallback-Encoder/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initializationOptions)

        val videoEncoderFactory = DefaultVideoEncoderFactory(
            eglBase.eglBaseContext,
            true,
            true
        )

        val videoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(videoEncoderFactory)
            .setVideoDecoderFactory(videoDecoderFactory)
            .setOptions(PeerConnectionFactory.Options().apply {
                disableEncryption = false
                disableNetworkMonitor = false
            })
            .createPeerConnectionFactory()
    }

    private fun createPeerConnection(): PeerConnection {
        val rtcConfig = PeerConnection.RTCConfiguration(listOf(

            PeerConnection.IceServer.builder("turn:ardua.site:3478")
                .setUsername("user1")
                .setPassword("pass1")
                .createIceServer(),

            PeerConnection.IceServer.builder("stun:ardua.site:3478").createIceServer(),

//            PeerConnection.IceServer.builder("turns:ardua.site:5349")
//                .setUsername("user1")
//                .setPassword("pass1")
//                .createIceServer(),

//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19301").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19303").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19304").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19305").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19301").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19303").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19304").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19305").createIceServer()
)).apply {
sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
iceTransportsType = PeerConnection.IceTransportsType.ALL
bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ENABLED
candidateNetworkPolicy = PeerConnection.CandidateNetworkPolicy.ALL
keyType = PeerConnection.KeyType.ECDSA

            // Оптимизация для мобильных
            if (Build.MODEL.contains("iPhone")) {
                audioJitterBufferMaxPackets = 50
                audioJitterBufferFastAccelerate = true
            } else {
                // Настройки для Android
                audioJitterBufferMaxPackets = 200
                iceConnectionReceivingTimeout = 5000
            }
        }

        return peerConnectionFactory.createPeerConnection(rtcConfig, observer)!!
    }

    // В WebRTCClient.kt добавляем обработку переключения камеры
    internal fun switchCamera(useBackCamera: Boolean) {
        try {
            videoCapturer?.let { capturer ->
                if (capturer is CameraVideoCapturer) {
                    if (useBackCamera) {
                        // Switch to back camera
                        val cameraEnumerator = Camera2Enumerator(context)
                        val deviceNames = cameraEnumerator.deviceNames
                        deviceNames.find { !cameraEnumerator.isFrontFacing(it) }?.let { backCameraId ->
                            capturer.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                                override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                                    Log.d("WebRTCClient", "Switched to back camera")
                                }

                                override fun onCameraSwitchError(error: String) {
                                    Log.e("WebRTCClient", "Error switching to back camera: $error")
                                }
                            })
                        }
                    } else {
                        // Switch to front camera
                        val cameraEnumerator = Camera2Enumerator(context)
                        val deviceNames = cameraEnumerator.deviceNames
                        deviceNames.find { cameraEnumerator.isFrontFacing(it) }?.let { frontCameraId ->
                            capturer.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                                override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                                    Log.d("WebRTCClient", "Switched to front camera")
                                }

                                override fun onCameraSwitchError(error: String) {
                                    Log.e("WebRTCClient", "Error switching to front camera: $error")
                                }
                            })
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error switching camera", e)
        }
    }

    private fun createLocalTracks() {
        createAudioTrack()
        createVideoTrack()

        val streamId = "ARDAMS"
        val stream = peerConnectionFactory.createLocalMediaStream(streamId)

        localAudioTrack?.let {
            stream.addTrack(it)
            peerConnection.addTrack(it, listOf(streamId))
        }

        localVideoTrack?.let {
            stream.addTrack(it)
            peerConnection.addTrack(it, listOf(streamId))
        }
    }

    private fun createAudioTrack() {
        val audioConstraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googHighpassFilter", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
        }

        val audioSource = peerConnectionFactory.createAudioSource(audioConstraints)
        localAudioTrack = peerConnectionFactory.createAudioTrack("ARDAMSa0", audioSource)
    }

    private fun createVideoTrack() {
        try {
            videoCapturer = createCameraCapturer()
            videoCapturer?.let { capturer ->
                surfaceTextureHelper = SurfaceTextureHelper.create(
                    "CaptureThread",
                    eglBase.eglBaseContext
                )

                val videoSource = peerConnectionFactory.createVideoSource(false)
                capturer.initialize(
                    surfaceTextureHelper,
                    context,
                    videoSource.capturerObserver
                )
                capturer.startCapture(640, 480, 30)

                localVideoTrack = peerConnectionFactory.createVideoTrack("ARDAMSv0", videoSource).apply {
                    addSink(localView)
                }
            } ?: run {
                Log.e("WebRTCClient", "Failed to create video capturer")
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error creating video track", e)
        }
    }

    private fun createCameraCapturer(): VideoCapturer? {
        return Camera2Enumerator(context).run {
            deviceNames.find { isFrontFacing(it) }?.let {
                Log.d("WebRTC", "Using front camera: $it")
                createCapturer(it, null)
            } ?: deviceNames.firstOrNull()?.let {
                Log.d("WebRTC", "Using first available camera: $it")
                createCapturer(it, null)
            }
        }
    }

    fun close() {
        try {
            videoCapturer?.let {
                it.stopCapture()
                it.dispose()
            }
            localVideoTrack?.let {
                it.removeSink(localView)
                it.dispose()
            }
            localAudioTrack?.dispose()
            surfaceTextureHelper?.dispose()
            peerConnection.close()
            peerConnection.dispose()
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error closing resources", e)
        }
    }
}

// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/WebRTCService.kt
// file: src/main/java/com/example/mytest/WebRTCService.kt
package com.example.mytest

import android.annotation.SuppressLint
import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import org.json.JSONObject
import org.webrtc.*
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit
import android.net.NetworkRequest
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType

class WebRTCService : Service() {

    companion object {
        var isRunning = false
            private set
        var currentRoomName = ""
        const val ACTION_SERVICE_STATE = "com.example.mytest.SERVICE_STATE"
        const val EXTRA_IS_RUNNING = "is_running"
    }

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == ACTION_SERVICE_STATE) {
                val isRunning = intent.getBooleanExtra(EXTRA_IS_RUNNING, false)
                // Можно обновить UI активности, если она видима
            }
        }
    }

    private fun sendServiceStateUpdate() {
        val intent = Intent(ACTION_SERVICE_STATE).apply {
            putExtra(EXTRA_IS_RUNNING, isRunning)
        }
        sendBroadcast(intent)
    }

    private var isConnected = false // Флаг подключения
    private var isConnecting = false // Флаг процесса подключения

    private var shouldStop = false
    private var isUserStopped = false

    private val binder = LocalBinder()
    private lateinit var webSocketClient: WebSocketClient
    private lateinit var webRTCClient: WebRTCClient
    private lateinit var eglBase: EglBase

    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 10
    private val reconnectDelay = 5000L // 5 секунд

    private lateinit var remoteView: SurfaceViewRenderer

    private var roomName = "room1" // Будет перезаписано при старте
    private val userName = Build.MODEL ?: "AndroidDevice"
    private val webSocketUrl = "wss://ardua.site/ws"

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"
    private val handler = Handler(Looper.getMainLooper())

    private var isStateReceiverRegistered = false
    private var isConnectivityReceiverRegistered = false

    inner class LocalBinder : Binder() {
        fun getService(): WebRTCService = this@WebRTCService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    private val connectivityReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (!isInitialized() || !webSocketClient.isConnected()) {
                reconnect()
            }
        }
    }

    private val webSocketListener = object : WebSocketListener() {
        override fun onMessage(webSocket: okhttp3.WebSocket, text: String) {
            try {
                val message = JSONObject(text)
                handleWebSocketMessage(message)
            } catch (e: Exception) {
                Log.e("WebRTCService", "WebSocket message parse error", e)
            }
        }

        override fun onOpen(webSocket: okhttp3.WebSocket, response: okhttp3.Response) {
            Log.d("WebRTCService", "WebSocket connected for room: $roomName")
            isConnected = true
            isConnecting = false
            reconnectAttempts = 0 // Сбрасываем счетчик попыток
            updateNotification("Connected to server")
            joinRoom()
        }

        override fun onClosed(webSocket: okhttp3.WebSocket, code: Int, reason: String) {
            Log.d("WebRTCService", "WebSocket disconnected, code: $code, reason: $reason")
            isConnected = false
            if (code != 1000) { // Если это не нормальное закрытие
                scheduleReconnect()
            }
        }

        override fun onFailure(webSocket: okhttp3.WebSocket, t: Throwable, response: okhttp3.Response?) {
            Log.e("WebRTCService", "WebSocket error: ${t.message}")
            isConnected = false
            isConnecting = false
            updateNotification("Error: ${t.message?.take(30)}...")
            scheduleReconnect()
        }
    }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            super.onAvailable(network)
            handler.post { reconnect() }
        }

        override fun onLost(network: Network) {
            super.onLost(network)
            handler.post { updateNotification("Network lost") }
        }
    }

    private val healthCheckRunnable = object : Runnable {
        override fun run() {
            if (!isServiceActive()) {
                reconnect()
            }
            handler.postDelayed(this, 30000) // Проверка каждые 30 секунд
        }
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    override fun onCreate() {
        super.onCreate()
        isRunning = true

        // Инициализация имени комнаты из статического поля
        roomName = currentRoomName

        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(this, WebRTCService::class.java).apply {
            action = "CHECK_CONNECTION"
        }
        val pendingIntent = PendingIntent.getService(
            this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        handler.post(healthCheckRunnable)

        alarmManager.setInexactRepeating(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + AlarmManager.INTERVAL_FIFTEEN_MINUTES,
            AlarmManager.INTERVAL_FIFTEEN_MINUTES,
            pendingIntent
        )

        Log.d("WebRTCService", "Service created with room: $roomName")
        sendServiceStateUpdate()
        try {
            registerReceiver(connectivityReceiver, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION))
            isConnectivityReceiverRegistered = true
            registerReceiver(stateReceiver, IntentFilter(ACTION_SERVICE_STATE))
            isStateReceiverRegistered = true
            createNotificationChannel()
            startForegroundService()
            initializeWebRTC()
            connectWebSocket()
            registerNetworkCallback() // Добавлен вызов регистрации коллбэка сети
        } catch (e: Exception) {
            Log.e("WebRTCService", "Initialization failed", e)
            stopSelf()
        }
    }

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            cm.registerDefaultNetworkCallback(networkCallback)
        } else {
            val request = NetworkRequest.Builder().build()
            cm.registerNetworkCallback(request, networkCallback)
        }
    }

    private fun isServiceActive(): Boolean {
        return ::webSocketClient.isInitialized && webSocketClient.isConnected()
    }


    private fun startForegroundService() {
        val notification = createNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                startForeground(
                    notificationId,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION or
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
            } catch (e: SecurityException) {
                Log.e("WebRTCService", "SecurityException: ${e.message}")
                startForeground(notificationId, notification)
            }
        } else {
            startForeground(notificationId, notification)
        }
    }

    private fun initializeWebRTC() {
        Log.d("WebRTCService", "Initializing WebRTC for room: $roomName")
        cleanupWebRTCResources()

        eglBase = EglBase.create()
        val localView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
            setMirror(true)
            setEnableHardwareScaler(true)
        }

        remoteView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
            setEnableHardwareScaler(true)
        }

        webRTCClient = WebRTCClient(
            context = this,
            eglBase = eglBase,
            localView = localView,
            remoteView = remoteView,
            observer = createPeerConnectionObserver()
        )
    }

    private fun createPeerConnectionObserver() = object : PeerConnection.Observer {
        override fun onIceCandidate(candidate: IceCandidate?) {
            candidate?.let {
                Log.d("WebRTCService", "Local ICE candidate: ${it.sdpMid}:${it.sdpMLineIndex} ${it.sdp}")
                sendIceCandidate(it)
            }
        }

        override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
            Log.d("WebRTCService", "ICE connection state: $state")
            when (state) {
                PeerConnection.IceConnectionState.CONNECTED ->
                    updateNotification("Connection established")
                PeerConnection.IceConnectionState.DISCONNECTED ->
                    updateNotification("Connection lost")
                else -> {}
            }
        }

        override fun onSignalingChange(p0: PeerConnection.SignalingState?) {}
        override fun onIceConnectionReceivingChange(p0: Boolean) {}
        override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
        override fun onIceCandidatesRemoved(p0: Array<out IceCandidate>?) {}
        override fun onAddStream(stream: MediaStream?) {
            stream?.videoTracks?.forEach { track ->
                Log.d("WebRTCService", "Adding remote video track from stream")
                track.addSink(remoteView)
            }
        }
        override fun onRemoveStream(p0: MediaStream?) {}
        override fun onDataChannel(p0: DataChannel?) {}
        override fun onRenegotiationNeeded() {}
        override fun onAddTrack(p0: RtpReceiver?, p1: Array<out MediaStream>?) {}
        override fun onTrack(transceiver: RtpTransceiver?) {
            transceiver?.receiver?.track()?.let { track ->
                handler.post {
                    when (track.kind()) {
                        "video" -> {
                            Log.d("WebRTCService", "Video track received")
                            (track as VideoTrack).addSink(remoteView)
                        }
                        "audio" -> {
                            Log.d("WebRTCService", "Audio track received")
                        }
                    }
                }
            }
        }
    }

    private fun cleanupWebRTCResources() {
        try {
            if (::webRTCClient.isInitialized) {
                webRTCClient.close()
            }
            if (::eglBase.isInitialized) {
                eglBase.release()
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error cleaning WebRTC resources", e)
        }
    }

    private fun connectWebSocket() {
        if (isConnected || isConnecting) {
            Log.d("WebRTCService", "Already connected or connecting, skipping")
            return
        }

        isConnecting = true
        webSocketClient = WebSocketClient(webSocketListener)
        webSocketClient.connect(webSocketUrl)
    }

    private fun scheduleReconnect() {
        if (isUserStopped) {
            Log.d("WebRTCService", "Service stopped by user, not reconnecting")
            return
        }

        handler.removeCallbacksAndMessages(null)

        reconnectAttempts++
        val delay = when {
            reconnectAttempts < 5 -> 5000L
            reconnectAttempts < 10 -> 15000L
            else -> 60000L
        }

        Log.d("WebRTCService", "Scheduling reconnect in ${delay/1000} seconds (attempt $reconnectAttempts)")
        updateNotification("Reconnecting in ${delay/1000}s...")

        handler.postDelayed({
            if (!isConnected && !isConnecting) {
                Log.d("WebRTCService", "Executing reconnect attempt $reconnectAttempts")
                reconnect()
            } else {
                Log.d("WebRTCService", "Already connected or connecting, skipping scheduled reconnect")
            }
        }, delay)
    }

    private fun reconnect() {
        if (isConnected || isConnecting) {
            Log.d("WebRTCService", "Already connected or connecting, skipping manual reconnect")
            return
        }

        handler.post {
            try {
                Log.d("WebRTCService", "Starting reconnect process")

                // Получаем последнее сохраненное имя комнаты
                val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
                val lastRoomName = sharedPrefs.getString("last_used_room", "")

                // Если имя комнаты пустое, используем дефолтное значение
                roomName = if (lastRoomName.isNullOrEmpty()) {
                    "default_room_${System.currentTimeMillis()}"
                } else {
                    lastRoomName
                }

                // Обновляем текущее имя комнаты
                currentRoomName = roomName
                Log.d("WebRTCService", "Reconnecting to room: $roomName")

                // Очищаем предыдущие соединения
                if (::webSocketClient.isInitialized) {
                    webSocketClient.disconnect()
                }

                // Инициализируем заново
                initializeWebRTC()
                connectWebSocket()

            } catch (e: Exception) {
                Log.e("WebRTCService", "Reconnection error", e)
                isConnecting = false
                scheduleReconnect()
            }
        }
    }

    private fun joinRoom() {
        try {
            val message = JSONObject().apply {
                put("action", "join")
                put("room", roomName)
                put("username", userName)
                put("isLeader", true)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Sent join request for room: $roomName")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error joining room: $roomName", e)
        }
    }

    private fun handleBandwidthEstimation(estimation: Long) {
        handler.post {
            try {
                // Адаптируем качество видео в зависимости от доступной полосы
                val width = when {
                    estimation > 1500000 -> 1280 // 1.5 Mbps+
                    estimation > 500000 -> 854  // 0.5-1.5 Mbps
                    else -> 640                // <0.5 Mbps
                }

                val height = (width * 9 / 16)

                webRTCClient.videoCapturer?.let { capturer ->
                    capturer.stopCapture()
                    capturer.startCapture(width, height, 24)
                    Log.d("WebRTCService", "Adjusted video to ${width}x${height} @24fps")
                }
            } catch (e: Exception) {
                Log.e("WebRTCService", "Error adjusting video quality", e)
            }
        }
    }

    private fun handleWebSocketMessage(message: JSONObject) {
        Log.d("WebRTCService", "Received: $message")

        try {
            when (message.optString("type")) {
                "bandwidth_estimation" -> {
                    val estimation = message.optLong("estimation", 1000000)
                    handleBandwidthEstimation(estimation)
                }
                "offer" -> handleOffer(message)
                "answer" -> handleAnswer(message)
                "ice_candidate" -> handleIceCandidate(message)
                "room_info" -> {}
                "switch_camera" -> {
                    // Обрабатываем команду переключения камеры
                    val useBackCamera = message.optBoolean("useBackCamera", false)
                    Log.d("WebRTCService", "Received switch camera command: useBackCamera=$useBackCamera")
                    handler.post {
                        webRTCClient.switchCamera(useBackCamera)
                        // Отправляем подтверждение
                        sendCameraSwitchAck(useBackCamera)
                    }
                }
                else -> Log.w("WebRTCService", "Unknown message type")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling message", e)
        }
    }

    // Метод для отправки подтверждения переключения камеры
    private fun sendCameraSwitchAck(useBackCamera: Boolean) {
        try {
            val message = JSONObject().apply {
                put("type", "switch_camera_ack")
                put("useBackCamera", useBackCamera)
                put("success", true)
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Sent camera switch ack")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending camera switch ack", e)
        }
    }

    private fun handleOffer(offer: JSONObject) {
        try {
            val sdp = offer.getJSONObject("sdp")
            val sessionDescription = SessionDescription(
                SessionDescription.Type.OFFER,
                sdp.getString("sdp")
            )

            webRTCClient.peerConnection.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    val constraints = MediaConstraints().apply {
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                    }
                    createAnswer(constraints)
                }
                override fun onSetFailure(error: String) {
                    Log.e("WebRTCService", "Error setting remote description: $error")
                }
                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onCreateFailure(error: String) {}
            }, sessionDescription)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling offer", e)
        }
    }

    private fun createAnswer(constraints: MediaConstraints) {
        try {
            webRTCClient.peerConnection.createAnswer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    Log.d("WebRTCService", "Created answer: ${desc.description}")
                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            sendSessionDescription(desc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e("WebRTCService", "Error setting local description: $error")
                        }
                        override fun onCreateSuccess(p0: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, desc)
                }
                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCService", "Error creating answer: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error creating answer", e)
        }
    }

    private fun sendSessionDescription(desc: SessionDescription) {
        Log.d("WebRTCService", "Sending SDP: ${desc.type} \n${desc.description}")
        try {
            val message = JSONObject().apply {
                put("type", desc.type.canonicalForm())
                put("sdp", JSONObject().apply {
                    put("type", desc.type.canonicalForm())
                    put("sdp", desc.description)
                })
                put("room", roomName)
                put("username", userName)
                put("target", "browser")
            }
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending SDP", e)
        }
    }

    private fun handleAnswer(answer: JSONObject) {
        try {
            val sdp = answer.getJSONObject("sdp")
            val sessionDescription = SessionDescription(
                SessionDescription.Type.fromCanonicalForm(sdp.getString("type")),
                sdp.getString("sdp")
            )

            webRTCClient.peerConnection.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    Log.d("WebRTCService", "Answer accepted")
                }
                override fun onSetFailure(error: String) {
                    Log.e("WebRTCService", "Error setting answer: $error")
                }
                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onCreateFailure(error: String) {}
            }, sessionDescription)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling answer", e)
        }
    }

    private fun handleIceCandidate(candidate: JSONObject) {
        try {
            val ice = candidate.getJSONObject("ice")
            val iceCandidate = IceCandidate(
                ice.getString("sdpMid"),
                ice.getInt("sdpMLineIndex"),
                ice.getString("candidate")
            )
            webRTCClient.peerConnection.addIceCandidate(iceCandidate)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling ICE candidate", e)
        }
    }

    private fun sendIceCandidate(candidate: IceCandidate) {
        try {
            val message = JSONObject().apply {
                put("type", "ice_candidate")
                put("ice", JSONObject().apply {
                    put("sdpMid", candidate.sdpMid)
                    put("sdpMLineIndex", candidate.sdpMLineIndex)
                    put("candidate", candidate.sdp)
                })
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending ICE candidate", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "WebRTC Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "WebRTC streaming service"
            }
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("WebRTC Service")
            .setContentText("Active in room: $roomName")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_HIGH) // Измените на HIGH
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("WebRTC Service")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .notify(notificationId, notification)
    }

    override fun onDestroy() {
        if (!isUserStopped) {
            if (isConnectivityReceiverRegistered) {
                unregisterReceiver(connectivityReceiver)
            }
            if (isStateReceiverRegistered) {
                unregisterReceiver(stateReceiver)
            }
            // Автоматический перезапуск только если не было явной остановки
            scheduleRestartWithWorkManager()
        }
        super.onDestroy()
    }

    private fun cleanupAllResources() {
        handler.removeCallbacksAndMessages(null)
        cleanupWebRTCResources()
        if (::webSocketClient.isInitialized) {
            webSocketClient.disconnect()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "STOP" -> {
                isUserStopped = true
                isConnected = false
                isConnecting = false
                stopEverything()
                return START_NOT_STICKY
            }
            else -> {
                isUserStopped = false

                // Получаем последнее сохраненное имя комнаты
                val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
                val lastRoomName = sharedPrefs.getString("last_used_room", "")

                roomName = if (lastRoomName.isNullOrEmpty()) {
                    "default_room_${System.currentTimeMillis()}"
                } else {
                    lastRoomName
                }

                currentRoomName = roomName

                Log.d("WebRTCService", "Starting service with room: $roomName")

                if (!isConnected && !isConnecting) {
                    initializeWebRTC()
                    connectWebSocket()
                }

                isRunning = true
                return START_STICKY
            }
        }
    }

    private fun stopEverything() {
        isRunning = false
        isConnected = false
        isConnecting = false

        try {
            handler.removeCallbacksAndMessages(null)
            unregisterReceiver(connectivityReceiver)
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            cm?.unregisterNetworkCallback(networkCallback)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error during cleanup", e)
        }

        cleanupAllResources()

        if (isUserStopped) {
            stopSelf()
            android.os.Process.killProcess(android.os.Process.myPid())
        }
    }

    private fun scheduleRestartWithWorkManager() {
        // Убедитесь, что используете ApplicationContext
        val workRequest = OneTimeWorkRequestBuilder<WebRTCWorker>()
            .setInitialDelay(1, TimeUnit.MINUTES)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED) // Только при наличии сети
                    .build()
            )
            .build()

        WorkManager.getInstance(applicationContext).enqueueUniqueWork(
            "WebRTCServiceRestart",
            ExistingWorkPolicy.REPLACE,
            workRequest
        )
    }

    fun isInitialized(): Boolean {
        return ::webSocketClient.isInitialized &&
                ::webRTCClient.isInitialized &&
                ::eglBase.isInitialized
    }
}

браузер
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\hooks\useWebRTC.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\lib\webrtc.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\lib\signaling.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\VideoCallApp.tsx

// file: docker-ardua/components/webrtc/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
type: string;
data?: any;
sdp?: {
type: RTCSdpType;
sdp: string;
};
ice?: RTCIceCandidateInit;
room?: string;
username?: string;
// Добавляем новый тип сообщения
force_disconnect?: boolean;
}

export const useWebRTC = (
deviceIds: { video: string; audio: string },
username: string,
roomId: string
) => {
const [localStream, setLocalStream] = useState<MediaStream | null>(null);
const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
const [users, setUsers] = useState<string[]>([]);
const [isCallActive, setIsCallActive] = useState(false);
const [isConnected, setIsConnected] = useState(false);
const [isInRoom, setIsInRoom] = useState(false);
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);

    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
    const isNegotiating = useRef(false);
    const shouldCreateOffer = useRef(false);
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const statsInterval = useRef<NodeJS.Timeout | null>(null);
    const videoCheckTimeout = useRef<NodeJS.Timeout | null>(null);
    const retryAttempts = useRef(0);

    // Максимальное количество попыток переподключения
    const MAX_RETRIES = 10;
    const VIDEO_CHECK_TIMEOUT = 4000; // 4 секунд для проверки видео

    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';

        // Сначала очищаем от network-cost
        let normalized = sdp.replace(/a=network-cost:.+\r\n/g, '');

        normalized = normalized.trim();

        if (!normalized.startsWith('v=')) {
            normalized = 'v=0\r\n' + normalized;
        }
        if (!normalized.includes('\r\no=')) {
            normalized = normalized.replace('\r\n', '\r\no=- 0 0 IN IP4 0.0.0.0\r\n');
        }
        if (!normalized.includes('\r\ns=')) {
            normalized = normalized.replace('\r\n', '\r\ns=-\r\n');
        }
        if (!normalized.includes('\r\nt=')) {
            normalized = normalized.replace('\r\n', '\r\nt=0 0\r\n');
        }

        return normalized + '\r\n';
    };

    const cleanup = () => {
        // Очистка таймеров
        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
        }

        if (statsInterval.current) {
            clearInterval(statsInterval.current);
            statsInterval.current = null;
        }

        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
            videoCheckTimeout.current = null;
        }

        // Очистка WebRTC соединения
        if (pc.current) {
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onicegatheringstatechange = null;
            pc.current.onsignalingstatechange = null;
            pc.current.onconnectionstatechange = null;
            pc.current.close();
            pc.current = null;
        }

        // Остановка медиапотоков
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                track.dispatchEvent(new Event('ended'));
            });
            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => {
                track.stop();
                track.dispatchEvent(new Event('ended'));
            });
            setRemoteStream(null);
        }

        setIsCallActive(false);
        pendingIceCandidates.current = [];
        isNegotiating.current = false;
        shouldCreateOffer.current = false;
        retryAttempts.current = 0;
    };


    const leaveRoom = () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            try {
                ws.current.send(JSON.stringify({
                    type: 'leave',
                    room: roomId,
                    username
                }));
            } catch (e) {
                console.error('Error sending leave message:', e);
            }
        }
        cleanup();
        setUsers([]);
        setIsInRoom(false);
        ws.current?.close();
        ws.current = null;
        setRetryCount(0);
    };

    const startVideoCheckTimer = () => {
        // Очищаем предыдущий таймер, если он есть
        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
        }

        // Устанавливаем новый таймер
        videoCheckTimeout.current = setTimeout(() => {
            if (!remoteStream || remoteStream.getVideoTracks().length === 0 ||
                !remoteStream.getVideoTracks()[0].readyState) {
                console.log('Удаленное видео не получено в течение .. секунд, перезапускаем соединение...');
                resetConnection();
            }
        }, VIDEO_CHECK_TIMEOUT);
    };

    const connectWebSocket = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                resolve(true);
                return;
            }

            try {
                ws.current = new WebSocket('wss://ardua.site/ws');

                const onOpen = () => {
                    cleanupEvents();
                    setIsConnected(true);
                    setError(null);
                    console.log('WebSocket подключен');
                    resolve(true);
                };

                const onError = (event: Event) => {
                    cleanupEvents();
                    console.error('Ошибка WebSocket:', event);
                    setError('Ошибка подключения');
                    setIsConnected(false);
                    resolve(false);
                };

                const onClose = (event: CloseEvent) => {
                    cleanupEvents();
                    console.log('WebSocket отключен:', event.code, event.reason);
                    setIsConnected(false);
                    setIsInRoom(false);
                    setError(event.code !== 1000 ? `Соединение закрыто: ${event.reason || 'код ' + event.code}` : null);
                    resolve(false);
                };

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('open', onOpen);
                    ws.current?.removeEventListener('error', onError);
                    ws.current?.removeEventListener('close', onClose);
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                    }
                };

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    setError('Таймаут подключения WebSocket');
                    resolve(false);
                }, 5000);

                ws.current.addEventListener('open', onOpen);
                ws.current.addEventListener('error', onError);
                ws.current.addEventListener('close', onClose);

            } catch (err) {
                console.error('Ошибка создания WebSocket:', err);
                setError('Не удалось создать WebSocket соединение');
                resolve(false);
            }
        });
    };



    const setupWebSocketListeners = () => {
        if (!ws.current) return;

        const handleMessage = async (event: MessageEvent) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                console.log('Получено сообщение:', data);

                // Добавляем обработку switch_camera
                if (data.type === 'switch_camera_ack') {
                    console.log('Камера на Android успешно переключена');
                    // Можно показать уведомление пользователю
                }

                // Добавляем обработку reconnect_request
                if (data.type === 'reconnect_request') {
                    console.log('Server requested reconnect');
                    setTimeout(() => {
                        resetConnection();
                    }, 1000);
                    return;
                }

                if (data.type === 'force_disconnect') {
                    // Обработка принудительного отключения
                    console.log('Получена команда принудительного отключения');
                    setError('Вы были отключены, так как подключился другой зритель');

                    // Останавливаем все медиапотоки
                    if (remoteStream) {
                        remoteStream.getTracks().forEach(track => track.stop());
                    }

                    // Закрываем PeerConnection
                    if (pc.current) {
                        pc.current.close();
                        pc.current = null;
                    }
                    leaveRoom();
                    // Очищаем состояние
                    setRemoteStream(null);
                    setIsCallActive(false);
                    setIsInRoom(false);

                    return;
                }


                if (data.type === 'room_info') {
                    setUsers(data.data.users || []);
                }
                else if (data.type === 'error') {
                    setError(data.data);
                }
                else if (data.type === 'offer') {
                    if (pc.current && ws.current?.readyState === WebSocket.OPEN && data.sdp) {
                        try {
                            if (isNegotiating.current) {
                                console.log('Уже в процессе переговоров, игнорируем оффер');
                                return;
                            }

                            isNegotiating.current = true;
                            await pc.current.setRemoteDescription(
                                new RTCSessionDescription(data.sdp)
                            );

                            const answer = await pc.current.createAnswer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                            });

                            const normalizedAnswer = {
                                ...answer,
                                sdp: normalizeSdp(answer.sdp)
                            };

                            await pc.current.setLocalDescription(normalizedAnswer);

                            ws.current.send(JSON.stringify({
                                type: 'answer',
                                sdp: normalizedAnswer,
                                room: roomId,
                                username
                            }));

                            setIsCallActive(true);
                            isNegotiating.current = false;

                            // Запускаем проверку получения видео
                            startVideoCheckTimer();
                        } catch (err) {
                            console.error('Ошибка обработки оффера:', err);
                            setError('Ошибка обработки предложения соединения');
                            isNegotiating.current = false;
                        }
                    }
                }
                else if (data.type === 'answer') {
                    if (pc.current && data.sdp) {
                        try {
                            if (pc.current.signalingState !== 'have-local-offer') {
                                console.log('Не в состоянии have-local-offer, игнорируем ответ');
                                return;
                            }

                            const answerDescription: RTCSessionDescriptionInit = {
                                type: 'answer',
                                sdp: normalizeSdp(data.sdp.sdp)
                            };

                            console.log('Устанавливаем удаленное описание с ответом');
                            await pc.current.setRemoteDescription(
                                new RTCSessionDescription(answerDescription)
                            );

                            setIsCallActive(true);

                            // Запускаем проверку получения видео
                            startVideoCheckTimer();

                            // Обрабатываем ожидающие кандидаты
                            while (pendingIceCandidates.current.length > 0) {
                                const candidate = pendingIceCandidates.current.shift();
                                if (candidate) {
                                    try {
                                        await pc.current.addIceCandidate(candidate);
                                    } catch (err) {
                                        console.error('Ошибка добавления отложенного ICE кандидата:', err);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Ошибка установки ответа:', err);
                            setError(`Ошибка установки ответа: ${err instanceof Error ? err.message : String(err)}`);
                        }
                    }
                }
                else if (data.type === 'ice_candidate') {
                    if (data.ice) {
                        try {
                            const candidate = new RTCIceCandidate(data.ice);

                            if (pc.current && pc.current.remoteDescription) {
                                await pc.current.addIceCandidate(candidate);
                            } else {
                                pendingIceCandidates.current.push(candidate);
                            }
                        } catch (err) {
                            console.error('Ошибка добавления ICE-кандидата:', err);
                            setError('Ошибка добавления ICE-кандидата');
                        }
                    }
                }
            } catch (err) {
                console.error('Ошибка обработки сообщения:', err);
                setError('Ошибка обработки сообщения сервера');
            }
        };

        ws.current.onmessage = handleMessage;
    };

    const createAndSendOffer = async () => {
        if (!pc.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const offer = await pc.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                iceRestart: false,
            });

            const standardizedOffer = {
                ...offer,
                sdp: normalizeSdp(offer.sdp)
            };

            console.log('Устанавливаем локальное описание с оффером');
            await pc.current.setLocalDescription(standardizedOffer);

            ws.current.send(JSON.stringify({
                type: "offer",
                sdp: standardizedOffer,
                room: roomId,
                username
            }));

            setIsCallActive(true);

            // Запускаем проверку получения видео
            startVideoCheckTimer();
        } catch (err) {
            console.error('Ошибка создания оффера:', err);
            setError('Ошибка создания предложения соединения');
        }
    };

    const initializeWebRTC = async () => {
        try {
            cleanup();

            const config: RTCConfiguration = {
                iceServers: [
                    {
                        urls: [
                            'turn:ardua.site:3478',  // UDP/TCP
                            // 'turns:ardua.site:5349'   // TLS (если настроен)
                        ],
                        username: 'user1',     // Исправлено: username
                        credential: 'pass1'    // Исправлено: credential
                    },
                    {
                        urls: [
                            'stun:ardua.site:3478',
                            // 'stun:stun.l.google.com:19301',
                            // 'stun:stun.l.google.com:19302',
                            // 'stun:stun.l.google.com:19303',
                            // 'stun:stun.l.google.com:19304',
                            // 'stun:stun.l.google.com:19305',
                            // 'stun:stun1.l.google.com:19301',
                            // 'stun:stun1.l.google.com:19302',
                            // 'stun:stun1.l.google.com:19303',
                            // 'stun:stun1.l.google.com:19304',
                            // 'stun:stun1.l.google.com:19305'
                        ]
                    }
                ],
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require'
            };

            pc.current = new RTCPeerConnection(config);

            // Обработчики событий WebRTC
            pc.current.onnegotiationneeded = () => {
                console.log('Требуется переговорный процесс');
            };

            pc.current.onsignalingstatechange = () => {
                console.log('Состояние сигнализации изменилось:', pc.current?.signalingState);
            };

            pc.current.onicegatheringstatechange = () => {
                console.log('Состояние сбора ICE изменилось:', pc.current?.iceGatheringState);
            };

            pc.current.onicecandidateerror = (event) => {
                const ignorableErrors = [701, 702, 703]; // Игнорируем стандартные ошибки STUN
                if (!ignorableErrors.includes(event.errorCode)) {
                    console.error('Критическая ошибка ICE кандидата:', event);
                    setError(`Ошибка ICE соединения: ${event.errorText}`);
                }
            };

            // Получаем медиапоток с устройства
            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } : {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                },
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : true
            });

            // Проверяем наличие видеотрека
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length === 0) {
                throw new Error('Не удалось получить видеопоток с устройства');
            }

            setLocalStream(stream);
            stream.getTracks().forEach(track => {
                pc.current?.addTrack(track, stream);
            });

            // Обработка ICE кандидатов
            pc.current.onicecandidate = (event) => {
                if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                    try {
                        // Фильтруем нежелательные кандидаты
                        if (event.candidate.candidate &&
                            event.candidate.candidate.length > 0 &&
                            !event.candidate.candidate.includes('0.0.0.0')) {

                            ws.current.send(JSON.stringify({
                                type: 'ice_candidate',
                                ice: {
                                    candidate: event.candidate.candidate,
                                    sdpMid: event.candidate.sdpMid || '0',
                                    sdpMLineIndex: event.candidate.sdpMLineIndex || 0
                                },
                                room: roomId,
                                username
                            }));
                        }
                    } catch (err) {
                        console.error('Ошибка отправки ICE кандидата:', err);
                    }
                }
            };

            // Обработка входящих медиапотоков
            pc.current.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    // Проверяем, что видеопоток содержит данные
                    const videoTrack = event.streams[0].getVideoTracks()[0];
                    if (videoTrack) {
                        const videoElement = document.createElement('video');
                        videoElement.srcObject = new MediaStream([videoTrack]);
                        videoElement.onloadedmetadata = () => {
                            if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                                setRemoteStream(event.streams[0]);
                                setIsCallActive(true);

                                // Видео получено, очищаем таймер проверки
                                if (videoCheckTimeout.current) {
                                    clearTimeout(videoCheckTimeout.current);
                                    videoCheckTimeout.current = null;
                                }
                            } else {
                                console.warn('Получен пустой видеопоток');
                            }
                        };
                    } else {
                        console.warn('Входящий поток не содержит видео');
                    }
                }
            };

            // Обработка состояния ICE соединения
            pc.current.oniceconnectionstatechange = () => {
                if (!pc.current) return;

                if (pc.current?.iceConnectionState === 'disconnected' ||
                    pc.current?.iceConnectionState === 'failed') {
                    console.log('ICE соединение разорвано, возможно нас заменили');
                    leaveRoom();
                }

                console.log('Состояние ICE соединения:', pc.current.iceConnectionState);

                switch (pc.current.iceConnectionState) {
                    case 'failed':
                        console.log('Перезапуск ICE...');
                        setTimeout(() => {
                            if (pc.current && pc.current.iceConnectionState === 'failed') {
                                pc.current.restartIce();
                                if (isInRoom && !isCallActive) {
                                    createAndSendOffer().catch(console.error);
                                }
                            }
                        }, 1000);
                        break;

                    case 'disconnected':
                        console.log('Соединение прервано...');
                        setIsCallActive(false);
                        setTimeout(() => {
                            if (pc.current && pc.current.iceConnectionState === 'disconnected') {
                                createAndSendOffer().catch(console.error);
                            }
                        }, 2000);
                        break;

                    case 'connected':
                        console.log('Соединение установлено!');
                        setIsCallActive(true);
                        break;

                    case 'closed':
                        console.log('Соединение закрыто');
                        setIsCallActive(false);
                        break;
                }
            };

            // Запускаем мониторинг статистики соединения
            startConnectionMonitoring();

            return true;
        } catch (err) {
            console.error('Ошибка инициализации WebRTC:', err);
            setError(`Не удалось инициализировать WebRTC: ${err instanceof Error ? err.message : String(err)}`);
            cleanup();
            return false;
        }
    };

    const startConnectionMonitoring = () => {
        if (statsInterval.current) {
            clearInterval(statsInterval.current);
        }

        statsInterval.current = setInterval(async () => {
            if (!pc.current || !isCallActive) return;

            try {
                const stats = await pc.current.getStats();
                let hasActiveVideo = false;

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        if (report.bytesReceived > 0) {
                            hasActiveVideo = true;
                        }
                    }
                });

                if (!hasActiveVideo && isCallActive) {
                    console.warn('Нет активного видеопотока, пытаемся восстановить...');
                    resetConnection();
                }
            } catch (err) {
                console.error('Ошибка получения статистики:', err);
            }
        }, 5000);
    };

    const resetConnection = async () => {
        if (retryAttempts.current >= MAX_RETRIES) {
            setError('Не удалось восстановить соединение после нескольких попыток');
            leaveRoom();
            return;
        }

        retryAttempts.current += 1;
        setRetryCount(retryAttempts.current);
        console.log(`Попытка восстановления #${retryAttempts.current}`);

        try {
            await leaveRoom();
            await new Promise(resolve => setTimeout(resolve, 1000 * retryAttempts.current));
            await joinRoom(username);
        } catch (err) {
            console.error('Ошибка при восстановлении соединения:', err);
        }
    };

    const restartMediaDevices = async () => {
        try {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } : {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                },
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : true
            });

            setLocalStream(stream);

            if (pc.current) {
                const senders = pc.current.getSenders();
                stream.getTracks().forEach(track => {
                    const sender = senders.find(s => s.track?.kind === track.kind);
                    if (sender) {
                        sender.replaceTrack(track);
                    } else {
                        pc.current?.addTrack(track, stream);
                    }
                });
            }

            return true;
        } catch (err) {
            console.error('Ошибка перезагрузки медиаустройств:', err);
            setError('Ошибка доступа к медиаустройствам');
            return false;
        }
    };

    const joinRoom = async (uniqueUsername: string) => {
        setError(null);
        setIsInRoom(false);
        setIsConnected(false);

        try {
            // 1. Подключаем WebSocket
            if (!(await connectWebSocket())) {
                throw new Error('Не удалось подключиться к WebSocket');
            }

            setupWebSocketListeners();

            // 2. Инициализируем WebRTC
            if (!(await initializeWebRTC())) {
                throw new Error('Не удалось инициализировать WebRTC');
            }

            // 3. Отправляем запрос на присоединение к комнате
            await new Promise<void>((resolve, reject) => {
                if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket не подключен'));
                    return;
                }

                const onMessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'room_info') {
                            cleanupEvents();
                            resolve();
                        } else if (data.type === 'error') {
                            cleanupEvents();
                            reject(new Error(data.data || 'Ошибка входа в комнату'));
                        }
                    } catch (err) {
                        cleanupEvents();
                        reject(err);
                    }
                };

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('message', onMessage);
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                    }
                };

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    console.log('Таймаут ожидания ответа от сервера');
                }, 10000);

                ws.current.addEventListener('message', onMessage);
                ws.current.send(JSON.stringify({
                    action: "join",
                    room: roomId,
                    username: uniqueUsername,
                    isLeader: false // Браузер всегда ведомый
                }));
            });

            // 4. Успешное подключение
            setIsInRoom(true);
            shouldCreateOffer.current = true;

            // 5. Создаем оффер, если мы первые в комнате
            if (users.length === 0) {
                await createAndSendOffer();
            }

            // 6. Запускаем таймер проверки видео
            startVideoCheckTimer();

        } catch (err) {
            console.error('Ошибка входа в комнату:', err);
            setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`);

            // Полная очистка при ошибке
            cleanup();
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            // Автоматическая повторная попытка
            if (retryAttempts.current < MAX_RETRIES) {
                setTimeout(() => {
                    joinRoom(uniqueUsername).catch(console.error);
                }, 2000 * (retryAttempts.current + 1));
            }
        }
    };

    useEffect(() => {
        return () => {
            leaveRoom();
        };
    }, []);

    return {
        localStream,
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        error,
        retryCount,
        resetConnection,
        restartMediaDevices,
        ws: ws.current, // Возвращаем текущее соединение
    };
};

// file: docker-ardua/components/webrtc/lib/webrtc.ts
//app\webrtc\lib\webrtc.ts
export function checkWebRTCSupport(): boolean {
if (typeof window === 'undefined') return false;

    const requiredAPIs = [
        'RTCPeerConnection',
        'RTCSessionDescription',
        'RTCIceCandidate',
        'MediaStream',
        'navigator.mediaDevices.getUserMedia'
    ];

    return requiredAPIs.every(api => {
        try {
            if (api.includes('.')) {
                const [obj, prop] = api.split('.');
                return (window as any)[obj]?.[prop] !== undefined;
            }
            return (window as any)[api] !== undefined;
        } catch {
            return false;
        }
    });
}







// file: docker-ardua/components/webrtc/lib/signaling.ts
// file: client/app/webrtc/lib/signaling.ts
import { RoomInfo, SignalingMessage, SignalingClientOptions } from '../types';

export class SignalingClient {
private ws: WebSocket | null = null;
private reconnectAttempts = 0;
private connectionTimeout: NodeJS.Timeout | null = null;
private connectionPromise: Promise<void> | null = null;
private resolveConnection: (() => void) | null = null;

    public onRoomInfo: (data: RoomInfo) => void = () => {};
    public onOffer: (data: RTCSessionDescriptionInit) => void = () => {};
    public onAnswer: (data: RTCSessionDescriptionInit) => void = () => {};
    public onCandidate: (data: RTCIceCandidateInit) => void = () => {};
    public onError: (error: string) => void = () => {};
    public onLeave: (username?: string) => void = () => {};
    public onJoin: (username: string) => void = () => {};

    constructor(
        private url: string,
        private options: SignalingClientOptions = {}
    ) {
        this.options = {
            maxReconnectAttempts: 5,
            reconnectDelay: 1000,
            connectionTimeout: 5000,
            ...options
        };
    }

    public get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    public connect(roomId: string, username: string): Promise<void> {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(this.url);
        this.setupEventListeners();

        this.connectionPromise = new Promise((resolve, reject) => {
            this.resolveConnection = resolve;

            this.connectionTimeout = setTimeout(() => {
                if (!this.isConnected) {
                    this.handleError('Connection timeout');
                    reject(new Error('Connection timeout'));
                }
            }, this.options.connectionTimeout);

            this.ws!.onopen = () => {
                this.ws!.send(JSON.stringify({
                    type: 'join',
                    room: roomId,
                    username: username
                }));
            };
        });

        return this.connectionPromise;
    }

    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.onmessage = (event) => {
            try {
                const message: SignalingMessage = JSON.parse(event.data);

                if (!('type' in message)) {
                    console.warn('Received message without type:', message);
                    return;
                }

                switch (message.type) {
                    case 'room_info':
                        this.onRoomInfo(message.data);
                        break;
                    case 'error':
                        this.onError(message.data);
                        break;
                    case 'offer':
                        this.onOffer(message.sdp);
                        break;
                    case 'answer':
                        this.onAnswer(message.sdp);
                        break;
                    case 'candidate':
                        this.onCandidate(message.candidate);
                        break;
                    case 'leave':
                        this.onLeave(message.data);
                        break;
                    case 'join':
                        this.onJoin(message.data);
                        break;
                    default:
                        console.warn('Unknown message type:', message);
                }
            } catch (error) {
                this.handleError('Invalid message format');
            }
        };

        this.ws.onclose = () => {
            console.log('Signaling connection closed');
            this.cleanup();
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            this.handleError(`Connection error: ${error}`);
        };
    }

    public sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        return this.send({ type: 'offer', sdp: offer });
    }

    public sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        return this.send({ type: 'answer', sdp: answer });
    }

    public sendCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        return this.send({ type: 'candidate', candidate });
    }

    public sendLeave(username: string): Promise<void> {
        return this.send({ type: 'leave', data: username });
    }

    private send(data: SignalingMessage): Promise<void> {
        if (!this.isConnected) {
            return Promise.reject(new Error('WebSocket not connected'));
        }

        try {
            this.ws!.send(JSON.stringify(data));
            return Promise.resolve();
        } catch (error) {
            console.error('Send error:', error);
            return Promise.reject(error);
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
            return this.handleError('Max reconnection attempts reached');
        }

        this.reconnectAttempts++;
        console.log(`Reconnecting (attempt ${this.reconnectAttempts})`);

        setTimeout(() => this.connect('', ''), this.options.reconnectDelay);
    }

    private handleError(error: string): void {
        console.error('Signaling error:', error);
        this.onError(error);
        this.cleanup();
    }

    private cleanup(): void {
        this.clearTimeout(this.connectionTimeout);
        if (this.resolveConnection) {
            this.resolveConnection();
            this.resolveConnection = null;
        }
        this.connectionPromise = null;
    }

    private clearTimeout(timer: NodeJS.Timeout | null): void {
        if (timer) clearTimeout(timer);
    }

    public close(): void {
        this.cleanup();
        this.ws?.close();
    }
}

// file: docker-ardua/components/webrtc/VideoCallApp.tsx
// file: docker-ardua/components/webrtc/VideoCallApp.tsx
'use client'

import { useWebRTC } from './hooks/useWebRTC'
import styles from './styles.module.css'
import { VideoPlayer } from './components/VideoPlayer'
import { DeviceSelector } from './components/DeviceSelector'
import { useEffect, useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import SocketClient from '../control/SocketClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"


type VideoSettings = {
rotation: number
flipH: boolean
flipV: boolean
}

// Тип для сохраненных комнат
type SavedRoom = {
id: string // Без тире (XXXX-XXXX-XXXX-XXXX -> XXXXXXXXXXXXXXXX)
isDefault: boolean
}

export const VideoCallApp = () => {
const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
const [selectedDevices, setSelectedDevices] = useState({
video: '',
audio: ''
})
const [showLocalVideo, setShowLocalVideo] = useState(true)
const [videoTransform, setVideoTransform] = useState('')
const [roomId, setRoomId] = useState('') // С тире (XXXX-XXXX-XXXX-XXXX)
const [username, setUsername] = useState('user_' + Math.floor(Math.random() * 1000))
const [hasPermission, setHasPermission] = useState(false)
const [devicesLoaded, setDevicesLoaded] = useState(false)
const [isJoining, setIsJoining] = useState(false)
const [autoJoin, setAutoJoin] = useState(false)
const [activeMainTab, setActiveMainTab] = useState<'webrtc' | 'esp' | null>(null)
const [showControls, setShowControls] = useState(false)
const [videoSettings, setVideoSettings] = useState<VideoSettings>({
rotation: 0,
flipH: false,
flipV: false
})
const [muteLocalAudio, setMuteLocalAudio] = useState(false)
const [muteRemoteAudio, setMuteRemoteAudio] = useState(false)
const videoContainerRef = useRef<HTMLDivElement>(null)
const [isFullscreen, setIsFullscreen] = useState(false)
const remoteVideoRef = useRef<HTMLVideoElement>(null);
const localAudioTracks = useRef<MediaStreamTrack[]>([])
const [useBackCamera, setUseBackCamera] = useState(false)
const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([])
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
const [roomToDelete, setRoomToDelete] = useState<string | null>(null)


    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const {
        localStream,
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        error,
        ws
    } = useWebRTC(selectedDevices, username, roomId.replace(/-/g, '')) // Удаляем тире при передаче в useWebRTC

    // Загрузка сохраненных комнат и настроек из localStorage
    useEffect(() => {
        const loadSettings = () => {
            try {
                const saved = localStorage.getItem('videoSettings')
                if (saved) {
                    const parsed = JSON.parse(saved) as VideoSettings
                    setVideoSettings(parsed)
                    applyVideoTransform(parsed)
                }
            } catch (e) {
                console.error('Failed to load video settings', e)
            }
        }

        const loadSavedRooms = () => {
            try {
                const saved = localStorage.getItem('savedRooms')
                if (saved) {
                    const rooms: SavedRoom[] = JSON.parse(saved)
                    setSavedRooms(rooms)

                    // Находим комнату по умолчанию
                    const defaultRoom = rooms.find(r => r.isDefault)
                    if (defaultRoom) {
                        // Форматируем ID с тире для отображения
                        setRoomId(formatRoomId(defaultRoom.id))
                    }
                }
            } catch (e) {
                console.error('Failed to load saved rooms', e)
            }
        }

        const savedMuteLocal = localStorage.getItem('muteLocalAudio')
        if (savedMuteLocal !== null) {
            setMuteLocalAudio(savedMuteLocal === 'true')
        }

        const savedMuteRemote = localStorage.getItem('muteRemoteAudio')
        if (savedMuteRemote !== null) {
            setMuteRemoteAudio(savedMuteRemote === 'true')
        }

        const savedShowLocalVideo = localStorage.getItem('showLocalVideo')
        if (savedShowLocalVideo !== null) {
            setShowLocalVideo(savedShowLocalVideo === 'true')
        }

        const savedCameraPref = localStorage.getItem('useBackCamera')
        if (savedCameraPref !== null) {
            setUseBackCamera(savedCameraPref === 'true')
        }

        const savedAutoJoin = localStorage.getItem('autoJoin') === 'true'
        setAutoJoin(savedAutoJoin)

        loadSettings()
        loadSavedRooms()
        loadDevices()
    }, [])

    // Форматирование ID комнаты с тире (XXXX-XXXX-XXXX-XXXX)
    const formatRoomId = (id: string): string => {
        // Удаляем все недопустимые символы (оставляем только буквы и цифры)
        const cleanId = id.replace(/[^A-Z0-9]/gi, '')

        // Вставляем тире каждые 4 символа
        return cleanId.replace(/(.{4})(?=.)/g, '$1-')
    }

    // Обработчик изменения поля ID комнаты
    const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.toUpperCase()

        // Удаляем все недопустимые символы (оставляем только буквы, цифры и тире)
        let cleanInput = input.replace(/[^A-Z0-9-]/gi, '')

        // Ограничиваем длину до 19 символов (16 символов + 3 тире)
        if (cleanInput.length > 19) {
            cleanInput = cleanInput.substring(0, 19)
        }

        // Вставляем тире каждые 4 символа
        const formatted = formatRoomId(cleanInput)
        setRoomId(formatted)
    }

    // Проверка, что введен полный ID комнаты (16 символов без учета тире)
    const isRoomIdComplete = roomId.replace(/-/g, '').length === 16

    // Сохранение комнаты в список
    const handleSaveRoom = () => {
        if (!isRoomIdComplete) return

        const roomIdWithoutDashes = roomId.replace(/-/g, '')

        // Проверяем, не сохранена ли уже эта комната
        if (savedRooms.some(r => r.id === roomIdWithoutDashes)) {
            return
        }

        const newRoom: SavedRoom = {
            id: roomIdWithoutDashes,
            isDefault: savedRooms.length === 0 // Первая комната становится по умолчанию
        }

        const updatedRooms = [...savedRooms, newRoom]
        setSavedRooms(updatedRooms)
        saveRoomsToStorage(updatedRooms)
    }

    // Удаление комнаты из списка
    const handleDeleteRoom = (roomIdWithoutDashes: string) => {
        setRoomToDelete(roomIdWithoutDashes)
        setShowDeleteDialog(true)
    }

    // Подтверждение удаления комнаты
    const confirmDeleteRoom = () => {
        if (!roomToDelete) return

        const updatedRooms = savedRooms.filter(r => r.id !== roomToDelete)

        // Если удаляем комнату по умолчанию, назначаем новую по умолчанию (если есть)
        if (savedRooms.some(r => r.id === roomToDelete && r.isDefault)) {
            if (updatedRooms.length > 0) {
                updatedRooms[0].isDefault = true
            }
        }

        setSavedRooms(updatedRooms)
        saveRoomsToStorage(updatedRooms)

        // Если удаленная комната была текущей, очищаем поле
        if (roomId.replace(/-/g, '') === roomToDelete) {
            setRoomId('')
        }

        setShowDeleteDialog(false)
        setRoomToDelete(null)
    }

    // Выбор комнаты из списка
    const handleSelectRoom = (roomIdWithoutDashes: string) => {
        // Форматируем ID с тире для отображения
        setRoomId(formatRoomId(roomIdWithoutDashes))
    }

    // Установка комнаты по умолчанию
    const setDefaultRoom = (roomIdWithoutDashes: string) => {
        const updatedRooms = savedRooms.map(r => ({
            ...r,
            isDefault: r.id === roomIdWithoutDashes
        }))

        setSavedRooms(updatedRooms)
        saveRoomsToStorage(updatedRooms)
    }

    // Сохранение списка комнат в localStorage
    const saveRoomsToStorage = (rooms: SavedRoom[]) => {
        localStorage.setItem('savedRooms', JSON.stringify(rooms))
    }

    // Функция переключения камеры на Android устройстве
    const toggleCamera = () => {
        const newCameraState = !useBackCamera
        setUseBackCamera(newCameraState)
        localStorage.setItem('useBackCamera', String(newCameraState))

        // Проверяем соединение перед отправкой
        if (isConnected && ws) {
            try {
                ws.send(JSON.stringify({
                    type: "switch_camera",
                    useBackCamera: newCameraState,
                    room: roomId.replace(/-/g, ''),
                    username: username
                }))
            } catch (err) {
                console.error('Error sending camera switch command:', err)
            }
        } else {
            console.error('Not connected to server')
        }
    }

    // Управление локальным звуком
    useEffect(() => {
        if (localStream) {
            localAudioTracks.current = localStream.getAudioTracks()
            localAudioTracks.current.forEach(track => {
                track.enabled = !muteLocalAudio
            })
        }
    }, [localStream, muteLocalAudio])

    // Управление удаленным звуком
    useEffect(() => {
        if (remoteStream) {
            remoteStream.getAudioTracks().forEach(track => {
                track.enabled = !muteRemoteAudio
            })
        }
    }, [remoteStream, muteRemoteAudio])

    useEffect(() => {
        if (autoJoin && hasPermission && !isInRoom && isRoomIdComplete) {
            handleJoinRoom();
        }
    }, [autoJoin, hasPermission, isRoomIdComplete]); // Зависимости

    const applyVideoTransform = (settings: VideoSettings) => {
        const { rotation, flipH, flipV } = settings
        let transform = ''
        if (rotation !== 0) transform += `rotate(${rotation}deg) `
        transform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
        setVideoTransform(transform)

        if (remoteVideoRef.current) {
            remoteVideoRef.current.style.transform = transform
            remoteVideoRef.current.style.transformOrigin = 'center center'
        }
    }

    const saveSettings = (settings: VideoSettings) => {
        localStorage.setItem('videoSettings', JSON.stringify(settings))
    }

    const loadDevices = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })

            stream.getTracks().forEach(track => track.stop())

            const devices = await navigator.mediaDevices.enumerateDevices()
            setDevices(devices)
            setHasPermission(true)
            setDevicesLoaded(true)

            const savedVideoDevice = localStorage.getItem('videoDevice')
            const savedAudioDevice = localStorage.getItem('audioDevice')

            setSelectedDevices({
                video: savedVideoDevice || '',
                audio: savedAudioDevice || ''
            })
        } catch (error) {
            console.error('Device access error:', error)
            setHasPermission(false)
            setDevicesLoaded(true)
        }
    }

    const toggleLocalVideo = () => {
        const newState = !showLocalVideo
        setShowLocalVideo(newState)
        localStorage.setItem('showLocalVideo', String(newState))
    }

    const updateVideoSettings = (newSettings: Partial<VideoSettings>) => {
        const updated = { ...videoSettings, ...newSettings }
        setVideoSettings(updated)
        applyVideoTransform(updated)
        saveSettings(updated)
    }

    const handleDeviceChange = (type: 'video' | 'audio', deviceId: string) => {
        setSelectedDevices(prev => ({
            ...prev,
            [type]: deviceId
        }))
        localStorage.setItem(`${type}Device`, deviceId)
    }

    const handleJoinRoom = async () => {
        if (!isRoomIdComplete) return

        setIsJoining(true)
        try {
            // Устанавливаем выбранную комнату как дефолтную
            setDefaultRoom(roomId.replace(/-/g, ''))

            await joinRoom(username)
        } catch (error) {
            console.error('Error joining room:', error)
        } finally {
            setIsJoining(false)
        }
    }

    const toggleFullscreen = async () => {
        if (!videoContainerRef.current) return

        try {
            if (!document.fullscreenElement) {
                await videoContainerRef.current.requestFullscreen()
                setIsFullscreen(true)
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch (err) {
            console.error('Fullscreen error:', err)
        }
    }

    const toggleMuteLocalAudio = () => {
        const newState = !muteLocalAudio
        setMuteLocalAudio(newState)
        localStorage.setItem('muteLocalAudio', String(newState))

        localAudioTracks.current.forEach(track => {
            track.enabled = !newState
        })
    }

    const toggleMuteRemoteAudio = () => {
        const newState = !muteRemoteAudio
        setMuteRemoteAudio(newState)
        localStorage.setItem('muteRemoteAudio', String(newState))

        if (remoteStream) {
            remoteStream.getAudioTracks().forEach(track => {
                track.enabled = !newState
            })
        }
    }

    const rotateVideo = (degrees: number) => {
        updateVideoSettings({ rotation: degrees });

        if (remoteVideoRef.current) {
            if (degrees === 90 || degrees === 270) {
                remoteVideoRef.current.classList.add(styles.rotated);
            } else {
                remoteVideoRef.current.classList.remove(styles.rotated);
            }
        }
    };

    const flipVideoHorizontal = () => {
        updateVideoSettings({ flipH: !videoSettings.flipH })
    }

    const flipVideoVertical = () => {
        updateVideoSettings({ flipV: !videoSettings.flipV })
    }

    const resetVideo = () => {
        updateVideoSettings({ rotation: 0, flipH: false, flipV: false })
    }

    const toggleTab = (tab: 'webrtc' | 'esp' | 'controls') => {
        if (tab === 'controls') {
            setShowControls(!showControls)
        } else {
            setActiveMainTab(activeMainTab === tab ? null : tab)
        }
    }

    return (
        <div
            className={styles.container}
            suppressHydrationWarning // Добавляем это для игнорирования различий в атрибутах
        >
            <div
                ref={videoContainerRef}
                className={styles.remoteVideoContainer}
                suppressHydrationWarning
            >
                {isClient && ( // Оборачиваем в проверку isClient для клиент-сайд рендеринга
                    <VideoPlayer
                        stream={remoteStream}
                        className={styles.remoteVideo}
                        transform={videoTransform}
                        videoRef={remoteVideoRef}
                    />
                )}
            </div>

            {showLocalVideo && (
                <div className={styles.localVideoContainer}>
                    <VideoPlayer
                        stream={localStream}
                        muted
                        className={styles.localVideo}
                    />
                </div>
            )}

            <div className={styles.topControls}>
                <div className={styles.tabsContainer}>
                    <button
                        onClick={() => toggleTab('webrtc')}
                        className={`${styles.tabButton} ${activeMainTab === 'webrtc' ? styles.activeTab : ''}`}
                    >
                        {activeMainTab === 'webrtc' ? '▲' : '▼'} <img src="/cam.svg" alt="Camera"/>
                    </button>
                    <button
                        onClick={() => toggleTab('esp')}
                        className={`${styles.tabButton} ${activeMainTab === 'esp' ? styles.activeTab : ''}`}
                    >
                        {activeMainTab === 'esp' ? '▲' : '▼'} <img src="/joy.svg" alt="Joystick"/>
                    </button>
                    <button
                        onClick={() => toggleTab('controls')}
                        className={`${styles.tabButton} ${showControls ? styles.activeTab : ''}`}
                    >
                        {showControls ? '▲' : '▼'} <img src="/img.svg" alt="Image"/>
                    </button>
                </div>
            </div>

            {activeMainTab === 'webrtc' && (
                <div className={styles.tabContent}>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.controls}>
                        <div className={styles.connectionStatus}>
                            Статус: {isConnected ? (isInRoom ? `В комнате ${roomId}` : 'Подключено') : 'Отключено'}
                            {isCallActive && ' (Звонок активен)'}
                            {users.length > 0 && (
                                <div>
                                    Роль: {users[0] === username ? "Ведущий" : "Ведомый"}
                                </div>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="autoJoin"
                                    checked={autoJoin}
                                    disabled={!isRoomIdComplete}
                                    onCheckedChange={(checked) => {
                                        setAutoJoin(!!checked)
                                        localStorage.setItem('autoJoin', checked ? 'true' : 'false')
                                    }}
                                    suppressHydrationWarning
                                />
                                <Label htmlFor="autoJoin">Автоматическое подключение</Label>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <Label htmlFor="room">ID комнаты</Label>
                            <Input
                                id="room"
                                value={roomId}
                                onChange={handleRoomIdChange}
                                disabled={isInRoom}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                maxLength={19}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <Label htmlFor="username">Ваше имя</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isInRoom}
                                placeholder="Ваше имя"
                            />
                        </div>

                        {!isInRoom ? (
                            <Button
                                onClick={handleJoinRoom}
                                disabled={!hasPermission || isJoining || !isRoomIdComplete}
                                className={styles.button}
                            >
                                {isJoining ? 'Подключение...' : 'Войти в комнату'}
                            </Button>
                        ) : (
                            <Button onClick={leaveRoom} className={styles.button}>
                                Покинуть комнату
                            </Button>
                        )}

                        <div className={styles.inputGroup}>
                            <Button
                                onClick={handleSaveRoom}
                                disabled={!isRoomIdComplete || savedRooms.some(r => r.id === roomId.replace(/-/g, ''))}
                                className={styles.button}
                            >
                                Сохранить ID комнаты
                            </Button>
                        </div>

                        {savedRooms.length > 0 && (
                            <div className={styles.savedRooms}>
                                <h3>Сохраненные комнаты:</h3>
                                <ul>
                                    {savedRooms.map((room) => (
                                        <li key={room.id} className={styles.savedRoomItem}>
                                            <span
                                                onClick={() => handleSelectRoom(room.id)}
                                                className={room.isDefault ? styles.defaultRoom : ''}
                                            >
                                                {formatRoomId(room.id)}
                                                {room.isDefault && ' (по умолчанию)'}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                className={styles.deleteRoomButton}
                                            >
                                                Удалить
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className={styles.userList}>
                            <h3>Участники ({users.length}):</h3>
                            <ul>
                                {users.map((user, index) => (
                                    <li key={index}>{user}</li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.deviceSelection}>
                            <h3>Выбор устройств:</h3>
                            {devicesLoaded ? (
                                <DeviceSelector
                                    devices={devices}
                                    selectedDevices={selectedDevices}
                                    onChange={handleDeviceChange}
                                    onRefresh={loadDevices}
                                />
                            ) : (
                                <div>Загрузка устройств...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeMainTab === 'esp' && (
                <div className={styles.tabContent}>
                    <SocketClient/>
                </div>
            )}

            {showControls && (
                <div className={styles.tabContent}>
                    <div className={styles.videoControlsTab}>
                        <div className={styles.controlButtons}>
                            <button
                                onClick={toggleCamera}
                                className={`${styles.controlButton} ${useBackCamera ? styles.active : ''}`}
                                title={useBackCamera ? 'Переключить на фронтальную камеру' : 'Переключить на заднюю камеру'}
                            >
                                {useBackCamera ? '📷⬅️' : '📷➡️'}
                            </button>
                            <button
                                onClick={() => rotateVideo(0)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 0 ? styles.active : ''}`}
                                title="Обычная ориентация"
                            >
                                ↻0°
                            </button>
                            <button
                                onClick={() => rotateVideo(90)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 90 ? styles.active : ''}`}
                                title="Повернуть на 90°"
                            >
                                ↻90°
                            </button>
                            <button
                                onClick={() => rotateVideo(180)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 180 ? styles.active : ''}`}
                                title="Повернуть на 180°"
                            >
                                ↻180°
                            </button>
                            <button
                                onClick={() => rotateVideo(270)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 270 ? styles.active : ''}`}
                                title="Повернуть на 270°"
                            >
                                ↻270°
                            </button>
                            <button
                                onClick={flipVideoHorizontal}
                                className={`${styles.controlButton} ${videoSettings.flipH ? styles.active : ''}`}
                                title="Отразить по горизонтали"
                            >
                                ⇄
                            </button>
                            <button
                                onClick={flipVideoVertical}
                                className={`${styles.controlButton} ${videoSettings.flipV ? styles.active : ''}`}
                                title="Отразить по вертикали"
                            >
                                ⇅
                            </button>
                            <button
                                onClick={resetVideo}
                                className={styles.controlButton}
                                title="Сбросить настройки"
                            >
                                ⟲
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className={styles.controlButton}
                                title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
                            >
                                {isFullscreen ? '✕' : '⛶'}
                            </button>
                            <button
                                onClick={toggleLocalVideo}
                                className={`${styles.controlButton} ${!showLocalVideo ? styles.active : ''}`}
                                title={showLocalVideo ? 'Скрыть локальное видео' : 'Показать локальное видео'}
                            >
                                {showLocalVideo ? '👁' : '👁‍🗨'}
                            </button>
                            <button
                                onClick={toggleMuteLocalAudio}
                                className={`${styles.controlButton} ${muteLocalAudio ? styles.active : ''}`}
                                title={muteLocalAudio ? 'Включить микрофон' : 'Отключить микрофон'}
                            >
                                {muteLocalAudio ? '🎤🔇' : '🎤'}
                            </button>
                            <button
                                onClick={toggleMuteRemoteAudio}
                                className={`${styles.controlButton} ${muteRemoteAudio ? styles.active : ''}`}
                                title={muteRemoteAudio ? 'Включить звук' : 'Отключить звук'}
                            >
                                {muteRemoteAudio ? '🔈🔇' : '🔈'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Диалог подтверждения удаления комнаты */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить комнату?</DialogTitle>
                    </DialogHeader>
                    <p>Вы уверены, что хотите удалить комнату {roomToDelete ? formatRoomId(roomToDelete) : ''}?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Отмена
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteRoom}>
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
Android библиотеки используй только эти:
// WebRTC
implementation("io.github.webrtc-sdk:android:125.6422.07")
// WebSocket
implementation("com.squareup.okhttp3:okhttp:4.11.0")

Server GO библиотеки используй только эти:
github.com/gorilla/websocket v1.5.3
github.com/pion/webrtc/v3 v3.3.5

почему трансляция создается, а потом нет. почему в гугл хром работает, а в firefox и safari нет? 
TURN и STUN работает 100% - может где надо что то пересоздать обновить, когда ведомый уходит из комнаты.
Напомню ведущий создает комнату, ведомый только присоединяется. Попробуй как нибудь все очистить в комнате чтобы новому ведомому поступала корректно трансляция видео. Если комната не создана ну жно чтобы ведомому оповещалось что комната не создана и роль его всегда Роль: Ведущий - Next - браузер.
почему после перезагрузки сервера всегда ведомый получает трансляцию видео, что нужно сделать чтобы так работало всегда? может удалять комнату и ведущий создавал ее заново для улучшения обмена видео?
так же не убираей логику сервера, особенно замена ведомого, когда подсоединяется второй ведомый. Правило в комнате может быть один ведущий и один ведомый. Ведущий создает комнату, ведомый нет.
дай полный код, комментарии на русском 




трансляция появилась во всех браузерах. Но когда ведомый покидает комнату, то последующие соединения ведомого не получается трансляция видео
Задание: Посмотри что можно улучшить чтобы ведомые всегда с разных браузеров могли отсоединяться и присоединиться несколько раз и получать трансляцию. 
После перезагрузки сервера ведомый всегда получает трансляцию видео,  TURN и STUN работает 100%
Server GO библиотеки используй только эти:
github.com/gorilla/websocket v1.5.3
github.com/pion/webrtc/v3 v3.3.5

ты исправляешь не первый раз у тебя вот такие ошибки, избегай их:
pi@PC:~/Projects/docker/docker-go$ go run main.go
# command-line-arguments
./main.go:8:2: "strings" imported and not used
./main.go:402:23: cannot use ice["sdpMid"].(string) (comma, ok expression of type string) as *string value in struct literal
./main.go:403:24: cannot use uint16(ice["sdpMLineIndex"].(float64)) (value of type uint16) as *uint16 value in struct literal
./main.go:404:24: cannot use ice["usernameFragment"].(string) (comma, ok expression of type string) as *string value in struct literal

и чтобы не было таких ошибок
2025/04/30 06:13:17 AddICECandidate error: InvalidStateError: remote description is not set
2025/04/30 06:13:17 AddICECandidate error: InvalidStateError: remote description is not set
2025/04/30 06:13:17 AddICECandidate error: InvalidStateError: remote description is not set

может нужно добавить:
// Очистка при отключении
mu.Lock()
delete(peers, remoteAddr)
delete(rooms[peer.room], peer.username)
if len(rooms[peer.room]) == 0 {
delete(rooms, peer.room)
}
mu.Unlock()

	log.Printf("User '%s' left room '%s'", peer.username, peer.room)
	logStatus()
	sendRoomInfo(peer.room)




дай полный код, комментарии на русском , не меняй и не улучшай логику и синтаксис кода если это не относится к заданию.

