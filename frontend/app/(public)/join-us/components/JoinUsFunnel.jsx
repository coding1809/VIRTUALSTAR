"use client";

import { useState } from "react";

import styles from "../join-us.module.css";

const steps = [
  {
    key: "fullName",
    label: "Full Name *",
    title: "Let's start with your full name.",
    description: "We want to personalize your experience from the very first step.",
    type: "text",
    placeholder: "Enter your full name",
  },
  {
    key: "phone",
    label: "Phone Number *",
    title: "What's the best number to reach you?",
    description: "We'll use this to follow up quickly if you move forward.",
    type: "tel",
    placeholder: "(555) 555-5555",
  },
  {
    key: "email",
    label: "Email *",
    title: "Where should we send your info?",
    description: "You'll receive next steps and details at this address.",
    type: "email",
    placeholder: "you@example.com",
  },
  {
    key: "licensed",
    label: "Do you have a life insurance license? *",
    title: "Do you have a life insurance license?",
    description: "Select the option that best describes your current situation.",
    type: "choice",
    options: ["Yes", "No"],
  },
  {
    key: "salesExperience",
    label: "Have you sold over the phone or video? *",
    title: "Have you sold over the phone or video?",
    description: "This helps us understand your sales background.",
    type: "choice",
    options: ["Yes", "No"],
  },
  {
    key: "availability",
    label: "How much time can you commit? *",
    title: "How much availability do you have right now?",
    description: "Choose the range that best fits your current schedule.",
    type: "choice",
    options: ["10–20 hrs/wk", "40+ hrs/wk"],
  },
  {
    key: "investment",
    label: "Are you able to invest in your business? *",
    title: "Are you able to invest in your business?",
    description: "We look for agents committed to building something real.",
    type: "choice",
    options: ["Yes", "No"],
  },
  {
    key: "workPermit",
    label: "Do you have U.S. work authorization? *",
    title: "Do you have U.S. work authorization?",
    description: "We need to confirm this before moving forward.",
    type: "choice",
    options: ["Yes", "No"],
  },
];

const initialAnswers = steps.reduce((accumulator, step) => {
  accumulator[step.key] = "";
  return accumulator;
}, {});

export default function JoinUsFunnel() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [isComplete, setIsComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const currentStep = steps[stepIndex];
  const currentValue = answers[currentStep.key];
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const canContinue = currentValue.trim().length > 0;
  const isLastStep = stepIndex === steps.length - 1;

  function handleChange(value) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentStep.key]: value,
    }));
  }

  async function handleNext() {
    if (!canContinue) return;

    if (isLastStep) {
      setSubmitting(true);
      setSubmitError("");
      try {
        const res = await fetch("/api/join-us/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(answers),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Submission failed.");
        setIsComplete(true);
      } catch (err) {
        setSubmitError(err.message ?? "Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setStepIndex((currentIndex) => currentIndex + 1);
  }

  function handleBack() {
    setStepIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.progressMeta}>
        <span className={styles.progressText}>Step {Math.min(stepIndex + 1, steps.length)} of {steps.length}</span>
        <span className={styles.progressText}>{Math.round(progress)}%</span>
      </div>
      <div className={styles.progressBar} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {isComplete ? (
        <div className={styles.successState}>
          <span className={styles.successBadge}>Application Received</span>
          <h2 className={styles.successTitle}>You&apos;re in. We&apos;ll be in touch shortly.</h2>
          <p className={styles.successText}>
            We&apos;ve captured your information. The next step is connecting with you
            by phone or email to continue the selection process.
          </p>
        </div>
      ) : (
        <>
          <h2 className={styles.stepTitle}>{currentStep.title}</h2>
          <p className={styles.stepDescription}>{currentStep.description}</p>

          {currentStep.type === "choice" ? (
            <div className={styles.choiceGrid}>
              {currentStep.options.map((option) => {
                const isSelected = currentValue === option;
                const className = isSelected
                  ? `${styles.choiceButton} ${styles.choiceButtonSelected}`
                  : styles.choiceButton;

                return (
                  <button
                    key={option}
                    type="button"
                    className={className}
                    onClick={() => handleChange(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <label className={styles.fieldLabel} htmlFor={currentStep.key}>
                {currentStep.label}
              </label>
              <input
                id={currentStep.key}
                className={styles.textInput}
                type={currentStep.type}
                inputMode={currentStep.type === "tel" ? "tel" : currentStep.type === "email" ? "email" : "text"}
                placeholder={currentStep.placeholder}
                value={currentValue}
                onChange={(event) => handleChange(event.target.value)}
                autoComplete={currentStep.type === "email" ? "email" : currentStep.type === "tel" ? "tel" : "name"}
              />
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleBack}
              disabled={stepIndex === 0 || submitting}
            >
              Back
            </button>
            <button
              type="button"
              className={canContinue ? styles.primaryButton : `${styles.primaryButton} ${styles.primaryButtonDisabled}`}
              onClick={handleNext}
              disabled={!canContinue || submitting}
            >
              {submitting ? "Submitting…" : isLastStep ? "Submit" : "Continue"}
            </button>
          </div>

          {submitError && (
            <p style={{ margin: "8px 0 0", color: "#ff6b6b", fontSize: "0.82rem" }}>{submitError}</p>
          )}

          <p className={styles.disclaimer}>
            By continuing, you agree that Virtual Impact may contact you by phone,
            text, or email to follow up on this application.
          </p>
        </>
      )}
    </div>
  );
}
