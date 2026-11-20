import { Route, Routes } from 'react-router-dom'

import { ProgressProvider } from './game/ProgressContext'
import { TitlePage } from './pages/TitlePage'
import { IntroPage } from './pages/IntroPage'
import { MapPage } from './pages/MapPage'
import { LevelPage } from './pages/LevelPage'
import { SandboxPage } from './pages/SandboxPage'
import { BadgesPage } from './pages/BadgesPage'
import { BreakRoomPage } from './pages/BreakRoomPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PracticePage } from './pages/PracticePage'
import { useRememberPage } from './game/returnTo'

export function App() {
  // Remember where the learner is, so the Break Room can send them back.
  useRememberPage()
  return (
    <ProgressProvider>
      <Routes>
        <Route path="/" element={<TitlePage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/level/:id" element={<LevelPage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/break" element={<BreakRoomPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ProgressProvider>
  )
}
