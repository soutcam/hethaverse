import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const meds: string[] = Array.isArray(body?.medications) ? body.medications.map(String).map((m:any)=>String(m).trim()).filter(Boolean) : [];
  if (meds.length < 2) return NextResponse.json({ error: 'Please provide at least 2 medications.' }, { status: 400 });

  const n = meds.map((m) => m.toLowerCase());
  const has = (x: string) => n.includes(x);

  const interactions: any[] = [];
  if (has('warfarin') && (has('ibuprofen') || has('naproxen') || has('aspirin'))) {
    interactions.push({
      id: 'warfarin__nsaid__high',
      between: ['Warfarin', 'NSAID / Aspirin'],
      severity: 'high',
      summary: 'Increased bleeding risk when NSAIDs/aspirin are taken with warfarin.',
      whatToDo: 'Ask a clinician/pharmacist before combining; consider alternatives and monitor INR as directed.',
    });
  }

  return NextResponse.json({
    medications: meds,
    interactions,
    disclaimer: 'Educational only. Not medical advice.',
  });
}
