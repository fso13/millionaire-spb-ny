import { useEffect, useState } from 'react'
import './App.css'
import MillionaireGame from './MillionaireGame'
import YourGame from './YourGame'

type Theme = 'dark' | 'light'
type GameMode = 'menu' | 'millionaire' | 'yourgame'

const LS_THEME_KEY = 'theme'

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem(LS_THEME_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'dark'
  })

  const [gameMode, setGameMode] = useState<GameMode>('menu')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(LS_THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  if (gameMode === 'millionaire') {
    return <MillionaireGame theme={theme} onBack={() => setGameMode('menu')} />
  }

  if (gameMode === 'yourgame') {
    return (
      <div className="app">
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
              <div className="headerRow">
                <div>
                  <h1 className="title">Твоя игра</h1>
                  <p className="subtitle">Новогодний выпуск</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="themeToggle" onClick={toggleTheme} title="Переключить тему">
                    {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                  </button>
                  <button className="themeToggle" onClick={() => setGameMode('menu')} title="Вернуться в меню">
                    ← Меню
                  </button>
                </div>
              </div>
            </div>
            <YourGame />
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
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
            <div className="headerRow">
              <div>
                <h1 className="title">Новогодние игры</h1>
                <p className="subtitle">Выберите игру</p>
              </div>
              <button className="themeToggle" onClick={toggleTheme} title="Переключить тему">
                {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              </button>
            </div>
          </div>

          <div className="finishBox" style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 20 }}>Выберите игру</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="primaryBtn"
                onClick={() => setGameMode('millionaire')}
                style={{ padding: '16px 20px', fontSize: 18, textAlign: 'left' }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Кто хочет стать миллионером</div>
                <div className="muted" style={{ fontSize: 14 }}>
                  15 вопросов с вариантами ответов. Зарабатывайте очки и используйте подсказки!
                </div>
              </button>
              <button
                className="primaryBtn"
                onClick={() => setGameMode('yourgame')}
                style={{ padding: '16px 20px', fontSize: 18, textAlign: 'left' }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Твоя игра</div>
                <div className="muted" style={{ fontSize: 14 }}>
                  30 вопросов в формате Jeopardy. 6 тем по 5 вопросов. Остерегайтесь Кота в мешке!
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
