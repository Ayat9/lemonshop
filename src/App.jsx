import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <div className="logos">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="headings">
        <h1>Hello World</h1>
        <h2>Hello Harsan</h2>
        <h3>Vite + React</h3>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">Vite</a>
        {' · '}
        <a href="https://react.dev" target="_blank" rel="noreferrer">React</a>
        {' — click the logos to learn more'}
      </p>
    </div>
  )
}

export default App
