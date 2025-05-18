/* global Word, console, Office, window, localStorage */

import React, { useState, useEffect } from "react";
import { Button, Select, Input, Space, message, Spin } from "antd";
import { OllamaService } from "../services/OllamaService";
import { OpenRouterService } from "../services/OpenRouterService";
import "./TextProcessor.css";
import { InfoCircleOutlined, CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const TextProcessor: React.FC = () => {
  const [selectedText, setSelectedText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState("paraphrase");
  const [customPrompt, setCustomPrompt] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [model, setModel] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [provider, setProvider] = useState<"ollama" | "openrouter">("ollama");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [expandedThoughts, setExpandedThoughts] = useState<{ [key: number]: boolean }>({});
  const [isThinking, setIsThinking] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("Normal");
  const chatHistoryRef = React.useRef<HTMLDivElement>(null);

  const ollamaService = new OllamaService();
  const openRouterService = new OpenRouterService();

  // Load settings and models when component mounts
  useEffect(() => {
    loadModelsAndSettings();
    setupSelectionListener();
    return () => {
      Office.context.document.removeHandlerAsync(Office.EventType.DocumentSelectionChanged);
    };
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "providerSettings") {
        loadModelsAndSettings();
      }
    };

    const handleSettingsUpdate = (e: CustomEvent) => {
      const settings = e.detail;
      if (settings) {
        loadModelsAndSettings();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("settingsUpdated", handleSettingsUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handleSettingsUpdate as EventListener);
      window.removeEventListener("settingsUpdated", handleSettingsUpdate as EventListener);
    };
  }, []);

  const setupSelectionListener = () => {
    Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, async () => {
      try {
        await Word.run(async (context) => {
          const range = context.document.getSelection();
          range.load("text");
          await context.sync();
          if (range.text) {
            setSelectedText(range.text.trim());
          }
        });
      } catch (error) {
        console.error("Error getting selected text:", error);
      }
    });
  };

  const loadModelsAndSettings = async () => {
    try {
      const settingsStr = localStorage.getItem("providerSettings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        const newProvider = settings.provider || "ollama";
        setProvider(newProvider);

        const currentSettings = newProvider === "ollama" ? settings.ollamaSettings : settings.openRouterSettings;

        if (currentSettings) {
          setTargetLanguage(currentSettings.defaultLanguage || "Spanish");
          setSelectedStyle(currentSettings.defaultStyle || "Normal");

          // Update model if it's different from current
          if (currentSettings.defaultModel && currentSettings.defaultModel !== model) {
            setModel(currentSettings.defaultModel);
          }

          // Update service configurations
          if (newProvider === "ollama") {
            ollamaService.setBaseUrl(currentSettings.baseUrl);
          } else {
            openRouterService.setBaseUrl(currentSettings.baseUrl);
            if (currentSettings.apiKey) {
              openRouterService.setApiKey(currentSettings.apiKey);
            }
          }
        }

        // Load models based on current provider
        const models =
          newProvider === "ollama" ? await ollamaService.listModels() : await openRouterService.listModels();

        setAvailableModels(models);

        // Set default model if not already set
        if (!model && currentSettings?.defaultModel && models.includes(currentSettings.defaultModel)) {
          setModel(currentSettings.defaultModel);
        } else if (!model && models.length > 0) {
          setModel(models[0]);
        }
      } else {
        // Load default models if no settings exist
        const models = provider === "ollama" ? await ollamaService.listModels() : await openRouterService.listModels();

        setAvailableModels(models);
        if (models.length > 0) {
          setModel(models[0]);
        }
      }
    } catch (error) {
      message.error(`Error loading ${provider} models. Please check your configuration.`);
      console.error(error);
    }
  };

  const processText = async () => {
    if (!selectedText) {
      message.warning("Please select text first");
      return;
    }

    if (!model) {
      message.warning("Please select a model");
      return;
    }

    setProcessing(true);
    try {
      const service = provider === "ollama" ? ollamaService : openRouterService;
      const { prompt: stylePrompt, temperature } = getStylePrompt(selectedStyle);
      let result = "";

      switch (action) {
        case "paraphrase":
          result = await service.paraphrase(selectedText, model, stylePrompt, temperature);
          break;
        case "summarize":
          result = await service.summarize(selectedText, model, stylePrompt, temperature);
          break;
        case "extend":
          result = await service.extend(selectedText, model, stylePrompt, temperature);
          break;
        case "translate":
          result = await service.translate(selectedText, targetLanguage, model, stylePrompt, temperature);
          break;
        case "generate":
          result = await service.generate(selectedText, model, stylePrompt, temperature);
          break;
        case "custom":
          if (!customPrompt) {
            message.warning("Please enter a custom prompt");
            setProcessing(false);
            return;
          }
          result = await service.generateWithCustomPrompt(selectedText, customPrompt, model, stylePrompt, temperature);
          break;
        default:
          throw new Error("Invalid action");
      }

      await Word.run(async (context) => {
        const range = context.document.getSelection();
        range.insertText(result, "Replace");
        await context.sync();
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      message.error(`Error processing text: ${errorMessage}`);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setChatInput("");
    setStreamingResponse("");
    setExpandedThoughts({});
    setIsThinking(false);
  };

  const getStylePrompt = (style: string) => {
    let temperature = 0.7; // Default temperature
    let prompt = "";

    switch (style) {
      case "Scientific":
        temperature = 0.3;
        prompt =
          "Please respond in a scientific/academic style, using formal language, technical terms, and proper citations where appropriate. Maintain a precise and analytical tone.";
        break;
      case "Formal":
        temperature = 0.4;
        prompt =
          "Please respond in a formal style, using professional language and maintaining a respectful tone. Focus on clarity and precision.";
        break;
      case "Informal":
        temperature = 0.8;
        prompt =
          "Please respond in an informal style, using casual language and a friendly tone. Feel free to use contractions and conversational expressions.";
        break;
      case "Friendly":
        temperature = 0.9;
        prompt =
          "Please respond in a friendly and approachable style. Use warm language, show enthusiasm, and maintain a positive tone. Feel free to use casual expressions and be conversational.";
        break;
      case "Creative":
        temperature = 1.0;
        prompt =
          "Please respond in a highly creative and imaginative style. Think outside the box, use vivid language, and explore unique perspectives. Feel free to be innovative and original in your approach.";
        break;
      case "Warm":
        temperature = 0.85;
        prompt =
          "Please respond in a warm and empathetic style, showing understanding and emotional support. Use gentle language and maintain a caring tone.";
        break;
      case "Cold":
        temperature = 0.2;
        prompt =
          "Please respond in a cold and detached style, focusing on facts and logic without emotional engagement. Use precise and objective language.";
        break;
      default:
        temperature = 0.7;
        prompt = "Please respond in a normal, balanced style.";
    }

    return { prompt, temperature };
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    // Prepare the message content
    let messageContent = chatInput;
    const trimmedSelectedText = selectedText.trim();
    // Only include selected text if {{text}} placeholder is used
    if (trimmedSelectedText && messageContent.includes("{{text}}")) {
      messageContent = messageContent.replace("{{text}}", `"${trimmedSelectedText}"`);
    }
    const newHistory = [...chatHistory, { role: "user", content: messageContent }];
    setChatHistory(newHistory);
    setChatInput("");
    setProcessing(true);
    setStreamingResponse("");
    setIsThinking(false);
    try {
      const service = provider === "ollama" ? ollamaService : openRouterService;
      const { prompt: stylePrompt, temperature } = getStylePrompt(selectedStyle);
      const response = await service.chat(
        [{ role: "system", content: stylePrompt }, ...newHistory],
        model,
        true,
        (chunk: string) => {
          setStreamingResponse((prev) => {
            const newResponse = prev + chunk;
            // Check for think tags in the new response
            if (newResponse.includes("<think>") && !isThinking) {
              setIsThinking(true);
            }
            if (newResponse.includes("</think>") && isThinking) {
              setIsThinking(false);
            }
            return newResponse;
          });
        },
        temperature
      );
      setChatHistory([...newHistory, { role: "assistant", content: response }]);
      setStreamingResponse("");
      setIsThinking(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      message.error(`Error in chat: ${errorMessage}`);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const scrollToBottom = () => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  };

  // Auto-scroll when streaming
  useEffect(() => {
    if (processing) {
      scrollToBottom();
    }
  }, [streamingResponse, processing]);

  const formatMessage = (text: string, messageIndex: number, isStreaming: boolean = false) => {
    // First handle think tags
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
    if (thinkMatch) {
      const [, thoughtProcess, finalResponse] = thinkMatch;
      return (
        <>
          <div
            style={{
              color: "#888",
              fontStyle: "italic",
              marginBottom: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              userSelect: "none",
            }}
            onClick={() => setExpandedThoughts((prev) => ({ ...prev, [messageIndex]: !prev[messageIndex] }))}
          >
            {expandedThoughts[messageIndex] ? <CaretDownOutlined /> : <CaretRightOutlined />}
            <span>Thinking process</span>
          </div>
          {expandedThoughts[messageIndex] && (
            <div style={{ color: "#888", fontStyle: "italic", marginBottom: "8px" }}>
              {formatBoldText(thoughtProcess)}
            </div>
          )}
          <div>{formatBoldText(finalResponse)}</div>
        </>
      );
    }

    // Handle streaming thinking process
    const streamingThinkMatch = text.match(/<think>([\s\S]*)/);
    if (streamingThinkMatch && isStreaming) {
      const thoughtProcess = streamingThinkMatch[1];
      return (
        <>
          <div
            style={{
              color: "#888",
              fontStyle: "italic",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <CaretDownOutlined />
            <span>Thinking process</span>
          </div>
          <div style={{ color: "#888", fontStyle: "italic", marginBottom: "8px" }}>
            {formatBoldText(thoughtProcess)}
          </div>
        </>
      );
    }

    return formatBoldText(text);
  };

  const formatBoldText = (text: string) => {
    // Remove ### and replace --- with newline
    const formattedText = text.replace(/###/g, "").replace(/---/g, "\n");
    const parts = formattedText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return <strong key={index}>{boldText}</strong>;
      }
      return part;
    });
  };

  const getFinalResponse = (text: string) => {
    const thinkMatch = text.match(/<think>[\s\S]*?<\/think>([\s\S]*)/);
    return thinkMatch ? thinkMatch[1] : text;
  };

  const insertToDocument = async (text: string) => {
    try {
      const finalResponse = getFinalResponse(text);
      // Remove ### and replace --- with newline
      const formattedText = finalResponse.replace(/###/g, "").replace(/---/g, "\n");
      await Word.run(async (context) => {
        const range = context.document.getSelection();
        range.load("text");
        await context.sync();
        // Clear the current selection
        range.insertText("", "Replace");
        // Split the text by bold markers and process each part
        const parts = formattedText.split(/(\*\*.*?\*\*)/g);
        let currentRange = range;
        for (const part of parts) {
          if (part.startsWith("**") && part.endsWith("**")) {
            // This is bold text
            const boldText = part.slice(2, -2);
            const newRange = currentRange.insertText(boldText, "End");
            newRange.font.bold = true;
            currentRange = newRange;
          } else if (part) {
            // This is regular text
            const newRange = currentRange.insertText(part, "End");
            newRange.font.bold = false;
            currentRange = newRange;
          }
        }
        await context.sync();
      });
      message.success("Text inserted into document");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      message.error(`Error inserting text: ${errorMessage}`);
      console.error(error);
    }
  };

  return (
    <div className="text-processor">
      <div className="text-area-container">
        {selectedText.trim() ? (
          <TextArea
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
            placeholder="Select text in your document or type here..."
            autoSize={{ minRows: 4, maxRows: 8 }}
            className="text-area"
          />
        ) : (
          <div
            className="text-area-placeholder"
            style={{
              padding: "12px",
              border: "1px dashed #d9d9d9",
              borderRadius: "6px",
              backgroundColor: "#fafafa",
              color: "#888",
              minHeight: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div>
              <InfoCircleOutlined style={{ fontSize: "20px", marginBottom: "8px" }} />
              <div>Select text in your document to start</div>
              <div style={{ fontSize: "12px" }}>Use {"{{text}}"} in your message to include selected text</div>
            </div>
          </div>
        )}
      </div>

      <Space direction="vertical" className="controls">
        <Select
          value={model}
          onChange={setModel}
          placeholder="Select a model"
          options={availableModels.map((m) => ({ value: m, label: m }))}
          className="model-select"
        />

        <Select
          value={action}
          onChange={setAction}
          options={[
            { value: "paraphrase", label: "Paraphrase" },
            { value: "summarize", label: "Summarize" },
            { value: "extend", label: "Extend" },
            { value: "translate", label: "Translate" },
            { value: "generate", label: "Generate" },
            { value: "chat", label: "Chat" },
            { value: "custom", label: "Custom Prompt" },
          ]}
          className="action-select"
        />

        {action === "translate" && (
          <Select
            value={targetLanguage}
            onChange={setTargetLanguage}
            options={[
              { value: "Spanish", label: "Spanish" },
              { value: "French", label: "French" },
              { value: "German", label: "German" },
              { value: "Italian", label: "Italian" },
              { value: "Portuguese", label: "Portuguese" },
              { value: "Chinese", label: "Chinese" },
              { value: "Japanese", label: "Japanese" },
              { value: "Korean", label: "Korean" },
              { value: "Turkish", label: "Turkish" },
            ]}
            className="language-select"
          />
        )}

        {action === "custom" && (
          <Input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your custom prompt"
            className="custom-prompt"
          />
        )}

        {action === "chat" && (
          <div className="chat-container" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
              <Button
                type="default"
                onClick={handleNewChat}
                disabled={processing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  opacity: processing ? 0.5 : 1,
                }}
              >
                <svg
                  viewBox="64 64 896 896"
                  focusable="false"
                  data-icon="plus"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                >
                  <path d="M482 152h60c5.1 0 9.2 4.1 9.2 9.2v248.8c0 5.1-4.1 9.2-9.2 9.2h-60c-5.1 0-9.2-4.1-9.2-9.2V161.2c0-5.1 4.1-9.2 9.2-9.2zm-60 0h60c5.1 0 9.2 4.1 9.2 9.2v248.8c0 5.1-4.1 9.2-9.2 9.2h-60c-5.1 0-9.2-4.1-9.2-9.2V161.2c0-5.1 4.1-9.2 9.2-9.2zm0 0h60c5.1 0 9.2 4.1 9.2 9.2v248.8c0 5.1-4.1 9.2-9.2 9.2h-60c-5.1 0-9.2-4.1-9.2-9.2V161.2c0-5.1 4.1-9.2 9.2-9.2z" />
                </svg>
                New Chat
              </Button>
            </div>
            <div
              ref={chatHistoryRef}
              className="chat-history"
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginBottom: "12px",
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                border: "1px solid #e8e8e8",
                scrollBehavior: "smooth",
              }}
            >
              {chatHistory.length === 0 && !processing && (
                <div style={{ color: "#888", textAlign: "center" }}>
                  <InfoCircleOutlined style={{ fontSize: "24px", marginBottom: "8px", display: "block" }} />
                  <div style={{ fontSize: "14px", marginBottom: "4px" }}>Start chatting with the model</div>
                  <div style={{ fontSize: "12px" }}>Use {"{{text}}"} in your message to include selected text</div>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      backgroundColor: msg.role === "user" ? "#1890ff" : "#fff",
                      color: msg.role === "user" ? "#fff" : "#000",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                      wordBreak: "break-word",
                    }}
                  >
                    {formatMessage(msg.content, idx, false)}
                  </div>
                  {msg.role === "assistant" && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => insertToDocument(msg.content)}
                      style={{
                        marginTop: "4px",
                        padding: "0 4px",
                        fontSize: "12px",
                        color: "#1890ff",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        height: "24px",
                        borderRadius: "4px",
                        transition: "all 0.3s",
                        backgroundColor: "transparent",
                        border: "none",
                        boxShadow: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e6f7ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <svg
                          viewBox="64 64 896 896"
                          focusable="false"
                          data-icon="file-add"
                          width="1em"
                          height="1em"
                          fill="currentColor"
                          style={{ marginRight: "4px" }}
                        >
                          <path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494zM504 618H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM312 490v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8z" />
                        </svg>
                        Insert to Document
                      </span>
                    </Button>
                  )}
                </div>
              ))}
              {processing && (
                <div
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      backgroundColor: "#fff",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {streamingResponse ? (
                      <div style={{ whiteSpace: "pre-wrap" }}>{formatMessage(streamingResponse, -1, true)}</div>
                    ) : (
                      <>
                        <Spin size="small" style={{ marginRight: "8px" }} />
                        <span style={{ color: "#888" }}>AI is thinking...</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input.TextArea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder="Type your message and press Enter..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                disabled={processing}
                style={{
                  flex: 1,
                  borderRadius: "6px",
                  resize: "none",
                }}
              />
              <Button
                type="primary"
                onClick={handleSendChat}
                loading={processing}
                disabled={!chatInput.trim()}
                style={{
                  height: "auto",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {action !== "chat" && (
          <Button
            type="primary"
            onClick={processText}
            loading={processing}
            disabled={!selectedText || !model}
            className="process-button"
          >
            Process Text
          </Button>
        )}
      </Space>
    </div>
  );
};

export default TextProcessor;
