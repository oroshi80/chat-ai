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
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import "github-markdown-css/github-markdown.css";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { PlaceholdersAndVanishTextarea } from "@/components/ui/placeholders-and-vanish-textarea";

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
  meta?: {
    load_duration: number;
    total_duration: number;
    eval_count: number;
  };
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");
  const [model, setModel] = useState<string | undefined>(undefined);
  const [models, setModels] = useState<Models[]>([]);
  const [isThinking, setIsThinking] = useState(false); //same as isLoading
  const [thinkingStage, setThinkingStage] = useState<"thinking" | "generating">(
    "thinking"
  );
  const shimmerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const placeholders = [
    "Ask anything...",
    "Who is David Tennant?",
    "Where is Loch Ness lake?",
    "Write a Javascript method to reverse a string",
    "How to assemble your own PC?",
  ];

  useEffect(() => {
    const storedModel = localStorage.getItem("model");
    if (storedModel) setModel(storedModel);

    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => setModels(data.tags))
      .catch((err) => console.error("Failed to fetch models:", err));
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking]);

  useEffect(() => {
    if (!isThinking) return;

    const timer = setTimeout(() => {
      setThinkingStage("generating");
    }, 5000);

    return () => clearTimeout(timer);
  }, [isThinking]);

  const handleAsk = async () => {
    // if (!message.trim() || !model) return;
    if (!message.trim() || !model || isThinking) return; // Add isThinking check

    setIsThinking(true);

    const newUserMessage: ChatMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, newUserMessage]);
    setMessage("");

    try {
      const response = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          model,
        }),
      });

      const data = await response.json();
      const parsed =
        typeof data.content === "string" ? JSON.parse(data.content) : data;

      console.log("Raw response from /api/ollama:", data);

      if (!parsed.message || !parsed.message.content) {
        throw new Error("Invalid response: message content missing");
      }

      const assistantContent = parsed.message.content;
      const meta = {
        load_duration: parsed.load_duration,
        total_duration: parsed.total_duration,
        eval_count: parsed.eval_count,
      };

      const words = assistantContent.split(" ");
      let i = 0;
      let currentText = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", meta },
      ]);

      const updateMessageGradually = () => {
        if (i < words.length) {
          currentText += (i > 0 ? " " : "") + words[i];
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? { ...msg, content: currentText, meta }
                : msg
            )
          );
          i++;
          shimmerRef.current = window.setTimeout(updateMessageGradually, 50);
        } else {
          shimmerRef.current = null;
        }
      };

      updateMessageGradually();
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <div className="flex justify-between gap-4">
        <div className="text-3xl mb-4">Chat AI</div>
        <LightDark />
      </div>

      <Card className="w-full max-w-6xl">
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
                <Avatar>
                  <AvatarFallback className="bg-gray-600">
                    {msg.role === "user" ? <User2 /> : "🤖"}
                  </AvatarFallback>
                </Avatar>

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

                  {msg.meta && (
                    <div className="text-xs text-muted-foreground mt-2 border-t pt-2 opacity-70">
                      ⏱ Load: {(msg.meta.load_duration / 1e9).toFixed(2)}s •
                      Total: {(msg.meta.total_duration / 1e9).toFixed(2)}s •
                      Evals: {msg.meta.eval_count}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Shimmer Loading */}
          {isThinking && (
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback className="bg-gray-600">🤖</AvatarFallback>
              </Avatar>

              <TextShimmer className="" duration={1}>
                {thinkingStage === "thinking"
                  ? "I'm thinking..."
                  : "Generating..."}
              </TextShimmer>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-2">
          <div className="flex gap-2 items-end w-full">
            <div className="flex-1">
              <PlaceholdersAndVanishTextarea
                placeholders={placeholders}
                onChange={(e) => setMessage(e.target.value)}
                onSubmit={handleAsk}
                disabled={isThinking} // ✅ prevent input while AI is thinking
              />
            </div>
            {/* <Textarea
                className="w-full"
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
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
            </Button> */}
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            <span className="bg-gray-600 px-2 py-1 rounded text-gray-300">
              Ctrl
            </span>{" "}
            +{" "}
            <span className="bg-gray-600 px-2 py-1 rounded text-gray-300">
              Enter
            </span>{" "}
            to break a new line
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
