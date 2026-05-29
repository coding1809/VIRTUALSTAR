"use client";

import { useState } from "react";
import styles from "./SimConfig.module.css";

const SCENARIOS = [
  {
    id: "cold_call",
    label: "Cold Call",
    emoji: "📞",
    desc: "Complete stranger, never heard of you",
    context: "You have never spoken to this agent before. You are busy and did not expect this call.",
  },
  {
    id: "follow_up",
    label: "Follow-Up",
    emoji: "🔁",
    desc: "Spoke briefly last week, showed little interest",
    context: "You spoke briefly with this agent last week but showed no real interest. You barely remember them.",
  },
  {
    id: "referral",
    label: "Referral",
    emoji: "🤝",
    desc: "A friend gave them your number",
    context: "A friend of yours referred this agent. You are slightly more open than usual but still cautious.",
  },
  {
    id: "objection",
    label: "Objection Heavy",
    emoji: "🛡️",
    desc: "Already has insurance, thinks they're covered",
    context: "You already have some insurance and are convinced you do not need more. You push back on everything the agent says.",
  },
];

const DIFFICULTIES = [
  {
    id: "easy",
    label: "Fácil",
    color: "#22c55e",
    desc: "Client is open to listening",
    sentimentStart: 58,
  },
  {
    id: "medium",
    label: "Medio",
    color: "#f5a623",
    desc: "Standard cold call skepticism",
    sentimentStart: 38,
  },
  {
    id: "hard",
    label: "Difícil",
    color: "#ef4444",
    desc: "Very resistant, dismissive",
    sentimentStart: 18,
  },
];

export default function SimConfig({ onStart }) {
  const [scenario, setScenario] = useState("cold_call");
  const [difficulty, setDifficulty] = useState("medium");
  const [trainingWheels, setTrainingWheels] = useState(false);

  const selectedScenario = SCENARIOS.find((s) => s.id === scenario);
  const selectedDifficulty = DIFFICULTIES.find((d) => d.id === difficulty);

  function handleStart() {
    onStart({
      scenario: selectedScenario,
      difficulty: selectedDifficulty,
      trainingWheels,
    });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Live Client Sim</p>
        <h2 className={styles.title}>Set up your call</h2>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Scenario</p>
          <div className={styles.scenarioGrid}>
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`${styles.scenarioBtn} ${scenario === s.id ? styles.scenarioBtnActive : ""}`}
                onClick={() => setScenario(s.id)}
              >
                <span className={styles.scenarioEmoji}>{s.emoji}</span>
                <span className={styles.scenarioLabel}>{s.label}</span>
                <span className={styles.scenarioDesc}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Difficulty</p>
          <div className={styles.diffRow}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`${styles.diffBtn} ${difficulty === d.id ? styles.diffBtnActive : ""}`}
                style={difficulty === d.id ? { borderColor: d.color, color: d.color } : {}}
                onClick={() => setDifficulty(d.id)}
              >
                <span className={styles.diffLabel}>{d.label}</span>
                <span className={styles.diffDesc}>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.twRow} onClick={() => setTrainingWheels((v) => !v)}>
          <span className={styles.twLabel}>🎓 Training Wheels</span>
          <span className={styles.twDesc}>Muestra una sugerencia antes de hablar</span>
          <button
            type="button"
            role="switch"
            aria-checked={trainingWheels}
            className={`${styles.twSwitch} ${trainingWheels ? styles.twSwitchOn : ""}`}
            onClick={(e) => { e.stopPropagation(); setTrainingWheels((v) => !v); }}
          />
        </div>

        <div className={styles.summary}>
          <span>{selectedScenario?.emoji} {selectedScenario?.label}</span>
          <span className={styles.summaryDot}>·</span>
          <span style={{ color: selectedDifficulty?.color }}>{selectedDifficulty?.label}</span>
        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          Start Call →
        </button>
      </div>
    </div>
  );
}
