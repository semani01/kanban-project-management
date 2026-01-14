import React, { useState, useRef } from 'react'
import { exportToJSON, importFromJSON, exportTasksToCSV, downloadFile, readFileAsText } from '../utils/exportImport'

/**
 * ExportImport Component
 * Modal for exporting and importing boards/tasks
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {Array} boards - Array of all boards to export
 * @param {Function} onImport - Callback when boards are imported
 */
const ExportImport = ({ isOpen, onClose, boards, onImport }) => {
  const [activeTab, setActiveTab] = useState('export')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  /**
   * Exports all boards as JSON
   */
  const handleExportJSON = () => {
    const json = exportToJSON(boards)
    const filename = `kanban-boards-${new Date().toISOString().split('T')[0]}.json`
    downloadFile(json, filename, 'application/json')
  }

  /**
   * Exports current board tasks as CSV
   */
  const handleExportCSV = () => {
    // Export all tasks from all boards
    const allTasks = boards.flatMap(board => (board.tasks || []).map(task => ({
      ...task,
      boardName: board.name
    })))
    
    if (allTasks.length === 0) {
      alert('No tasks to export')
      return
    }

    const csv = exportTasksToCSV(allTasks)
    const filename = `kanban-tasks-${new Date().toISOString().split('T')[0]}.csv`
    downloadFile(csv, filename, 'text/csv')
  }

  /**
   * Handles file import
   */
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImportError('')

    try {
      const content = await readFileAsText(file)
      const importedBoards = importFromJSON(content)
      
      if (importedBoards.length === 0) {
        setImportError('No boards found in file')
        return
      }

      // Confirm import
      const confirmed = window.confirm(
        `Import ${importedBoards.length} board(s)? This will add them to your existing boards.`
      )

      if (confirmed) {
        onImport(importedBoards)
        onClose()
      }
    } catch (error) {
      setImportError(error.message || 'Failed to import file')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export / Import</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="export-import-tabs">
          <button
            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button
            className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
        </div>

        <div className="export-import-content">
          {activeTab === 'export' ? (
            <div className="export-section">
              <h3>Export Data</h3>
              <p className="export-description">
                Export your boards and tasks to backup or transfer to another device.
              </p>

              <div className="export-options">
                <div className="export-option">
                  <h4>Export All Boards (JSON)</h4>
                  <p>Export all boards with tasks in JSON format. Perfect for backups.</p>
                  <button className="btn-export" onClick={handleExportJSON}>
                    📥 Export JSON
                  </button>
                </div>

                <div className="export-option">
                  <h4>Export Tasks (CSV)</h4>
                  <p>Export all tasks from all boards in CSV format. Great for spreadsheets.</p>
                  <button className="btn-export" onClick={handleExportCSV}>
                    📊 Export CSV
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="import-section">
              <h3>Import Data</h3>
              <p className="import-description">
                Import boards from a previously exported JSON file.
              </p>

              <div className="import-option">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                  id="import-file-input"
                />
                <label htmlFor="import-file-input" className="btn-import">
                  📤 Choose JSON File
                </label>
              </div>

              {importError && (
                <div className="import-error">
                  ⚠️ {importError}
                </div>
              )}

              <div className="import-note">
                <strong>Note:</strong> Imported boards will be added to your existing boards.
                They will not replace your current data.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExportImport
