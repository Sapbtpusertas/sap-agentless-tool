import React, { useState, useEffect } from 'react'
import sampleLandscape from '../../sample_landscape.json'
import { motion } from 'framer-motion'

function validateSample(sample){
  const issues = []
  const systems = sample.systems || []
  const sidSet = new Set(systems.map(s=>s.sid))
  systems.forEach(s=>{
    if(!/^[A-Z0-9]{3}$/.test(s.sid)){
      issues.push({level:'critical', title:`SID invalid: ${s.sid}`, detail:'SID must be 3 uppercase letters or numbers.'})
    }
    if(!s.sld_entry || !s.sld_entry.registered){
      issues.push({level:'warn', title:`SLD missing for ${s.sid}`, detail:'Register system in SolMan LMDB/SLD.'})
    }
    (s.transport_queues||[]).forEach(t=>{
      (t.target_systems||[]).forEach(ts=>{
        if(!sidSet.has(ts)) issues.push({level:'warn', title:`Transport target ${ts} missing for ${t.transport_id}`, detail:'Target not in inventory.'})
      })
    })
    (s.rfc_connections||[]).forEach(r=>{
      if(r.target_system && r.target_system !== '*' && !sidSet.has(r.target_system)) issues.push({level:'warn', title:`RFC target ${r.target_system} for ${r.name} not found`, detail:'Check RFC destination or inventory.'})
      if(r.auth_method && r.auth_method.toLowerCase().includes('user')) issues.push({level:'warn', title:`RFC ${r.name} uses password auth`, detail:'Consider SNC or certificate auth.'})
    })
    (s.certificates||[]).forEach(c=>{
      if(c.not_after && new Date(c.not_after) < new Date()) issues.push({level:'critical', title:`Expired cert on ${s.sid}: ${c.subject}`, detail:'Renew certificate.'})
    })
  })
  return issues
}

export default function DataCollection(){
  const [mode,setMode] = useState('sample')
  const [sample,setSample] = useState(null)
  const [issues,setIssues] = useState([])
  const [selected,setSelected] = useState(null)
  useEffect(()=>{},[])
  function loadSample(){
    setSample(sampleLandscape)
    const v = validateSample(sampleLandscape)
    setIssues(v)
  }
  useEffect(()=>{ if(mode==='sample') loadSample() },[mode])
  async function handleUpload(e){
    const files = e.target.files
    if(!files || files.length===0) return
    // post each file to backend /api/validate if available
    const form = new FormData()
    for(let i=0;i<files.length;i++) form.append('file', files[i])
    try{
      const base = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(base + '/api/validate', {method:'POST', body: form})
      if(res.ok){
        const j = await res.json()
        setIssues(prev => [{ level: j.valid ? 'ok' : 'warn', title: j.filename, detail: j.ai }, ...prev])
      }else{
        setIssues(prev => [{ level:'warn', title:'Upload failed', detail: 'Server error ' + res.status }, ...prev])
      }
    }catch(err){
      setIssues(prev => [{ level:'warn', title:'Upload error', detail: String(err) }, ...prev])
    }
  }
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-6 bg-white rounded shadow cursor-pointer" onClick={()=>setMode('manual')}>
          <h3 className="font-medium">Manual Collection</h3>
          <p className="text-sm text-gray-500 mt-2">Upload exports (SM59, STMS, LMDB).</p>
        </div>
        <div className="p-6 bg-white rounded shadow cursor-pointer" onClick={()=>setMode('auto')}>
          <h3 className="font-medium">Automated Collection</h3>
          <p className="text-sm text-gray-500 mt-2">Run simulated agentless collectors.</p>
        </div>
        <div className="p-6 bg-white rounded shadow cursor-pointer" onClick={()=>{ setMode('sample'); loadSample(); }}>
          <h3 className="font-medium">Load Sample Data</h3>
          <p className="text-sm text-gray-500 mt-2">Instant demo dataset and validation.</p>
        </div>
      </div>

      {mode === 'manual' && (
        <div className="bg-white p-6 rounded shadow">
          <h4 className="font-semibold">Manual uploads</h4>
          <p className="text-sm text-gray-500 mb-3">Select one or more exported files (CSV/XLSX)</p>
          <input type="file" multiple onChange={handleUpload} />
        </div>
      )}

      {mode === 'auto' && (
        <div className="bg-white p-6 rounded shadow">
          <h4 className="font-semibold">Automated (simulated)</h4>
          <p className="text-sm text-gray-500 mb-3">Triggers backend simulated collectors.</p>
          <button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={async ()=>{
            const base = import.meta.env.VITE_API_BASE || ''
            const form = new FormData(); form.append('host','prd-pas-00.aws.example.com'); form.append('sid','PRD'); 
            const resp = await fetch(base + '/api/collect/auto', { method:'POST', body: form })
            if(resp.ok){ alert('Collection started (demo). Poll /api/collect/status/<session> to see files.'); }
            else { alert('Collection failed') }
          }}>Run Collection</button>
        </div>
      )}

      {mode === 'sample' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="bg-white p-4 rounded shadow">
              <h4 className="font-semibold mb-2">Sample Systems</h4>
              {sample ? sample.systems.map((s, i)=> (
                <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} className="border rounded p-3 mb-2">
                  <div className="flex justify-between">
                    <div><div className="font-medium">{s.sid} — {s.name}</div><div className="text-xs text-gray-500">{s.type} • {s.environment}</div></div>
                    <div className="text-sm text-gray-500">Instances: {s.instances?.length || 0}</div>
                  </div>
                </motion.div>
              )) : <div className="text-sm text-gray-500">No sample loaded</div>}
            </div>

            <div className="bg-white p-4 rounded shadow mt-4">
              <h4 className="font-semibold mb-2">Validation</h4>
              {issues.length === 0 && <div className="text-sm text-gray-500">No issues found</div>}
              {issues.map((it, idx)=> (
                <div key={idx} className="flex items-start space-x-3 p-2 border rounded mb-2 cursor-pointer" onClick={()=>setSelected(it)}>
                  <div>{ it.level === 'critical' ? '❌' : it.level === 'warn' ? '⚠️' : '✅' }</div>
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-gray-500">{it.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-white p-4 rounded shadow">
              <h4 className="font-semibold mb-2">Modules</h4>
              <div className="text-sm text-gray-600">Systems: {sample?.systems?.length || 0}</div>
              <div className="text-sm text-gray-600">RFCs: {sample ? sample.systems.reduce((acc,s)=> acc + (s.rfc_connections?.length||0),0) : 0}</div>
              <div className="text-sm text-gray-600">Transports: {sample ? sample.systems.reduce((acc,s)=> acc + (s.transport_queues?.length||0),0) : 0}</div>
              <div className="text-sm text-gray-600">SLD entries: {sample ? sample.systems.filter(s=>s.sld_entry && s.sld_entry.registered).length : 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
