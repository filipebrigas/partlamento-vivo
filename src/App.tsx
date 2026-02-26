import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Landing } from '@/pages/Landing'
import { LiveSession } from '@/pages/LiveSession'
import { Speeches } from '@/pages/Speeches'
import { FillerWords } from '@/pages/FillerWords'
import { Participation } from '@/pages/Participation'
import { Compare } from '@/pages/Compare'
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
            <Route path="/ao-vivo" element={<LiveSession />} />
            <Route path="/discursos" element={<Speeches />} />
            <Route path="/palavras-de-enchimento" element={<FillerWords />} />
            <Route path="/participação" element={<Participation />} />
            <Route path="/comparar" element={<Compare />} />
            <Route path="/estatísticas" element={<Stats />} />
            <Route path="/documentação" element={<Documentation />} />
            {/* English aliases */}
            <Route path="/live" element={<LiveSession />} />
            <Route path="/speeches" element={<Speeches />} />
            <Route path="/filler-words" element={<FillerWords />} />
            <Route path="/participation" element={<Participation />} />
            <Route path="/compare" element={<Compare />} />
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
