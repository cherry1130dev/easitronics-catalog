import { Project } from './types';
import { EASITRONICS } from './constants';

export function formatProjectDetailsForCopy(project: Project): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const projectUrl = `${origin}/projects/${project.id}`;

  return [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡ EASITRONICS PROJECT SPECIFICATION & QUOTATION`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📌 Project Title: ${project.title}`,
    `🎓 Department / Branch: ${project.branch}`,
    `🔬 Tech Domain: ${project.domain}`,
    `📦 Project Type: ${project.type}`,
    `💰 Estimated Cost: ₹${project.price.toLocaleString('en-IN')}`,
    `   *(NOTE: This cost is an ESTIMATION ONLY and NOT A FIXED COST. Actual cost depends on hardware specifications, sensor models, and custom requirements.)`,
    ``,
    `📝 Project Overview:`,
    `${project.description}`,
    ``,
    project.tags.length > 0 ? `🏷️ Tags / Tech Stack: #${project.tags.join(', #')}` : '',
    ``,
    `🔗 Catalog Details: ${projectUrl}`,
    ``,
    `📞 Developers & Technical Support:`,
    `   • Charan (Developer & Support): +91 7989604815 (WhatsApp & Call)`,
    `   • Mouli (Developer & Support): +91 7731943179 (WhatsApp & Call)`,
    `   • Easi (AI Project Advisor): Powered by Gemini AI at ${origin}`,
    `   • Official Store: ${EASITRONICS.officialUrl}`,
    `   • Email: ${EASITRONICS.email}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].filter(line => line !== null && line !== undefined).join('\n');
}
