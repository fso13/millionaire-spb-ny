export type AnswerKey = 'A' | 'B' | 'C' | 'D'

export type MillionaireQuestion = {
  id: string
  question: string
  options: Record<AnswerKey, string>
  correct: AnswerKey
  explanation?: string
}


