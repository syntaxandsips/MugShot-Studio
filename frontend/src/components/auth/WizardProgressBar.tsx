
import { motion } from 'framer-motion';

interface Step {
    id: number;
    label: string;
}

interface WizardProgressBarProps {
    currentStep: number;
    totalSteps: number;
    steps: Step[];
}

export function WizardProgressBar({ currentStep, totalSteps, steps }: WizardProgressBarProps) {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="mb-12 relative">
            {/* Progress bar track - centered behind the 36px circles */}
            <div className="absolute top-[18px] left-0 w-full h-1 bg-gray-100 rounded-full -translate-y-1/2 px-4.5">
                <div className="mx-4.5 h-full relative">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                </div>
            </div>

            {/* Steps and labels */}
            <div className="relative flex justify-between items-start">
                {steps.map((step) => {
                    const isCompleted = step.id < currentStep;
                    const isCurrent = step.id === currentStep;

                    return (
                        <div key={step.id} className="flex flex-col items-center z-10">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isCurrent ? 1.1 : 1,
                                    backgroundColor: isCompleted
                                        ? '#4f46e5'
                                        : isCurrent
                                            ? '#4f46e5'
                                            : '#ffffff',
                                    borderColor: isCompleted || isCurrent ? '#4f46e5' : '#e5e7eb',
                                    color: isCompleted || isCurrent ? '#ffffff' : '#9ca3af',
                                }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-sm bg-white"
                            >
                                {isCompleted ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    step.id
                                )}
                            </motion.div>
                            <span className={`text-[10px] uppercase tracking-wider mt-3 font-bold transition-colors duration-300 ${
                                isCurrent ? 'text-[#4f46e5]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
