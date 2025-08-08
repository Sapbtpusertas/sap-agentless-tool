import React from 'react'
import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-2">SAP Landscape Analysis Tool</h1>
        <p className="text-gray-600 mb-4">Agentless discovery, validation and guided remediation for SAP landscapes. This demo uses a simulated backend and sample dataset.</p>
        <div className="grid grid-cols-3 gap-4">
          <Link to="/collect" className="p-6 bg-sky-50 rounded-lg hover:shadow">
            <h3 className="font-medium">Data Collection</h3>
            <p className="text-sm text-gray-500 mt-2">Manual uploads or agentless collectors.</p>
          </Link>
          <Link to="/dashboard" className="p-6 bg-sky-50 rounded-lg hover:shadow">
            <h3 className="font-medium">Analysis</h3>
            <p className="text-sm text-gray-500 mt-2">Run rules engine (demo).</p>
          </Link>
          <Link to="/dashboard" className="p-6 bg-sky-50 rounded-lg hover:shadow">
            <h3 className="font-medium">Final Dashboard</h3>
            <p className="text-sm text-gray-500 mt-2">Interactive visualizations and drilldowns.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
