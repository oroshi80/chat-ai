import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434'

export async function POST(req: NextRequest): Promise<Response> {
    const { prompt, model } = await req.json();

    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
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
            stream: true,
        }),
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body?.getReader();

    let fullContent = ""; // Concatenate all content here

    const stream = new ReadableStream({
        async start(controller) {
            if (!reader) {
                controller.close();
                return;
            }

            while (true) {
                const { done, value } = await reader.read();

                // Log each chunk for debugging
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    console.log("Backend Chunk:", chunk); // Log each chunk received from Ollama
                }

                // If done, break the loop
                if (done) {
                    console.log("Stream done, closing controller.");
                    controller.close();  // Signal that the stream is complete
                    break;
                }

                // Process and split the chunk
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });

                    // Process the chunk and split by lines
                    for (const line of chunk.split('\n')) {
                        if (!line.trim()) continue;

                        try {
                            const json = JSON.parse(line);
                            if (json?.message?.content) {
                                fullContent += json.message.content; // Concatenate all content

                                // Enqueue the updated content to the frontend
                                controller.enqueue(encoder.encode(fullContent));
                            }
                        } catch (err) {
                            console.error('Invalid JSON line:', line); // Log the invalid line
                            console.error('API error:', err);
                        }
                    }
                }
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
        },
    });
}





// export async function POST(req: NextRequest) {
//     const { prompt, model } = await req.json();

//     const ollamaRes = await fetch(`${OLLAMA_API_URL}/api/chat`, {
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
//             stream: false, // turn off stream for this test
//         }),
//     });

//     const data = await ollamaRes.json();
//     console.log("Ollama raw response:", data);

//     return NextResponse.json({
//         response: data?.message?.content || data?.response || "No content returned",
//     });
// }
