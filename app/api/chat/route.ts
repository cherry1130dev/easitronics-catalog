import { NextRequest, NextResponse } from 'next/server';
import { getProjects } from '@/lib/sheets';
import { EASITRONICS } from '@/lib/constants';

interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], userApiKey } = body;

    const lastMessage = messages[messages.length - 1]?.content || '';
    if (!lastMessage.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // 1. Fetch live catalog projects to ground the assistant
    const { projects } = await getProjects();

    // 2. Determine API Key
    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || '';

    const qLower = lastMessage.toLowerCase();
    const wantsDetail =
      qLower.includes('detail') ||
      qLower.includes('explain') ||
      qLower.includes('step by step') ||
      qLower.includes('breakdown') ||
      qLower.includes('elaborate') ||
      qLower.includes('in depth') ||
      qLower.includes('more info');

    // System prompt grounding
    const systemPrompt = `
You are "Easi", the official AI Engineering Project Advisor for Easitronics, powered by Google Gemini AI.
Official site: ${EASITRONICS.officialUrl}

DEVELOPER & TECHNICAL SUPPORT:
• Charan (Developer & Support): +91 7989604815 (WhatsApp)
• Mouli (Developer & Support): +91 7731943179 (WhatsApp)

CRITICAL PRICING RULE:
All project costs in the Easitronics catalog are ESTIMATIONS ONLY and NOT FIXED COSTS.

CONCISENESS & READABILITY RULES (CRITICAL):
1. Keep EVERY response SHORT, COMPACT, and SCANNABLE (strictly 2 to 4 concise sentences or max 2 bullet items).
2. DO NOT output long walls of text, lengthy essays, or overwhelming lists. Large responses are hard to read on mobile.
3. ONLY provide a longer or detailed response if the user explicitly asks for "detailed explanation", "step by step", or "breakdown".
4. When suggesting projects, recommend at most 2 top titles with Branch and Estimated Cost (mentioning cost is estimation only).
5. End with a quick 1-line developer contact: "Support: Charan (+91 7989604815) / Mouli (+91 7731943179)".
`.trim();

    // If Gemini API Key is present, call Google Gemini API
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        // Format history for Gemini API
        const contents = [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\nPlease acknowledge your role as Easi, the AI Project Advisor powered by Gemini AI. Remember to keep answers short, crisp, and easily readable unless detailed breakdown is requested.' }],
          },
          {
            role: 'model',
            parts: [{ text: 'Understood! I am Easi, the AI Project Advisor for Easitronics powered by Gemini AI. I will keep all responses short, compact, and highly readable, recommending 1-2 projects with estimated costs, and expanding only when the user requests detailed explanations. For support, I will direct students to Charan (+91 7989604815) and Mouli (+91 7731943179).' }],
          },
          ...messages.map((m: ChatMessage) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        ];

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: wantsDetail ? 600 : 250,
            },
          }),
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const replyText = data.candidates[0].content.parts[0].text;
          return NextResponse.json({
            reply: replyText,
            source: 'gemini-1.5-flash',
          });
        } else {
          console.warn('Gemini API error or quota limit:', data);
          // Fall through to smart intelligent advisor below
        }
      } catch (geminiErr) {
        console.error('Gemini API call failed:', geminiErr);
        // Fall through to smart intelligent advisor below
      }
    }

    // 3. Fallback Smart Grounded Catalog Advisor (Easi - Powered by Gemini AI knowledge base)
    let reply = '';

    // Search matching projects by keywords
    const matched = projects.filter((p) => {
      return (
        qLower.includes(p.branch.toLowerCase()) ||
        qLower.includes(p.domain.toLowerCase()) ||
        p.tags.some(t => qLower.includes(t.toLowerCase())) ||
        p.title.toLowerCase().split(' ').some(w => w.length > 3 && qLower.includes(w))
      );
    });

    if (qLower.includes('cost') || qLower.includes('price') || qLower.includes('budget') || qLower.includes('under') || qLower.includes('cheap')) {
      const budgetMatch = qLower.match(/\d+/);
      const budgetLimit = budgetMatch ? parseInt(budgetMatch[0], 10) * (parseInt(budgetMatch[0], 10) < 100 ? 1000 : 1) : 20000;
      const count = wantsDetail ? 3 : 2;
      const budgetProjects = projects.filter(p => p.price <= budgetLimit).slice(0, count);

      reply = `💰 **Projects under ₹${budgetLimit.toLocaleString('en-IN')}:**\n\n` +
        budgetProjects.map((p) => `• **${p.title}** (${p.branch}) — Est. ₹${p.price.toLocaleString('en-IN')} [Details](/projects/${p.id})`).join('\n') +
        `\n\n*(Costs are estimations only, not fixed).*` +
        `\n💬 Quote: WhatsApp [Charan (+91 7989604815)](https://wa.me/917989604815) or [Mouli (+91 7731943179)](https://wa.me/917731943179)`;
    } else if (qLower.includes('kit') || qLower.includes('hardware') || qLower.includes('what comes') || qLower.includes('include') || qLower.includes('support')) {
      if (wantsDetail) {
        reply = `📦 **Easitronics Project Kits Include:**\n\n` +
          `• **Hardware**: Microcontrollers (ESP32/Arduino/RPi), sensors, relays & wiring.\n` +
          `• **Code**: Fully commented firmware & app dashboard setup.\n` +
          `• **Docs**: Synopsis, circuit schematic & IEEE format report.\n` +
          `• **Support**: Step-by-step video & live WhatsApp mentorship.\n\n` +
          `*(Costs are estimations only, not fixed).*\n` +
          `📞 Order: WhatsApp [Charan (+91 7989604815)](https://wa.me/917989604815) or [Mouli (+91 7731943179)](https://wa.me/917731943179)`;
      } else {
        reply = `📦 **Easitronics Hardware Kits Include:**\n` +
          `• Tested hardware & calibrated sensors\n` +
          `• Verified source code & firmware\n` +
          `• Circuit schematic & project documentation\n` +
          `• Live technical mentorship & demo video\n\n` +
          `*(Kit costs are estimations only, not fixed).*\n` +
          `📞 Order: WhatsApp [Charan (7989604815)](https://wa.me/917989604815) or [Mouli (7731943179)](https://wa.me/917731943179)`;
      }
    } else if (matched.length > 0) {
      const count = wantsDetail ? 3 : 2;
      const picks = matched.slice(0, count);
      reply = `🎯 **Recommended Projects:**\n\n` +
        picks.map((p) => `• **${p.title}** (${p.branch} • ${p.domain}) — Est. ₹${p.price.toLocaleString('en-IN')} [Details](/projects/${p.id})`).join('\n') +
        `\n\n*(Pricing is estimation only, not fixed).*` +
        `\n📲 Inquire: WhatsApp [Charan (7989604815)](https://wa.me/917989604815) or [Mouli (7731943179)](https://wa.me/917731943179)`;
    } else {
      reply = `👋 **Hi! I'm Easi (Powered by Gemini AI).**\n\n` +
        `I can quickly find verified engineering projects for you.\n` +
        `Try asking: *"IoT projects for ECE"* or *"Projects under ₹15,000"*.\n\n` +
        `*(Catalog costs are estimations only).* \n` +
        `Support: [Charan (+91 7989604815)](https://wa.me/917989604815) | [Mouli (+91 7731943179)](https://wa.me/917731943179)`;
    }

    return NextResponse.json({
      reply,
      source: apiKey ? 'gemini-fallback' : 'catalog-knowledge-engine',
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
