import { HashRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import Home from './pages/Home'
import Admin from './pages/Admin'
import './App.css'

function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}

export default App
