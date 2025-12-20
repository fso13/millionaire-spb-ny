import { useEffect, useState } from 'react'
import './App.css'
import type { YourGameQuestion, Difficulty, YourGameData } from './types'
import yourGameQuestionsJson from './data/yourGameQuestions.json'

type QuestionState = 'hidden' | 'open' | 'answered'
type GameState = 'selectDifficulty' | 'playing' | 'finished'

type CellState = {
  themeId: string
  questionId: string
  points: number
  state: QuestionState
  isCatInBag: boolean
  originalThemeId?: string
}

function playMeow() {
  // Воспроизводим звук мяуканья из файла
  const audio = new Audio('/si2_cat.mp3')
  audio.volume = 0.7
  audio.play().catch((e) => {
    console.warn('Не удалось воспроизвести звук кота:', e)
  })
}

function YourGame() {
  const gameData = yourGameQuestionsJson as YourGameData
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [gameState, setGameState] = useState<GameState>('selectDifficulty')
  
  const themes = gameData[difficulty].themes
  
  // Создаем сетку вопросов
  const [grid, setGrid] = useState<CellState[][]>(() => {
    const initialGrid = themes.map((theme) => {
      return theme.questions.map((q) => ({
        themeId: theme.id,
        questionId: q.id,
        points: q.points,
        state: 'hidden' as QuestionState,
        isCatInBag: q.isCatInBag ?? false,
        originalThemeId: q.originalThemeId
      }))
    })

    // Добавляем случайные "Коты в мешке" при инициализации
    return initialGrid.map((row) => {
      return row.map((cell, colIndex) => {
        // 10% шанс быть "Котом в мешке" (примерно 3 из 30)
        if (Math.random() < 0.1 && !cell.isCatInBag) {
          // Выбираем случайную другую тему
          const otherThemes = themes.filter((t) => t.id !== cell.themeId)
          const randomTheme = otherThemes[Math.floor(Math.random() * otherThemes.length)]
          const randomQuestion = randomTheme.questions[colIndex]
          
          return {
            ...cell,
            isCatInBag: true,
            originalThemeId: randomTheme.id,
            questionId: randomQuestion.id
          }
        }
        return cell
      })
    })
  })

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [totalPoints, setTotalPoints] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<Set<string>>(new Set())

  // Пересоздаем сетку при изменении сложности
  useEffect(() => {
    if (gameState === 'playing') {
      const currentThemes = gameData[difficulty].themes
      const initialGrid = currentThemes.map((theme) => {
        return theme.questions.map((q) => ({
          themeId: theme.id,
          questionId: q.id,
          points: q.points,
          state: 'hidden' as QuestionState,
          isCatInBag: q.isCatInBag ?? false,
          originalThemeId: q.originalThemeId
        }))
      })

      const newGrid = initialGrid.map((row) => {
        return row.map((cell, colIndex) => {
          if (Math.random() < 0.1 && !cell.isCatInBag) {
            const otherThemes = currentThemes.filter((t) => t.id !== cell.themeId)
            const randomTheme = otherThemes[Math.floor(Math.random() * otherThemes.length)]
            const randomQuestion = randomTheme.questions[colIndex]
            
            return {
              ...cell,
              isCatInBag: true,
              originalThemeId: randomTheme.id,
              questionId: randomQuestion.id
            }
          }
          return cell
        })
      })
      setGrid(newGrid)
      setTotalPoints(0)
      setSelectedCell(null)
      setShowAnswer(false)
      setWrongAnswers(new Set())
    }
  }, [difficulty, gameState, gameData])


  const handleCellClick = (row: number, col: number) => {
    if (selectedCell || gameState === 'finished') return
    
    const cell = grid[row][col]
    if (cell.state !== 'hidden') return

    // Если это "Кот в мешке", проигрываем мяуканье
    if (cell.isCatInBag) {
      playMeow()
    }

    // Открываем вопрос
    const newGrid = [...grid]
    newGrid[row][col] = { ...cell, state: 'open' }
    setGrid(newGrid)
    setSelectedCell({ row, col })
    setShowAnswer(false)
  }

  const handleShowAnswer = () => {
    if (!selectedCell) return
    setShowAnswer(true)
  }

  const handleAnswerCorrect = () => {
    if (!selectedCell) return
    
    const cell = grid[selectedCell.row][selectedCell.col]
    const newGrid = [...grid]
    newGrid[selectedCell.row][selectedCell.col] = { ...cell, state: 'answered' }
    setGrid(newGrid)
    setTotalPoints((p) => p + cell.points)
    setSelectedCell(null)
    setShowAnswer(false)

    // Проверяем, закончена ли игра
    const allAnswered = newGrid.every((row) => row.every((cell) => cell.state === 'answered'))
    if (allAnswered) {
      setGameState('finished')
    }
  }

  const handleAnswerWrong = () => {
    if (!selectedCell) return
    
    const cell = grid[selectedCell.row][selectedCell.col]
    const newGrid = [...grid]
    newGrid[selectedCell.row][selectedCell.col] = { ...cell, state: 'answered' }
    setGrid(newGrid)
    
    // Вычитаем очки за неправильный ответ (можно уходить в минус)
    setTotalPoints((p) => p - cell.points)
    
    // Отмечаем этот вопрос как неправильно отвеченный
    const questionKey = `${selectedCell.row}-${selectedCell.col}`
    setWrongAnswers((prev) => new Set(prev).add(questionKey))
    
    setSelectedCell(null)
    setShowAnswer(false)

    // Проверяем, закончена ли игра
    const allAnswered = newGrid.every((row) => row.every((cell) => cell.state === 'answered'))
    if (allAnswered) {
      setGameState('finished')
    }
  }

  const startGame = () => {
    setGameState('playing')
    setTotalPoints(0)
    setSelectedCell(null)
    setShowAnswer(false)
    setWrongAnswers(new Set())
  }

  const restartGame = () => {
    setGameState('selectDifficulty')
    setTotalPoints(0)
    setSelectedCell(null)
    setShowAnswer(false)
    setWrongAnswers(new Set())
  }

  const getCurrentQuestion = (): YourGameQuestion | null => {
    if (!selectedCell) return null
    
    const cell = grid[selectedCell.row][selectedCell.col]
    const theme = themes.find((t) => t.id === (cell.isCatInBag ? cell.originalThemeId : cell.themeId))
    if (!theme) return null
    
    return theme.questions.find((q) => q.id === cell.questionId) || null
  }

  const currentQuestion = getCurrentQuestion()

  return (
    <div className="yourGameContainer">
      <div className="yourGameHeader">
        <h1 className="title">Твоя игра</h1>
        <div className="yourGameStats">
          <span className="badge">Очки: <b>{totalPoints}</b></span>
        </div>
      </div>

      {gameState === 'selectDifficulty' ? (
        <div className="finishBox">
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 20 }}>Выберите сложность</div>
          <div className="muted" style={{ marginBottom: 16 }}>
            Выберите уровень сложности вопросов перед началом игры.
          </div>
          <div className="lifelines" style={{ gap: 10 }}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const labels: Record<Difficulty, string> = {
                easy: 'Лёгкий',
                medium: 'Средний',
                hard: 'Сложный'
              }
              return (
                <button
                  key={d}
                  className={difficulty === d ? 'lifelineBtn selected' : 'lifelineBtn'}
                  onClick={() => setDifficulty(d)}
                  title={`Выбрать сложность: ${labels[d]}`}
                >
                  {labels[d]}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="primaryBtn" onClick={startGame} style={{ width: '100%' }}>
              Начать игру
            </button>
          </div>
        </div>
      ) : gameState === 'finished' ? (
        <div className="finishBox">
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 24 }}>
            Игра завершена!
          </div>
          <div className="muted" style={{ marginBottom: 10 }}>
            Ваш результат: <b>{totalPoints}</b> очков
          </div>
          <div className="fireworks" aria-hidden="true">
            <span className="fw fw1" />
            <span className="fw fw2" />
            <span className="fw fw3" />
          </div>
          <button className="primaryBtn" onClick={restartGame} style={{ marginTop: 16 }}>
            Сыграть ещё раз
          </button>
        </div>
      ) : selectedCell && currentQuestion ? (
        <div className="questionModal">
          <div className={`questionBox ${wrongAnswers.has(`${selectedCell.row}-${selectedCell.col}`) ? 'wrongAnswer' : ''}`}>
            <div className="questionHeader">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="badge">
                  {grid[selectedCell.row][selectedCell.col].isCatInBag ? '🐱 Кот в мешке' : themes[selectedCell.row].name}
                </span>
                <span className="badge">{currentQuestion.points} очков</span>
              </div>
              <button
                className="themeToggle"
                onClick={() => {
                  setSelectedCell(null)
                  setShowAnswer(false)
                }}
                title="Закрыть вопрос"
              >
                ✕
              </button>
            </div>
            <div className="question">
              {currentQuestion.question}
            </div>
            {showAnswer ? (
              <div className="answerBox">
                <div className="answerLabel">Ответ:</div>
                <div className="answerText">{currentQuestion.answer}</div>
                <div className="answerButtons">
                  <button className="primaryBtn" onClick={handleAnswerCorrect} style={{ background: 'rgba(94, 242, 160, 0.2)', borderColor: 'rgba(94, 242, 160, 0.5)' }}>
                    Правильно
                  </button>
                  <button className="primaryBtn" onClick={handleAnswerWrong} style={{ background: 'rgba(255, 92, 92, 0.2)', borderColor: 'rgba(255, 92, 92, 0.5)' }}>
                    Неправильно
                  </button>
                </div>
              </div>
            ) : (
              <button className="primaryBtn" onClick={handleShowAnswer} style={{ marginTop: 16 }}>
                Показать ответ
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="yourGameGrid">
          <div className="gridHeader">
            <div className="gridHeaderCell"></div>
            {[100, 200, 300, 400, 500].map((points) => (
              <div key={points} className="gridHeaderCell">
                {points}
              </div>
            ))}
          </div>
          {themes.map((theme, rowIndex) => (
            <div key={theme.id} className="gridRow">
              <div className="gridThemeCell">{theme.name}</div>
              {grid[rowIndex].map((cell, colIndex) => {
                const questionKey = `${rowIndex}-${colIndex}`
                const isWrong = wrongAnswers.has(questionKey)
                const cellClass = `gridCell ${cell.state === 'answered' ? 'answered' : cell.state === 'open' ? 'open' : ''} ${isWrong ? 'wrongAnswer' : ''}`
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={cellClass}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={cell.state !== 'hidden'}
                  >
                    {cell.state === 'hidden' ? (
                      cell.points
                    ) : cell.state === 'answered' ? (
                      '✓'
                    ) : (
                      ''
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default YourGame

