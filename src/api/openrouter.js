const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openrouter/free'

const FALLBACK =
  "We couldn't generate a recommendation for this one — check out the overview above!"

const SYSTEM_PROMPT = [
  'You are an enthusiastic but honest film critic.',
  'Write short watch recommendations for someone deciding whether to spend an evening on a film.',
  'Constraints:',
  '- 2 to 3 sentences, roughly 50 to 80 words.',
  '- Use second person ("you"); never first person ("I", "my", "we").',
  '- No plot spoilers beyond the supplied overview.',
  '- No hollow phrases like "must-see", "instant classic", "tour de force".',
  '- No preamble — start directly with the recommendation, do not say things like "Here\'s a recommendation:".',
  '- Plain prose only, no markdown, no bullet points, no emoji.',
].join('\n')

export const getMovieInsight = async ({ title, genres, overview }) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) {
    console.warn('VITE_OPENROUTER_API_KEY is not set — using fallback recommendation.')
    return FALLBACK
  }

  const userMessage = [
    `Title: ${title}`,
    `Genres: ${genres || 'Unknown'}`,
    `Overview: ${overview || 'No overview available.'}`,
    '',
    'Write a 2–3 sentence watch recommendation aimed at the viewer most likely to enjoy this film.',
  ].join('\n')

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    return text || FALLBACK
  } catch (error) {
    console.error('AI insight failed:', error)
    return FALLBACK
  }
}
