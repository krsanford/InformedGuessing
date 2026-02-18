import { experimental_useObject as useObject } from '@ai-sdk/react'
import { GenerateEstimateResponseSchema } from '../ai/schemas'

export function useAIEstimate() {
  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/generate-estimate',
    schema: GenerateEstimateResponseSchema,
  })

  return { estimate: object, generate: submit, isLoading, stop, error }
}
