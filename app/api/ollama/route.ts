import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434'

// export async function POST(req: NextRequest): Promise<Response> {
//     const { prompt, model } = await req.json();

//     const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             model,
//             messages: [
//                 {
//                     role: 'user',
//                     content: prompt,
//                 },
//             ],
//             stream: true,
//         }),
//     });

//     const encoder = new TextEncoder();
//     const decoder = new TextDecoder();
//     const reader = response.body?.getReader();
//     console.log(reader);


//     const stream = new ReadableStream({
//         async start(controller) {
//             if (!reader) {
//                 controller.close();
//                 return;
//             }

//             while (true) {
//                 const { done, value } = await reader.read();
//                 if (done) break;

//                 const chunk = decoder.decode(value, { stream: true });

//                 for (const line of chunk.split('\n')) {
//                     if (!line.trim()) continue;

//                     try {
//                         const json = JSON.parse(line);
//                         if (json?.message?.content) {
//                             controller.enqueue(encoder.encode(json.message.content));
//                         }
//                     } catch (err) {
//                         console.error('Invalid JSON line:', line);
//                         console.error('API error:', err);
//                     }
//                 }
//             }

//             controller.close();
//         },
//     });

//     return new Response(stream, {
//         headers: {
//             'Content-Type': 'text/plain; charset=utf-8',
//             'Cache-Control': 'no-cache',
//         },
//     });
// }

export async function POST(req: NextRequest) {
    const { prompt, model } = await req.json();

    const ollamaRes = await fetch(`${OLLAMA_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            stream: false, // turn off stream for this test
        }),
    });

    const data = await ollamaRes.json();
    console.log("Ollama raw response:", data);

    return NextResponse.json({
        response: data?.message?.content || data?.response || "No content returned",
    });
}
