import { NextResponse } from "next/server";

const LAW_CHAT_ENDPOINT = "http://36.255.14.42:7821/chat";

type LawChatRequestBody = {
  question?: unknown;
};

type LawChatUpstreamPayload = {
  answer?: unknown;
  data?: {
    answer?: unknown;
  };
  message?: unknown;
  response?: unknown;
  result?: unknown;
  text?: unknown;
};

function extractAnswerText(payload: unknown, fallbackText = "") {
  if (typeof payload === "string") {
    return payload.trim();
  }

  if (payload && typeof payload === "object") {
    const record = payload as LawChatUpstreamPayload;
    const candidate = record.answer ?? record.data?.answer ?? record.result ?? record.response ?? record.message ?? record.text;

    if (typeof candidate === "string") {
      return candidate.trim();
    }

    if (candidate && typeof candidate === "object") {
      return extractAnswerText(candidate, fallbackText);
    }
  }

  return String(fallbackText || "").trim();
}

function buildFallbackAnswer(question: string) {
  const normalizedQuestion = question.toLowerCase();

  if (/\b(?:loophole|bypass|evade|circumvent|workaround|exempt|avoid permit|skip permit)\b/.test(normalizedQuestion)) {
    return "I can't help with loopholes or bypassing tree-removal rules. If the tree affects the house layout, the safe route is to check whether it is protected, ask the local authority about a removal permit, and get an arborist to confirm the legal options, including transplanting or approved removal.";
  }

  if (/\b(?:bbmp|bda)\b/.test(normalizedQuestion)) {
    return "If you mean BBMP or BDA, tree-removal permission in Bangalore is usually handled through the municipal tree officer or the local town-planning desk. I can't give the exact permit fee without the current schedule, because it can vary by circular and tree details. If you're asking about a specific plot, share the tree type and plot details and I can help you frame the application or check the likely approval steps.";
  }

  if (/\b(?:tree|trees)\b/.test(normalizedQuestion) && /\b(?:cut|remove|fell|clear|prune|trim)\b/.test(normalizedQuestion)) {
    return "If the tree is in the middle of the plot, don't cut it before checking local rules. The usual steps are: confirm whether the tree is protected, ask the municipal authority or local forest/tree officer if a permit is needed, get an arborist to inspect it, and check whether the utility lines or neighbors are affected. If the tree can be removed legally, keep the approval paperwork before you start construction.";
  }

  if (/setback/.test(normalizedQuestion)) {
    return "Setback rules depend on the local by-laws, road width, and the jurisdiction. I can't give a reliable exact number from the plot size alone. Share the city or municipal authority and the road width, and I'll help you narrow down the likely front, side, and rear setbacks.";
  }

  if (/\b(fsi|far|floor area ratio|coverage)\b/.test(normalizedQuestion)) {
    return "FSI, FAR, and coverage depend on the local planning authority and zoning rules. If you share the city or jurisdiction, I can help you interpret the likely limits in a ChatGPT-style way.";
  }

  return "I can help with that, but I need the jurisdiction or by-law source to give a reliable legal answer. Share the city or authority name and the plot details, and I'll answer directly instead of turning it into a house plan.";
}

export async function POST(request: Request) {
  let question = "";

  try {
    const body = (await request.json().catch(() => ({}))) as LawChatRequestBody;
    question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json({ ok: false, error: "Question is required." }, { status: 400 });
    }

    const upstreamResponse = await fetch(LAW_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    const responseText = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      return NextResponse.json({ ok: true, answer: buildFallbackAnswer(question), source: "fallback" });
    }

    let parsed: unknown = responseText;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = responseText;
    }

    const answer = extractAnswerText(parsed, responseText);
    if (!answer) {
      return NextResponse.json({ ok: true, answer: buildFallbackAnswer(question), source: "fallback" });
    }

    return NextResponse.json({ ok: true, answer, source: "upstream" });
  } catch (error) {
    return NextResponse.json({ ok: true, answer: buildFallbackAnswer(question || String((error as Error)?.message || "")), source: "fallback" });
  }
}
