import { NextResponse } from 'next/server'

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434'

interface ModelDetails {
    parent_model: string
    format: string
    family: string
    families: string[] | null
    parameter_size: string
    quantization_level: string
}

interface Model {
    name: string
    model: string
    modified_at: string
    size: number
    digest: string
    details: ModelDetails
}

interface ApiResponse {
    models: Model[]
}

export async function GET() {
    try {
        const response = await fetch(`${OLLAMA_API_URL}/api/tags`)
        const data: ApiResponse = await response.json()

        const tags = data.models.map((model) => ({
            name: model.name,
            size: model.details.parameter_size,
            format: model.details.format,
            quant: model.details.quantization_level,
            updated: model.modified_at,
        }))

        return NextResponse.json({ tags }) // <- return in correct structure
    } catch (error) {
        console.error('[Ollama API Error]', error)
        return NextResponse.json(
            { error: 'Failed to fetch models from Ollama' },
            { status: 500 }
        )
    }
}
