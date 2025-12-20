import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import type { AnswerKey, Difficulty, MillionaireQuestion } from './types'
import questionsNewYearJson from './data/questions.json'
import questionsRegularJson from './data/questionsRegular.json'
import losevMoose from './assets/losev-moose.svg'
import snowman from './assets/snowman.svg'

type GameState = 'intro' | 'playing' | 'finished'
type GameMode = 'newyear' | 'regular'

const LS_DIFFICULTY_KEY = 'millionaire:difficulty'
const LS_EARNED_TOTAL_KEY = 'millionaire:earnedPoints'
const LS_GAME_MODE_KEY = 'millionaire:gameMode'

function normalizeQuestions(input: unknown): MillionaireQuestion[] {
  if (!Array.isArray(input)) return []
  return input.filter(Boolean) as MillionaireQuestion[]
}

function normalizeQuestionsByDifficulty(
  input: unknown
): Record<Difficulty, MillionaireQuestion[]> {
  const empty: Record<Difficulty, MillionaireQuestion[]> = {
    easy: [],
    medium: [],
    hard: []
  }

  // Backward compatibility: old format was just an array
  if (Array.isArray(input)) {
    empty.easy = normalizeQuestions(input)
    return empty
  }

  if (typeof input !== 'object' || input === null) return empty
  const obj = input as Record<string, unknown>
  return {
    easy: normalizeQuestions(obj.easy),
    medium: normalizeQuestions(obj.medium),
    hard: normalizeQuestions(obj.hard)
  }
}

function keyOrder(): AnswerKey[] {
  return ['A', 'B', 'C', 'D']
}

function pickOne<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)] ?? null
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}


// Озвучка текста через SpeechSynthesis
function speakText(text: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) return
  
  // Останавливаем предыдущую озвучку, если она есть
  window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ru-RU'
  utterance.rate = 0.85
  utterance.pitch = 0.7 // Низкий pitch для мужского голоса
  utterance.volume = 0.9
  
  // Улучшенный поиск мужского голоса для Жоры
  const voices = window.speechSynthesis.getVoices()
  
  // Приоритетный поиск мужского голоса
  const maleVoice = 
    // 1. Явно мужской голос
    voices.find(v => v.lang.startsWith('ru') && (
      v.name.toLowerCase().includes('male') || 
      v.name.toLowerCase().includes('муж') ||
      v.name.toLowerCase().includes('dmitri') ||
      v.name.toLowerCase().includes('yuri')
    )) ||
    // 2. Исключаем женские голоса
    voices.find(v => v.lang.startsWith('ru') && 
      !v.name.toLowerCase().includes('female') && 
      !v.name.toLowerCase().includes('жен') &&
      !v.name.toLowerCase().includes('anna') &&
      !v.name.toLowerCase().includes('katya') &&
      !v.name.toLowerCase().includes('milena') &&
      !v.name.toLowerCase().includes('elena')
    ) ||
    // 3. Любой русский голос
    voices.find(v => v.lang.startsWith('ru'))
  
  if (maleVoice) {
    utterance.voice = maleVoice
  }
  
  if (onEnd) {
    utterance.onend = onEnd
  }
  
  window.speechSynthesis.speak(utterance)
}

function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

type MillionaireGameProps = {
  onBack: () => void
}

function MillionaireGame({ onBack }: MillionaireGameProps) {
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const saved = window.localStorage.getItem(LS_GAME_MODE_KEY)
    return saved === 'newyear' || saved === 'regular' ? saved : 'regular'
  })

  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = window.localStorage.getItem(LS_DIFFICULTY_KEY)
    return saved === 'easy' || saved === 'medium' || saved === 'hard' ? saved : 'easy'
  })

  const [earnedTotal, setEarnedTotal] = useState(() => {
    const raw = window.localStorage.getItem(LS_EARNED_TOTAL_KEY)
    const parsed = raw ? Number(raw) : 0
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
  })

  const currentUtteranceRef = useRef<number>(0)

  // Выбираем файл вопросов в зависимости от режима
  const questionsJson = gameMode === 'newyear' ? questionsNewYearJson : questionsRegularJson
  const questionSets = useMemo(() => normalizeQuestionsByDifficulty(questionsJson), [questionsJson])
  const baseQuestions = questionSets[difficulty]
  
  // Выбираем ровно 15 случайных вопросов из доступных для разнообразия
  const [selectedQuestions, setSelectedQuestions] = useState<MillionaireQuestion[]>([])
  
  const questions = selectedQuestions.length > 0 ? selectedQuestions : []
  const total = 15

  const [gameState, setGameState] = useState<GameState>('intro')
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<AnswerKey | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [showCorrectMessage, setShowCorrectMessage] = useState(false)
  const [result, setResult] = useState<'win' | 'lose' | null>(null)
  const [points, setPoints] = useState(0)
  const [purchasesCount, setPurchasesCount] = useState(0)
  const [hiddenByQuestionId, setHiddenByQuestionId] = useState<Record<string, AnswerKey[]>>({})
  const [callOpen, setCallOpen] = useState(false)

  const current = questions[idx]
  const hiddenNow = hiddenByQuestionId[current?.id ?? ''] ?? []
  const visibleKeys = keyOrder().filter((k) => !hiddenNow.includes(k))
  const nextPurchaseCost = purchasesCount + 1
  const already5050ThisQuestion = Boolean(current?.id && hiddenByQuestionId[current.id]?.length)

  useEffect(() => {
    window.localStorage.setItem(LS_GAME_MODE_KEY, gameMode)
    // Сбрасываем игру при изменении режима
    if (gameState !== 'intro') {
      setGameState('intro')
      setIdx(0)
      setSelected(null)
      setConfirmed(false)
      setReveal(false)
      setShowCorrectMessage(false)
      setResult(null)
      setPoints(0)
      setPurchasesCount(0)
      setHiddenByQuestionId({})
      setCallOpen(false)
    }
  }, [gameMode])

  useEffect(() => {
    window.localStorage.setItem(LS_DIFFICULTY_KEY, difficulty)
  }, [difficulty])

  useEffect(() => {
    window.localStorage.setItem(LS_EARNED_TOTAL_KEY, String(earnedTotal))
  }, [earnedTotal])

  // Выбираем 15 случайных вопросов при изменении сложности или режима
  useEffect(() => {
    if (baseQuestions.length > 0) {
      const shuffled = shuffleArray(baseQuestions)
      // Выбираем ровно 15 вопросов (или все, если их меньше)
      const selected = shuffled.slice(0, Math.min(15, shuffled.length))
      setSelectedQuestions(selected)
    } else {
      setSelectedQuestions([])
    }
  }, [difficulty, baseQuestions, gameMode])

  // Загрузка голосов для синтеза речи
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [])

  const start = () => {
    // Выбираем 15 случайных вопросов перед началом новой игры
    if (baseQuestions.length > 0) {
      const shuffled = shuffleArray(baseQuestions)
      // Выбираем ровно 15 вопросов (или все, если их меньше)
      const selected = shuffled.slice(0, Math.min(15, shuffled.length))
      setSelectedQuestions(selected)
    }
    
    setGameState('playing')
    setIdx(0)
    setSelected(null)
    setConfirmed(false)
    setReveal(false)
    setShowCorrectMessage(false)
    setResult(null)
    setPoints(0)
    setPurchasesCount(0)
    setHiddenByQuestionId({})
    setCallOpen(false)
  }

  const restart = () => {
    // Выбираем 15 случайных вопросов перед новым прохождением
    if (baseQuestions.length > 0) {
      const shuffled = shuffleArray(baseQuestions)
      // Выбираем ровно 15 вопросов (или все, если их меньше)
      const selected = shuffled.slice(0, Math.min(15, shuffled.length))
      setSelectedQuestions(selected)
    }
    
    setGameState('intro')
    setIdx(0)
    setSelected(null)
    setConfirmed(false)
    setReveal(false)
    setShowCorrectMessage(false)
    setResult(null)
    setPoints(0)
    setPurchasesCount(0)
    setHiddenByQuestionId({})
    setCallOpen(false)
  }

  const choose = (k: AnswerKey) => {
    if (gameState !== 'playing') return
    if (reveal || confirmed) return
    setSelected(k)
  }

  const confirmAnswer = () => {
    if (gameState !== 'playing') return
    if (!selected || confirmed) return
    setConfirmed(true)
    setReveal(true)

    window.setTimeout(() => {
      const isCorrect = selected === current.correct
      if (!isCorrect) {
        setResult('lose')
        setGameState('finished')
        return
      }

      setShowCorrectMessage(true)
      const gained = idx + 1
      setPoints((p) => p + gained)
      setEarnedTotal((t) => t + gained)

      window.setTimeout(() => {
        const nextIdx = idx + 1
        if (nextIdx >= total) {
          setResult('win')
          setGameState('finished')
          return
        }

        setIdx(nextIdx)
        setSelected(null)
        setConfirmed(false)
        setReveal(false)
        setShowCorrectMessage(false)
      }, 2000)
    }, 900)
  }

  const buy5050 = () => {
    if (gameState !== 'playing') return
    if (reveal || confirmed) return
    if (points < nextPurchaseCost) return
    const q = current
    if (!q) return
    if (hiddenByQuestionId[q.id]?.length) return

    const wrong = keyOrder().filter((k) => k !== q.correct)
    const keepWrong = pickOne(wrong)
    const toHide = wrong.filter((k) => k !== keepWrong).slice(0, 2)

    setHiddenByQuestionId((prev) => ({ ...prev, [q.id]: toHide }))
    setPoints((p) => p - nextPurchaseCost)
    setPurchasesCount((c) => c + 1)
  }

  const buyCall = () => {
    if (gameState !== 'playing') return
    if (points < nextPurchaseCost) return
    setPoints((p) => p - nextPurchaseCost)
    setPurchasesCount((c) => c + 1)
    setCallOpen(true)
  }

  const closeCall = () => {
    stopSpeaking()
    setCallOpen(false)
  }

  const callLines = useMemo(() => {
    if (!current) return []
    const correctKey = current.correct
    const correctText = current.options[correctKey]
    const funnyNewYear = [
      'Секунду… я включу «режим умного лося».',
      'Я тут рядом с ёлкой, но мозги не замёрзли.',
      'Шуршу копытами по знаниям…',
      'Сейчас скажу уверенно… как будто я в викторине каждый день.',
      'У меня на рогах Wi‑Fi ловит лучше, чем у людей.'
    ]
    const funnyRegular = [
      'Секунду… я включу «режим умного лося».',
      'Я тут пасусь на знаниях, но мозги не заржавели.',
      'Шуршу копытами по информации…',
      'Сейчас скажу уверенно… как будто я в викторине каждый день.',
      'У меня на рогах Wi‑Fi ловит лучше, чем у людей.'
    ]
    const funny = gameMode === 'newyear' ? funnyNewYear : funnyRegular
    const filler = pickOne(funny) ?? funny[0]
    const greeting = gameMode === 'newyear' 
      ? 'Алло-алло! Лось на связи. Слышу вас отлично, даже лучше, чем снег под ногами.'
      : 'Алло-алло! Лось на связи. Слышу вас отлично, связь хорошая.'
    const location = gameMode === 'newyear' ? 'в Питере' : ''
    return [
      { who: 'Вы', text: 'Жора, привет! Нужна подсказка по вопросу.' },
      { who: 'Жора Лосев', text: greeting },
      { who: 'Жора Лосев', text: filler },
      {
        who: 'Жора Лосев',
        text: `Я бы ставил на вариант ${correctKey}: «${correctText}». Если что — скажем, что связь ${location} была с помехами.`
      },
      { who: 'Жора Лосев', text: 'Ладно, удачи! И не забывай: главное — не переживай, а пережёвывай.' }
    ]
  }, [current, gameMode])

  // Озвучка диалога Лося
  useEffect(() => {
    if (!callOpen || !callLines.length) return

    stopSpeaking()
    currentUtteranceRef.current += 1
    const currentId = currentUtteranceRef.current

    let messageIndex = 0
    const speakNextMessage = () => {
      if (!callOpen || currentId !== currentUtteranceRef.current) return

      while (messageIndex < callLines.length) {
        const message = callLines[messageIndex]
        messageIndex++
        if (message.who === 'Жора Лосев') {
          speakText(
            message.text,
            messageIndex < callLines.length ? speakNextMessage : undefined
          )
          return
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      speakNextMessage()
    }, 500)

    return () => {
      window.clearTimeout(timeoutId)
      if (currentId === currentUtteranceRef.current) {
        stopSpeaking()
      }
    }
  }, [callOpen, callLines])

  const answerClass = (k: AnswerKey) => {
    if (!reveal) return selected === k ? 'answerBtn selected' : 'answerBtn'
    if (k === current.correct) return 'answerBtn correct'
    if (selected === k && !showCorrectMessage) return 'answerBtn wrong'
    return 'answerBtn'
  }

  const difficultyLabel: Record<Difficulty, string> = {
    easy: 'Лёгкий',
    medium: 'Средний',
    hard: 'Сложный'
  }

  const resetEarned = () => {
    setEarnedTotal(0)
  }

  return (
    <div className="app">
      {/* Новогодние декорации только для новогоднего режима */}
      {gameMode === 'newyear' && (
        <>
          <div className="treeLeft" aria-hidden="true">
            <div className="treeLayer treeLayer1" />
            <div className="treeLayer treeLayer2" />
            <div className="treeLayer treeLayer3" />
            <div className="treeLayer treeLayer4" />
            <div className="treeLayer treeLayer5" />
            <div className="treeLayer treeLayer6" />
            <div className="treeStar" />
            <div className="treeTinsel" />
            <div className="treeGarland">
              <span className="treeBulb tb1" />
              <span className="treeBulb tb2" />
              <span className="treeBulb tb3" />
              <span className="treeBulb tb4" />
              <span className="treeBulb tb5" />
              <span className="treeBulb tb6" />
            </div>
          </div>
          <div className="treeRight" aria-hidden="true">
            <div className="treeLayer treeLayer1" />
            <div className="treeLayer treeLayer2" />
            <div className="treeLayer treeLayer3" />
            <div className="treeLayer treeLayer4" />
            <div className="treeLayer treeLayer5" />
            <div className="treeLayer treeLayer6" />
            <div className="treeStar" />
            <div className="treeTinsel" />
            <div className="treeGarland">
              <span className="treeBulb tb1" />
              <span className="treeBulb tb2" />
              <span className="treeBulb tb3" />
              <span className="treeBulb tb4" />
              <span className="treeBulb tb5" />
              <span className="treeBulb tb6" />
            </div>
          </div>
        </>
      )}
      <div className="shell">
        <section className="panel left">
          <div className="festiveHeader">
            {gameMode === 'newyear' && (
              <div className="garland" aria-hidden="true">
                <span className="bulb b1" />
                <span className="bulb b2" />
                <span className="bulb b3" />
                <span className="bulb b4" />
                <span className="bulb b5" />
                <span className="bulb b6" />
                <span className="bulb b7" />
              </div>
            )}
            <div className="headerRow">
              <div>
                <h1 className="title">Кто хочет стать миллионером</h1>
                <p className="subtitle">
                  {gameMode === 'newyear' ? 'Новогодний выпуск про Санкт-Петербург' : 'Классический выпуск'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="themeToggle" onClick={onBack} title="Вернуться в меню">
                  ← Меню
                </button>
              </div>
            </div>
          </div>

          {questions.length === 0 || baseQuestions.length === 0 ? (
            <div className="finishBox">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Нет вопросов</div>
              <div className="muted">
                Проверь файл <code>src/data/{gameMode === 'newyear' ? 'questions.json' : 'questionsRegular.json'}</code>.
                {baseQuestions.length > 0 && baseQuestions.length < 15 && (
                  <div style={{ marginTop: 8 }}>
                    Доступно только {baseQuestions.length} вопросов. Нужно минимум 15.
                  </div>
                )}
              </div>
            </div>
          ) : gameState === 'intro' ? (
            <>
              <div className="finishBox">
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Правила</div>
                <div className="muted">
                  15 вопросов, по 4 варианта ответа. Нажал — ответ фиксируется, правильный
                  подсвечивается. За каждый пройденный вопрос начисляются очки: за вопрос №k
                  получаешь k очков. Очки можно тратить на подсказки.
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Режим игры</div>
                  <div className="muted" style={{ marginBottom: 10 }}>
                    Выберите режим игры перед выбором сложности.
                  </div>
                  <div className="lifelines" style={{ gap: 10, marginBottom: 16 }}>
                    <button
                      className={gameMode === 'newyear' ? 'lifelineBtn selected' : 'lifelineBtn'}
                      onClick={() => setGameMode('newyear')}
                      title="Новогодний режим"
                    >
                      🎄 Новогодний
                    </button>
                    <button
                      className={gameMode === 'regular' ? 'lifelineBtn selected' : 'lifelineBtn'}
                      onClick={() => setGameMode('regular')}
                      title="Обычный режим"
                    >
                      📚 Обычный
                    </button>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Сложность</div>
                  <div className="muted" style={{ marginBottom: 10 }}>
                    Выберите набор вопросов перед стартом.
                  </div>
                  <div className="lifelines" style={{ gap: 10 }}>
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        className={difficulty === d ? 'lifelineBtn selected' : 'lifelineBtn'}
                        onClick={() => setDifficulty(d)}
                        title={`Выбрать сложность: ${difficultyLabel[d]}`}
                      >
                        {difficultyLabel[d]}
                      </button>
                    ))}
                  </div>
                  <div className="muted" style={{ marginTop: 10 }}>
                    Заработано всего: <b>{earnedTotal}</b> очк.
                    <button
                      className="themeToggle"
                      style={{ marginLeft: 10 }}
                      onClick={resetEarned}
                      title="Сбросить сохранённые заработанные очки"
                    >
                      Сбросить
                    </button>
                  </div>
                </div>
              </div>
              <div className="footerRow">
                <span className="muted">
                  Сложность: <b>{difficultyLabel[difficulty]}</b> · Вопросов: {total}
                </span>
                <button className="primaryBtn" onClick={start}>
                  Начать игру
                </button>
              </div>
            </>
          ) : gameState === 'playing' ? (
            <>
              <div className="metaRow">
                <span className="badge">
                  Вопрос <b>{idx + 1}</b> / {total}
                </span>
                <span className="badge">
                  Очки: <b>{points}</b>
                </span>
                <span className="badge">
                  Заработано всего: <b>{earnedTotal}</b>
                </span>
              </div>

              <div className="lifelinesRow">
                <div className="lifelines">
                  <button
                    className="lifelineBtn"
                    onClick={buy5050}
                    disabled={reveal || confirmed || points < nextPurchaseCost || already5050ThisQuestion}
                    title="Убрать два неправильных варианта"
                  >
                    50/50 · {nextPurchaseCost} очк.
                  </button>
                  <button
                    className="lifelineBtn"
                    onClick={buyCall}
                    disabled={points < nextPurchaseCost}
                    title="Звонок Жоре Лосеву"
                  >
                    Звонок · {nextPurchaseCost} очк.
                  </button>
                </div>
                <span className="muted">
                  Следующая покупка: {nextPurchaseCost} очк.
                </span>
              </div>

              <div className="question">
                {current.question}
                <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                  Автор: <b>{current.author.name}</b>, г. {current.author.city}
                </div>
              </div>

              {showCorrectMessage ? (
                <div className="finishBox" style={{ marginTop: 20, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 24, color: 'var(--color-success, #4caf50)' }}>
                    ✓ Ответ верный!
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    +{idx + 1} очк.
                  </div>
                </div>
              ) : (
                <>
                  <div className="answers">
                    {visibleKeys.map((k) => (
                      <button
                        key={k}
                        className={answerClass(k)}
                        onClick={() => choose(k)}
                        disabled={reveal || confirmed}
                      >
                        {reveal && k === current.correct && (
                          <>
                            <span className="spark spark1" />
                            <span className="spark spark2" />
                            <span className="spark spark3" />
                            <span className="spark spark4" />
                            <span className="spark spark5" />
                            <span className="spark spark6" />
                          </>
                        )}
                        <span className="key">{k}</span>
                        {current.options[k]}
                      </button>
                    ))}
                  </div>

                  <div className="footerRow">
                    {selected && !confirmed ? (
                      <>
                        <span className="muted">Выбран вариант <b>{selected}</b></span>
                        <button className="primaryBtn" onClick={confirmAnswer}>
                          Подтвердить ответ
                        </button>
                      </>
                    ) : reveal ? (
                      <>
                        <span className="muted">{showCorrectMessage ? 'Переход к следующему вопросу…' : 'Проверяем ответ…'}</span>
                        <span className="muted">За правильный ответ: +{idx + 1} очк.</span>
                      </>
                    ) : (
                      <>
                        <span className="muted">Выберите вариант</span>
                        <span className="muted">За правильный ответ: +{idx + 1} очк.</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="finishBox">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {result === 'win' ? 'Победа!' : 'Неправильный ответ'}
              </div>
              {result === 'win' ? (
                <>
                  <div className="muted" style={{ marginBottom: 10 }}>
                    Ваш результат: <b>{points}</b> очк.
                  </div>
                  <div className="fireworks" aria-hidden="true">
                    <span className="fw fw1" />
                    <span className="fw fw2" />
                    <span className="fw fw3" />
                  </div>
                </>
              ) : (
                <>
                  <div className="muted" style={{ marginBottom: 10 }}>
                    Попробуй еще.
                  </div>
                  {gameMode === 'newyear' && (
                    <img className="snowman" src={snowman} alt="Снеговик" />
                  )}
                </>
              )}
              <button className="primaryBtn" onClick={restart}>
                Сыграть ещё раз
              </button>
            </div>
          )}
        </section>

        <aside className="panel right">
          <div className="ladderTitle">Прогресс</div>
          <ol className="ladder">
            {Array.from({ length: total }, (_, i) => i + 1)
              .map((n) => ({ n, i: n - 1 }))
              .reverse()
              .map(({ n, i }) => {
                const active = gameState === 'playing' && i === idx
                const passed = i < idx
                const cls = ['step', active ? 'stepActive' : '', passed ? 'stepPassed' : '']
                  .filter(Boolean)
                  .join(' ')
                return (
                  <li key={n} className={cls}>
                    <span>
                      Вопрос {n}
                    </span>
                    {active ? <span>+{n} очк.</span> : passed ? <span>✓</span> : <span />}
                  </li>
                )
              })}
          </ol>
        </aside>
      </div>

      {callOpen ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalHeader">
              <div className="modalTitle">Звонок Жоре Лосеву</div>
              <button className="modalClose" onClick={closeCall} aria-label="Закрыть">
                ✕
              </button>
            </div>

            <div className="callBody">
              <img className="avatar" src={losevMoose} alt="Аватарка Лося (Жора Лосев)" />
              <div className="chat">
                {callLines.map((m, i) => (
                  <div key={i} className="msg">
                    <div className="who">{m.who}</div>
                    <div className="text">{m.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modalFooter">
              <button className="primaryBtn" onClick={closeCall}>
                Понял, спасибо, Жора!
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MillionaireGame

