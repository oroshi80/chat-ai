"use client";
import React, { useEffect, useState } from "react";
import { LightDark } from "./components/light-dark";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";

// Types

type Models = {
  name: string;
  size: string;
  format: string;
  quant: string;
  updated: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");
  const [model, setModel] = useState<string | undefined>(undefined);
  const [models, setModels] = useState<Models[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");

  useEffect(() => {
    const storedModel = localStorage.getItem("model");
    if (storedModel) setModel(storedModel);

    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => setModels(data.tags))
      .catch((err) => console.error("Failed to fetch models:", err));
  }, []);

  const handleAsk = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();

    // Clear previous message to avoid appending errors
    setStreamingMessage("");

    // Make the request to the backend
    const responseStream = await fetch("/api/ollama", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: message, model: model }),
    });

    const reader = responseStream.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      console.error("Error: Reader is undefined.");
      return;
    }

    let fullResponse = ""; // This will hold the final response content

    // Start processing the stream
    const processStream = async () => {
      const processChunk = async ({
        done,
        value,
      }: ReadableStreamDefaultReader<Uint8Array>) => {
        if (done) {
          console.log("Stream finished.");
          return;
        }

        // Decode the current chunk
        const decodedChunk = decoder.decode(value, { stream: true });

        // Only append if new chunk is non-empty
        if (decodedChunk) {
          fullResponse += decodedChunk;
          setStreamingMessage(fullResponse); // Update UI with the new chunk
        }

        // Read the next chunk
        reader
          .read()
          .then(processChunk)
          .catch((err) => {
            console.error("Error reading the stream:", err);
          });
      };

      // Start the chunk reading
      reader
        .read()
        .then(processChunk)
        .catch((err) => {
          console.error("Stream read error:", err);
        });
    };

    // Start streaming
    processStream();
  };

  return (
    <div className="container p-4">
      <div className="flex justify-between">
        <div className="text-3xl mb-4">Chat AI</div>
        <LightDark />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center">
              Model:
              <Select
                onValueChange={(value) => {
                  setModel(value);
                  localStorage.setItem("model", value);
                }}
                value={model || ""}
              >
                <SelectTrigger className="w-[180px] ml-2 border rounded p-1">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m, index) => (
                    <SelectItem key={index} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                  {msg.role === "user" ? "🧑" : "🤖"}
                </div>
                <div
                  className={`rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-white"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {streamingMessage && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                  🤖
                </div>
                <div className="rounded-lg p-3 text-sm bg-neutral-800 text-white">
                  <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <div className="flex gap-4 items-center">
            <div className="w-full">
              <Input
                className="w-[600px]"
                placeholder="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button onClick={handleAsk} disabled={isLoaded}>
              <SendHorizontal />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
