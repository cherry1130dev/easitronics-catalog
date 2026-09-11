'use client';

import { DomainType } from '@/lib/types';
import { Wifi, Cpu, Bot, BrainCircuit, Activity, Sparkles } from 'lucide-react';

interface DomainHighlightCardProps {
  selectedDomains: DomainType[];
  onSelectDomain: (domain: DomainType) => void;
}

const DOMAIN_DATA: Array<{
  name: DomainType;
  description: string;
  icon: any;
  gradient: string;
  border: string;
  badgeBg: string;
  textColor: string;
}> = [
  {
    name: 'IoT',
    description: 'Smart sensors, cloud telemetry & connected automation',
    icon: Wifi,
    gradient: 'from-blue-600/20 via-cyan-500/10 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-400',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    textColor: 'text-cyan-400',
  },
  {
    name: 'Embedded',
    description: 'FPGA, microcontrollers, DSP & real-time systems',
    icon: Cpu,
    gradient: 'from-amber-600/20 via-orange-500/10 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    textColor: 'text-amber-400',
  },
  {
    name: 'Robotics',
    description: 'Autonomous crawlers, robotic arms, IMUs & kinematics',
    icon: Bot,
    gradient: 'from-emerald-600/20 via-teal-500/10 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
  {
    name: 'Machine Learning',
    description: 'Computer vision, signal classification & predictive models',
    icon: BrainCircuit,
    gradient: 'from-indigo-600/20 via-purple-500/10 to-transparent',
    border: 'border-indigo-500/30 hover:border-indigo-400',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    textColor: 'text-indigo-400',
  },
  {
    name: 'Simulation',
    description: 'ANSYS CFD thermal analysis, MATLAB & FEA stress models',
    icon: Activity,
    gradient: 'from-rose-600/20 via-pink-500/10 to-transparent',
    border: 'border-rose-500/30 hover:border-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    textColor: 'text-rose-400',
  },
  {
    name: 'Large AI',
    description: 'Generative AI, LLMs, vision-language models & multi-agent swarms',
    icon: Sparkles,
    gradient: 'from-purple-600/20 via-fuchsia-500/10 to-transparent',
    border: 'border-purple-500/30 hover:border-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    textColor: 'text-purple-400',
  },
];

export default function DomainHighlightSection({ selectedDomains, onSelectDomain }: DomainHighlightCardProps) {
  return (
    <section id="domains" className="py-12 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Browse Projects by Domain
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Click any domain card to immediately filter project titles in that specialization
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DOMAIN_DATA.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedDomains.includes(item.name);

            return (
              <button
                key={item.name}
                onClick={() => {
                  onSelectDomain(item.name);
                  // Smooth scroll down to project catalog section
                  const catalogElement = document.getElementById('catalog');
                  if (catalogElement) {
                    catalogElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`relative group text-left p-5 rounded-2xl border transition-all duration-300 bg-slate-950/60 overflow-hidden ${
                  isSelected 
                    ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-950/30 shadow-xl' 
                    : `${item.border} hover:bg-slate-950 hover:shadow-lg`
                }`}
              >
                {/* Background subtle gradient glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-40 group-hover:opacity-80 transition-opacity`} />

                <div className="relative z-10 flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 ${item.textColor} shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.badgeBg}`}>
                    {isSelected ? 'Active Filter' : 'Explore'}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
