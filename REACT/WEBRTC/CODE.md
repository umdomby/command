HTTPS_REACT://webrtc.org/getting-started/media-devices#using-promises_1

//получение устройств
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    console.log(devices)
  });

