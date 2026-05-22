"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  Upload,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const suggestedQuestions = [
  "How much did I spend on groceries last month?",
  "What are my top 5 spending categories?",
  "Show me my monthly spending trends",
  "Which merchants do I spend the most at?",
  "Compare my spending this month vs last month",
];

function getMessageText(message: {
  parts?: { type: string; text?: string }[];
}): string {
  if (!message.parts || !Array.isArray(message.parts)) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

interface ChatInterfaceProps {
  hasStatements: boolean;
}

export default function ChatInterface({ hasStatements }: ChatInterfaceProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const isDisabled = !hasStatements;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isDisabled) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleSuggestion = (question: string) => {
    if (isLoading || isDisabled) return;
    sendMessage({ text: question });
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Ask AI</h1>
        <p className="text-muted-foreground">
          Chat with your financial data using natural language
        </p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Financial Assistant</CardTitle>
              <CardDescription className="text-xs">
                Ask questions about your spending
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 py-8">
                {isDisabled ? (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center max-w-md">
                      <h3 className="text-lg font-semibold text-foreground">
                        No Financial Data Available
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        To start chatting with your financial data, you need to
                        upload at least one bank statement first.
                      </p>
                    </div>
                    <Link href="/upload">
                      <Button className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Your First Statement
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        Start a conversation
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ask me anything about your finances
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                      {suggestedQuestions.map((question) => (
                        <Button
                          key={question}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestion(question)}
                          className="text-xs"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              messages.map((message) => {
                const text = getMessageText(message);
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-sm">{text}</p>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="mb-2 list-disc pl-4">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mb-2 list-decimal pl-4">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1">{children}</li>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold">{children}</strong>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="rounded bg-muted-foreground/10 px-1 py-0.5 text-xs">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block rounded bg-muted-foreground/10 p-2 text-xs overflow-x-auto">
                                    {children}
                                  </code>
                                );
                              },
                              table: ({ children }) => (
                                <div className="my-2 overflow-x-auto">
                                  <table className="min-w-full divide-y divide-border">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="px-3 py-2 text-left text-xs font-semibold">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-3 py-2 text-sm">{children}</td>
                              ),
                            }}
                          >
                            {text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            {isDisabled ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 border border-dashed px-4 py-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Chat disabled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload a statement to start chatting with your financial
                    data
                  </p>
                </div>
                <Link href="/upload">
                  <Button size="sm" variant="secondary" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your spending..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
