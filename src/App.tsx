import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Landing } from '@/pages/Landing'
import { Detections } from '@/pages/Detections'
import { Politicians } from '@/pages/Politicians'
import { Stats } from '@/pages/Stats'
import { Documentation } from '@/pages/Documentation'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/deteções" element={<Detections />} />
            <Route path="/deputados" element={<Politicians />} />
            <Route path="/estatísticas" element={<Stats />} />
            <Route path="/documentação" element={<Documentation />} />
            {/* English aliases */}
            <Route path="/detections" element={<Detections />} />
            <Route path="/politicians" element={<Politicians />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/docs" element={<Documentation />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
