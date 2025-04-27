"use client";
import { Card } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown"; // Import react-markdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Dataset {
  _id: string;
  filename: string;
  dataset_description: string;
  is_preprocessing_done: boolean;
  Is_preprocessing_form_filled: boolean;
  start_preprocessing: boolean;
  test_dataset_percentage: number;
  remove_duplicate: boolean;
  scaling_and_normalization: boolean;
  increase_the_size_of_dataset: boolean;
}

const ChatPage = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    null
  );

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  const fetchUserDatasets = async () => {
    if (!user) {
      console.log("User not loaded yet");
      return;
    }

    console.log("Fetching user data for Clerk ID:", user.id);
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/user/get-user?userId=${user.id}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch user data: ${response.status} - ${errorText}`
        );
      }

      const userData = await response.json();
      console.log("User data received:", userData);
      if (!userData.user_id) {
        throw new Error("MongoDB user_id not found in user data");
      }
      setMongoUserId(userData.user_id);

      const datasetIds = userData.dataset_ids || [];
      console.log("Extracted dataset IDs:", datasetIds);

      const datasetsPromises = datasetIds.map(async (id: string) => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}dataset/get_dataset?dataset_id=${id}`
        );
        if (!response.ok) {
          console.error(`Failed to fetch dataset ${id}`);
          return null;
        }
        return response.json();
      });

      const datasetsData = (await Promise.all(datasetsPromises)).filter(
        (data) => data !== null
      );
      console.log("Fetched datasets:", datasetsData);
      setDatasets(datasetsData);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserDatasets();
    }
  }, [user]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if selectedDatasetId is set
    if (!selectedDatasetId) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Please select a dataset before sending a message.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/gemini/chat_with_dataset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            dataset_id: selectedDatasetId,
            user_query: input,
          }),
        }
      );

      const data = await response.json();

      // Add Gemini response to chat
      const botMessage = {
        id: Date.now() + 1,
        text: data.answer,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching Gemini response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, something went wrong. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto h-[84vh] flex flex-col p-4">
      <Card className="flex-1 flex flex-col border border-gray-200 rounded-lg shadow-sm max-h-full">
        <ScrollArea className="flex-1 p-4 " ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Start a conversation by typing a message below
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 flex flex-col ${
                    message.sender === "user"
                      ? "bg-gray-600 text-white"
                      : " text-white" // Added bg color for bot
                  }`}
                >
                  {message.sender === "bot" ? (
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything"
              className="flex-[2]"
              disabled={isLoading}
            ></Input>
            <div className="flex-1 border border-gray-800 rounded-md">
              <Select
                onValueChange={setSelectedDatasetId}
                value={selectedDatasetId || undefined}
              >
                <SelectTrigger className="w-full h-full text-left px-2">
                  <SelectValue
                    className="placeholder-gray-700 w-full"
                    placeholder="Select a dataset"
                  />
                </SelectTrigger>
                <SelectContent
                  side="top"
                  sideOffset={5}
                  position="popper" // <- this is IMPORTANT
                  className="w-full p-2"
                >
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading datasets...
                    </SelectItem>
                  ) : datasets.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No datasets available
                    </SelectItem>
                  ) : (
                    datasets.map((dataset) => (
                      <SelectItem key={dataset._id} value={dataset._id}>
                        {dataset.filename}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ChatPage;
