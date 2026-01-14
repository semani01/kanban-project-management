import React, { useState } from 'react'

/**
 * BoardSwitcher Component
 * Allows users to switch between boards, create new boards, and manage boards
 * 
 * @param {Array} boards - Array of all boards
 * @param {string} currentBoardId - ID of the currently active board
 * @param {Function} onBoardChange - Callback when board is switched
 * @param {Function} onCreateBoard - Callback to create a new board
 * @param {Function} onArchiveBoard - Callback to archive/unarchive a board
 * @param {Function} onDeleteBoard - Callback to delete a board
 */
const BoardSwitcher = ({
  boards,
  currentBoardId,
  onBoardChange,
  onCreateBoard,
  onArchiveBoard,
  onDeleteBoard
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Separate active and archived boards
  const activeBoards = boards.filter(board => !board.isArchived)
  const archivedBoards = boards.filter(board => board.isArchived)
  
  const currentBoard = boards.find(board => board.id === currentBoardId)

  return (
    <div className="board-switcher">
      {/* Current board display */}
      <button
        className="board-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch board"
      >
        <span className="board-switcher-icon">📋</span>
        <span className="board-switcher-name">
          {currentBoard ? currentBoard.name : 'Select Board'}
        </span>
        <span className="board-switcher-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          <div className="board-switcher-overlay" onClick={() => setIsOpen(false)} />
          <div className="board-switcher-menu">
            {/* Create new board button */}
            <button
              className="board-switcher-create"
              onClick={() => {
                onCreateBoard()
                setIsOpen(false)
              }}
            >
              + Create New Board
            </button>

            {/* Active boards */}
            <div className="board-switcher-section">
              <div className="board-switcher-section-title">Active Boards</div>
              {activeBoards.length === 0 ? (
                <div className="board-switcher-empty">No active boards</div>
              ) : (
                activeBoards.map(board => (
                  <div
                    key={board.id}
                    className={`board-switcher-item ${board.id === currentBoardId ? 'active' : ''}`}
                    onClick={() => {
                      onBoardChange(board.id)
                      setIsOpen(false)
                    }}
                  >
                    <span className="board-switcher-item-name">{board.name}</span>
                    <div className="board-switcher-item-actions">
                      <button
                        className="board-switcher-action"
                        onClick={(e) => {
                          e.stopPropagation()
                          onArchiveBoard(board.id)
                        }}
                        aria-label="Archive board"
                        title="Archive"
                      >
                        📦
                      </button>
                      {activeBoards.length > 1 && (
                        <button
                          className="board-switcher-action"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`Delete board "${board.name}"? This cannot be undone.`)) {
                              onDeleteBoard(board.id)
                            }
                          }}
                          aria-label="Delete board"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Archived boards */}
            {archivedBoards.length > 0 && (
              <div className="board-switcher-section">
                <div className="board-switcher-section-title">Archived Boards</div>
                {archivedBoards.map(board => (
                  <div
                    key={board.id}
                    className="board-switcher-item archived"
                    onClick={() => {
                      onBoardChange(board.id)
                      setIsOpen(false)
                    }}
                  >
                    <span className="board-switcher-item-name">{board.name}</span>
                    <div className="board-switcher-item-actions">
                      <button
                        className="board-switcher-action"
                        onClick={(e) => {
                          e.stopPropagation()
                          onArchiveBoard(board.id)
                        }}
                        aria-label="Unarchive board"
                        title="Unarchive"
                      >
                        📤
                      </button>
                      <button
                        className="board-switcher-action"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`Permanently delete board "${board.name}"? This cannot be undone.`)) {
                            onDeleteBoard(board.id)
                          }
                        }}
                        aria-label="Delete board"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default BoardSwitcher
