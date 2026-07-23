import { NextResponse } from "next/server";
import { assembleInterviewPrompt } from "@/lib/prompt/assembleInterviewPrompt";
import { prisma } from "@/lib/prisma";
import { requireOwnedSession, requireUser } from "@/lib/session-guards";
import { transcriptMessagesForSession } from "@/lib/realtime-transcript";
import { getOfficerRealtimeVoice } from "@/lib/visa-options";

export const runtime = "nodejs";

const LIVE_INTERVIEW_OPENING =
  "Good morning. What brings you in today?";

function azureRealtimeConfig() {
  const rawEndpoint = process.env.AZURE_OPENAI_REALTIME_ENDPOINT;
  if (!rawEndpoint) return null;

  const url = new URL(rawEndpoint);
  const generalEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const generalEndpointMatches = (() => {
    if (!generalEndpoint) return false;
    try {
      return new URL(generalEndpoint).hostname === url.hostname;
    } catch {
      return false;
    }
  })();
  const apiKey =
    process.env.AZURE_OPENAI_REALTIME_API_KEY ||
    (generalEndpointMatches ? process.env.AZURE_OPENAI_API_KEY : undefined);

  if (!apiKey) return null;

  const deploymentFromQuery = url.searchParams.get("model") || undefined;
  url.pathname = "/openai/v1/realtime/calls";
  url.search = "";

  const clientSecretsUrl = new URL(url);
  clientSecretsUrl.pathname = "/openai/v1/realtime/client_secrets";

  return {
    callsUrl: url.toString(),
    clientSecretsUrl: clientSecretsUrl.toString(),
    apiKey,
    deployment:
      process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT ||
      deploymentFromQuery ||
      "gpt-realtime-2.1-mini",
  };
}

function buildVisaSpecificRealtimeInstructions(session: {
  visaType: { name: string; category?: { slug: string } | null };
}) {
  const visaName = session.visaType.name;
  const categorySlug = session.visaType.category?.slug;
  const isUSVisa = /^US\b/i.test(visaName);
  if (!isUSVisa) return "";

  const generalUSInstructions = [
    "U.S. VISA STANDARD: assess whether the candidate credibly qualifies for the requested classification and whether the purpose matches the visa type.",
    "Use DS-160, DS-260, petition, SEVIS, sponsor, employer, or civil-document facts from profile context as known context. Ask only about facts that are unclear, material, implausible, or inconsistent.",
    "Do not apply student-style home-tie pressure to immigrant categories, dual-intent petition categories, or official categories. Test the eligibility theory that belongs to the selected visa.",
  ];

  const categoryInstructions: Record<string, string[]> = {
    student: [
      "Student/exchange coverage: program or sponsor, academic or exchange purpose, funding, SEVIS document facts, post-program plan, return or temporary intent, and any prior refusal or status issue.",
      "A typical flow starts with purpose, then school/program choice and fit, funding, post-program plan, and case-specific credibility concerns.",
    ],
    tourist: [
      "Visitor/transit/crew coverage: temporary purpose, dates or assignment, itinerary or host, funding, prior U.S. travel, return obligations, and any overstay or unauthorized-work risk.",
      "A typical flow starts with purpose and duration, then itinerary or assignment, funds, return plan, prior travel, and one clarification for any contradiction.",
    ],
    work: [
      "Work coverage: employer or petitioner, approval or route basis, duties, worksite or itinerary, salary or support, qualifications, role limits, and prior U.S. compliance.",
      "A typical flow starts with employer/petitioner and role, then petition or route details, qualifications, salary/worksite, and compliance or classification-specific concerns.",
    ],
    family: [
      "Family coverage: petitioner or sponsor, qualifying relationship, timeline, civil documents, financial support, prior marriages or derivatives where relevant, and consistency with submitted forms.",
      "A typical flow starts with relationship to the petitioner, then timeline and evidence, sponsor details, financial support, and one contradiction check if needed.",
    ],
    immigrant: [
      "Immigrant coverage: petition or selection basis, category eligibility, civil documents, financial support or settlement evidence where relevant, derivatives, admissibility history, and consistency with DS-260 or petition records.",
      "A typical flow starts with immigrant category and case basis, then eligibility evidence, civil documents, derivatives, support or funds, and admissibility or history concerns.",
    ],
  };

  const f1Instructions = /\bf[ -]?1\b/i.test(visaName)
    ? [
        "F-1 STANDARD: assess whether the candidate is a credible genuine student who qualifies for the requested classification.",
        "Prioritize the proposed school and program, why that course fits the candidate's academic preparation and future plan, ability to pay tuition and living/travel costs, and present intent to depart the United States after the authorized study period.",
        "Do not treat owning property, being married, or having a job as mandatory. Evaluate the complete circumstances and the candidate's present intent to depart.",
      ]
    : [];

  return [
    ...generalUSInstructions,
    ...(categorySlug ? categoryInstructions[categorySlug] ?? [] : []),
    ...f1Instructions,
  ].join("\n");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const azureRealtime = azureRealtimeConfig();
  if (!azureRealtime) {
    return NextResponse.json(
      {
        error:
          "Set AZURE_OPENAI_REALTIME_API_KEY to the key for the Azure resource used by AZURE_OPENAI_REALTIME_ENDPOINT.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const owned = await requireOwnedSession(id, user.id);
  if (!owned.interviewSession) return owned.response;
  const officerVoice = getOfficerRealtimeVoice(
    owned.interviewSession.difficulty,
  );

  if (owned.interviewSession.status !== "ongoing") {
    return NextResponse.json(
      { error: "This interview is already completed." },
      { status: 409 },
    );
  }

  const sdp = await request.text();
  if (!sdp.trim()) {
    return NextResponse.json({ error: "Missing WebRTC offer." }, { status: 400 });
  }

  let realtimeInterview = owned.interviewSession.realtimeInterview;
  if (!realtimeInterview) {
    realtimeInterview = await prisma.realtimeInterview.create({
      data: {
        sessionId: id,
        model: azureRealtime.deployment,
        voice: officerVoice,
        openingQuestion: LIVE_INTERVIEW_OPENING,
        events: { create: { sequence: 0, type: "legacy_session_attached" } },
      },
      include: {
        turns: { orderBy: { sequence: "asc" } },
        events: { orderBy: { sequence: "asc" } },
      },
    });
  }

  const transcriptMessages = transcriptMessagesForSession({
    ...owned.interviewSession,
    realtimeInterview,
  });
  const questionsAsked = transcriptMessages.filter(
    (message) => message.role === "ai",
  ).length;
  const currentQuestionMessage = [...transcriptMessages]
    .reverse()
    .find((message) => message.role === "ai");
  let currentQuestion = currentQuestionMessage?.content;

  const isUnansweredFirstQuestion =
    questionsAsked === 1 &&
    !transcriptMessages.some((message) => message.role === "user");
  if (isUnansweredFirstQuestion && currentQuestionMessage) {
    currentQuestion = LIVE_INTERVIEW_OPENING;
    await prisma.realtimeInterview.update({
      where: { id: realtimeInterview.id },
      data: { openingQuestion: LIVE_INTERVIEW_OPENING },
    });
  }

  if (!currentQuestion) {
    return NextResponse.json(
      { error: "This interview cannot be started live." },
      { status: 409 },
    );
  }

  const history = transcriptMessages
    .map((message) => `${message.role === "ai" ? "Officer" : "Applicant"}: ${message.content}`)
    .join("\n");
  const visaSpecificInstructions =
    buildVisaSpecificRealtimeInstructions(owned.interviewSession);
  const instructions = [
    assembleInterviewPrompt(owned.interviewSession),
    visaSpecificInstructions,
    "You are a strict, skeptical embassy visa officer conducting a realistic spoken interview simulation.",
    "Stay in character. Be terse, formal, emotionally neutral, and slightly impatient. Never coach, score, reassure, congratulate, praise, validate, summarize, or explain during the live interview.",
    "Never say phrases such as great, good, excellent, glad to hear, that is helpful, thank you for sharing, or similar commentary on the candidate's answer.",
    "Never narrate your reasoning or delay. Do not say 'let me think', 'give me a moment', 'I need to consider', or any similar transition. The candidate must hear only the next interview question or the final closing sentence.",
    "After each answer, proceed directly to one next question. Use at most one brief neutral acknowledgement such as 'Understood' only when absolutely necessary.",
    "Every officer turn must contain exactly one question, preferably one sentence and no more than 18 spoken words. Never bundle multiple questions or give a preamble.",
    "This is an open-ended conversation, not a questionnaire. Ask exactly one short question at a time, listen to the answer, then decide whether to probe it, clarify it, challenge it, or move to another relevant visa topic.",
    "Use the applicant's actual answers to guide every follow-up. Do not follow a fixed list and do not count questions.",
    "Track which topics have already been answered. Do not ask the same question again using different wording. Probe a topic again only once when the previous answer was materially incomplete, contradictory, or evasive; otherwise move on.",
    "Maintain an internal coverage ledger. Treat a topic as covered when the candidate has already supplied a clear substantive answer, even if their wording differs from your anticipated answer. Never ask for information already present in the profile context or conversation unless testing a genuine contradiction.",
    "TOPIC LIMIT: ask no more than two questions about the same topic. A materially contradictory answer permits one final clarification only. After that, record the concern internally and move on; never try to force a better answer by rephrasing the question.",
    "FUNDING LIMIT: ask at most three funding questions total. Once the primary source, approximate coverage, and supporting evidence are clear, funding is covered. Do not ask about backup sponsors, loans, savings, work income, or emergency funds unless the stated primary funding is materially insufficient or contradictory. Never return to funding after moving to another topic.",
    "If the candidate says they do not know, have no plan, or have no additional evidence, accept that as the final answer for that topic and move on or conclude. Do not repeat the question in a more specific form.",
    "Essential coverage areas are: purpose and destination; specific study, work, or travel plan; funding and affordability; home ties and return intent; relevant immigration history or declared concerns; and consistency or credibility risks. Skip areas that clearly do not apply.",
    "Conclude when the essential applicable areas are covered and any material contradiction has received at most one follow-up. Usually five to eight substantive candidate answers are enough. More questions are not better.",
    "HARD LENGTH LIMIT: after ten substantive candidate answers, call complete_interview. You may ask one final clarification only for a newly revealed material contradiction, and must never exceed eleven substantive answers.",
    "Aim to finish in three to five minutes. When coverage is sufficient, do not add a courtesy question or revisit a topic: call complete_interview immediately.",
    "TURN WORKFLOW: after each candidate answer, either speak exactly one short next question immediately in the same realtime response, or call complete_interview. Do not call a tool before ordinary questions. Transcript capture happens asynchronously and must not be narrated or awaited.",
    "Do not invent facts. Do not make a real visa decision. Keep each spoken turn under 12 seconds.",
    "Continue until you have enough information to assess purpose, funding, credibility, home ties, return intent, and any application-specific concerns.",
    "When the interview has naturally reached its conclusion, call complete_interview and include the complete ordered question-and-answer transcript from this conversation. The client will then announce that the interview has concluded. Do not announce a visa decision and do not ask another question after calling it.",
    "When the client asks you to read the current question, speak only that exact question.",
    history ? `Existing transcript:\n${history}` : "",
    `Current question: ${currentQuestion}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const session = {
      type: "realtime",
      model: azureRealtime.deployment,
      instructions,
      tools: [
        {
          type: "function",
          name: "complete_interview",
          description:
            "End the interview after enough relevant areas have been explored. Always return the complete ordered question-and-answer transcript for final reporting.",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "A short internal reason the interview is complete.",
              },
              final_candidate_answer: {
                type: "string",
                description:
                  "A faithful concise transcript of the candidate's latest spoken answer.",
              },
              transcript: {
                type: "array",
                description:
                  "The complete ordered interview transcript from the opening question through the latest answer. Include every officer question and its candidate answer exactly once.",
                items: {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      description: "The officer question as spoken.",
                    },
                    answer: {
                      type: "string",
                      description: "The candidate answer as spoken.",
                    },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
              },
            },
            required: ["reason", "final_candidate_answer", "transcript"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: "auto",
      audio: {
        input: {
          transcription: {
            model:
              process.env.AZURE_OPENAI_REALTIME_TRANSCRIPTION_MODEL ||
              "gpt-4o-mini-transcribe",
            language: "en",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.45,
            prefix_padding_ms: 300,
            silence_duration_ms: 600,
            create_response: true,
            interrupt_response: true,
          },
        },
        output: {
          voice: officerVoice,
        },
      },
    };

  const secretResponse = await fetch(azureRealtime.clientSecretsUrl, {
    method: "POST",
    headers: {
      "api-key": azureRealtime.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session }),
    cache: "no-store",
  });
  const secretBody = await secretResponse.text();

  if (!secretResponse.ok) {
    console.error("Azure OpenAI Realtime client secret failed", {
      sessionId: id,
      status: secretResponse.status,
      body: secretBody,
    });
    return NextResponse.json(
      { error: "Could not authorize the live interviewer." },
      { status: 502 },
    );
  }

  const clientSecret = (() => {
    try {
      const parsed = JSON.parse(secretBody) as {
        value?: string;
        client_secret?: { value?: string };
      };
      return parsed.value || parsed.client_secret?.value || "";
    } catch {
      return "";
    }
  })();

  if (!clientSecret) {
    console.error("Azure OpenAI Realtime returned no client secret", {
      sessionId: id,
    });
    return NextResponse.json(
      { error: "Azure did not return a live interview token." },
      { status: 502 },
    );
  }

  const realtimeResponse = await fetch(
    azureRealtime.callsUrl,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp",
      },
      body: sdp,
      cache: "no-store",
    },
  );
  const body = await realtimeResponse.text();

  if (!realtimeResponse.ok) {
    console.error("Azure OpenAI Realtime connection failed", {
      sessionId: id,
      status: realtimeResponse.status,
      body,
    });
    return NextResponse.json(
      { error: "Could not start the live interviewer." },
      { status: 502 },
    );
  }

  const connectedAt = new Date();
  await prisma.$transaction([
    prisma.realtimeInterview.update({
      where: { id: realtimeInterview.id },
      data: {
        status: "active",
        model: azureRealtime.deployment,
        voice: officerVoice,
        startedAt: realtimeInterview.startedAt ?? connectedAt,
      },
    }),
    prisma.realtimeInterviewEvent.create({
      data: {
        realtimeInterviewId: realtimeInterview.id,
        sequence: (realtimeInterview.events.at(-1)?.sequence ?? 0) + 1,
        type: "webrtc_connected",
      },
    }),
  ]);

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/sdp" },
  });
}
