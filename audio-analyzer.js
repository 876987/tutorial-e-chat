// public/audio-analyzer.js

let ws;

async function startAudio() {
  try {
    // Ask for mic permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Microphone access granted');

    // Connect to your Heroku WebSocket server
    ws = new WebSocket('wss://fyt-interview-fa9bf3d3321e.herokuapp.com/');
    ws.onopen = () => console.log('✅ WebSocket connected');

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const mic = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    mic.connect(analyser);

    // Analyze and send audio level every frame
    function analyze() {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, v) => sum + v, 0) / bufferLength;
      const normalized = (avg / 255).toFixed(3);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ level: normalized }));
      }

      requestAnimationFrame(analyze);
    }

    analyze();

  } catch (err) {
    alert('Microphone access denied or not available.');
    console.error('Mic error:', err);
  }
}
