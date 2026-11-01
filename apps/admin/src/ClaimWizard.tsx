import React, { useMemo, useState } from 'react';
import { claimsApi, type Item } from './api';
import { ProgressBar, StepProgress } from './components';
import { useToast } from './ToastContext';
interface ClaimWizardProps {
  item: Item;
  onClose: () => void;
  onSubmitted: () => void;
}
export function ClaimWizard({ item, onClose, onSubmitted }: ClaimWizardProps) {
  const { showToast } = useToast();
  const questions = useMemo(() => {
    const publicQuestions =
      item.verificationQuestions
        ?.map((entry) => entry.question)
        .filter(Boolean) ?? [];
    return publicQuestions.length > 0
      ? publicQuestions
      : ['What distinctive detail can you share to help verify this item?'];
  }, [item.verificationQuestions]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() =>
    questions.map(() => ''),
  );
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const totalSteps = questions.length + 1;
  const currentQuestion = step < questions.length ? questions[step] : undefined;
  const currentAnswer =
    step < questions.length ? (answers[step] ?? '') : message;
  function updateAnswer(value: string) {
    setAnswers((values) =>
      values.map((answer, index) => (index === step ? value : answer)),
    );
  }
  function next() {
    if (!currentAnswer.trim()) {
      setError(
        step < questions.length
          ? 'Please answer this verification question.'
          : 'Add a short message before submitting.',
      );
      return;
    }
    setError('');
    setStep((value) => Math.min(totalSteps - 1, value + 1));
  }
  function back() {
    setError('');
    setStep((value) => Math.max(0, value - 1));
  }
  async function submit() {
    if (!message.trim()) {
      setError('Add a short message before submitting.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await claimsApi.create(item.id, {
        message: message.trim(),
        answers: questions.map((question, index) => ({
          question,
          answer: answers[index]?.trim() ?? '',
        })),
      });
      setSubmitted(true);
      showToast('Claim sent. The poster will review your answers.', 'success');
    } catch (requestError: unknown) {
      setError((requestError as Error).message || 'Unable to send your claim.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className="modal-backdrop center"
      role="dialog"
      aria-modal="true"
      aria-label="Claim item"
    >
      {' '}
      <div
        className="modal"
        style={{
          maxWidth: 620,
          width: 'min(620px, calc(100vw - 32px))',
          maxHeight: 'min(760px, calc(100dvh - 32px))',
          overflow: 'auto',
          borderRadius: 'var(--r-2xl)',
        }}
      >
        {' '}
        <div className="modal-header">
          {' '}
          <div>
            {' '}
            <h2 className="modal-title">Claim this item</h2>{' '}
            <p
              style={{
                margin: '4px 0 0',
                color: 'var(--c-text-muted)',
                fontSize: 13,
              }}
            >
              {item.title}
            </p>{' '}
          </div>{' '}
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close claim form"
          >
            ×
          </button>{' '}
        </div>{' '}
        {submitted ? (
          <div style={{ padding: '24px 8px 8px', textAlign: 'center' }}>
            {' '}
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>{' '}
            <h3 style={{ marginBottom: 8 }}>Claim sent</h3>{' '}
            <p
              style={{
                color: 'var(--c-text-muted)',
                maxWidth: 420,
                margin: '0 auto 24px',
              }}
            >
              {' '}
              Your answers are private and will only be shown to the person who
              posted this item. We will notify you when they respond.{' '}
            </p>{' '}
            <button className="btn btn-primary" onClick={onSubmitted}>
              View activity
            </button>{' '}
          </div>
        ) : (
          <>
            {' '}
            <div style={{ padding: '0 8px' }}>
              {' '}
              <StepProgress
                steps={[
                  ...questions.map((_, index) => `Answer ${index + 1}`),
                  'Message',
                ]}
                current={step}
              />{' '}
              <ProgressBar value={step + 1} max={totalSteps} />{' '}
            </div>{' '}
            <div style={{ padding: '24px 8px 8px' }}>
              {' '}
              {currentQuestion ? (
                <div>
                  {' '}
                  <div
                    className="badge badge-found"
                    style={{ marginBottom: 12 }}
                  >
                    Private verification
                  </div>{' '}
                  <h3 style={{ marginBottom: 8 }}>{currentQuestion}</h3>{' '}
                  <p
                    style={{
                      color: 'var(--c-text-muted)',
                      fontSize: 14,
                      marginBottom: 18,
                    }}
                  >
                    {' '}
                    Only the item poster can review this answer.{' '}
                  </p>{' '}
                  <textarea
                    className="form-textarea"
                    value={answers[step] ?? ''}
                    onChange={(event) => updateAnswer(event.target.value)}
                    placeholder="Write a detail only the rightful owner would know"
                    rows={5}
                    maxLength={1000}
                    autoFocus
                  />{' '}
                  <div className="form-helper" style={{ textAlign: 'right' }}>
                    {(answers[step] ?? '').length}/1000
                  </div>{' '}
                </div>
              ) : (
                <div>
                  {' '}
                  <h3 style={{ marginBottom: 8 }}>Add a message</h3>{' '}
                  <p
                    style={{
                      color: 'var(--c-text-muted)',
                      fontSize: 14,
                      marginBottom: 18,
                    }}
                  >
                    {' '}
                    Give the poster helpful context without sharing phone
                    numbers, email addresses, or passwords.{' '}
                  </p>{' '}
                  <textarea
                    className="form-textarea"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="For example: I noticed this was missing after my afternoon class."
                    rows={5}
                    maxLength={500}
                    autoFocus
                  />{' '}
                  <div className="form-helper" style={{ textAlign: 'right' }}>
                    {message.length}/500
                  </div>{' '}
                </div>
              )}{' '}
              {error && (
                <div
                  className="form-error"
                  role="alert"
                  style={{ marginTop: 12 }}
                >
                  {error}
                </div>
              )}{' '}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginTop: 24,
                }}
              >
                {' '}
                <button
                  className="btn btn-secondary"
                  onClick={step === 0 ? onClose : back}
                  disabled={loading}
                >
                  {' '}
                  {step === 0 ? 'Cancel' : 'Back'}{' '}
                </button>{' '}
                {step < totalSteps - 1 ? (
                  <button className="btn btn-primary" onClick={next}>
                    Next
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => void submit()}
                    disabled={loading}
                  >
                    {' '}
                    {loading ? 'Sending…' : 'Send claim'}{' '}
                  </button>
                )}{' '}
              </div>{' '}
            </div>{' '}
          </>
        )}{' '}
      </div>{' '}
    </div>
  );
}
