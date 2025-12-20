export type AnswerKey = 'A' | 'B' | 'C' | 'D'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type MillionaireQuestion = {
  id: string
  question: string
  author: {
    name: string
    city: string
  }
  options: Record<AnswerKey, string>
  correct: AnswerKey
  explanation?: string
}

export type YourGameQuestion = {
  id: string
  question: string
  answer: string
  points: 100 | 200 | 300 | 400 | 500
  isCatInBag?: boolean
  originalThemeId?: string
}

export type YourGameTheme = {
  id: string
  name: string
  questions: YourGameQuestion[]
}

export type YourGameData = {
  easy: { themes: YourGameTheme[] }
  medium: { themes: YourGameTheme[] }
  hard: { themes: YourGameTheme[] }
}


