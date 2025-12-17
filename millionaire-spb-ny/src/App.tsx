import { useMemo, useState } from 'react'
import './App.css'
import type { AnswerKey, MillionaireQuestion } from './types'
import questionsJson from './data/questions.json'
import losevMoose from './assets/losev-moose.svg'
import snowman from './assets/snowman.svg'

type GameState = 'intro' | 'playing' | 'finished'

function normalizeQuestions(input: unknown): MillionaireQuestion[] {
  if (!Array.isArray(input)) return []
  return input.filter(Boolean) as MillionaireQuestion[]
}

function keyOrder(): AnswerKey[] {
  return ['A', 'B', 'C', 'D']
}

function pickOne<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)] ?? null
}

function App() {
  const questions = useMemo(() => normalizeQuestions(questionsJson), [])
  const total = Math.min(15, questions.length)

  const [gameState, setGameState] = useState<GameState>('intro')
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<AnswerKey | null>(null)
  const [reveal, setReveal] = useState(false)
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

  const start = () => {
    setGameState('playing')
    setIdx(0)
    setSelected(null)
    setReveal(false)
    setResult(null)
    setPoints(0)
    setPurchasesCount(0)
    setHiddenByQuestionId({})
    setCallOpen(false)
  }

  const restart = () => {
    setGameState('intro')
    setIdx(0)
    setSelected(null)
    setReveal(false)
    setResult(null)
    setPoints(0)
    setPurchasesCount(0)
    setHiddenByQuestionId({})
    setCallOpen(false)
  }

  const choose = (k: AnswerKey) => {
    if (gameState !== 'playing') return
    if (reveal) return
    setSelected(k)
    setReveal(true)

    window.setTimeout(() => {
      const isCorrect = k === current.correct
      if (!isCorrect) {
        setResult('lose')
        setGameState('finished')
        return
      }

      setPoints((p) => p + (idx + 1))

      const nextIdx = idx + 1
      if (nextIdx >= total) {
        setResult('win')
        setGameState('finished')
        return
      }

      setIdx(nextIdx)
      setSelected(null)
      setReveal(false)
    }, 900)
  }

  const buy5050 = () => {
    if (gameState !== 'playing') return
    if (reveal) return
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

  const closeCall = () => setCallOpen(false)

  const callLines = useMemo(() => {
    if (!current) return []
    const correctKey = current.correct
    const correctText = current.options[correctKey]
    const funny = [
      'Секунду… я включу «режим умного лося».',
      'Я тут рядом с ёлкой, но мозги не замёрзли.',
      'Шуршу копытами по знаниям…',
      'Сейчас скажу уверенно… как будто я в викторине каждый день.',
      'У меня на рогах Wi‑Fi ловит лучше, чем у людей.'
    ]
    const filler = pickOne(funny) ?? funny[0]
    return [
      { who: 'Вы', text: 'Жора, привет! Нужна подсказка по вопросу.' },
      { who: 'Жора Лосев', text: 'Алло-алло! Лось на связи. Слышу вас отлично, даже лучше, чем снег под ногами.' },
      { who: 'Жора Лосев', text: filler },
      {
        who: 'Жора Лосев',
        text: `Я бы ставил на вариант ${correctKey}: «${correctText}». Если что — скажем, что связь в Питере была с помехами.`
      },
      { who: 'Жора Лосев', text: 'Ладно, удачи! И не забывай: главное — не переживай, а пережёвывай.' }
    ]
  }, [current])

  const answerClass = (k: AnswerKey) => {
    if (!reveal) return selected === k ? 'answerBtn selected' : 'answerBtn'
    if (k === current.correct) return 'answerBtn correct'
    if (selected === k) return 'answerBtn wrong'
    return 'answerBtn'
  }

  return (
    <div className="app">
      <div className="shell">
        <section className="panel left">
          <div className="festiveHeader">
            <div className="garland" aria-hidden="true">
              <span className="bulb b1" />
              <span className="bulb b2" />
              <span className="bulb b3" />
              <span className="bulb b4" />
              <span className="bulb b5" />
              <span className="bulb b6" />
              <span className="bulb b7" />
            </div>
            <h1 className="title">Кто хочет стать миллионером</h1>
            <p className="subtitle">Новогодний выпуск про Санкт-Петербург</p>
          </div>

          {questions.length === 0 ? (
            <div className="finishBox">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Нет вопросов</div>
              <div className="muted">
                Проверь файл <code>src/data/questions.json</code>.
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
              </div>
              <div className="footerRow">
                <span className="muted">
                  Вопросов: {total} / {questions.length}
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
              </div>

              <div className="lifelinesRow">
                <div className="lifelines">
                  <button
                    className="lifelineBtn"
                    onClick={buy5050}
                    disabled={reveal || points < nextPurchaseCost || already5050ThisQuestion}
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

              <div className="question">{current.question}</div>

              <div className="answers">
                {visibleKeys.map((k) => (
                  <button
                    key={k}
                    className={answerClass(k)}
                    onClick={() => choose(k)}
                    disabled={reveal}
                  >
                    <span className="key">{k}</span>
                    {current.options[k]}
                  </button>
                ))}
              </div>

              <div className="footerRow">
                <span className="muted">{reveal ? 'Проверяем ответ…' : 'Выберите вариант'}</span>
                <span className="muted">За правильный ответ: +{idx + 1} очк.</span>
              </div>
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
                  <img className="snowman" src={snowman} alt="Снеговик" />
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

export default App
