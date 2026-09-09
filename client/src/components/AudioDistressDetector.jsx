import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertTriangle, Activity, Volume2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

export default function AudioDistressDetector({ onDistressTriggered, isOffline = false }) {
  const [isListening, setIsListening] = useState(false);
  const [audioState, setAudioState] = useState({
    decibels: 30,
    peakFrequency: 0,
    isDistressFrame: false,
    distressProgress: 0,
    hasTriggered: false
  });
  const [triggerLog, setTriggerLog] = useState([]);
  const canvasRef = useRef(null);

  const toggleListening = async () => {
    if (isListening) {
      audioEngine.stop();
      setIsListening(false);
    } else {
      try {
        await audioEngine.start(
          (frameData) => {
            setAudioState(frameData);
            drawWaveform(frameData.timeData, frameData.freqData, frameData.isDistressFrame);
          },
          (distressEvent) => {
            console.warn("[AUDIO AI AUTO-TRIGGERED]", distressEvent);
            setTriggerLog(prev => [distressEvent, ...prev]);
            if (onDistressTriggered) {
              onDistressTriggered(distressEvent);
            }
          }
        );
        setIsListening(true);
      } catch (err) {
        alert("Microphone access required for Edge AI Audio Detector. Please allow mic permission.");
      }
    }
  };

  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  // Draw Waveform and Spectral FFT Bars on Canvas
  const drawWaveform = (timeData, freqData, isDistress) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Frequency Bars Background
    if (freqData && freqData.length) {
      const barWidth = (width / freqData.length) * 2;
      let x = 0;
      for (let i = 0; i < freqData.length / 2; i++) {
        const barHeight = (freqData[i] / 255) * height;
        const hue = isDistress ? 0 : 200; // Red if distress, Cyan if normal
        ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.3)`;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }

    // Draw Oscilloscope Time-Domain Waveform
    if (timeData && timeData.length) {
      ctx.lineWidth = isDistress ? 3 : 2;
      ctx.strokeStyle = isDistress ? '#ef4444' : '#06b6d4';
      ctx.beginPath();

      const sliceWidth = width / timeData.length;
      let x = 0;

      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-700/60 shadow-2xl relative overflow-hidden">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Edge-AI Audio Distress Monitor
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                Web Audio FFT
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Hands-free trigger for screams, whistles & pipe taps (&gt; 2s continuous signal)
            </p>
          </div>
        </div>

        <button
          onClick={toggleListening}
          className={`px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg text-sm ${
            isListening
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse-fast'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Stop AI Monitor</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Activate Edge AI</span>
            </>
          )}
        </button>
      </div>

      {/* Visualizer Canvas */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-4 h-36 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={144}
          className="w-full h-full block"
        />

        {!isListening && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Mic className="w-8 h-8 text-slate-600" />
            <p className="text-xs font-medium">Click "Activate Edge AI" to monitor ambient acoustic distress</p>
          </div>
        )}

        {isListening && (
          <div className="absolute top-2 left-2 flex items-center space-x-2 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-mono">
            <div className={`w-2 h-2 rounded-full ${audioState.isDistressFrame ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
            <span className="text-slate-300">{audioState.decibels} dB</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{audioState.peakFrequency} Hz Peak</span>
          </div>
        )}
      </div>

      {/* Real-time Decibel & Trigger Threshold Bar */}
      {isListening && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Acoustic Energy Bar
            </span>
            <span className={`font-bold ${audioState.decibels >= 72 ? 'text-red-400' : 'text-slate-300'}`}>
              {audioState.decibels} / 100 dB (Threshold: 72 dB)
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              className={`h-full transition-all duration-75 ${
                audioState.decibels >= 72 ? 'bg-gradient-to-r from-amber-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, audioState.decibels)}%` }}
            />
            {/* Threshold Line marker */}
            <div className="absolute top-0 bottom-0 left-[72%] w-0.5 bg-red-400 opacity-70" />
          </div>

          {/* Continuous Distress Trigger Timer Bar */}
          {audioState.distressProgress > 0 && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 animate-pulse">
              <div className="flex justify-between items-center text-xs text-red-300 font-bold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> DISTRESS ACOUSTIC DETECTED!
                </span>
                <span>Hold 2s to Auto-SOS ({audioState.distressProgress}%)</span>
              </div>
              <div className="w-full h-2 bg-red-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${audioState.distressProgress}%` }}
                />
              </div>
            </div>
          )}

          {audioState.hasTriggered && (
            <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 rounded-xl p-3 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Edge AI Auto-SOS Emitted to Responders!</p>
                <p className="text-emerald-400/80">GPS packet + distress spectrogram sent over local Wi-Fi.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
