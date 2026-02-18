import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { streamText, Output } from 'ai'
import { azure } from '../lib/openai.js'
import { GenerateEstimateResponseSchema } from '../schemas/index.js'
import { GENERATE_ESTIMATE_PROMPT } from '../lib/prompts.js'

app.setup({ enableHttpStream: true })

async function generateEstimate(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return {
        status: 400,
        jsonBody: { error: 'Invalid JSON body' },
      }
    }

    if (
      !body ||
      typeof body !== 'object' ||
      !('prompt' in body) ||
      typeof (body as { prompt?: unknown }).prompt !== 'string' ||
      !(body as { prompt: string }).prompt.trim()
    ) {
      return {
        status: 400,
        jsonBody: { error: 'Missing or invalid "prompt" field' },
      }
    }

    const prompt = (body as { prompt: string }).prompt

    const deploymentName = process.env.AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT ?? 'gpt-4o-mini'

    const result = streamText({
      model: azure(deploymentName),
      experimental_output: Output.object({ schema: GenerateEstimateResponseSchema }),
      system: GENERATE_ESTIMATE_PROMPT,
      prompt,
    })

    const response = result.toTextStreamResponse()

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
      body: response.body,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      status: 500,
      jsonBody: { error: message },
    }
  }
}

app.http('generateEstimate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'generate-estimate',
  handler: generateEstimate,
})
