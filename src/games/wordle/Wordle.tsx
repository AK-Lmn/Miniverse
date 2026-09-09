import { useState, useEffect, useCallback } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton } from '../../components/ui/Clay'
import { RotateCcw, Delete, CornerDownLeft, Trophy, Frown } from 'lucide-react'

const WORDS = [
  'REACT', 'GAMES', 'CLAYM', 'BLOCK', 'SPACE', 'CLOUD', 'CRAFT', 'PIXEL',
  'QUEST', 'SPARK', 'FLASH', 'SHINE', 'POWER', 'LEVEL', 'SCORE', 'SUPER',
  'MAGIC', 'BRAIN', 'DREAM', 'CHESS', 'AUDIO', 'TRACK', 'SPEED', 'SOLAR',
  'STORM', 'RIVER', 'TIGER', 'PLANT', 'LIGHT', 'HEART', 'NIGHT', 'OCEAN',
  'FLAME', 'GHOST', 'SHARK', 'TRAIN', 'MOUSE', 'APPLE', 'SWEET', 'HONEY',
  'WATER', 'EARTH', 'MONEY', 'MUSIC', 'STARS', 'PEACH', 'MANGO', 'LEMON',
  'BERRY', 'CHERRY', 'GRAPE', 'CANDY', 'SUGAR', 'BREAD', 'PIZZA', 'SUSHI',
]

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty'

interface EvaluatedRow {
  letters: string[]
  statuses: LetterStatus[]
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
]

export function Wordle({ onScore }: GameComponentProps) {
  const [targetWord, setTargetWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)])
  const [guesses, setGuesses] = useState<EvaluatedRow[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [shakeRow, setShakeRow] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2000)
  }

  const evaluateGuess = (guess: string, target: string): LetterStatus[] => {
    const statuses: LetterStatus[] = Array(5).fill('absent')
    const targetArr = target.split('')
    const guessArr = guess.split('')
    const letterCounts: Record<string, number> = {}

    for (const char of targetArr) {
      letterCounts[char] = (letterCounts[char] || 0) + 1
    }

    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === targetArr[i]) {
        statuses[i] = 'correct'
        letterCounts[guessArr[i]]--
      }
    }

    for (let i = 0; i < 5; i++) {
      if (statuses[i] !== 'correct') {
        const char = guessArr[i]
        if (letterCounts[char] && letterCounts[char] > 0) {
          statuses[i] = 'present'
          letterCounts[char]--
        }
      }
    }

    return statuses
  }

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return
    if (currentGuess.length !== 5) {
      setShakeRow(true)
      showToast('Not enough letters')
      setTimeout(() => setShakeRow(false), 500)
      return
    }

    const statuses = evaluateGuess(currentGuess, targetWord)
    const newGuesses = [...guesses, { letters: currentGuess.split(''), statuses }]
    setGuesses(newGuesses)
    setCurrentGuess('')

    if (currentGuess === targetWord) {
      setStatus('won')
      const finalScore = (7 - newGuesses.length) * 120 + 200
      onScore(finalScore, { attempts: newGuesses.length, word: targetWord })
    } else if (newGuesses.length >= 6) {
      setStatus('lost')
      onScore(20, { attempts: 6, word: targetWord })
    }
  }, [status, currentGuess, guesses, targetWord, onScore])

  const handleKey = useCallback(
    (key: string) => {
      if (status !== 'playing') return

      if (key === 'ENTER') {
        submitGuess()
      } else if (key === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1))
      } else if (/^[A-Z]$/.test(key)) {
        if (currentGuess.length < 5) {
          setCurrentGuess((prev) => prev + key)
        }
      }
    },
    [status, currentGuess, submitGuess]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase()
      if (k === 'ENTER') {
        handleKey('ENTER')
      } else if (k === 'BACKSPACE') {
        handleKey('BACKSPACE')
      } else if (/^[A-Z]$/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleKey(k)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKey])

  const restartGame = () => {
    const remaining = WORDS.filter((w) => w !== targetWord)
    const next = remaining[Math.floor(Math.random() * remaining.length)]
    setTargetWord(next)
    setGuesses([])
    setCurrentGuess('')
    setStatus('playing')
    setMessage(null)
  }

  const keyStatuses = guesses.reduce<Record<string, LetterStatus>>((acc, row) => {
    row.letters.forEach((char, i) => {
      const current = acc[char]
      const status = row.statuses[i]
      if (status === 'correct') {
        acc[char] = 'correct'
      } else if (status === 'present' && current !== 'correct') {
        acc[char] = 'present'
      } else if (status === 'absent' && !current) {
        acc[char] = 'absent'
      }
    })
    return acc
  }, {})

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto select-none">

      {message && (
        <div className="absolute top-24 z-30 clay bg-white dark:bg-zinc-800 text-ink px-4 py-2 rounded-full font-bold text-sm animate-pop-in shadow-lg">
          {message}
        </div>
      )}

      <div className="grid grid-rows-6 gap-1.5 sm:gap-2 my-2">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length
          const rowGuess = guesses[rowIndex]

          return (
            <div
              key={rowIndex}
              className={`grid grid-cols-5 gap-1.5 sm:gap-2 ${
                isCurrentRow && shakeRow ? 'animate-jiggle' : ''
              }`}
            >
              {Array.from({ length: 5 }).map((_, colIndex) => {
                let char = ''
                let statusClass = 'border-2 border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 text-ink'

                if (rowGuess) {
                  char = rowGuess.letters[colIndex]
                  const st = rowGuess.statuses[colIndex]
                  if (st === 'correct') {
                    statusClass = 'clay bg-emerald-500 text-white font-black border-transparent'
                  } else if (st === 'present') {
                    statusClass = 'clay bg-amber-400 text-white font-black border-transparent'
                  } else {
                    statusClass = 'clay bg-zinc-400/80 dark:bg-zinc-600 text-white font-bold border-transparent'
                  }
                } else if (isCurrentRow) {
                  char = currentGuess[colIndex] || ''
                  if (char) {
                    statusClass = 'border-2 border-[var(--color-plum)] bg-white/90 dark:bg-black/40 text-ink font-bold scale-105 transition-transform'
                  }
                }

                return (
                  <div
                    key={colIndex}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl uppercase transition-all duration-300 ${statusClass}`}
                  >
                    {char}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {status !== 'playing' && (
        <div className="clay p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 flex flex-col items-center gap-2 animate-pop-in my-1 text-center max-w-xs shadow-xl">
          {status === 'won' ? (
            <>
              <Trophy size={36} className="text-yellow-500 animate-bounce" />
              <p className="font-extrabold text-lg text-ink">Brilliant! You found it!</p>
              <p className="text-xs text-ink-soft">
                Found <span className="font-bold text-ink">{targetWord}</span> in {guesses.length} {guesses.length === 1 ? 'try' : 'tries'}.
              </p>
            </>
          ) : (
            <>
              <Frown size={36} className="text-rose-400" />
              <p className="font-extrabold text-lg text-ink">Nice try!</p>
              <p className="text-xs text-ink-soft">
                The word was <span className="font-bold text-emerald-600 tracking-wider">{targetWord}</span>.
              </p>
            </>
          )}
          <ClayButton accent="mint" size="sm" onClick={restartGame} className="mt-2">
            <RotateCcw size={15} /> Play Again
          </ClayButton>
        </div>
      )}

      <div className="flex flex-col gap-1.5 w-full mt-1">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((k) => {
              const keyStatus = keyStatuses[k]
              let keyBg = 'clay-btn text-ink bg-white/70 dark:bg-white/10'

              if (keyStatus === 'correct') {
                keyBg = 'clay bg-emerald-500 text-white font-bold'
              } else if (keyStatus === 'present') {
                keyBg = 'clay bg-amber-400 text-white font-bold'
              } else if (keyStatus === 'absent') {
                keyBg = 'bg-zinc-300/60 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400 opacity-60'
              }

              const isActionKey = k === 'ENTER' || k === 'BACKSPACE'

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKey(k)}
                  className={`h-11 sm:h-12 flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold active:scale-95 transition-all ${
                    isActionKey ? 'px-2.5 sm:px-3 text-[11px]' : 'w-8 sm:w-10'
                  } ${keyBg}`}
                >
                  {k === 'BACKSPACE' ? (
                    <Delete size={18} />
                  ) : k === 'ENTER' ? (
                    <div className="flex items-center gap-0.5">
                      <span>ENTER</span>
                      <CornerDownLeft size={12} />
                    </div>
                  ) : (
                    k
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Wordle
