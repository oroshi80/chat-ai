import { NextRequest } from 'next/server'

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434'


export async function POST(req: NextRequest): Promise<Response> {
    const { messages, model } = await req.json();

    try {

        const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false, // You can keep this in case Ollama streams by default, but it won't matter now.
            }),
        });

        if (!response.body) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let fullText = '';
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });
            }
        }

        return Response.json({ content: fullText });
    } catch (error) {
        console.error('[Ollama API Error]', error);
        return Response.json({ error: 'Failed to fetch models from Ollama' }, { status: 500 });
    }

}

// export async function POST(req: NextRequest): Promise<Response> {
//     // const { prompt, model } = await req.json();
//     const { messages, model } = await req.json();

//     const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             model,
//             messages,
//             stream: true,
//         }),
//     });

//     const encoder = new TextEncoder();
//     const decoder = new TextDecoder();
//     const reader = response.body?.getReader();

//     let fullContent = ""; // Concatenate all content here

//     const stream = new ReadableStream({
//         async start(controller) {
//             if (!reader) {
//                 controller.close();
//                 return;
//             }

//             while (true) {
//                 const { done, value } = await reader.read();

//                 // Log each chunk for debugging
//                 if (value) {
//                     const chunk = decoder.decode(value, { stream: true });
//                     console.log("Backend Chunk:", chunk); // Log each chunk received from Ollama
//                 }

//                 // If done, break the loop
//                 if (done) {
//                     console.log("Stream done, closing controller.");
//                     controller.close();  // Signal that the stream is complete
//                     break;
//                 }

//                 // Process and split the chunk
//                 if (value) {
//                     const chunk = decoder.decode(value, { stream: true });

//                     // Process the chunk and split by lines
//                     for (const line of chunk.split('\n')) {
//                         if (!line.trim()) continue;

//                         try {
//                             const json = JSON.parse(line);
//                             if (json?.message?.content) {
//                                 fullContent += json.message.content; // Concatenate all content

//                                 // Enqueue the updated content to the frontend
//                                 controller.enqueue(encoder.encode(fullContent));
//                             }
//                         } catch (err) {
//                             console.error('Invalid JSON line:', line); // Log the invalid line
//                             console.error('API error:', err);
//                         }
//                     }
//                 }
//             }
//         },
//     });

//     if (process.env.NODE_ENV === 'development') {
//         return new Response(stream, {
//             headers: {
//                 'Content-Type': 'text/plain; charset=utf-8',
//                 'Cache-Control': 'no-cache',
//             },
//         });
//     } else {
//         // In production, use `text/event-stream` for streaming and chunked transfer encoding
//         return new Response(stream, {
//             headers: {
//                 "Content-Type": "text/event-stream",
//                 "Transfer-Encoding": "chunked",
//             },
//         });
//     }
// }
