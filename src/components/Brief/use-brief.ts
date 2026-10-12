'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useGoal } from '@/components/Analytics/use-consent';
import { useRouter } from '@/i18n/navigation';
import { GOALS } from '@/lib/analytics/consts';
import { BRIEF_STEPS, HONEYPOT_FIELD, THANKS_HREF } from '@/lib/brief/consts';
import type { BriefChoice } from '@/lib/brief/types';
import { BRIEF_EMPTY_ANSWERS, BRIEF_STEP_REQUIRED } from './consts';
import type { BriefAnswers, BriefProps, BriefStatus, UseBrief } from './types';

export const useBrief = ({ design, plan }: BriefProps): UseBrief => {
  const router = useRouter();
  const reachGoal = useGoal();
  const started = useRef(false);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<BriefAnswers>({ ...BRIEF_EMPTY_ANSWERS, design, product: plan ?? '' });
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState('');
  const [status, setStatus] = useState<BriefStatus>('idle');

  const current = BRIEF_STEPS[step];
  const isLast = step === BRIEF_STEPS.length - 1;
  const filled = BRIEF_STEP_REQUIRED[current].every((field) => answers[field as keyof BriefAnswers].trim());

  const pick = (field: BriefChoice, value: string) => {
    if (!started.current) {
      started.current = true;
      reachGoal(GOALS.quizStart);
    }

    setAnswers((state) => ({ ...state, [field]: value }));
  };

  const write =
    (field: 'name' | 'contact' | 'comment') => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setAnswers((state) => ({ ...state, [field]: event.target.value }));

  const back = () => setStep((value) => value - 1);

  const next = () => setStep((value) => value + 1);

  const send = async () => {
    setStatus('sending');

    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...answers, plan, consent, [HONEYPOT_FIELD]: trap }),
      });

      if (!response.ok) {
        setStatus('error');

        return;
      }

      reachGoal(GOALS.quizComplete);
      router.push(THANKS_HREF);
    } catch {
      setStatus('error');
    }
  };

  return {
    step,
    current,
    isLast,
    filled,
    answers,
    consent,
    trap,
    status,
    pick,
    write,
    back,
    next,
    send,
    setConsent,
    setTrap,
  };
};
