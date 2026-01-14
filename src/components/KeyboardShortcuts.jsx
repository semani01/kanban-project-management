import React, { useEffect, useState } from 'react'

/**
 * KeyboardShortcuts Component
 * Handles keyboard shortcuts for common actions
 * 
 * @param {Object} shortcuts - Object mapping key combinations to callbacks
 * @param {Function} shortcuts.onCreateTask - Callback for creating task (Ctrl/Cmd + N)
 * @param {Function} shortcuts.onSearch - Callback to focus search (Ctrl/Cmd + K)
 * @param {Function} shortcuts.onUndo - Callback for undo (Ctrl/Cmd + Z)
 * @param {Function} shortcuts.onRedo - Callback for redo (Ctrl/Cmd + Shift + Z)
 * @param {Function} shortcuts.onCloseModal - Callback to close modals (Escape)
 */
const KeyboardShortcuts = ({ shortcuts = {} }) => {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        // Allow Escape to close modals even when in inputs
        if (e.key === 'Escape' && shortcuts.onCloseModal) {
          shortcuts.onCloseModal()
        }
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd + N - Create new task
      if (ctrlKey && e.key === 'n' && shortcuts.onCreateTask) {
        e.preventDefault()
        shortcuts.onCreateTask()
      }

      // Ctrl/Cmd + K - Focus search
      if (ctrlKey && e.key === 'k' && shortcuts.onSearch) {
        e.preventDefault()
        shortcuts.onSearch()
      }

      // Ctrl/Cmd + Z - Undo
      if (ctrlKey && e.key === 'z' && !e.shiftKey && shortcuts.onUndo) {
        e.preventDefault()
        shortcuts.onUndo()
      }

      // Ctrl/Cmd + Shift + Z - Redo
      if (ctrlKey && e.key === 'Z' && e.shiftKey && shortcuts.onRedo) {
        e.preventDefault()
        shortcuts.onRedo()
      }

      // Escape - Close modals
      if (e.key === 'Escape' && shortcuts.onCloseModal) {
        shortcuts.onCloseModal()
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' && !ctrlKey) {
        e.preventDefault()
        setShowHelp(!showHelp)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, showHelp])

  if (!showHelp) return null

  return (
    <div className="keyboard-shortcuts-modal" onClick={() => setShowHelp(false)}>
      <div className="keyboard-shortcuts-content" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button
            className="btn-close"
            onClick={() => setShowHelp(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="keyboard-shortcuts-list">
          <div className="shortcut-item">
            <kbd>Ctrl/Cmd</kbd> + <kbd>N</kbd>
            <span>Create new task</span>
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl/Cmd</kbd> + <kbd>K</kbd>
            <span>Focus search</span>
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl/Cmd</kbd> + <kbd>Z</kbd>
            <span>Undo</span>
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>
            <span>Redo</span>
          </div>
          <div className="shortcut-item">
            <kbd>Esc</kbd>
            <span>Close modal</span>
          </div>
          <div className="shortcut-item">
            <kbd>?</kbd>
            <span>Show/hide shortcuts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcuts
