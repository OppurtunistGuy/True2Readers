'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Compass,
  ArrowRight,
  Search,
  Zap,
  Brain,
  Heart,
  Globe,
  Coffee,
  Feather,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import type { UserReadingIntent } from '@/lib/intent-matcher'

export interface ReadingIntentViewProps {
  onSubmitIntent: (intent: UserReadingIntent) => void
  onSkipToSearch: () => void
}

const FEEL_OPTIONS = [
  { id: 'fast_gripping', label: 'Fast & gripping', icon: Zap, desc: 'High momentum, page-turner' },
  { id: 'thought_provoking', label: 'Thought-provoking', icon: Brain, desc: 'Big concepts, new perspectives' },
  { id: 'emotional', label: 'Emotional', icon: Heart, desc: 'Resonant, relatable character arcs' },
  { id: 'immersive', label: 'Immersive', icon: Globe, desc: 'Richly textured, deep world' },
  { id: 'relaxing', label: 'Relaxing', icon: Coffee, desc: 'Gentle, uplifting, cozy escape' },
]

const EFFORT_OPTIONS = [
  { id: 'low', label: 'Easy escape', desc: 'Brisk, light cognitive lift' },
  { id: 'moderate', label: 'Some focus', desc: 'Engaging without being exhausting' },
  { id: 'deep', label: 'Deep dive', desc: 'Dense, layered, demanding reward' },
]

const FOCUS_OPTIONS = [
  { id: 'story', label: 'Story', desc: 'Plot momentum & narrative drive' },
  { id: 'characters', label: 'Characters', desc: 'Vulnerable, complex personalities' },
  { id: 'ideas', label: 'Ideas', desc: 'Insight, philosophy, frameworks' },
  { id: 'writing', label: 'Writing', desc: 'Lyrical prose & voice' },
]

export function ReadingIntentView({
  onSubmitIntent,
  onSkipToSearch,
}: ReadingIntentViewProps) {
  const [selectedFeel, setSelectedFeel] = React.useState<string[]>(['fast_gripping'])
  const [selectedEffort, setSelectedEffort] = React.useState<'low' | 'moderate' | 'deep'>('moderate')
  const [selectedFocus, setSelectedFocus] = React.useState<string[]>(['story'])

  const toggleFeel = (id: string) => {
    setSelectedFeel((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev
      }
      return [...prev, id]
    })
  }

  const toggleFocus = (id: string) => {
    setSelectedFocus((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev
      }
      if (prev.length >= 2) {
        return [prev[1], id]
      }
      return [...prev, id]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmitIntent({
      feel: selectedFeel,
      effort: selectedEffort,
      focus: selectedFocus,
    })
  }

  return (
    <div className="relative min-h-[calc(100vh-140px)] bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
            <Compass className="size-3.5" />
            <span>Reading Intent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            What are you in the mood to read?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Tell us what you want from your next book. We&apos;ll use real reader experiences to help narrow it down.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1: What do you want to feel? */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900">
                1. What do you want to feel?
              </label>
              <span className="text-[10px] font-medium text-slate-500">Select any</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEEL_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = selectedFeel.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleFeel(opt.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question 2: How much effort do you want? */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900">
                2. How much effort do you want?
              </label>
              <span className="text-[10px] font-medium text-slate-500">Single select</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {EFFORT_OPTIONS.map((opt) => {
                const isSelected = selectedEffort === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedEffort(opt.id as any)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question 3: What matters most? */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900">
                3. What matters most?
              </label>
              <span className="text-[10px] font-medium text-slate-500">Select up to 2</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {FOCUS_OPTIONS.map((opt) => {
                const isSelected = selectedFocus.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleFocus(opt.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-98"
            >
              <span>Show books that fit</span>
              <ArrowRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={onSkipToSearch}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2"
            >
              <Search className="size-3.5" />
              <span>Skip — I&apos;ll search myself</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
