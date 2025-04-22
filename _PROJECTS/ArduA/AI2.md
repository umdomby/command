Next -
Next.js 15.3.1-canary.14 (stale)
Webpack
Console (https://nextjs.org/docs/messages/version-staleness) Error



InvalidAccessError: (https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code) Failed to set local offer sdp: The order of m-lines in subsequent offer doesn't match order from previous offer/answer.




Server Go
2025/04/21 18:34:26 SDP offer from user_501 (room1)
v=0
o=- 5967582303300649595 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1 2 3
a=extmap-allow-mixed
a=msid-semantic: WMS 86385170-a0b9-42b8-a3b3-c90c2480f1d5
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 103 104 105 106 107 108 109 127 125 112 113 114
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:Rdr2
a=ice-pwd:E+5p+v793lnl2wJCNmAFNv/S
a=ice-options:trickle
a=fingerprint:sha-256 D0:BC:CB:10:F3:CE:73:F9:C5:BF:95:4F:2B:96:51:6A:0A:DD:0C:79:FA:C1:59:77:78:C1:87:D3:E8:22:82:90
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 urn:3gpp:video-orientation
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=sendrecv
a=msid:86385170-a0b9-42b8-a3b3-c90c2480f1d5 3531082c-11de-441b-bf02-310724c3898f
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 H264/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 H264/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 H264/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=fmtp:100 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=640c1f
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:102 H264/90000
a=rtcp-fb:102 goog-remb
a=rtcp-fb:102 transport-cc
a=rtcp-fb:102 ccm fir
a=rtcp-fb:102 nack
a=rtcp-fb:102 nack pli
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=rtpmap:103 rtx/90000
a=fmtp:103 apt=102
a=rtpmap:104 H265/90000
a=rtcp-fb:104 goog-remb
a=rtcp-fb:104 transport-cc
a=rtcp-fb:104 ccm fir
a=rtcp-fb:104 nack
a=rtcp-fb:104 nack pli
a=rtpmap:105 rtx/90000
a=fmtp:105 apt=104
a=rtpmap:106 VP8/90000
a=rtcp-fb:106 goog-remb
a=rtcp-fb:106 transport-cc
a=rtcp-fb:106 ccm fir
a=rtcp-fb:106 nack
a=rtcp-fb:106 nack pli
a=rtpmap:107 rtx/90000
a=fmtp:107 apt=106
a=rtpmap:108 VP9/90000
a=rtcp-fb:108 goog-remb
a=rtcp-fb:108 transport-cc
a=rtcp-fb:108 ccm fir
a=rtcp-fb:108 nack
a=rtcp-fb:108 nack pli
a=fmtp:108 profile-id=0
a=rtpmap:109 rtx/90000
a=fmtp:109 apt=108
a=rtpmap:127 VP9/90000
a=rtcp-fb:127 goog-remb
a=rtcp-fb:127 transport-cc
a=rtcp-fb:127 ccm fir
a=rtcp-fb:127 nack
a=rtcp-fb:127 nack pli
a=fmtp:127 profile-id=2
a=rtpmap:125 rtx/90000
a=fmtp:125 apt=127
a=rtpmap:112 red/90000
a=rtpmap:113 rtx/90000
a=fmtp:113 apt=112
a=rtpmap:114 ulpfec/90000
a=ssrc-group:FID 3417096405 2701602285
a=ssrc:3417096405 cname:3QJ43hb7iC/PC/5Z
a=ssrc:3417096405 msid:86385170-a0b9-42b8-a3b3-c90c2480f1d5 3531082c-11de-441b-bf02-310724c3898f
a=ssrc:2701602285 cname:3QJ43hb7iC/PC/5Z
a=ssrc:2701602285 msid:86385170-a0b9-42b8-a3b3-c90c2480f1d5 3531082c-11de-441b-bf02-310724c3898f
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:Rdr2
a=ice-pwd:E+5p+v793lnl2wJCNmAFNv/S
a=ice-options:trickle
a=fingerprint:sha-256 D0:BC:CB:10:F3:CE:73:F9:C5:BF:95:4F:2B:96:51:6A:0A:DD:0C:79:FA:C1:59:77:78:C1:87:D3:E8:22:82:90
a=setup:actpass
a=mid:1
a=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=sendrecv
a=msid:86385170-a0b9-42b8-a3b3-c90c2480f1d5 abf8c659-b9b2-475a-b443-117d40112aca
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
a=ssrc:292508596 cname:3QJ43hb7iC/PC/5Z
a=ssrc:292508596 msid:86385170-a0b9-42b8-a3b3-c90c2480f1d5 abf8c659-b9b2-475a-b443-117d40112aca
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 103 104 105 106 107 108 109 127 125 112 113 114
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:Rdr2
a=ice-pwd:E+5p+v793lnl2wJCNmAFNv/S
a=ice-options:trickle
a=fingerprint:sha-256 D0:BC:CB:10:F3:CE:73:F9:C5:BF:95:4F:2B:96:51:6A:0A:DD:0C:79:FA:C1:59:77:78:C1:87:D3:E8:22:82:90
a=setup:actpass
a=mid:2
a=extmap:1 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 urn:3gpp:video-orientation
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=sendrecv
a=msid:70bd2026-1934-45cb-b62a-14483c1b190e 3536d442-eea0-4be7-a0fb-35731753405d
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 H264/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 H264/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 H264/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=fmtp:100 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=640c1f
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:102 H264/90000
a=rtcp-fb:102 goog-remb
a=rtcp-fb:102 transport-cc
a=rtcp-fb:102 ccm fir
a=rtcp-fb:102 nack
a=rtcp-fb:102 nack pli
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=rtpmap:103 rtx/90000
a=fmtp:103 apt=102
a=rtpmap:104 H265/90000
a=rtcp-fb:104 goog-remb
a=rtcp-fb:104 transport-cc
a=rtcp-fb:104 ccm fir
a=rtcp-fb:104 nack
a=rtcp-fb:104 nack pli
a=rtpmap:105 rtx/90000
a=fmtp:105 apt=104
a=rtpmap:106 VP8/90000
a=rtcp-fb:106 goog-remb
a=rtcp-fb:106 transport-cc
a=rtcp-fb:106 ccm fir
a=rtcp-fb:106 nack
a=rtcp-fb:106 nack pli
a=rtpmap:107 rtx/90000
a=fmtp:107 apt=106
a=rtpmap:108 VP9/90000
a=rtcp-fb:108 goog-remb
a=rtcp-fb:108 transport-cc
a=rtcp-fb:108 ccm fir
a=rtcp-fb:108 nack
a=rtcp-fb:108 nack pli
a=fmtp:108 profile-id=0
a=rtpmap:109 rtx/90000
a=fmtp:109 apt=108
a=rtpmap:127 VP9/90000
a=rtcp-fb:127 goog-remb
a=rtcp-fb:127 transport-cc
a=rtcp-fb:127 ccm fir
a=rtcp-fb:127 nack
a=rtcp-fb:127 nack pli
a=fmtp:127 profile-id=2
a=rtpmap:125 rtx/90000
a=fmtp:125 apt=127
a=rtpmap:112 red/90000
a=rtpmap:113 rtx/90000
a=fmtp:113 apt=112
a=rtpmap:114 ulpfec/90000
a=ssrc-group:FID 2386020336 16669364
a=ssrc:2386020336 cname:3QJ43hb7iC/PC/5Z
a=ssrc:2386020336 msid:70bd2026-1934-45cb-b62a-14483c1b190e 3536d442-eea0-4be7-a0fb-35731753405d
a=ssrc:16669364 cname:3QJ43hb7iC/PC/5Z
a=ssrc:16669364 msid:70bd2026-1934-45cb-b62a-14483c1b190e 3536d442-eea0-4be7-a0fb-35731753405d
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:Rdr2
a=ice-pwd:E+5p+v793lnl2wJCNmAFNv/S
a=ice-options:trickle
a=fingerprint:sha-256 D0:BC:CB:10:F3:CE:73:F9:C5:BF:95:4F:2B:96:51:6A:0A:DD:0C:79:FA:C1:59:77:78:C1:87:D3:E8:22:82:90
a=setup:actpass
a=mid:3
a=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=sendrecv
a=msid:70bd2026-1934-45cb-b62a-14483c1b190e 24738d4c-ad2e-48d8-be72-6c902346a9fa
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
a=ssrc:4091447420 cname:3QJ43hb7iC/PC/5Z
a=ssrc:4091447420 msid:70bd2026-1934-45cb-b62a-14483c1b190e 24738d4c-ad2e-48d8-be72-6c902346a9fa
2025/04/21 18:34:26 Video in SDP: true

WebSocket подключен
useWebRTC.ts:353 Требуется переговорный процесс
useWebRTC.ts:183 Получено сообщение: {data: {…}, type: 'room_info'}
useWebRTC.ts:310 Устанавливаем локальное описание с оффером
useWebRTC.ts:357 Состояние сигнализации изменилось: have-local-offer
useWebRTC.ts:361 Состояние сбора ICE изменилось: gathering
