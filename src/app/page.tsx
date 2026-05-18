'use client';

import { useMemo, useState } from 'react';

export default function Page(){
  const [text,setText]=useState('Warfarin\nIbuprofen');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [result,setResult]=useState<any>(null);

  const medications=useMemo(()=>text.split(/\n|,/g).map(s=>s.trim()).filter(Boolean),[text]);

  async function run(){
    setError(null); setResult(null);
    if(medications.length<2){ setError('Enter at least 2 medications'); return; }
    setLoading(true);
    try{
      const res=await fetch('/api/interactions',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ medications }),
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data?.error||'Request failed');
      setResult(data);
    }catch(e:any){ setError(e?.message||'Request failed'); }
    finally{ setLoading(false); }
  }

  return (
    <main style={{maxWidth:900,margin:'40px auto',padding:'0 16px',fontFamily:'system-ui,sans-serif'}}>
      <h1>HETHAVERSE — Drug Interaction Checker</h1>
      <p>Starter UI (mock interactions, provider-stub).</p>

      <div style={{border:'1px solid #e5e5e5',borderRadius:12,padding:16}}>
        <label style={{fontWeight:700,display:'block'}}>Medications (one per line or comma)</label>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} style={{width:'100%'}} />
        <div style={{marginTop:8,fontSize:13}}>Parsed: {medications.join(', ')||'—'}</div>
        <button onClick={run} disabled={loading} style={{marginTop:12,width:'100%',padding:12}}>
          {loading?'Checking...':'Check interactions'}
        </button>
      </div>

      {error && <div style={{marginTop:18,color:'#b00020'}}>{error}</div>}

      {result && (
        <section style={{marginTop:18}}>
          <h2>Results</h2>
          {result.interactions.length===0 ? <div>No known interactions found.</div> : (
            <div style={{display:'grid',gap:12}}>
              {result.interactions.map((it:any)=> (
                <article key={it.id} style={{border:'1px solid #e5e5e5',borderRadius:12,padding:14}}>
                  <div style={{fontWeight:800}}>{it.between[0]} ↔ {it.between[1]}</div>
                  <div style={{marginTop:6,fontWeight:800}}>Severity: {it.severity}</div>
                  <div style={{marginTop:8}}>{it.summary}</div>
                </article>
              ))}
            </div>
          )}
          <p style={{marginTop:14,fontSize:13,color:'#555'}}>{result.disclaimer}</p>
        </section>
      )}
    </main>
  );
}
