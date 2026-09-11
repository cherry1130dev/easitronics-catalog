import { getProjects } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  IndianRupee, 
  Tag, 
  CheckCircle2, 
  Video, 
  Sparkles, 
  Share2, 
  Mail,
  ExternalLink,
  Layers,
  MessageSquare
} from 'lucide-react';
import CopyProjectButton from '@/components/CopyProjectButton';
import { EASITRONICS } from '@/lib/constants';

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { projects } = await getProjects();
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    return {
      title: 'Project Not Found | Engineering Catalog',
    };
  }

  return {
    title: `${project.title} | Engineering Project Catalog`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projects } = await getProjects();
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-6 transition-colors group bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Project Catalog</span>
        </Link>

        {/* Main Content Card (Image-Free) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-lg mb-8">
          {/* Top Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                {project.branch} Engineering
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Domain: {project.domain}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  project.type === 'Product'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                {project.type}
              </span>
            </div>

            {project.featured && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-slate-950">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Featured Top Pick
              </span>
            )}
          </div>

          {/* Project Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug tracking-tight mb-4">
            {project.title}
          </h1>

          {/* Pricing & Copy Details Box */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estimated Cost:
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 flex items-center tracking-tight">
                  <IndianRupee className="w-6 h-6 inline" />
                  {project.price.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-amber-400/90 mt-1.5 font-medium max-w-xl">
                ⚠️ <strong>Cost Note:</strong> The project cost shown is an <strong>estimation only and not a fixed cost</strong>. Actual cost may vary depending on component specifications, sensor models, and custom requirements.
              </p>
            </div>

            <div className="shrink-0">
              <CopyProjectButton project={project} />
            </div>
          </div>

          {/* Description Section */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
              Project Overview & Summary
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl">
              {project.description}
            </p>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Associated Tags & Technologies</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-950 text-slate-300 border border-slate-800 px-3 py-1 rounded-lg"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Demo Video Section if present */}
          {project.demoVideoUrl && (
            <div className="mb-8 p-5 bg-slate-950 border border-slate-800 rounded-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-rose-400" />
                <span>Demo Video Reference</span>
              </h3>
              <a
                href={project.demoVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
              >
                <span>Watch Demonstration Video</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Project Attributes Table */}
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Specification Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Department</span>
                <strong className="text-white font-semibold">{project.branch}</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Tech Domain</span>
                <strong className="text-white font-semibold">{project.domain}</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Delivery Type</span>
                <strong className="text-white font-semibold">{project.type}</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Source</span>
                <strong className="text-white font-semibold">
                  {project.source === 'custom' ? 'User Upload' : 'Google Sheets'}
                </strong>
              </div>
            </div>
          </div>

          {/* Easitronics Project Kit & Guidance Box */}
          <div className="mt-8 p-6 bg-slate-950 border border-teal-500/30 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-1">
                  Easitronics Student Project Assistance
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                  Interested in building this project?
                </h4>
                <p className="text-xs text-slate-400 max-w-lg">
                  Easitronics provides complete hardware kits, verified circuit diagrams, working source code, project reports, and live execution support.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={`https://wa.me/917989604815?text=${encodeURIComponent(`Hi Charan, I want to order/inquire about the project: ${project.title} (${project.branch} - ${project.domain}, Est. ₹${project.price})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  title="WhatsApp Charan (Developer & Support)"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Charan (7989604815)</span>
                </a>
                <a
                  href={`https://wa.me/917731943179?text=${encodeURIComponent(`Hi Mouli, I want to order/inquire about the project: ${project.title} (${project.branch} - ${project.domain}, Est. ₹${project.price})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                  title="WhatsApp Mouli (Developer & Support)"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Mouli (7731943179)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
