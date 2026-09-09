import { useState, useCallback } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton } from '../../components/ui/Clay'
import { RotateCcw } from 'lucide-react'

const WORDS_BY_CAT: Record<string, string[]> = {
  Animals:  ['TIGER', 'WHALE', 'EAGLE', 'KOALA', 'LLAMA', 'BISON', 'CRANE', 'HYENA', 'PANDA', 'SHARK'],
  Fruits:   ['APPLE', 'GRAPE', 'LEMON', 'MANGO', 'PEACH', 'MELON', 'OLIVE', 'GUAVA', 'PLUMB', 'BERRY'],
  Places:   ['JAPAN', 'EGYPT', 'ITALY', 'SPAIN', 'CHINA', 'INDIA', 'PARIS', 'MIAMI', 'GHANA', 'WALES'],
  Things:   ['PIANO', 'BRUSH', 'CLOCK', 'FENCE', 'TORCH', 'SWORD', 'CHAIR', 'TRUCK', 'GLOBE', 'PAPER'],
}
const ALL_WORDS = Object.values(WORDS_BY_CAT).flat()

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MAX_WRONG = 6

function pickWord() {
  return ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)]
}

// SVG hangman stages (0 = empty gallows ... 6 = full figure)
function HangmanFigure({ wrong }: { wrong: number }) {
  return (
    <svg viewBox="0 0 120 140" width={120} height={140} aria-hidden="true">
      {/* Gallows */}
      <line x1="10" y1="135" x2="110" y2="135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="135" x2="30" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="10" x2="80" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="10" x2="80" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Head */}
      {wrong >= 1 && <circle cx="80" cy="36" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />}
      {/* Body */}
      {wrong >= 2 && <line x1="80" y1="44" x2="80" y2="85" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
      {/* Left arm */}
      {wrong >= 3 && <line x1="80" y1="55" x2="58" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
      {/* Right arm */}
      {wrong >= 4 && <line x1="80" y1="55" x2="102" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
      {/* Left leg */}
      {wrong >= 5 && <line x1="80" y1="85" x2="60" y2="110" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
      {/* Right leg */}
      {wrong >= 6 && <line x1="80" y1="85" x2="100" y2="110" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
    </svg>
  )
}

export function Hangman({ onScore }: GameComponentProps) {
  const [word, setWord]         = useState(pickWord)
  const [guessed, setGuessed]   = useState<Set<string>>(new Set())
  const [gameState, setGs]      = useState<'playing' | 'won' | 'lost'>('playing')

  const wrongLetters = [...guessed].filter((l) => !word.includes(l))
  const wrongCount   = wrongLetters.length
  const maskedWord   = word.split('').map((l) => (guessed.has(l) ? l : '_'))

  const guess = useCallback((letter: string) => {
    if (gameState !== 'playing' || guessed.has(letter)) return
    const next = new Set(guessed).add(letter)
    setGuessed(next)
    const newWrong = [...next].filter((l) => !word.includes(l)).length
    const newMasked = word.split('').map((l) => (next.has(l) ? l : '_'))
    if (newMasked.every((c) => c !== '_')) {
      setGs('won')
      onScore(Math.max(100 - newWrong * 10, 10))
    } else if (newWrong >= MAX_WRONG) {
      setGs('lost')
      onScore(0)
    }
  }, [guessed, word, gameState, onScore])

  const restart = () => {
    setWord(pickWord())
    setGuessed(new Set())
    setGs('playing')
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5 select-none">
      {/* Figure */}
      <div className="text-ink">
        <HangmanFigure wrong={wrongCount} />
      </div>

      {/* Wrong count */}
      <p className="text-xs font-semibold text-ink-soft">{wrongCount} / {MAX_WRONG} wrong</p>

      {/* Word */}
      <div className="flex gap-2" aria-label={`Word: ${maskedWord.join(' ')}`}>
        {maskedWord.map((ch, i) => (
          <div
            key={i}
            className="flex h-10 w-8 items-end justify-center border-b-2 border-plum font-display text-xl font-bold text-ink"
          >
            {ch !== '_' ? ch : ''}
          </div>
        ))}
      </div>

      {/* Wrong letters */}
      {wrongLetters.length > 0 && (
        <p className="text-xs font-semibold text-rose-500">
          Wrong: {wrongLetters.join('  ')}
        </p>
      )}

      {/* Status */}
      {gameState === 'won' && (
        <p className="font-display text-lg font-bold text-mint-dark">You got it! 🎉</p>
      )}
      {gameState === 'lost' && (
        <p className="font-display text-lg font-bold text-rose-500">The word was: <span className="text-ink">{word}</span></p>
      )}

      {/* Keyboard */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {ALPHABET.map((letter) => {
          const isGuessed = guessed.has(letter)
          const isWrong   = isGuessed && !word.includes(letter)
          const isCorrect = isGuessed && word.includes(letter)
          return (
            <button
              key={letter}
              onClick={() => guess(letter)}
              disabled={isGuessed || gameState !== 'playing'}
              aria-label={`Guess ${letter}`}
              className={`clay-btn h-9 w-9 rounded-xl text-sm font-bold transition-all ${
                isWrong   ? 'opacity-30 text-rose-400' :
                isCorrect ? 'bg-mint text-ink opacity-70' :
                'text-ink'
              }`}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {gameState !== 'playing' && (
        <ClayButton accent="mint" onClick={restart}>
          <RotateCcw size={15} aria-hidden="true" /> Play Again
        </ClayButton>
      )}
    </div>
  )
}

export default Hangman

