'use client';

import { useState, useEffect } from 'react';
import { TutorialStep } from '@/lib/tutorialSteps';

interface TutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export default function Tutorial({ steps, onComplete, onSkip }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (step.targetElement) {
      const element = document.querySelector(step.targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });

        // スムーズにスクロール
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetPosition(null);
    }
  }, [currentStep, step.targetElement]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getModalPosition = () => {
    if (!targetPosition || step.position === 'center') {
      return 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }

    const { top, left, width, height } = targetPosition;
    const modalWidth = 400;
    const modalHeight = 200;
    const padding = 20;

    switch (step.position) {
      case 'top':
        return `fixed`;
      case 'bottom':
        return `fixed`;
      case 'left':
        return `fixed`;
      case 'right':
        return `fixed`;
      default:
        return 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  const getModalStyles = () => {
    if (!targetPosition || step.position === 'center') {
      return {};
    }

    const { top, left, width, height } = targetPosition;
    const padding = 20;

    switch (step.position) {
      case 'top':
        return {
          top: `${top - 250}px`,
          left: `${left + width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${top + height + padding}px`,
          left: `${left + width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${top + height / 2}px`,
          left: `${left - 420}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${top + height / 2}px`,
          left: `${left + width + padding}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {};
    }
  };

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/70 z-40 animate-fade-in" onClick={onSkip} />

      {/* ハイライト */}
      {step.highlightElement && targetPosition && (
        <div
          className="fixed z-50 pointer-events-none animate-pulse"
          style={{
            top: `${targetPosition.top - 4}px`,
            left: `${targetPosition.left - 4}px`,
            width: `${targetPosition.width + 8}px`,
            height: `${targetPosition.height + 8}px`,
            border: '4px solid #3b82f6',
            borderRadius: '8px',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
          }}
        />
      )}

      {/* チュートリアルモーダル */}
      <div
        className={`${getModalPosition()} z-50 bg-slate-800 border-2 border-blue-500 rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-in-up`}
        style={getModalStyles()}
      >
        {/* プログレスバー */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>ステップ {currentStep + 1} / {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* タイトル */}
        <h2 className="text-2xl font-bold mb-3 text-white">{step.title}</h2>

        {/* コンテンツ */}
        <div className="text-slate-300 mb-6 whitespace-pre-line leading-relaxed">
          {step.content}
        </div>

        {/* アクションヒント */}
        {step.action && step.action !== 'none' && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-sm text-blue-300">
            💡 {step.action === 'click' ? 'クリックしてみましょう' : 'マウスを乗せてみましょう'}
          </div>
        )}

        {/* ボタン */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            スキップ
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                ← 戻る
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg transition-all hover:shadow-lg"
            >
              {isLastStep ? '完了！ 🎉' : '次へ →'}
            </button>
          </div>
        </div>

        {/* ステップインジケーター */}
        <div className="flex justify-center gap-1.5 mt-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-blue-500'
                  : index < currentStep
                  ? 'w-1.5 bg-blue-500/50'
                  : 'w-1.5 bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
