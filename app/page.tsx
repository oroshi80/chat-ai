"use client";
import React, { useEffect, useState, useRef } from "react";
import { LightDark } from "./components/light-dark";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ring } from "ldrs/react";
import "ldrs/react/Ring.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw"; // Add this to support raw HTML in markdown
import rehypeSanitize from "rehype-sanitize"; // Optional for sanitizing HTML if needed
import "github-markdown-css/github-markdown.css";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // Use GitHub-like theme
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedModel = localStorage.getItem("model");
    if (storedModel) setModel(storedModel);

    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => setModels(data.tags))
      .catch((err) => console.error("Failed to fetch models:", err));
  }, []);

  useEffect(() => {
    // Scroll to the bottom whenever messages or streamingMessage changes
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);

  const handleAsk = async () => {
    // event.preventDefault();
    setIsLoaded(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setStreamingMessage("");

    try {
      const response = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ prompt: message, model }),
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: message }],
          model,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (!reader) {
        console.error("No reader from response stream.");
        setIsLoaded(false);
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log("[Stream Chunk]:", chunk);

        fullResponse = chunk; // Update with latest chunk
        setStreamingMessage(chunk); // Show current stream
      }

      // Once done, set the final message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullResponse },
      ]);
      setStreamingMessage("");
      setMessage("");
    } catch (err) {
      console.error("Stream read error:", err);
    } finally {
      setIsLoaded(false);
    }
  };

  return (
    // <div className="flex flex-col container p-4 justify-center">
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <div className="flex justify-between gap-4">
        <div className="text-3xl mb-4">Chat AI</div>
        <LightDark />
      </div>

      <Card className="w-full max-w-5xl">
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
                <div className="w-8 h-8 shrink-0 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                  {msg.role === "user" ? (
                    <Avatar>
                      <AvatarFallback className="bg-gray-600">
                        {" "}
                        <User2 />{" "}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar>
                      <AvatarFallback className="bg-gray-600">
                        🤖
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "dark:bg-slate-700 bg-slate-500 text-white"
                      : "dark:!bg-slate-950 !bg-slate-800 markdown-body"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                  >
                    {msg.content}
                  </ReactMarkdown>
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
                <div className="rounded-lg p-3 text-sm markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                  >
                    {streamingMessage}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-2">
          <div className="flex gap-2 items-end w-full">
            <div className="flex-1">
              <Textarea
                className="w-full"
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    console.log("CTRL+ENTER triggered");
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleAsk}
              disabled={isLoaded}
              className="self-end cursor-pointer"
            >
              {isLoaded ? (
                <Ring
                  size="20"
                  stroke="2"
                  bgOpacity="0"
                  speed="2"
                  color="black"
                />
              ) : (
                <SendHorizontal />
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            <span className="bg-gray-600 px-2 py-1 rounded text-gray-300">
              Ctrl
            </span>{" "}
            +{" "}
            <span className="bg-gray-600 px-2 py-1 rounded text-gray-300">
              Enter
            </span>{" "}
            to send message
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
