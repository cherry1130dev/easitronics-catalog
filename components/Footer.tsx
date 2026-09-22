'use client';

import Link from 'next/link';
import { 
  Mail, 
  ExternalLink, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { EASITRONICS } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="bg-[#232f3e] border-t border-[#131921] text-slate-300 pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 border border-white/20 p-0.5 flex items-center justify-center shrink-0">
                <img
                  src={EASITRONICS.logoUrl}
                  alt="EasiCart Logo"
                  className="w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">
                  EasiCart
                </span>
                <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  powered by Easitronics
                </span>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              {EASITRONICS.tagline}
            </p>

            {/* Easi AI Launcher Banner */}
            <div className="pt-1">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-gemini-chat'));
                  }
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#febd69] hover:bg-[#f3a847] text-slate-950 font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Open Easi - AI Project Assistant (Powered by Gemini AI)"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Ask Easi (Powered by Gemini AI)</span>
              </button>
            </div>
          </div>

          {/* Column 2: Official Links & Store */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 border-b border-amber-400/40 pb-1.5 inline-block">
              Easitronics Services
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href={EASITRONICS.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>Official Website</span>
                </a>
              </li>
              <li>
                <a
                  href="https://esitronics.netlify.app/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3 h-3 text-slate-400" />
                  <span>Electronics E-Store</span>
                </a>
              </li>
              <li>
                <a
                  href="https://esitronics.netlify.app/my-orders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>Track Your Order</span>
                </a>
              </li>
              <li>
                <a
                  href="https://esitronics.netlify.app/share-idea"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-slate-400" />
                  <span>Share Your Idea</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Engineering Disciplines */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 border-b border-amber-400/40 pb-1.5 inline-block">
              Departments & Domains
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-slate-300">• ECE Branch</span>
              <span className="text-slate-300">• IoT & Smart Tech</span>
              <span className="text-slate-300">• CSE Branch</span>
              <span className="text-slate-300">• Machine Learning</span>
              <span className="text-slate-300">• EEE Branch</span>
              <span className="text-slate-300">• Embedded Systems</span>
              <span className="text-slate-300">• Mechanical</span>
              <span className="text-slate-300">• Robotics & Control</span>
              <span className="text-slate-300">• Civil & Medical</span>
              <span className="text-slate-300">• Simulation / AI</span>
            </div>
          </div>

          {/* Column 4: Developers & Technical Support */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 border-b border-amber-400/40 pb-1.5 inline-block">
              Developers & Support
            </h3>
            <ul className="space-y-3 text-xs">
              {/* Charan */}
              <li className="p-2.5 rounded-lg bg-[#131921] border border-slate-700/80 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Charan</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Developer & Support
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <a
                    href="https://wa.me/917989604815?text=Hi%20Charan,%20I%20am%20inquiring%20about%20Easitronics%20engineering%20projects"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>WhatsApp</span>
                  </a>
                  <span className="text-slate-500">•</span>
                  <a
                    href="tel:+917989604815"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    <span>+91 7989604815</span>
                  </a>
                </div>
              </li>

              {/* Mouli */}
              <li className="p-2.5 rounded-lg bg-[#131921] border border-slate-700/80 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Mouli</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Developer & Support
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <a
                    href="https://wa.me/917731943179?text=Hi%20Mouli,%20I%20am%20inquiring%20about%20Easitronics%20engineering%20projects"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>WhatsApp</span>
                  </a>
                  <span className="text-slate-500">•</span>
                  <a
                    href="tel:+917731943179"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    <span>+91 7731943179</span>
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-2 pt-1 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <a href={`mailto:${EASITRONICS.email}`} className="hover:text-amber-400 transition-colors">
                  {EASITRONICS.email}
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-6 border-t border-[#131921] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <p suppressHydrationWarning>
              © {new Date().getFullYear()} EasiCart powered by Easitronics. All rights reserved. Engineering Projects, Hardware Kits, Component Lists & Software Solutions.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              *Disclaimer: Project pricing shown across the catalog is an <strong>estimation only and not a fixed cost</strong>. Final quotes depend on custom sensor models, component availability, and delivery scopes.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">
              Catalog
            </Link>
            <a
              href={EASITRONICS.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              Official Website
            </a>
            {/* Easi Powered by Gemini AI Link in Bottom */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-gemini-chat'));
                }
              }}
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="Open Easi AI"
            >
              <Sparkles className="w-3 h-3 fill-current" />
              <span>Easi • Powered by Gemini AI</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
