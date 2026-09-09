import { useEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

const WORDS = (
  'time year people way day man thing woman life child world school state family student group ' +
  'country problem hand part place case week company system program question work government number ' +
  'night point home water room mother area money story fact month lot right study book eye job word ' +
  'business issue side kind head house service friend father power hour game line end member law car ' +
  'city community name president team minute idea body information back parent face others level office ' +
  'door health person art war history party result change morning reason research girl guy moment air ' +
  'teacher force education foot boy age policy process music market sense nation plan college interest ' +
  'death experience effect use class control care field development role effort rate heart drug show leader'
).split(' ')

const DURATIONS = [15, 30, 60]

function randomWords(count: number) {
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(WORDS[Math.floor(Math.random() * WORDS.length)])
  return out
}

export function TypingTest({ onScore, soundEnabled }: GameComponentProps) {
  const [duration, setDuration] = useState(30)
  const [words, setWords] = useState<string[]>(() => randomWords(60))
  const [input, setInput] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [correctChars, setCorrectChars] = useState(0)
  const [errorChars, setErrorChars] = useState(0)
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }, [])

  const wpm = useMemo(() => {
    const elapsed = duration - timeLeft
    if (elapsed <= 0) return 0
    return Math.round((correctChars / 5) / (elapsed / 60))
  }, [correctChars, duration, timeLeft])

  const accuracy = useMemo(() => {
    const total = correctChars + errorChars
    return total ? Math.round((correctChars / total) * 100) : 100
  }, [correctChars, errorChars])

  const reset = (d: number) => {
    setDuration(d)
    setTimeLeft(d)
    setWords(randomWords(80))
    setWordIndex(0)
    setInput('')
    setCorrectChars(0)
    setErrorChars(0)
    setFinished(false)
    setRunning(false)
    if (intervalRef.current) window.clearInterval(intervalRef.current)
  }

  const finishTest = () => {
    setRunning(false)
    setFinished(true)
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    playSfx('gameOver', soundEnabled)
    onScore(wpm)
  }

  const startIfNeeded = () => {
    if (running || finished) return
    setRunning(true)
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(intervalRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (running && timeLeft === 0) finishTest()

  }, [timeLeft, running])

  const handleChange = (value: string) => {
    if (finished) return
    startIfNeeded()
    if (value.endsWith(' ')) {
      const typed = value.trim()
      const target = words[wordIndex] ?? ''
      let correct = 0
      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === target[i]) correct++
      }
      setCorrectChars((c) => c + correct + 1)
      setErrorChars((e) => e + Math.max(0, typed.length - correct))
      setWordIndex((i) => i + 1)
      setInput('')
      return
    }
    setInput(value)
  }

  const visibleWords = words.slice(Math.max(0, wordIndex - 2), wordIndex + 14)

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-2">
        {DURATIONS.map((d) => (
          <ClayButton key={d} size="sm" accent={duration === d ? 'mint' : 'lavender'} onClick={() => reset(d)}>
            {d}s
          </ClayButton>
        ))}
      </div>

      <ClayCard accent="sky" className="w-full max-w-2xl px-5 py-3 text-center">
        <p className="font-display text-3xl font-extrabold text-ink">{timeLeft}s</p>
      </ClayCard>

      <ClayCard
        accent="cream"
        className="w-full max-w-2xl cursor-text px-5 py-6"
        onClick={() => inputRef.current?.focus()}
      >
        <p className="select-none text-lg leading-relaxed text-ink-soft">
          {visibleWords.map((w, i) => {
            const realIndex = Math.max(0, wordIndex - 2) + i
            const isCurrent = realIndex === wordIndex
            const isPast = realIndex < wordIndex
            return (
              <span
                key={realIndex}
                className={`mr-2 rounded px-0.5 ${
                  isCurrent ? 'bg-lavender text-ink' : isPast ? 'text-mint-dark' : ''
                }`}
              >
                {w}
              </span>
            )
          })}
        </p>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          disabled={finished}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Type the highlighted word"
          className="mt-4 w-full rounded-xl border-none bg-white/70 px-4 py-2 text-lg text-ink outline-none clay-inset"
          placeholder={finished ? 'Time! Pick a duration to retry.' : 'Start typing…'}
        />
      </ClayCard>

      <div className="grid w-full max-w-2xl grid-cols-3 gap-3">
        <ClayCard accent="lavender" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">WPM</p>
          <p className="font-display text-lg font-bold text-ink">{wpm}</p>
        </ClayCard>
        <ClayCard accent="mint" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Accuracy</p>
          <p className="font-display text-lg font-bold text-ink">{accuracy}%</p>
        </ClayCard>
        <ClayCard accent="peach" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Errors</p>
          <p className="font-display text-lg font-bold text-ink">{errorChars}</p>
        </ClayCard>
      </div>
    </div>
  )
}

export default TypingTest
