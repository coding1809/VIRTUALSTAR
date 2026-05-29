"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./LiveClientSim.module.css";

const OPENING_LINES = {
  cold_call: ["¿Quién habla?", "¿Cómo consiguió mi número?", "No me interesa, gracias.", "Ahorita no es buen momento.", "¿De qué empresa llama usted?"],
  follow_up:  ["Sí, creo que hablamos... ¿de qué era?", "Ah sí, pero ya le dije que no estoy interesado.", "¿Otra vez usted? ¿Qué necesita?"],
  referral:   ["Sí, me habló mi amigo de usted... ¿qué ofrece?", "¿Usted es el del seguro? Mi amigo dijo que llamara.", "Cuénteme, ¿de qué se trata?"],
  objection:  ["Ya tengo seguro, gracias.", "No necesito más seguros, ya estoy cubierto.", "Mire, ya tengo seguro con otra compañía, ¿para qué más?"],
};

const PHASE = { CLIENT: "client", LISTENING: "listening", PROCESSING: "processing", AI: "ai", HANGUP: "hangup", SUCCESS: "success" };
const WAVE_BARS = 5;

function speak(text, onEnd) {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-US";
  utter.rate = 0.92;
  utter.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.startsWith("es") && v.localService) ?? voices.find((v) => v.lang.startsWith("es"));
  if (voice) utter.voice = voice;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}

function SentimentBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct <= 15 ? "#ef4444" : pct <= 40 ? "#f97316" : pct <= 65 ? "#eab308" : "#22d3ee";
  const label = pct <= 15 ? "Colgando…" : pct <= 40 ? "Sin interés" : pct <= 65 ? "Escuchando" : "Confianza";
  return (
    <div className={styles.sentimentWrap}>
      <div className={styles.sentimentLabels}>
        <span className={styles.sentimentLeft}>📵 Cuelga</span>
        <span className={styles.sentimentCenter}>Sin interés</span>
        <span className={styles.sentimentRight}>Confianza ✓</span>
      </div>
      <div className={styles.sentimentTrack}>
        <div className={styles.sentimentFill} style={{ width: `${pct}%`, background: color }} />
        <div className={styles.sentimentThumb} style={{ left: `${pct}%`, borderColor: color }}>
          <span className={styles.sentimentLabel} style={{ color }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function EndOverlay({ type, history, onRetry, onClose }) {
  const [feedback, setFeedback] = useState(null);
  const isSuccess = type === "success";

  useEffect(() => {
    fetch("/api/sim-feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ history, type }),
    })
      .then((r) => r.json())
      .then(setFeedback)
      .catch(() => setFeedback(null));
  }, []); // eslint-disable-line

  return (
    <div className={`${styles.hangupOverlay} ${isSuccess ? styles.successOverlay : ""}`}>
      <div className={`${styles.hangupCard} ${isSuccess ? styles.successCard : ""}`}>
        <div className={styles.hangupPhone}>{isSuccess ? "🎉" : "📵"}</div>
        <h2 className={`${styles.hangupTitle} ${isSuccess ? styles.successTitle : ""}`}>
          {isSuccess ? "¡Cita confirmada!" : "El cliente colgó."}
        </h2>

        {!feedback ? (
          <div className={styles.hangupLoading}><div className={styles.spinner} /><p>Analizando la llamada…</p></div>
        ) : isSuccess ? (
          <>
            <div className={`${styles.hangupReason} ${styles.successReason}`}>
              <p className={styles.hangupReasonLabel}>Lo que hiciste bien</p>
              <p className={styles.hangupReasonText}>{feedback.highlight}</p>
            </div>
            <div className={styles.hangupTips}>
              <p className={styles.hangupTipsLabel}>Para la cita, recuerda…</p>
              {(feedback.tips ?? []).map((tip, i) => (
                <div key={i} className={styles.hangupTip}>
                  <span className={styles.hangupTipNum}>{i + 1}</span>
                  <p>"{tip}"</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={styles.hangupReason}>
              <p className={styles.hangupReasonLabel}>Por qué colgó</p>
              <p className={styles.hangupReasonText}>{feedback.reason}</p>
            </div>
            <div className={styles.hangupTips}>
              <p className={styles.hangupTipsLabel}>La próxima vez intenta decir…</p>
              {(feedback.tips ?? []).map((tip, i) => (
                <div key={i} className={styles.hangupTip}>
                  <span className={styles.hangupTipNum}>{i + 1}</span>
                  <p>"{tip}"</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.hangupActions}>
          <button className={styles.retryBtn} onClick={onRetry}>🔄 Intentar de nuevo</button>
          <button className={styles.exitBtn} onClick={onClose}>Salir</button>
        </div>
      </div>
    </div>
  );
}

export default function LiveClientSim({ config, onClose }) {
  const { scenario, difficulty, trainingWheels = false } = config;
  const lines = OPENING_LINES[scenario.id] ?? OPENING_LINES.cold_call;

  const [phase, setPhase] = useState(PHASE.CLIENT);
  const [clientLine, setClientLine] = useState(() => lines[Math.floor(Math.random() * lines.length)]);
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [sentiment, setSentiment] = useState(difficulty.sentimentStart);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [endType, setEndType] = useState(null);
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);

  const historyRef = useRef([]);
  const phaseRef = useRef(PHASE.CLIENT);
  const pausedRef = useRef(false);
  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const barRefs = useRef([]);
  const timeLeftRef = useRef(30);

  function setPhaseSync(p) { phaseRef.current = p; setPhase(p); }

  function animateWave() {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const step = Math.floor(data.length / WAVE_BARS);
    barRefs.current.forEach((bar, i) => { if (bar) bar.style.height = `${4 + (data[i * step] / 255) * 30}px`; });
    animFrameRef.current = requestAnimationFrame(animateWave);
  }

  function stopWave() {
    cancelAnimationFrame(animFrameRef.current);
    barRefs.current.forEach((bar) => { if (bar) bar.style.height = "4px"; });
  }

  function stopAll() {
    clearInterval(timerRef.current);
    stopWave();
    window.speechSynthesis.cancel();
    recorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
  }

  function triggerEnd(type) {
    stopAll();
    setPhaseSync(type === "success" ? PHASE.SUCCESS : PHASE.HANGUP);
    setTimeout(() => setEndType(type), type === "success" ? 400 : 1200);
  }

  async function startRecording() {
    if (pausedRef.current) return;
    setTranscript("");
    setTimeLeft(30);
    timeLeftRef.current = 30;
    setError("");

    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setError("Microphone access denied."); return; }

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    animateWave();

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(200);
    recorderRef.current = recorder;
    setPhaseSync(PHASE.LISTENING);

    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) { clearInterval(timerRef.current); stopAndTranscribe(); }
    }, 1000);
  }

  function togglePause() {
    const nowPaused = !pausedRef.current;
    pausedRef.current = nowPaused;
    setPaused(nowPaused);
    if (nowPaused) {
      window.speechSynthesis.pause();
      audioCtxRef.current?.suspend();
      stopWave();
    } else {
      window.speechSynthesis.resume();
      audioCtxRef.current?.resume().then(() => { if (phaseRef.current === PHASE.LISTENING) animateWave(); });
    }
  }

  const stopAndTranscribe = useCallback(() => {
    if (phaseRef.current !== PHASE.LISTENING) return;
    setPhaseSync(PHASE.PROCESSING);
    clearInterval(timerRef.current);
    stopWave();
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") { sendToAI("(sin respuesta)"); return; }
    recorder.onstop = async () => {
      audioCtxRef.current?.close();
      recorder.stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      try {
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const text = data.text?.trim() || "(sin audio)";
        setTranscript(text);
        sendToAI(text);
      } catch (err) {
        setError(err.message ?? "Transcription failed.");
        setPhaseSync(PHASE.LISTENING);
      }
    };
    recorder.stop();
  }, []); // eslint-disable-line

  async function sendToAI(agentText) {
    const updated = [...historyRef.current, { role: "agent", text: agentText }];
    historyRef.current = updated;
    try {
      const res = await fetch("/api/sim-response", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentText,
          history: updated,
          difficulty: difficulty.id,
          scenarioContext: scenario.context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const { reply, delta = -5, status = "ongoing" } = data;
      historyRef.current = [...updated, { role: "client", text: reply }];
      setClientLine(reply);
      setHint(null);

      if (status === "appointment_set") {
        speak(reply, () => triggerEnd("success"));
        return;
      }
      if (status === "end_call") {
        speak(reply, () => triggerEnd("hangup"));
        return;
      }

      const next = Math.max(0, Math.min(100, sentiment + delta));
      setSentiment(next);
      if (next <= 0) { speak(reply, () => triggerEnd("hangup")); return; }

      setPhaseSync(PHASE.AI);
      const fireSpeak = () => speak(reply, () => { if (!pausedRef.current) startRecording(); });
      if (window.speechSynthesis.getVoices().length > 0) fireSpeak();
      else window.speechSynthesis.onvoiceschanged = fireSpeak;
    } catch (err) {
      setError(err.message ?? "AI response failed.");
      setPhaseSync(PHASE.LISTENING);
    }
  }

  useEffect(() => {
    const line = clientLine;
    historyRef.current = [{ role: "client", text: line }];
    const fire = () => speak(line, () => startRecording());
    if (window.speechSynthesis.getVoices().length > 0) fire();
    else window.speechSynthesis.onvoiceschanged = fire;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      recorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []); // eslint-disable-line

  function handleRetry() {
    setEndType(null);
    setSentiment(difficulty.sentimentStart);
    historyRef.current = [];
    const line = lines[Math.floor(Math.random() * lines.length)];
    setClientLine(line);
    setTranscript("");
    setHint(null);
    setPhaseSync(PHASE.CLIENT);
    pausedRef.current = false;
    setPaused(false);
    historyRef.current = [{ role: "client", text: line }];
    const fire = () => speak(line, () => startRecording());
    if (window.speechSynthesis.getVoices().length > 0) fire();
    else window.speechSynthesis.onvoiceschanged = fire;
  }

  const isListening = phase === PHASE.LISTENING;
  const isProcessing = phase === PHASE.PROCESSING;
  const isEnded = phase === PHASE.HANGUP || phase === PHASE.SUCCESS;

  async function fetchHint() {
    setHintLoading(true);
    try {
      const res = await fetch("/api/sim-hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ history: historyRef.current, scenarioContext: scenario.context }),
      });
      const data = await res.json();
      if (res.ok) setHint(data.hint);
    } catch { /* silently ignore */ }
    finally { setHintLoading(false); }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {isEnded && !endType && (
          <div className={phase === PHASE.SUCCESS ? styles.successFlash : styles.hangupFlash} />
        )}

        {endType && (
          <EndOverlay type={endType} history={historyRef.current} onRetry={handleRetry} onClose={onClose} />
        )}

        <div className={styles.leftPanel}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          <p className={styles.simLabel}>Live Client Sim</p>

          <div className={styles.callInfo}>
            <span className={styles.callDot} />
            <span>
              {phase === PHASE.CLIENT && "Client speaking…"}
              {phase === PHASE.LISTENING && "Your turn — speak now"}
              {phase === PHASE.PROCESSING && "Transcribing…"}
              {phase === PHASE.AI && "Client responding…"}
              {phase === PHASE.HANGUP && "Call ended."}
              {phase === PHASE.SUCCESS && "Appointment booked!"}
            </span>
          </div>

          <div className={styles.bubble}>
            <span className={styles.bubbleRole}>Client</span>
            <p className={styles.bubbleText}>{clientLine}</p>
          </div>

          <div className={`${styles.agentArea} ${isListening && !paused ? styles.agentAreaActive : ""}`}>
            <div className={styles.agentAreaTop}>
              <span className={styles.agentLabel}>You</span>
              {isListening && !paused && (
                <div className={styles.timerPill}>
                  <span className={timeLeft <= 5 ? styles.timerUrgent : ""}>{timeLeft}s</span>
                </div>
              )}
              {paused && <span className={styles.pausedTag}>Paused</span>}
            </div>
            <div className={styles.soundWave}>
              {Array.from({ length: WAVE_BARS }).map((_, i) => (
                <span key={i} ref={(el) => { barRefs.current[i] = el; }}
                  className={`${styles.waveBar} ${isListening && !paused ? styles.waveBarActive : ""}`} />
              ))}
            </div>
            <p className={styles.agentTranscript}>
              {transcript || (isListening && !paused ? "Listening… speak now" : isProcessing ? "Transcribing with Whisper…" : "")}
            </p>
            {trainingWheels && isListening && !paused && (
              <div className={styles.hintWrap}>
                {!hint && !hintLoading && (
                  <button className={styles.hintBtn} onClick={fetchHint}>💡 Ver sugerencia</button>
                )}
                {hintLoading && <p className={styles.hintLoading}>Buscando sugerencia…</p>}
                {hint && <p className={styles.hintText}>💡 {hint}</p>}
              </div>
            )}
            {isListening && !paused && (
              <button className={styles.doneBtn} onClick={stopAndTranscribe}>Done ↵</button>
            )}
          </div>

          <SentimentBar value={sentiment} />
          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            className={`${styles.pauseBtn} ${paused ? styles.pauseBtnActive : ""}`}
            onClick={togglePause}
            disabled={isEnded}
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
        </div>

        <div className={styles.rightPanel}>
          <Image src="/images/services/CLIENT .png" alt="Live client" fill
            style={{ objectFit: "contain", objectPosition: "center bottom" }} priority />
          {isProcessing && (
            <div className={styles.processingOverlay}>
              <div className={styles.spinner} />
              <p>Reading your response…</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
