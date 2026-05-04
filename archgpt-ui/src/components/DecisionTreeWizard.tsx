'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { HouseDecision, HouseArchetype, HouseModifier, classifyHouseConcept } from '../lib/houseTaxonomy';

type Step = 'archetype' | 'site' | 'rooms' | 'style' | 'verify';

interface DecisionTreeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (spec: any) => void;
  initialPrompt?: string;
}

export function DecisionTreeWizard({ isOpen, onClose, onComplete, initialPrompt = '' }: DecisionTreeWizardProps) {
  const [step, setStep] = useState<Step>('archetype');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [decision, setDecision] = useState<HouseDecision | null>(null);
  const [plotWidth, setPlotWidth] = useState<string>('30');
  const [plotDepth, setPlotDepth] = useState<string>('40');
  const [facing, setFacing] = useState('north');
  const [storeys, setStoreys] = useState('2');
  const [bedrooms, setBedrooms] = useState('3');
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiCritique, setAiCritique] = useState<string | null>(null);
  const [aiSpec, setAiSpec] = useState<any>(null);

  useEffect(() => {
    if (prompt) {
      setDecision(classifyHouseConcept(prompt));
    }
  }, [prompt]);

  const handleNext = () => {
    if (step === 'archetype') setStep('site');
    else if (step === 'site') setStep('rooms');
    else if (step === 'rooms') setStep('style');
    else if (step === 'style') setStep('verify');
  };

  const handleBack = () => {
    if (step === 'site') setStep('archetype');
    else if (step === 'rooms') setStep('site');
    else if (step === 'style') setStep('rooms');
    else if (step === 'verify') setStep('style');
  };

  const verifyWithAI = async () => {
    setIsVerifying(true);
    setAiCritique(null);

    const userChoices = {
      prompt,
      archetype: decision?.archetype,
      plot: `${plotWidth}x${plotDepth}`,
      facing,
      storeys,
      bedrooms,
      modifiers: decision?.modifiers,
    };

    try {
      const response = await fetch('/api/verify-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userChoices),
      });

      const data = await response.json();
      setAiCritique(data.critique);
      setAiSpec(data.spec);
    } catch (error) {
      setAiCritique("Failed to verify with AI. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[#12141c] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              House Decision Tree
            </h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Step {step === 'archetype' ? 1 : step === 'site' ? 2 : step === 'rooms' ? 3 : step === 'style' ? 4 : 5} of 5</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 'archetype' && (
              <motion.div 
                key="archetype"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-sm font-medium text-purple-200">What do you have in mind?</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g. A modern 3-storey villa with a courtyard and a pool..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-purple-500/50 outline-none transition"
                  />
                </div>
                {decision && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                    <p className="text-xs text-purple-300 uppercase tracking-widest font-bold">Inferred Concept</p>
                    <h3 className="text-lg font-semibold text-white mt-1">{decision.label}</h3>
                    <p className="text-sm text-gray-400 mt-1">{decision.summary}</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'site' && (
              <motion.div 
                key="site"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Plot Width (ft)</label>
                    <input 
                      type="number"
                      value={plotWidth}
                      onChange={(e) => setPlotWidth(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Plot Depth (ft)</label>
                    <input 
                      type="number"
                      value={plotDepth}
                      onChange={(e) => setPlotDepth(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Road Facing Side</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['North', 'South', 'East', 'West'].map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setFacing(dir.toLowerCase())}
                        className={`p-3 rounded-xl border transition ${facing === dir.toLowerCase() ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-black/40 border-white/10 text-gray-400'}`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'rooms' && (
              <motion.div 
                key="rooms"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Number of Storeys</label>
                    <input 
                      type="number"
                      value={storeys}
                      onChange={(e) => setStoreys(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Bedrooms (BHK)</label>
                    <input 
                      type="number"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-300">Features</label>
                  <div className="flex flex-wrap gap-2">
                    {decision?.modifiers.map(mod => (
                      <span key={mod} className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-200 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        {mod.replace('-', ' ')}
                      </span>
                    ))}
                    {decision?.modifiers.length === 0 && <p className="text-sm text-gray-500 italic">No special features detected in prompt.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'style' && (
              <motion.div 
                key="style"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-300">Architectural Style</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Modern', 'Contemporary', 'Traditional', 'Minimal', 'Indian', 'Luxury'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setDecision(prev => prev ? { ...prev, style: s.toLowerCase() } : null)}
                        className={`p-4 rounded-2xl border transition text-left ${decision?.style === s.toLowerCase() ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'}`}
                      >
                        <span className="block font-semibold">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'verify' && (
              <motion.div 
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!aiCritique && !isVerifying && (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">AI Verification</h3>
                      <p className="text-sm text-gray-400 max-w-sm mx-auto mt-2">Our AI will now analyze your requirements to ensure they are realistic and architecturally sound.</p>
                    </div>
                    <button 
                      onClick={verifyWithAI}
                      className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold transition flex items-center gap-2 mx-auto"
                    >
                      Analyze My Design
                    </button>
                  </div>
                )}

                {isVerifying && (
                  <div className="text-center py-12 space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-sm text-purple-200 animate-pulse font-medium">AI is reasoning about your design...</p>
                  </div>
                )}

                {aiCritique && (
                  <div className="space-y-6">
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Architectural Critique</h4>
                      </div>
                      <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {aiCritique}
                      </div>
                    </div>

                    <button 
                      onClick={() => onComplete(aiSpec)}
                      className="w-full py-4 bg-white text-black rounded-2xl font-bold transition hover:bg-gray-200"
                    >
                      Generate 3D Model
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-8 py-6 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <button 
            onClick={handleBack}
            disabled={step === 'archetype'}
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          
          {step !== 'verify' && (
            <button 
              onClick={handleNext}
              className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm transition hover:bg-gray-200 flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
