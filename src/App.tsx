import { useReducer } from 'react'

interface AppState {
  // Placeholder for estimation state
}

type AppAction = { type: 'PLACEHOLDER' }

const initialState: AppState = {}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'PLACEHOLDER':
      return state
    default:
      return state
  }
}

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Informed Guessing - Estimation Workbench</h1>
      
      <section style={{ marginTop: '2rem' }}>
        <h2>1. Inputs</h2>
        <p>Input grid will go here</p>
      </section>

      <details style={{ marginTop: '2rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}>
          2. Advanced Variables
        </summary>
        <div style={{ marginTop: '1rem' }}>
          <p>Advanced variables will go here</p>
        </div>
      </details>

      <section style={{ marginTop: '2rem' }}>
        <h2>3. Outputs</h2>
        <p>Computed results will go here</p>
      </section>
    </div>
  )
}

export default App
