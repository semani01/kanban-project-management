import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/App.css'

// Entry point of the React application
// Renders the App component into the root div element
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
