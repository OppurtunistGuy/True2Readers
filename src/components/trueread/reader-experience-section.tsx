'use client'

import * as React from 'react'
import {
  Sparkles,
  AlertTriangle,
  BookOpenCheck,
  Compass,
  Zap,
  Feather,
  Brain,
  Heart,
  Quote,
} from 'lucide-react'
import type { ReaderExperienceProfile } from '@/lib/reader-experiences'

export interface ReaderExperienceSectionProps {
  profile: ReaderExperienceProfile | null
}

export function ReaderExperienceSection({ profile }: ReaderExperienceSectionProps) {
  if (!profile) return null

  const { experience, mismatch, consensus } = profile

  const dimensions = [
    {
      icon: Zap,
      title: 'Pacing Reality',
      label: experience.pacing.label,
      nuance: experience.pacing.nuance,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      icon: Feather,
      title: 'Writing & Prose Style',
      label: experience.writing.label,
      nuance: experience.writing.nuance,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      icon: Brain,
      title: 'Cognitive Complexity',
      label: experience.complexity.label,
      nuance: experience.complexity.nuance,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      icon: Compass,
      title: 'Narrative Engine',
      label: experience.focus.label,
      nuance: experience.focus.nuance,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      icon: Heart,
      title: 'Emotional Atmosphere',
      label: experience.emotional.label,
      nuance: experience.emotional.nuance,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 1. What readers experience */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="size-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">What readers experience</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
            Curated by True2Readers
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {dimensions.map((dim) => {
            const Icon = dim.icon
            return (
              <div
                key={dim.title}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1 rounded-lg border ${dim.color}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {dim.title}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900">{dim.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{dim.nuance}</p>
              </div>
            )
          })}
        </div>

        {/* 2. Potential Mismatch (First-Class Feature) */}
        {mismatch && mismatch.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50/40 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span>Potential mismatch</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-800/90">
              May not suit you if:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {mismatch.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold leading-none mt-0.5">•</span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Reader consensus statement */}
        {consensus && (
          <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-slate-600 italic text-xs leading-relaxed">
            <Quote className="size-4 text-slate-400 shrink-0 mt-0.5 not-italic" />
            <p>
              <strong className="not-italic font-semibold text-slate-800 mr-1.5">Reader consensus:</strong>
              {consensus}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
