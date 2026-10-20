import { Navigate, Route, Routes } from 'react-router-dom'

import { ProgressProvider } from './game/ProgressContext'
import { TitlePage } from './pages/TitlePage'
import { IntroPage } from './pages/IntroPage'
import { MapPage } from './pages/MapPage'
import { LevelPage } from './pages/LevelPage'
import { SandboxPage } from './pages/SandboxPage'
import { BadgesPage } from './pages/BadgesPage'

export function App() {
  return (
    <ProgressProvider>
      <Routes>
        <Route path="/" element={<TitlePage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/level/:id" element={<LevelPage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProgressProvider>
  )
}
