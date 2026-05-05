import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// ── Constants (optional env vars for routing links) ──
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://alphaandomegaagency.com/';
const CALENDLY_URL = process.env.CALENDLY_URL || 'https://calendly.com/jayjohnson2000';
const CALENDLY_URL_MEDICARE = process.env.CALENDLY_URL_MEDICARE || CALENDLY_URL;
const CALENDLY_URL_LIFE_INSURANCE = process.env.CALENDLY_URL_LIFE_INSURANCE || CALENDLY_URL;
const SUNFIRE_PLANS_URL = process.env.SUNFIRE_PLANS_URL || 'https://www.sunfirematrix.com/app/consumer/ember/?sfpath=spa&sfagid=21318914#/';

const VIDEO_LIBRARY = [
  {
    title: 'Medicare Overview Video',
    url: 'https://www.youtube.com/watch?v=gpHno2oTLQU',
    tags: ['medicare', 'overview', 'basics', 'part a', 'part b', 'plan']
  }
];

// ── Core processing functions ──

function detectPriority(text) {
  if (/urgent|asap|immediately|today|critical/.test(text)) return 'high';
  if (/soon|this week|next week/.test(text)) return 'normal';
  return 'low';
}

function inferAgeGroup(text) {
  if (/turning 65|age 65|medicare birthday/.test(text)) return 'new-medicare';
  if (/retire|retiring|leaving employer/.test(text)) return 'retiring';
  return 'existing-beneficiary';
}

function extractClientProfile(transcriptionText, clientInput = {}) {
  const text = transcriptionText.toLowerCase();
  const phoneMatch = transcriptionText.match(/\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const emailMatch = transcriptionText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const derivedPhone = clientInput.phone || (phoneMatch ? phoneMatch[0] : null);
  return {
    fullName: clientInput.fullName || 'Client',
    email: clientInput.email || (emailMatch ? emailMatch[0] : null),
    phone: derivedPhone,
    pointOfContact: clientInput.pointOfContact || derivedPhone || clientInput.email || null,
    address: clientInput.address || null,
    notes: clientInput.notes || null,
    ageGroup: inferAgeGroup(text),
    concerns: [
      /prescription|medication|rx/.test(text) ? 'Prescription costs' : null,
      /doctor|specialist|network/.test(text) ? 'Provider network match' : null,
      /premium|price|cost|budget/.test(text) ? 'Monthly affordability' : null,
      /travel|out of state/.test(text) ? 'Out-of-state coverage' : null
    ].filter(Boolean)
  };
}

function extractPricingMentions(sentence) {
  const dollarMatches = [...sentence.matchAll(/\$\s?\d{1,4}(?:,\d{3})*(?:\.\d{1,2})?/g)].map(m => m[0].replace(/\s+/g, ''));
  const zeroPremiumMention = /zero premium|no premium|\$0 premium/.test(sentence.toLowerCase());
  const mentions = [...dollarMatches];
  if (zeroPremiumMention && !mentions.includes('$0')) mentions.push('$0');
  return mentions;
}

function buildRecommendedPlans(transcriptionText) {
  const planPatterns = [
    { planName: 'Medicare Advantage', keywords: ['medicare advantage', 'advantage plan', 'advantage'] },
    { planName: 'Medicare Supplement', keywords: ['medicare supplement', 'medigap', 'supplement plan'] },
    { planName: 'Part D Drug Plan', keywords: ['part d', 'drug plan', 'prescription plan', 'rx plan'] },
    { planName: 'HMO Plan', keywords: ['hmo'] },
    { planName: 'PPO Plan', keywords: ['ppo'] },
    { planName: 'Plan G', keywords: ['plan g'] },
    { planName: 'Plan N', keywords: ['plan n'] }
  ];

  const sentences = String(transcriptionText).split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const found = [];

  function keywordMatches(text, keyword) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  }

  for (const sentence of sentences) {
    const lowered = sentence.toLowerCase();
    const pricingMentions = extractPricingMentions(sentence);
    const matchedPatterns = planPatterns.filter(p => p.keywords.some(k => keywordMatches(lowered, k)));
    const canSafelyAttachPricing = matchedPatterns.length === 1;

    for (const pattern of matchedPatterns) {
      const sentencePricing = canSafelyAttachPricing ? pricingMentions : [];
      const alreadyAdded = found.find(item => item.planName === pattern.planName);
      if (alreadyAdded) {
        for (const price of sentencePricing) {
          if (!alreadyAdded.discussedPricing.includes(price)) alreadyAdded.discussedPricing.push(price);
        }
        continue;
      }
      found.push({ planName: pattern.planName, discussedPricing: sentencePricing, sourceExcerpt: sentence });
    }
  }
  return found;
}

function buildTasks(text) {
  const tasks = [];
  if (/quote|proposal|plan options|pricing/.test(text)) tasks.push('Prepare and send personalized plan comparison.');
  if (/follow up|follow-up|call back|callback|next week/.test(text)) tasks.push('Schedule follow-up call and confirm exact time.');
  if (/email|send over|send me/.test(text)) tasks.push('Send recap email with recommendations and pricing table.');
  if (/doctor|specialist|network/.test(text)) tasks.push('Verify preferred doctors in-network for each recommended plan.');
  if (/prescription|medication|rx/.test(text)) tasks.push('Run medication list through each plan formulary.');
  if (tasks.length === 0) tasks.push('Complete standard post-call review and send recommendations.');
  return tasks;
}

function buildStepByStepGuide(profile) {
  return [
    `1. Confirm ${profile.fullName}'s top priorities (cost, doctors, prescriptions).`,
    '2. Review only plans explicitly mentioned in the transcript and validate provider network coverage.',
    '3. Confirm medication formulary details and quote pricing in carrier tools before sharing numbers.',
    '4. Send personalized recap email and attach plan recommendation file.',
    '5. Book next follow-up and track status in CRM/table.'
  ];
}

function transcriptIntentFlags(text) {
  return {
    discussingPlanSelection: /choose|select|selection|pick|which plan|enroll|enrollment/.test(text),
    discussingScheduling: /schedule|calendly|appointment|meeting|book|time next|next week|follow up/.test(text),
    discussingMedicareBasics: /medicare|part a|part b|part c|part d|supplement|advantage/.test(text)
  };
}

function inferCallCategory(text) {
  const lowered = String(text || '').toLowerCase();
  const medicareScore = [/medicare/, /part\s*a/, /part\s*b/, /part\s*c/, /part\s*d/, /medigap/, /supplement/, /advantage/, /plan\s*g/, /plan\s*n/].filter(p => p.test(lowered)).length;
  const lifeInsuranceScore = [/life\s*insurance/, /term\s*life/, /whole\s*life/, /universal\s*life/, /beneficiary/, /death\s*benefit/, /final\s*expense/, /policy\s*face\s*amount/].filter(p => p.test(lowered)).length;
  if (lifeInsuranceScore > medicareScore && lifeInsuranceScore > 0) return 'life_insurance';
  if (medicareScore > 0) return 'medicare';
  return 'general';
}

function resolveCalendlySchedulingUrl(callCategory) {
  if (callCategory === 'medicare') return CALENDLY_URL_MEDICARE;
  if (callCategory === 'life_insurance') return CALENDLY_URL_LIFE_INSURANCE;
  return CALENDLY_URL;
}

function pickVideoRecommendations(text) {
  const selected = VIDEO_LIBRARY.filter(v => v.tags.some(tag => text.includes(tag)));
  return selected.length > 0 ? selected.slice(0, 2) : VIDEO_LIBRARY.slice(0, 1);
}

function buildRoutingLinks(intent) {
  const links = [];
  if (intent.discussingPlanSelection) links.push({ label: 'View and Compare Available Plans', url: SUNFIRE_PLANS_URL });
  links.push({ label: 'Agency Website', url: WEBSITE_URL });
  if (intent.discussingScheduling) links.push({ label: 'Book a Time on Calendly', url: CALENDLY_URL });
  return links;
}

function extractSchedulingDetails(transcriptionText) {
  const text = String(transcriptionText || '');
  const lowered = text.toLowerCase();
  const hasSchedulingIntent = /schedule|scheduling|appointment|meeting|book|calendly|follow up|follow-up|call back|callback/.test(lowered);
  const dateLikeMatch = text.match(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{1,2}:\d{2}\s?(?:am|pm)|\d{1,2}\s?(?:am|pm))\b/i);
  return {
    hasSchedulingIntent,
    hasExplicitScheduleReference: Boolean(dateLikeMatch),
    scheduleEvidence: dateLikeMatch ? dateLikeMatch[0] : null,
    shouldAutoCreateInvite: hasSchedulingIntent && Boolean(dateLikeMatch)
  };
}

function buildEmailDraft(profile, tasks, plans, nextContactWindow, options = {}) {
  const { videos = [], routingLinks = [], intent = {}, calendlyUrl = CALENDLY_URL } = options;
  const planLines = plans.length
    ? plans.map((plan, i) => {
        const pricing = plan.discussedPricing.length
          ? `Discussed pricing: ${plan.discussedPricing.join(', ')}`
          : 'No pricing was explicitly discussed.';
        return `${i + 1}. ${plan.planName} - ${pricing}`;
      }).join('\n')
    : 'No specific plans or pricing were explicitly discussed on this call.';

  const videoLines = videos.length
    ? ['Helpful video for your situation:', ...videos.map((v, i) => `${i + 1}. ${v.title}: ${v.url}`), '']
    : [];
  const routingLines = routingLinks.length
    ? ['Helpful links:', ...routingLinks.map((l, i) => `${i + 1}. ${l.label}: ${l.url}`), '']
    : [];
  const calendlyLines = intent.discussingScheduling
    ? ['Scheduling:', `Please use this link to book a time: ${calendlyUrl}`, 'Once booked, Calendly will automatically send the calendar invite and confirmation email.', '']
    : [];

  return [
    `Hi ${profile.fullName || 'there'},`,
    '',
    'Thank you for speaking with me today. Based on your goals, I prepared a personalized set of Medicare options for you.',
    '',
    'Recommended plans:',
    planLines,
    '',
    ...videoLines,
    ...routingLines,
    ...calendlyLines,
    'Immediate next steps:',
    tasks.map((task, i) => `${i + 1}. ${task}`).join('\n'),
    '',
    `I will follow up ${nextContactWindow.toLowerCase()} to walk through these options together.`,
    '',
    'Best,',
    'Alpha & Omega Agency'
  ].join('\n');
}

// ── Route handler ──
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { transcriptionText, client = {}, sendEmail = false } = body;

    if (!transcriptionText) {
      return NextResponse.json({ error: 'Transcription text required' }, { status: 400 });
    }

    const cleaned = String(transcriptionText).trim();
    const lowered = cleaned.toLowerCase();
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
    const summary = sentences.slice(0, 2).join(' ').slice(0, 360) || cleaned.slice(0, 360);

    const profile = extractClientProfile(cleaned, client);
    const tasks = buildTasks(lowered);
    const plans = buildRecommendedPlans(cleaned);
    const steps = buildStepByStepGuide(profile);
    const intent = transcriptIntentFlags(lowered);
    const callCategory = inferCallCategory(cleaned);
    const schedulingDetails = extractSchedulingDetails(cleaned);
    const videos = pickVideoRecommendations(lowered);
    const routingLinks = buildRoutingLinks(intent);
    const priority = detectPriority(lowered);
    const nextContactWindow = priority === 'high' ? 'Today' : 'Within 24 hours';
    const callId = uuidv4();
    const calendlyUrl = resolveCalendlySchedulingUrl(callCategory);

    const finalizedRoutingLinks = intent.discussingScheduling
      ? routingLinks.map(link => link.label === 'Book a Time on Calendly' ? { ...link, url: calendlyUrl } : link)
      : routingLinks;

    const draftEmail = buildEmailDraft(profile, tasks, plans, nextContactWindow, {
      videos,
      routingLinks: finalizedRoutingLinks,
      intent,
      calendlyUrl
    });

    return NextResponse.json({
      status: 'success',
      callId,
      message: 'Transcript processed and automation package generated',
      automation: {
        client: profile,
        summary,
        callCategory,
        priority,
        nextContactWindow,
        tasks,
        stepByStep: steps,
        recommendedPlans: plans,
        recommendedVideos: videos,
        routingLinks: finalizedRoutingLinks,
        draftEmail,
        wordCount: cleaned.split(/\s+/).filter(Boolean).length,
        planFilePath: '(serverless — not saved to disk)'
      },
      delivery: {
        emailStatus: {
          sent: false,
          reason: sendEmail ? 'Email sending not configured in serverless mode' : 'Email not requested'
        },
        opalStatus: { triggered: false, reason: 'Not configured' },
        sheetSync: { synced: false, reason: 'Not configured' },
        calendlyInviteStatus: {
          created: false,
          reason: schedulingDetails.shouldAutoCreateInvite
            ? 'Calendly API not configured'
            : 'No scheduling intent detected'
        },
        calendlyWebhookStatus: { triggered: false, reason: 'Not configured' }
      },
      persistence: { supabaseEnabled: false, personId: null }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
