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

type Models = {
  name: string;
  size: string;
  format: string;
  quant: string;
  updated: string;
};

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [models, setModels] = useState<Models[]>([]);
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    const storedModel = localStorage.getItem("model");
    if (storedModel) setModel(storedModel);

    // Fetch available models
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data.tags);
      })
      .catch((err) => console.error("Failed to fetch models:", err));
  }, []);

  const handleAsk = async () => {
    setResponse(""); // Clear previous response

    const res = await fetch("/api/ollama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: message,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      setResponse("Error fetching response");
      return;
    }

    const data = await res.json(); // assuming API returns JSON
    setResponse(data.response || "No response found");
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
                value={model}
                onValueChange={(value) => {
                  setModel(value);
                  localStorage.setItem("model", value);
                }}
              >
                <SelectTrigger className="w-[180px] ml-2 border rounded p-1">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m, _index) => (
                    <SelectItem key={_index} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="border-neutral-700 bg-neutral-800 rounded-md m-2 p-2">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
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
            <Button onClick={handleAsk}>
              <SendHorizontal />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
