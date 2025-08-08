import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import sample from '../../sample_landscape.json'

const COLORS = ['#22c55e','#eab308','#ef4444','#9ca3af']

export default function Dashboard(){
  const [data,setData] = useState([])
  useEffect(()=>{
    // build aggregated status counts from sample validation rules (simple)
    const systems = sample.systems || []
    let ok=0, warn=0, crit=0, nc=0
    systems.forEach(s=>{
      if(s.sld_entry && s.sld_entry.registered) ok++
      else warn++
    })
    setData([{name:'OK', value: ok},{name:'Warn', value: warn},{name:'Critical', value: crit},{name:'NotCollected', value: nc}])
  },[])
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Landscape Health</h2>
        <div style={{width: '100%', height: 240}}>
          <ResponsiveContainer>
            <PieChart>
              <Pie dataKey="value" data={data} innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((entry, idx)=> <Cell key={idx} fill={COLORS[idx%COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
