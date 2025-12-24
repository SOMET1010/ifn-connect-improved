import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';

interface OnboardingStep {
  title: string;
  description: string;
  targetId?: string; // ID de l'élément à highlighter
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useLanguage();

  const steps: OnboardingStep[] = [
    {
      title: t('onboardingWelcomeTitle'),
      description: t('onboardingWelcomeDesc'),
      position: 'bottom',
    },
    {
      title: t('onboardingCashRegisterTitle'),
      description: t('onboardingCashRegisterDesc'),
      targetId: 'btn-cash-register',
      position: 'bottom',
    },
    {
      title: t('onboardingSoundTitle'),
      description: t('onboardingSoundDesc'),
      targetId: 'btn-speech-toggle',
      position: 'bottom',
    },
    {
      title: t('onboardingLanguageTitle'),
      description: t('onboardingLanguageDesc'),
      targetId: 'btn-language-selector',
      position: 'bottom',
    },
    {
      title: t('onboardingProfileTitle'),
      description: t('onboardingProfileDesc'),
      targetId: 'btn-profile',
      position: 'bottom',
    },
    {
      title: t('onboardingCongratulationsTitle'),
      description: t('onboardingCongratulationsDesc'),
      position: 'bottom',
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Calculer la position du spotlight
  const getTargetPosition = () => {
    if (!currentStepData.targetId) return null;
    const element = document.getElementById(currentStepData.targetId);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };

  const targetPosition = getTargetPosition();

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calculer la position de la bulle explicative
  const getTooltipPosition = () => {
    if (!targetPosition) {
      // Centré si pas de target
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const position = currentStepData.position || 'bottom';

    switch (position) {
      case 'bottom':
        return {
          top: `${targetPosition.top + targetPosition.height + padding}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'top':
        return {
          top: `${targetPosition.top - padding}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'left':
        return {
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.left - padding}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.left + targetPosition.width + padding}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          top: `${targetPosition.top + targetPosition.height + padding}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: 'translateX(-50%)',
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay semi-transparent */}
      <div className="absolute inset-0 bg-black/60" onClick={onSkip} />

      {/* Spotlight sur l'élément actif */}
      {targetPosition && (
        <div
          className="absolute border-4 border-yellow-400 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: `${targetPosition.top - 4}px`,
            left: `${targetPosition.left - 4}px`,
            width: `${targetPosition.width + 8}px`,
            height: `${targetPosition.height + 8}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Bulle explicative */}
      <Card
        className="absolute w-[90%] max-w-md p-6 shadow-2xl"
        style={tooltipPosition}
      >
        {/* Bouton fermer */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Indicateur d'étape */}
        <div className="flex gap-1 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full ${
                index === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Contenu */}
        <h3 className="text-2xl font-bold mb-3">{currentStepData.title}</h3>
        <p className="text-muted-foreground text-lg mb-6">
          {currentStepData.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex-1"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('previous')}
          </Button>

          <Button
            size="lg"
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {isLastStep ? t('finish') : t('next')}
            {!isLastStep && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>

        {/* Bouton Passer */}
        {!isLastStep && (
          <button
            onClick={onSkip}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            {t('skipTutorial')}
          </button>
        )}
      </Card>
    </div>
  );
}
