import { NextRequest, NextResponse } from 'next/server';

type UpstreamPayload = {
  medications: string[];
  patientAge?: number;
  notes?: string;
};

type Interaction = {
  id: string;
  between: [string, string];
  severity: 'low' | 'moderate' | 'high';
  summary: string;
  whatToDo: string;
};

type MockResponse = {
  medications: string[];
  interactions: Interaction[];
  disclaimer: string;
};

function mockInteractions(meds: string[]): Interaction[] {
  const n = meds.map((m) => m.toLowerCase());
  const has = (x: string) => n.includes(x);

  const interactions: Interaction[] = [];

  if (has('warfarin') && (has('ibuprofen') || has('naproxen') || has('aspirin'))) {
    interactions.push({
      id: 'warfarin__nsaid__high',
      between: ['Warfarin', 'NSAID / Aspirin'],
      severity: 'high',
      summary: 'Increased bleeding risk when NSAIDs/aspirin are taken with warfarin.',
      whatToDo:
        'Ask a clinician/pharmacist before combining; consider alternatives and monitor INR as directed.',
    });
  }

  // Keep the starter rules small; expand later or delegate to upstream.
  return interactions;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const meds: string[] = Array.isArray(body?.medications)
    ? body.medications.map((m: any) => String(m).trim()).filter(Boolean)
    : [];

  if (meds.length < 2) {
    return NextResponse.json({ error: 'Please provide at least 2 medications.' }, { status: 400 });
  }

  const upstreamUrl = process.env.DRUG_INTERACTION_API_URL;
  const upstreamKey = process.env.DRUG_INTERACTION_API_KEY;

  const payload: UpstreamPayload = {
    medications: meds,
    patientAge: typeof body?.patientAge === 'number' ? body.patientAge : undefined,
    notes: typeof body?.notes === 'string' ? body.notes : undefined,
  };

  const disclaimer =
    'Educational only. Not medical advice. If you have questions or symptoms, consult a clinician/pharmacist.';

  // If an upstream provider is configured, try it. If it fails, fall back to mocks.
  if (upstreamUrl) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (upstreamKey) headers.Authorization = 'Bearer ' + upstreamKey;

      const res = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Upstream failed: ' + res.status);

      const data = (await res.json()) as any;
      const interactions: Interaction[] = Array.isArray(data?.interactions) ? data.interactions : [];

      return NextResponse.json({
        medications: meds,
        interactions,
        disclaimer,
        provider: 'upstream',
      });
    } catch (e: any) {
      const fallback = mockResponse(meds, disclaimer);
      return NextResponse.json({
        ...fallback,
        provider: 'mock',
        upstreamError: e?.message || String(e),
      });
    }
  }

  return NextResponse.json(mockResponse(meds, disclaimer));
}

function mockResponse(meds: string[], disclaimer: string): MockResponse {
  return {
    medications: meds,
    interactions: mockInteractions(meds),
    disclaimer,
  };
}
