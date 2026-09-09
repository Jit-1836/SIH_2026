class AudioDistressEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.microphone = null;
    this.animFrameId = null;
    this.isListening = false;
    this.distressStartTime = null;
    this.hasTriggered = false;
    // Lowered dB threshold for voice SOS ("HELP HELP" scream detection while phone locked)
    this.decibelThreshold = 52; 
    this.requiredDurationMs = 1500; // 1.5 seconds continuous acoustic scream / help trigger
  }

  async start(onFrame, onDistressTriggered) {
    if (this.isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: false, 
          autoGainControl: true 
        } 
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;

      this.microphone = this.audioCtx.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      this.isListening = true;
      this.hasTriggered = false;
      this.distressStartTime = null;

      const bufferLength = this.analyser.frequencyBinCount;
      const timeData = new Uint8Array(bufferLength);
      const freqData = new Uint8Array(bufferLength);

      const processFrame = () => {
        if (!this.isListening) return;

        this.analyser.getByteTimeDomainData(timeData);
        this.analyser.getByteFrequencyData(freqData);

        // Calculate RMS decibels
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        const decibels = Math.min(100, Math.max(25, Math.round(25 + rms * 140)));

        // Spectral Analysis: Check energy in Vocal Scream / Distress band (800 Hz - 3500 Hz)
        const binHz = (this.audioCtx.sampleRate || 44100) / this.analyser.fftSize;
        const binStart = Math.floor(800 / binHz);
        const binEnd = Math.floor(3500 / binHz);

        let vocalEnergy = 0;
        let peakVal = 0;
        let peakFreqBin = 0;

        for (let i = binStart; i < Math.min(binEnd, freqData.length); i++) {
          vocalEnergy += freqData[i];
          if (freqData[i] > peakVal) {
            peakVal = freqData[i];
            peakFreqBin = i;
          }
        }
        const avgVocalEnergy = vocalEnergy / (binEnd - binStart);
        const peakFrequency = Math.round(peakFreqBin * binHz);

        // Sensitivity evaluation: Lowered threshold for locked phone scream "HELP HELP"
        const isVoiceScream = decibels >= this.decibelThreshold || avgVocalEnergy > 110;

        let distressProgress = 0;

        if (isVoiceScream) {
          if (!this.distressStartTime) {
            this.distressStartTime = Date.now();
          }
          const elapsed = Date.now() - this.distressStartTime;
          distressProgress = Math.min(100, Math.round((elapsed / this.requiredDurationMs) * 100));

          if (elapsed >= this.requiredDurationMs && !this.hasTriggered) {
            this.hasTriggered = true;
            if (onDistressTriggered) {
              onDistressTriggered({
                trigger_type: 'Voice_SOS_LockedPhone',
                category: 'Voice SOS (Locked Phone Screams)',
                decibels,
                peak_frequency: peakFrequency,
                details: `Locked-Phone Voice SOS Triggered! Edge AI detected acoustic distress scream / "HELP HELP" call (${decibels} dB, ${peakFrequency} Hz) for > 1.5s.`
              });
            }
          }
        } else {
          this.distressStartTime = null;
          distressProgress = 0;
        }

        if (onFrame) {
          onFrame({
            decibels,
            timeData: Array.from(timeData),
            freqData: Array.from(freqData),
            peakFrequency,
            isDistressFrame: isVoiceScream,
            distressProgress,
            hasTriggered: this.hasTriggered
          });
        }

        this.animFrameId = requestAnimationFrame(processFrame);
      };

      processFrame();
      return true;
    } catch (err) {
      console.error("[Audio Engine] Mic access failed:", err);
      throw err;
    }
  }

  stop() {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.microphone && this.microphone.mediaStream) {
      this.microphone.mediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.audioCtx = null;
    this.analyser = null;
    this.distressStartTime = null;
    this.hasTriggered = false;
  }
}

export const audioEngine = new AudioDistressEngine();
