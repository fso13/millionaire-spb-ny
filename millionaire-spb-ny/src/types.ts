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


