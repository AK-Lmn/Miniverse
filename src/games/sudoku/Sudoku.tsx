import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'
import { RotateCcw, Pencil, Eraser, Trophy, Clock, Play, Pause } from 'lucide-react'

type Difficulty = 'Easy' | 'Medium' | 'Hard'

interface PuzzleData {
  initial: number[][]
  solution: number[][]
}

// Curated verified solvable 9x9 puzzles
const PUZZLES: Record<Difficulty, PuzzleData[]> = {
  Easy: [
    {
      initial: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ],
    },
    {
      initial: [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0],
      ],
      solution: [
        [4, 3, 5, 2, 6, 9, 7, 8, 1],
        [6, 8, 2, 5, 7, 1, 4, 9, 3],
        [1, 9, 7, 8, 3, 4, 5, 6, 2],
        [8, 2, 6, 1, 9, 5, 3, 4, 7],
        [3, 7, 4, 6, 8, 2, 9, 1, 5],
        [9, 5, 1, 7, 4, 3, 6, 2, 8],
        [5, 1, 9, 3, 2, 6, 8, 7, 4],
        [2, 4, 8, 9, 5, 7, 1, 3, 6],
        [7, 6, 3, 4, 1, 8, 2, 5, 9],
      ],
    },
  ],
  Medium: [
    {
      initial: [
        [0, 2, 0, 6, 0, 8, 0, 0, 0],
        [5, 8, 0, 0, 0, 9, 7, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 0],
        [3, 7, 0, 0, 0, 0, 5, 0, 0],
        [6, 0, 0, 0, 0, 0, 0, 0, 4],
        [0, 0, 8, 0, 0, 0, 0, 1, 3],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 9, 8, 0, 0, 0, 3, 6],
        [0, 0, 0, 3, 0, 6, 0, 9, 0],
      ],
      solution: [
        [1, 2, 3, 6, 7, 8, 9, 4, 5],
        [5, 8, 4, 2, 3, 9, 7, 6, 1],
        [9, 6, 7, 1, 4, 5, 3, 2, 8],
        [3, 7, 2, 4, 6, 1, 5, 8, 9],
        [6, 9, 1, 5, 8, 3, 2, 7, 4],
        [4, 5, 8, 7, 9, 2, 6, 1, 3],
        [8, 3, 6, 9, 2, 4, 1, 5, 7],
        [2, 1, 9, 8, 5, 7, 4, 3, 6],
        [7, 4, 5, 3, 1, 6, 8, 9, 2],
      ],
    },
  ],
  Hard: [
    {
      initial: [
        [0, 0, 0, 6, 0, 0, 4, 0, 0],
        [7, 0, 0, 0, 0, 3, 6, 0, 0],
        [0, 0, 0, 0, 9, 1, 0, 8, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 0, 1, 8, 0, 0, 0, 3],
        [0, 0, 0, 3, 0, 6, 0, 4, 5],
        [0, 4, 0, 2, 0, 0, 0, 6, 0],
        [9, 0, 3, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 1, 0, 0],
      ],
      solution: [
        [5, 8, 1, 6, 7, 2, 4, 3, 9],
        [7, 9, 2, 8, 4, 3, 6, 5, 1],
        [3, 6, 4, 5, 9, 1, 7, 8, 2],
        [4, 3, 8, 9, 5, 7, 2, 1, 6],
        [2, 5, 6, 1, 8, 4, 9, 7, 3],
        [1, 7, 9, 3, 2, 6, 8, 4, 5],
        [8, 4, 5, 2, 1, 9, 3, 6, 7],
        [9, 1, 3, 7, 6, 8, 5, 2, 4],
        [6, 2, 7, 4, 3, 5, 1, 9, 8],
      ],
    },
  ],
}

export function Sudoku({ onScore }: GameComponentProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy')
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [board, setBoard] = useState<number[][]>(() =>
    PUZZLES.Easy[0].initial.map((r) => [...r])
  )
  const [notes, setNotes] = useState<Record<string, number[]>>({})
  const [selected, setSelected] = useState<[number, number] | null>([0, 0])
  const [pencilMode, setPencilMode] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isWon, setIsWon] = useState(false)

  const activePuzzle = useMemo(() => {
    const list = PUZZLES[difficulty]
    return list[puzzleIndex % list.length]
  }, [difficulty, puzzleIndex])

  const initialMask = useMemo(() => {
    return activePuzzle.initial.map((row) => row.map((cell) => cell !== 0))
  }, [activePuzzle])

  // Timer
  useEffect(() => {
    if (isWon || isPaused) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isWon, isPaused])

  const startNewGame = useCallback(
    (diff = difficulty) => {
      setDifficulty(diff)
      const list = PUZZLES[diff]
      const nextIdx = (puzzleIndex + 1) % list.length
      setPuzzleIndex(nextIdx)
      const p = list[nextIdx]
      setBoard(p.initial.map((r) => [...r]))
      setNotes({})
      setSelected([0, 0])
      setMistakes(0)
      setSeconds(0)
      setIsPaused(false)
      setIsWon(false)
    },
    [difficulty, puzzleIndex]
  )

  const checkWin = useCallback(
    (currentBoard: number[][]) => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] !== activePuzzle.solution[r][c]) {
            return false
          }
        }
      }
      return true
    },
    [activePuzzle]
  )

  const handleInputNumber = useCallback(
    (num: number) => {
      if (!selected || isWon || isPaused) return
      const [r, c] = selected
      if (initialMask[r][c]) return // Cannot modify initial clues

      const key = `${r}-${c}`

      if (pencilMode) {
        // Toggle note
        setNotes((prev) => {
          const current = prev[key] ?? []
          const updated = current.includes(num)
            ? current.filter((n) => n !== num)
            : [...current, num].sort()
          return { ...prev, [key]: updated }
        })
        return
      }

      // Normal entry
      const prevVal = board[r][c]
      const newVal = prevVal === num ? 0 : num

      const nextBoard = board.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? newVal : cell))
      )
      setBoard(nextBoard)

      // Clear pencil marks on that cell if number is placed
      if (newVal !== 0) {
        setNotes((prev) => {
          const copy = { ...prev }
          delete copy[key]
          return copy
        })

        // Check if wrong
        if (newVal !== activePuzzle.solution[r][c]) {
          setMistakes((m) => m + 1)
        }
      }

      if (checkWin(nextBoard)) {
        setIsWon(true)
        const diffMultiplier = difficulty === 'Hard' ? 3 : difficulty === 'Medium' ? 2 : 1
        const timePenalty = Math.floor(seconds / 5)
        const mistakePenalty = mistakes * 40
        const finalScore = Math.max(100, 1000 * diffMultiplier - timePenalty - mistakePenalty)
        onScore(finalScore, { difficulty, seconds, mistakes })
      }
    },
    [
      selected,
      isWon,
      isPaused,
      initialMask,
      pencilMode,
      board,
      activePuzzle,
      checkWin,
      difficulty,
      seconds,
      mistakes,
      onScore,
    ]
  )

  const handleErase = useCallback(() => {
    if (!selected || isWon || isPaused) return
    const [r, c] = selected
    if (initialMask[r][c]) return

    setBoard((prev) =>
      prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? 0 : cell)))
    )
    const key = `${r}-${c}`
    setNotes((prev) => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }, [selected, isWon, isPaused, initialMask])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon) return

      if (e.key >= '1' && e.key <= '9') {
        handleInputNumber(parseInt(e.key, 10))
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase()
      } else if (e.key === 'p' || e.key === 'P') {
        setPencilMode((p) => !p)
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        setSelected((curr) => {
          if (!curr) return [0, 0]
          let [r, c] = curr
          if (e.key === 'ArrowUp') r = (r + 8) % 9
          if (e.key === 'ArrowDown') r = (r + 1) % 9
          if (e.key === 'ArrowLeft') c = (c + 8) % 9
          if (e.key === 'ArrowRight') c = (c + 1) % 9
          return [r, c]
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleInputNumber, handleErase, isWon])

  const selectedVal = selected ? board[selected[0]][selected[1]] : null

  const formatTime = (total: number) => {
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto select-none">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full px-2">
        <div className="flex items-center gap-1.5 bg-white/40 dark:bg-black/20 rounded-full p-1 clay-inset">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => startNewGame(d)}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                difficulty === d
                  ? 'clay bg-[var(--color-plum)] text-white shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-ink-soft">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span className="font-mono text-sm text-ink">{formatTime(seconds)}</span>
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="p-1 hover:text-ink transition-colors ml-1"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          </div>
          <div>
            Mistakes:{' '}
            <span className={mistakes > 2 ? 'text-red-500 font-bold' : 'text-ink'}>
              {mistakes}
            </span>
          </div>
        </div>
      </div>

      {/* Main Board */}
      <div className="relative">
        {isPaused && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/70 dark:bg-black/70 flex flex-col items-center justify-center rounded-2xl gap-3">
            <p className="text-lg font-bold text-ink">Game Paused</p>
            <ClayButton accent="lavender" onClick={() => setIsPaused(false)}>
              <Play size={16} /> Resume
            </ClayButton>
          </div>
        )}

        {isWon && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/85 dark:bg-black/85 flex flex-col items-center justify-center rounded-2xl gap-3 animate-pop-in p-6 text-center">
            <Trophy size={48} className="text-yellow-500 animate-bounce" />
            <h3 className="text-2xl font-black text-ink">Sudoku Solved!</h3>
            <p className="text-sm text-ink-soft">
              Difficulty: <span className="font-bold text-ink">{difficulty}</span> | Time:{' '}
              <span className="font-bold text-ink">{formatTime(seconds)}</span>
            </p>
            <div className="flex gap-2 mt-2">
              <ClayButton accent="mint" onClick={() => startNewGame()}>
                <RotateCcw size={16} /> Play Again
              </ClayButton>
            </div>
          </div>
        )}

        <ClayCard className="p-2 sm:p-3 overflow-hidden">
          <div className="grid grid-cols-9 border-2 border-[var(--color-ink)]/60 rounded-xl overflow-hidden bg-white/80 dark:bg-black/40">
            {board.map((row, r) =>
              row.map((cellVal, c) => {
                const isInitial = initialMask[r][c]
                const isSelected = selected?.[0] === r && selected?.[1] === c
                const inSameRow = selected?.[0] === r
                const inSameCol = selected?.[1] === c
                const inSameBox =
                  selected &&
                  Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
                  Math.floor(selected[1] / 3) === Math.floor(c / 3)
                const isRelated = inSameRow || inSameCol || inSameBox
                const isSameNumber =
                  cellVal !== 0 && selectedVal !== null && cellVal === selectedVal
                const isIncorrect =
                  cellVal !== 0 && !isInitial && cellVal !== activePuzzle.solution[r][c]
                const cellNotes = notes[`${r}-${c}`] ?? []

                // Border logic for 3x3 grids
                const rightBorder = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-ink/40' : 'border-r border-r-ink/10'
                const bottomBorder = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-ink/40' : 'border-b border-b-ink/10'

                let bgClass = 'hover:bg-[var(--color-sky)]/30'
                if (isSelected) {
                  bgClass = 'bg-[var(--color-plum)] text-white shadow-inner font-extrabold'
                } else if (isIncorrect) {
                  bgClass = 'bg-red-200/80 dark:bg-red-950/60 text-red-600'
                } else if (isSameNumber) {
                  bgClass = 'bg-[var(--color-lavender-dark)]/40 font-bold'
                } else if (isRelated) {
                  bgClass = 'bg-[var(--color-lavender)]/30 dark:bg-white/5'
                }

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => setSelected([r, c])}
                    className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-base sm:text-lg select-none transition-colors relative ${rightBorder} ${bottomBorder} ${bgClass}`}
                  >
                    {cellVal !== 0 ? (
                      <span
                        className={`${
                          isInitial
                            ? 'font-bold text-ink'
                            : isSelected
                            ? 'text-white'
                            : isIncorrect
                            ? 'text-red-500 font-bold'
                            : 'text-[var(--color-plum)] font-semibold'
                        }`}
                      >
                        {cellVal}
                      </span>
                    ) : (
                      // Pencil marks grid
                      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none text-[8px] sm:text-[9px] leading-none text-ink-soft/70">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <div key={n} className="flex items-center justify-center font-mono">
                            {cellNotes.includes(n) ? n : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </ClayCard>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
        <ClayButton
          accent={pencilMode ? 'mint' : 'cream'}
          size="sm"
          onClick={() => setPencilMode((p) => !p)}
          className="flex items-center gap-1.5"
        >
          <Pencil size={15} />
          <span>Pencil {pencilMode ? 'ON' : 'OFF'}</span>
        </ClayButton>

        <ClayButton
          accent="cream"
          size="sm"
          onClick={handleErase}
          className="flex items-center gap-1.5"
        >
          <Eraser size={15} />
          <span>Erase</span>
        </ClayButton>

        <ClayButton
          accent="cream"
          size="sm"
          onClick={() => startNewGame()}
          className="flex items-center gap-1.5"
        >
          <RotateCcw size={15} />
          <span>Restart</span>
        </ClayButton>
      </div>

      {/* Number Pad (1-9) */}
      <div className="grid grid-cols-9 gap-1.5 w-full max-w-md px-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleInputNumber(num)}
            className="clay-btn h-11 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold text-ink active:scale-95 transition-transform"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Sudoku
