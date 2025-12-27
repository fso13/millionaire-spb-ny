import { useEffect, useState } from 'react'
import './App.css'
import type { YourGameQuestion, Difficulty, YourGameData } from './types'
import yourGameQuestionsJson from './data/yourGameQuestions.json'
import yourGameQuestionsRegularJson from './data/yourGameQuestionsRegular.json'
import yourGameQuestionsITJson from './data/yourGameQuestionsIT.json'

type QuestionState = 'hidden' | 'open' | 'answered'
type GameState = 'selectEdition' | 'selectDifficulty' | 'selectThemes' | 'playing' | 'finished'
type Edition = 'newyear' | 'regular' | 'it'

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
  const [edition, setEdition] = useState<Edition | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [gameState, setGameState] = useState<GameState>('selectEdition')
  const [selectedThemeIds, setSelectedThemeIds] = useState<Set<string>>(new Set())
  
  const gameData = (edition === 'newyear' 
    ? yourGameQuestionsJson 
    : edition === 'regular' 
    ? yourGameQuestionsRegularJson 
    : edition === 'it'
    ? yourGameQuestionsITJson
    : null) as YourGameData | null
  
  const baseThemes = gameData?.[difficulty]?.themes ?? []
  
  // Сохраняем замененные темы для regular edition
  const [themes, setThemes] = useState(baseThemes)
  
  // Обновляем themes при изменении baseThemes (когда меняется difficulty или edition)
  useEffect(() => {
    if (gameState !== 'playing') {
      setThemes(baseThemes)
    }
  }, [baseThemes, gameState])
  
  // Создаем сетку вопросов
  const [grid, setGrid] = useState<CellState[][]>([])

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [totalPoints, setTotalPoints] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<Set<string>>(new Set())

  // Пересоздаем сетку при изменении сложности или при старте игры
  useEffect(() => {
    if (gameState === 'playing' && gameData && gameData[difficulty]?.themes) {
      let currentThemes = [...baseThemes]
      if (currentThemes.length === 0) {
        console.warn('No themes found for difficulty:', difficulty)
        return
      }
      
      // Используем выбранные темы пользователем
      if (selectedThemeIds.size > 0) {
        currentThemes = baseThemes.filter(theme => selectedThemeIds.has(theme.id))
        if (currentThemes.length !== 6) {
          console.warn('Expected 6 themes, got:', currentThemes.length)
        }
      } else {
        // Fallback: если темы не выбраны, используем первые 6
        currentThemes = baseThemes.slice(0, 6)
      }
      
      // Сохраняем выбранные темы
      setThemes(currentThemes)
      
      // Для каждой темы выбираем по 5 вопросов (по одному на каждую стоимость: 100, 200, 300, 400, 500)
      const initialGrid = currentThemes.map((theme) => {
        const pointValues: (100 | 200 | 300 | 400 | 500)[] = [100, 200, 300, 400, 500]
        const selectedQuestions: CellState[] = []
        
        pointValues.forEach((points) => {
          // Находим все вопросы с данной стоимостью
          const questionsWithPoints = theme.questions.filter(q => q.points === points)
          
          if (questionsWithPoints.length > 0) {
            // Случайно выбираем один вопрос из этой группы
            const randomQuestion = questionsWithPoints[Math.floor(Math.random() * questionsWithPoints.length)]
            selectedQuestions.push({
              themeId: theme.id,
              questionId: randomQuestion.id,
              points: randomQuestion.points,
              state: 'hidden' as QuestionState,
              isCatInBag: randomQuestion.isCatInBag ?? false,
              originalThemeId: randomQuestion.originalThemeId
            })
          }
        })
        
        return selectedQuestions
      })

      const newGrid = initialGrid.map((row) => {
        return row.map((cell) => {
          if (Math.random() < 0.1 && !cell.isCatInBag) {
            const otherThemes = currentThemes.filter((t) => t.id !== cell.themeId)
            if (otherThemes.length > 0) {
              const randomTheme = otherThemes[Math.floor(Math.random() * otherThemes.length)]
              // Находим вопрос с той же стоимостью из другой темы
              const questionsWithSamePoints = randomTheme.questions.filter(q => q.points === cell.points)
              
              if (questionsWithSamePoints.length > 0) {
                const randomQuestion = questionsWithSamePoints[Math.floor(Math.random() * questionsWithSamePoints.length)]
                
                return {
                  ...cell,
                  isCatInBag: true,
                  originalThemeId: randomTheme.id,
                  questionId: randomQuestion.id
                }
              }
            }
          }
          return cell
        })
      })
      console.log('Grid created with', newGrid.length, 'rows')
      setGrid(newGrid)
      setTotalPoints(0)
      setSelectedCell(null)
      setShowAnswer(false)
      setWrongAnswers(new Set())
    } else if (gameState !== 'playing' && gameState !== 'selectDifficulty' && gameState !== 'selectEdition' && gameState !== 'selectThemes') {
      // Очищаем сетку только когда игра точно не активна (finished)
      setGrid([])
      setThemes(baseThemes)
    }
  }, [difficulty, gameState, gameData, edition, baseThemes, selectedThemeIds])


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


  const restartGame = () => {
    setGameState('selectEdition')
    setEdition(null)
    setSelectedThemeIds(new Set())
    setTotalPoints(0)
    setSelectedCell(null)
    setShowAnswer(false)
    setWrongAnswers(new Set())
  }

  const selectEditionAndContinue = (ed: Edition) => {
    setEdition(ed)
    setGameState('selectDifficulty')
  }

  const startGame = () => {
    if (!gameData) {
      console.warn('gameData is null, cannot start game. Edition:', edition)
      return
    }
    if (!gameData[difficulty]?.themes || gameData[difficulty].themes.length === 0) {
      console.warn('No themes found for difficulty:', difficulty, 'Edition:', edition)
      return
    }
    console.log('Starting game with', gameData[difficulty].themes.length, 'themes')
    setGameState('selectThemes')
    setTotalPoints(0)
    setSelectedCell(null)
    setShowAnswer(false)
    setWrongAnswers(new Set())
  }

  const toggleThemeSelection = (themeId: string) => {
    setSelectedThemeIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(themeId)) {
        newSet.delete(themeId)
      } else {
        if (newSet.size < 6) {
          newSet.add(themeId)
        }
      }
      return newSet
    })
  }

  const confirmThemeSelection = () => {
    if (selectedThemeIds.size !== 6) {
      return
    }
    setGameState('playing')
  }

  // Функции обработчики событий определены выше

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

      {gameState === 'selectEdition' ? (
        <div className="finishBox">
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 20 }}>Выберите выпуск</div>
          <div className="muted" style={{ marginBottom: 16 }}>
            Выберите выпуск игры перед началом.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="primaryBtn"
              onClick={() => selectEditionAndContinue('newyear')}
              style={{ padding: '16px 20px', fontSize: 18, textAlign: 'left' }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Новогодний выпуск</div>
              <div className="muted" style={{ fontSize: 14 }}>
                Вопросы про Новый год, Санкт-Петербург, географию, музыку, историю и культуру
              </div>
            </button>
            <button
              className="primaryBtn"
              onClick={() => selectEditionAndContinue('regular')}
              style={{ padding: '16px 20px', fontSize: 18, textAlign: 'left' }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Обычный выпуск</div>
              <div className="muted" style={{ fontSize: 14 }}>
                Вопросы про науку, литературу, кино, спорт, технологии и природу
              </div>
            </button>
            <button
              className="primaryBtn"
              onClick={() => selectEditionAndContinue('it')}
              style={{ padding: '16px 20px', fontSize: 18, textAlign: 'left' }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>IT/Программирование</div>
              <div className="muted" style={{ fontSize: 14 }}>
                Вопросы про языки программирования, алгоритмы, базы данных, веб-разработку, ОС и сети
              </div>
            </button>
          </div>
        </div>
      ) : gameState === 'selectDifficulty' ? (
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
              Продолжить
            </button>
          </div>
        </div>
      ) : gameState === 'selectThemes' ? (
        <div className="finishBox">
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 20 }}>Выберите 6 тем</div>
          <div className="muted" style={{ marginBottom: 16 }}>
            Выберите 6 тем для игры. Выбрано: {selectedThemeIds.size} из 6
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {baseThemes.map((theme) => {
              const isSelected = selectedThemeIds.has(theme.id)
              return (
                <button
                  key={theme.id}
                  className={isSelected ? 'lifelineBtn selected' : 'lifelineBtn'}
                  onClick={() => toggleThemeSelection(theme.id)}
                  disabled={!isSelected && selectedThemeIds.size >= 6}
                  style={{ padding: '12px 16px', textAlign: 'center' }}
                >
                  {theme.name}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 20 }}>
            <button 
              className="primaryBtn" 
              onClick={confirmThemeSelection} 
              style={{ width: '100%' }}
              disabled={selectedThemeIds.size !== 6}
            >
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
      ) : gameState === 'playing' && grid.length > 0 && themes.length > 0 ? (
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
              {grid[rowIndex]?.map((cell, colIndex) => {
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
      ) : gameState === 'playing' ? (
        <div className="finishBox">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Загрузка игры...</div>
          <div className="muted">Подготовка вопросов...</div>
        </div>
      ) : null}
    </div>
  )
}

export default YourGame

