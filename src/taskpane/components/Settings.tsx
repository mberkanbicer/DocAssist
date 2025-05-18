/* global console, localStorage, window */
import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, message, Modal, Radio } from "antd";
import { OllamaService } from "../services/OllamaService";
import { OpenRouterService } from "../services/OpenRouterService";
import "./Settings.css";

interface FormValues {
  baseUrl: string;
  defaultModel?: string;
  temperature: number;
  defaultLanguage: string;
  defaultStyle: string;
  apiKey?: string;
}

interface ProviderSettings {
  provider: "ollama" | "openrouter";
  ollamaSettings?: {
    baseUrl: string;
    defaultModel?: string;
    temperature: number;
    defaultLanguage: string;
    defaultStyle: string;
  };
  openRouterSettings?: {
    apiKey: string;
    baseUrl: string;
    defaultModel?: string;
    temperature: number;
    defaultLanguage: string;
    defaultStyle: string;
  };
}

const languageOptions = [
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Chinese", label: "Chinese" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Turkish", label: "Turkish" },
];

const styleOptions = [
  { value: "Scientific", label: "Scientific/Academic" },
  { value: "Formal", label: "Formal" },
  { value: "Informal", label: "Informal" },
  { value: "Friendly", label: "Friendly" },
  { value: "Creative", label: "Creative" },
  { value: "Warm", label: "Warm" },
  { value: "Cold", label: "Cold" },
  { value: "Normal", label: "Normal" },
];

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [form] = Form.useForm();
  const [provider, setProvider] = useState<"ollama" | "openrouter">("ollama");
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const ollamaService = new OllamaService();
  const openRouterService = new OpenRouterService();

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  // Load models when provider changes
  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [provider, isOpen]);

  const loadSettings = () => {
    const settingsStr = localStorage.getItem("providerSettings");
    if (settingsStr) {
      const settings: ProviderSettings = JSON.parse(settingsStr);
      setProvider(settings.provider || "ollama");

      const currentSettings = settings.provider === "ollama" ? settings.ollamaSettings : settings.openRouterSettings;

      if (currentSettings) {
        form.setFieldsValue({
          baseUrl: currentSettings.baseUrl,
          defaultModel: currentSettings.defaultModel,
          temperature: currentSettings.temperature,
          defaultLanguage: currentSettings.defaultLanguage,
          defaultStyle: currentSettings.defaultStyle,
          apiKey: settings.provider === "openrouter" ? (settings.openRouterSettings?.apiKey || "") : undefined,
        });
      }
    } else {
      // Set default values if no settings exist
      form.setFieldsValue({
        baseUrl: provider === "ollama" ? "http://localhost:11434" : "https://openrouter.ai/api/v1",
        temperature: 0.7,
        defaultLanguage: "Spanish",
        defaultStyle: "Normal",
      });
    }
  };

  // Update form values when provider changes
  useEffect(() => {
    const settingsStr = localStorage.getItem("providerSettings");
    if (settingsStr) {
      const settings: ProviderSettings = JSON.parse(settingsStr);
      const currentSettings = provider === "ollama" ? settings.ollamaSettings : settings.openRouterSettings;
      
      if (currentSettings) {
        form.setFieldsValue({
          baseUrl: currentSettings.baseUrl,
          defaultModel: currentSettings.defaultModel,
          temperature: currentSettings.temperature,
          defaultLanguage: currentSettings.defaultLanguage,
          defaultStyle: currentSettings.defaultStyle,
          apiKey: provider === "openrouter" ? (settings.openRouterSettings?.apiKey || "") : undefined,
        });
      } else {
        form.setFieldsValue({
          baseUrl: provider === "ollama" ? "http://localhost:11434" : "https://openrouter.ai/api/v1",
          temperature: 0.7,
          defaultLanguage: "Spanish",
          defaultStyle: "Normal",
        });
      }
    } else {
      form.setFieldsValue({
        baseUrl: provider === "ollama" ? "http://localhost:11434" : "https://openrouter.ai/api/v1",
        temperature: 0.7,
        defaultLanguage: "Spanish",
        defaultStyle: "Normal",
      });
    }
  }, [provider]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const models = provider === "ollama" ? await ollamaService.listModels() : await openRouterService.listModels();
      setAvailableModels(models);

      // Set default model if available
      const settingsStr = localStorage.getItem("providerSettings");
      if (settingsStr) {
        const settings: ProviderSettings = JSON.parse(settingsStr);
        const providerSettings = provider === "ollama" ? settings.ollamaSettings : settings.openRouterSettings;

        if (providerSettings?.defaultModel && models.includes(providerSettings.defaultModel)) {
          form.setFieldValue("defaultModel", providerSettings.defaultModel);
        }
      }
    } catch (error) {
      message.error(`Error loading ${provider} models. Please check your configuration.`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: FormValues) => {
    setLoading(true);
    try {
      const settingsStr = localStorage.getItem("providerSettings");
      const existingSettings: ProviderSettings = settingsStr ? JSON.parse(settingsStr) : { provider };

      const updatedSettings: ProviderSettings = {
        ...existingSettings,
        provider,
        ollamaSettings:
          provider === "ollama"
            ? {
                baseUrl: values.baseUrl,
                defaultModel: values.defaultModel,
                temperature: values.temperature || 0.7,
                defaultLanguage: values.defaultLanguage || "Spanish",
                defaultStyle: values.defaultStyle || "Normal",
              }
            : existingSettings.ollamaSettings,
        openRouterSettings:
          provider === "openrouter"
            ? {
                apiKey: values.apiKey || "",
                baseUrl: values.baseUrl,
                defaultModel: values.defaultModel,
                temperature: values.temperature || 0.7,
                defaultLanguage: values.defaultLanguage || "Spanish",
                defaultStyle: values.defaultStyle || "Normal",
              }
            : existingSettings.openRouterSettings,
      };

      // Save to localStorage
      localStorage.setItem("providerSettings", JSON.stringify(updatedSettings));

      // Dispatch a custom event to notify other components
      const event = new StorageEvent("storage", {
        key: "providerSettings",
        newValue: JSON.stringify(updatedSettings),
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      // Also dispatch a custom event for immediate update
      const customEvent = new CustomEvent("settingsUpdated", {
        detail: updatedSettings,
      });
      window.dispatchEvent(customEvent);

      message.success("Settings saved successfully");
      onClose();
    } catch (error) {
      message.error("Error saving settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Settings" open={isOpen} onCancel={onClose} footer={null} width={600} className="settings-modal">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          baseUrl: provider === "ollama" ? "http://localhost:11434" : "https://openrouter.ai/api/v1",
          temperature: 0.7,
          defaultLanguage: "Spanish",
          defaultStyle: "Normal",
        }}
      >
        <Form.Item name="provider" label="AI Provider">
          <Radio.Group onChange={(e) => setProvider(e.target.value)}>
            <Radio value="ollama">Ollama</Radio>
            <Radio value="openrouter">OpenRouter</Radio>
          </Radio.Group>
        </Form.Item>

        {provider === "ollama" ? (
          <>
            <Form.Item
              label="API URL"
              name="baseUrl"
              rules={[{ required: true, message: "Please enter the API URL" }]}
            >
              <Input placeholder="http://localhost:11434" />
            </Form.Item>
            <Form.Item label="Default Model" name="defaultModel">
              <Select
                placeholder="Select default model"
                options={availableModels.map((m) => ({ value: m, label: m }))}
                loading={loading}
              />
            </Form.Item>
            <Form.Item label="Default Language" name="defaultLanguage">
              <Select options={languageOptions} />
            </Form.Item>
            <Form.Item label="Default Style" name="defaultStyle">
              <Select options={styleOptions} />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              label="API URL"
              name="baseUrl"
              rules={[{ required: true, message: "Please enter the API URL" }]}
            >
              <Input placeholder="https://openrouter.ai/api/v1" />
            </Form.Item>
            <Form.Item
              label="API Key"
              name="apiKey"
              rules={[{ required: true, message: "Please enter your API key" }]}
            >
              <Input.Password placeholder="Enter your OpenRouter API key" />
            </Form.Item>
            <Form.Item label="Default Model" name="defaultModel">
              <Select
                placeholder="Select default model"
                options={availableModels.map((m) => ({ value: m, label: m }))}
                loading={loading}
              />
            </Form.Item>
            <Form.Item label="Default Language" name="defaultLanguage">
              <Select options={languageOptions} />
            </Form.Item>
            <Form.Item label="Default Style" name="defaultStyle">
              <Select options={styleOptions} />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Settings
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Settings;
