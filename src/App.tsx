import { Routes, Route } from 'react-router-dom';
import { Shell } from './components/Shell';
import { SetupFlow } from './features/setup/SetupFlow';
import { NowScreen } from './features/now/NowScreen';
import { TwinScreen } from './features/twin/TwinScreen';
import { LensScreen } from './features/lens/LensScreen';
import { SwarmScreen } from './features/swarm/SwarmScreen';
import { EarthScreen } from './features/earth/EarthScreen';
import { MeScreen } from './features/me/MeScreen';
import { Landing } from './features/landing/Landing';
import { useApp } from './AppContext';

export default function App() {
  const { household } = useApp();

  // First-run setup if no household
  if (household && !household.setupComplete) {
    return <SetupFlow />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<NowScreen />} />
        <Route path="twin" element={<TwinScreen />} />
        <Route path="lens" element={<LensScreen />} />
        <Route path="swarm" element={<SwarmScreen />} />
        <Route path="earth" element={<EarthScreen />} />
        <Route path="me" element={<MeScreen />} />
      </Route>
      <Route path="/setup" element={<SetupFlow />} />
    </Routes>
  );
}
