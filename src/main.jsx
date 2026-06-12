import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Service worker removed — kill-switch so devices that installed the old
// worker drop it (and its caches) and always load fresh from the server.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => {})
  if (window.caches?.keys) {
    caches
      .keys()
      .then((keys) => keys.forEach((key) => caches.delete(key)))
      .catch(() => {})
  }
}
