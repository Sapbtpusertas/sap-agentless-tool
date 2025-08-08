import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import DataCollection from './pages/DataCollection'
import Dashboard from './pages/Dashboard'

function App(){
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <nav className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="font-semibold">SAP Landscape Tool</div>
            <div className="space-x-3 text-sm">
              <Link to="/" className="text-sky-600">Home</Link>
              <Link to="/collect" className="text-sky-600">Data Collection</Link>
              <Link to="/dashboard" className="text-sky-600">Dashboard</Link>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/collect' element={<DataCollection/>} />
          <Route path='/dashboard' element={<Dashboard/>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
