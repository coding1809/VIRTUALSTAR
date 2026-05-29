"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./live-customer.module.css";

const DIFFICULTIES = [
  { key: "easy",   label: "Fácil",   desc: "Cliente paciente — margen de error alto" },
  { key: "medium", label: "Medio",   desc: "Cliente normal — algunas objeciones" },
  { key: "hard",   label: "Difícil", desc: "Cliente frío — tolerancia baja, cerrable con la respuesta correcta" },
];

const scenarios = [
  {
    customer: "Mira, la verdad no tengo presupuesto ahora mismo.",
    prompt: "Cliente dudando por costo. ¿Cómo respondes?",
    options: [
      {
        label: "Entiendo. ¿Qué pasaría si en seis meses ocurre algo y no tiene cobertura? Le muestro una opción de arranque sin comprometer su bolsillo.",
        score: 12, best: true,
        reaction: { easy: "Tiene razón… no lo había visto así. Cuénteme más.", medium: "Mm, eso me hace pensar. Tiene un minuto más.", hard: "…está bien. Tiene 60 segundos. Siga." },
        tone: "positive",
      },
      {
        label: "Hoy tenemos una promoción especial que termina esta semana.",
        score: 3, best: false,
        reaction: { easy: "¿Ah sí? ¿Cuánto sería?", medium: "Eso me suena a presión. No estoy seguro.", hard: "Otro con 'promoción'. No me interesa." },
        tone: "neutral",
      },
      {
        label: "No se preocupe, cuando tenga dinero me llama y vemos.",
        score: -8, best: false,
        reaction: { easy: "Okay, lo llamo… algún día.", medium: "Okay. Adiós.", hard: "*cuelga sin decir nada*" },
        tone: "negative",
      },
    ],
  },
  {
    customer: "Mire, ya tengo seguro con otra empresa. No necesito nada.",
    prompt: "Cliente cree que ya está cubierto. ¿Cómo respondes?",
    options: [
      {
        label: "Perfecto. Una pregunta rápida — ¿su póliza cubre gastos funerarios y pérdida de ingreso del hogar?",
        score: 10, best: true,
        reaction: { easy: "Pues… la verdad no sé si cubre eso.", medium: "Hmm… no lo he revisado. ¿Por qué lo pregunta?", hard: "¿Por qué? ¿Qué tiene que ver eso?" },
        tone: "positive",
      },
      {
        label: "La nuestra es mejor, le garantizo que le va a convencer.",
        score: -5, best: false,
        reaction: { easy: "Mmm, suena igual que todos.", medium: "Todos dicen lo mismo. No me interesa.", hard: "Claro, como todos. Adiós." },
        tone: "negative",
      },
      {
        label: "Puedo revisarle su póliza gratis para verificar que esté completa.",
        score: 7, best: false,
        reaction: { easy: "Bueno, eso no estaría mal.", medium: "Depende… ¿cuánto tiempo toma?", hard: "No tengo tiempo para revisiones." },
        tone: "neutral",
      },
    ],
  },
  {
    customer: "Déjeme pensarlo y yo le doy un aviso.",
    prompt: "Objeción de postergación. ¿Cómo respondes?",
    options: [
      {
        label: "Con gusto. ¿Qué necesitaría ver para decidir? Le agendo 10 minutos el jueves y le mando un resumen hoy.",
        score: 11, best: true,
        reaction: { easy: "Sí, el jueves me viene bien.", medium: "Mmm… el jueves podría ser.", hard: "…está bien. Pero solo 10 minutos." },
        tone: "positive",
      },
      {
        label: "Claro, cuando quiera me llama. Aquí estaré.",
        score: -5, best: false,
        reaction: { easy: "Okay, lo llamo… en algún momento.", medium: "Okay. *nunca llama*", hard: "Sí, claro. *cuelga*" },
        tone: "negative",
      },
      {
        label: "¿Qué es lo que le detiene — es el precio o algo más?",
        score: 8, best: false,
        reaction: { easy: "La verdad son varias cosas.", medium: "Pues… principalmente el precio.", hard: "No es de su incumbencia. Hasta luego." },
        tone: "neutral",
      },
    ],
  },
];

export default function LiveCustomerSimulatorPage() {
  const [difficulty, setDifficulty] = useState(null);
  const [trainingWheels, setTrainingWheels] = useState(false);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackTone, setFeedbackTone] = useState(null);

  const current = scenarios[step];
  const isComplete = step >= scenarios.length;

  const getRank = (s) => {
    if (s >= 28) return "Elite Closer 🏆";
    if (s >= 18) return "Buen Manejo";
    if (s >= 8)  return "En Progreso";
    return "Necesita Práctica";
  };

  const answer = (option) => {
    if (locked) return;
    setLocked(true);
    setScore((prev) => prev + option.score);
    setFeedback(option.reaction[difficulty]);
    setFeedbackTone(option.tone);
    setTimeout(() => {
      setStep((prev) => prev + 1);
      setLocked(false);
      setFeedback(null);
      setFeedbackTone(null);
    }, 2000);
  };

  const restart = () => {
    setStep(0);
    setScore(0);
    setLocked(false);
    setFeedback(null);
    setFeedbackTone(null);
    setDifficulty(null);
  };

  /* ── Difficulty selection screen ── */
  if (!difficulty) {
    return (
      <main className={styles.page}>
        <section className={styles.shell}>
          <header className={styles.topbar}>
            <div>
              <p className={styles.eyebrow}>Training Simulator</p>
              <h1>Live Customer</h1>
              <p>Practica objeciones reales como si fuera una llamada en vivo.</p>
            </div>
          </header>

          <article className={styles.gameCard}>
            <h2 className={styles.pickTitle}>Elige tu dificultad</h2>
            <div className={styles.diffGrid}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className={`${styles.diffBtn} ${styles[`diff_${d.key}`]}`}
                  onClick={() => setDifficulty(d.key)}
                >
                  <strong>{d.label}</strong>
                  <span>{d.desc}</span>
                </button>
              ))}
            </div>

            <label className={styles.twRow}>
              <span className={styles.twToggle}>
                <input
                  type="checkbox"
                  checked={trainingWheels}
                  onChange={(e) => setTrainingWheels(e.target.checked)}
                  className={styles.twInput}
                />
                <span className={styles.twTrack} />
              </span>
              <span className={styles.twLabel}>
                <strong>🎓 Training Wheels</strong>
                <small>Resalta la mejor respuesta antes de que elijas — ideal para aprender el guion correcto</small>
              </span>
            </label>

            <div className={styles.actions}>
              <Link href="/agent-portal/dashboard" className={styles.actionBtnSecondary}>← Dashboard</Link>
            </div>
          </article>
        </section>
      </main>
    );
  }

  /* ── Active game ── */
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>
              Training Simulator ·{" "}
              {DIFFICULTIES.find((d) => d.key === difficulty)?.label}
            </p>
            <h1>Live Customer</h1>
          </div>
          <div className={styles.topbarRight}>
            {trainingWheels && <span className={styles.twBadge}>🎓 Training Wheels</span>}
            <div className={styles.scoreCard}>
              <span>Score</span>
              <strong>{score}</strong>
            </div>
          </div>
        </header>

        {!isComplete ? (
          <article className={styles.gameCard}>
            <div className={styles.stepMeta}>
              <span>Paso {step + 1} de {scenarios.length}</span>
              <div className={styles.track}>
                <span style={{ width: `${((step + 1) / scenarios.length) * 100}%` }} />
              </div>
            </div>

            <div className={styles.customerBubble}>
              <span className={styles.avatar}>👤</span>
              <p>"{current.customer}"</p>
            </div>

            <p className={styles.prompt}>{current.prompt}</p>

            {feedback ? (
              <div className={`${styles.reactionBubble} ${styles[`tone_${feedbackTone}`]}`}>
                <span className={styles.avatar}>👤</span>
                <p>{feedback}</p>
              </div>
            ) : (
              <div className={styles.options}>
                {current.options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => answer(option)}
                    className={`${styles.optionBtn} ${trainingWheels && option.best ? styles.optionBest : ""}`}
                    disabled={locked}
                  >
                    <span>{option.label}</span>
                    {trainingWheels && option.best
                      ? <em className={styles.bestTag}>✓ Mayor prob. de éxito</em>
                      : <em className={styles.scoreHint}>{option.score > 0 ? `+${option.score}` : option.score}</em>
                    }
                  </button>
                ))}
              </div>
            )}
          </article>
        ) : (
          <article className={styles.gameCard}>
            <h2>Simulación completada</h2>
            <p className={styles.prompt}>
              Puntaje: <strong>{score}</strong> — {getRank(score)}
            </p>
            <p className={styles.summary}>
              {score >= 28
                ? "Dominas objeciones con contexto, valor y siguiente paso claro. Ese es el nivel."
                : score >= 18
                ? "Buen manejo. Practica el anclaje de valor y siempre cierra con una fecha concreta."
                : "Enfócate en escuchar antes de responder. Reencuadra el costo en términos de riesgo."}
            </p>
            <div className={styles.actions}>
              <button type="button" onClick={restart} className={styles.actionBtn}>Reiniciar</button>
              <Link href="/agent-portal/dashboard" className={styles.actionBtnSecondary}>Dashboard</Link>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
