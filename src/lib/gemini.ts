/// <reference types="vite/client" />

export interface ReceiptData {
  description: string
  amount: number
  date: string
  category: string
  note: string
}

export type ScanResult =
  | { ok: true; data: ReceiptData }
  | { ok: false; limitReached: boolean; error: string }

export async function scanReceipt(imageBase64: string, mimeType: string): Promise<ScanResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return { ok: false, limitReached: false, error: 'Chave Gemini não configurada.' }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const body = {
    contents: [{
      parts: [
        {
          text: `Analise esta nota fiscal ou cupom e extraia os dados em JSON.
Responda APENAS com um objeto JSON válido, sem markdown, sem explicações:
{
  "description": "nome do estabelecimento (ex: Supermercado Extra)",
  "amount": valor total em reais como número (ex: 47.90),
  "date": "data no formato yyyy-MM-dd (use hoje se não encontrar)",
  "category": "uma de: food, transport, entertainment, health, education, shopping, utilities, housing, travel, subscriptions, investment, other",
  "note": "lista resumida dos principais itens (máx 80 caracteres)"
}`,
        },
        {
          inline_data: { mime_type: mimeType, data: imageBase64 },
        },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.status === 429 || res.status === 403) {
      return { ok: false, limitReached: true, error: 'Limite de foto expirado, adicione o pagamento manualmente.' }
    }

    if (!res.ok) {
      return { ok: false, limitReached: false, error: 'Erro ao conectar com a IA. Tente novamente.' }
    }

    const json = await res.json()
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // extrai o JSON da resposta (às vezes vem com ```json```)
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { ok: false, limitReached: false, error: 'IA não conseguiu ler a nota. Tente uma foto mais nítida.' }

    const data = JSON.parse(match[0]) as ReceiptData
    if (!data.description || !data.amount) {
      return { ok: false, limitReached: false, error: 'Não encontrei os dados na nota. Tente outra foto.' }
    }

    // garante que a data é válida
    if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      data.date = new Date().toISOString().slice(0, 10)
    }

    return { ok: true, data }
  } catch {
    return { ok: false, limitReached: false, error: 'Sem conexão ou erro inesperado.' }
  }
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve({ base64, mimeType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
