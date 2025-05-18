# DocAssist - AI-Powered Document Assistant

A Microsoft Word add-in that uses AI to assist with document creation, editing, and enhancement. DocAssist supports both local AI models through Ollama and cloud-based models through OpenRouter to provide intelligent document assistance.

## Features

- Document Assistance:
  - Smart text paraphrasing
  - Intelligent summarization
  - Context-aware text extension
  - Multi-language translation
  - Custom prompt processing
  - Interactive chat interface with streaming responses
  - AI thinking process visualization
  - Smart text formatting (bold, newlines)

- AI Provider Support:
  - Ollama (local AI processing)
  - OpenRouter (cloud AI processing)

- Response Styles:
  - Scientific/Academic
  - Formal
  - Informal
  - Friendly
  - Creative
  - Warm
  - Cold
  - Normal

- Settings Management:
  - Provider selection
  - API configuration
  - Model selection
  - Default language
  - Response style
  - Temperature control
  - Persistent settings across sessions

## Setup

1. Install and start Ollama (for local AI processing)
   - Download from [ollama.ai](https://ollama.ai)
   - Run `ollama serve` to start the server
   - Pull required models using `ollama pull <model-name>`

2. Or get an OpenRouter API key (for cloud AI processing)
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Get your API key from the dashboard

3. Configure the add-in:
   - Open the Settings panel
   - Select your preferred provider (Ollama or OpenRouter)
   - Enter API credentials if using OpenRouter
   - Select your preferred model
   - Configure default language and response style
   - Adjust temperature settings

## Usage

### Text Processing

1. Select text in your Word document
2. Choose the desired action:
   - Paraphrase
   - Summarize
   - Extend
   - Translate
   - Generate
   - Custom prompt
3. Select the target language for translations
4. Click "Process" to generate the result
5. The processed text will replace your selection

### Chat Interface

1. Select the "Chat" action
2. Type your message in the chat input
3. Use `{{text}}` to include selected text in your message
4. Press Enter or click Send
5. View the AI's response with:
   - Real-time streaming
   - Thinking process visualization
   - Formatted text (bold, newlines)
6. Click "Insert to Document" to add the response to your document

### Text Formatting

The add-in supports various text formatting options:
- Text between `**` is displayed in bold
- `###` markers are removed
- `---` is replaced with newlines
- `<think>` tags show the AI's thinking process in italic gray

## Development

The project is built with:
- React
- TypeScript
- Ant Design
- Office.js
- Ollama API / OpenRouter API

### Project Structure

```
word-ai-content-generator/
├── src/
│   ├── taskpane/
│   │   ├── components/
│   │   │   ├── TextProcessor.tsx    # Main text processing component
│   │   │   ├── Settings.tsx        # Settings management
│   │   │   └── css/
│   │   ├── services/
│   │   │   ├── OllamaService.ts    # Ollama API integration
│   │   │   └── OpenRouterService.ts # OpenRouter API integration
│   │   └── taskpane.html
│   └── ...
├── manifest.xml
└── package.json
```

### Building for Production

1. Build the project:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` directory

## Troubleshooting

### Common Issues

1. **Add-in not loading**
   - Ensure the development server is running
   - Verify the manifest.xml is properly configured

2. **Ollama-specific issues**
   - Ensure Ollama is running (`ollama serve`)
   - Run `ollama list` to see available models
   - Pull the required model using `ollama pull <model-name>`

3. **OpenRouter-specific issues**
   - Verify your API key is correct
   - Check if you have sufficient credits
   - Ensure the selected model is available

4. **Connection errors**
   - Check your internet connection
   - Verify API endpoints are accessible
   - Check firewall settings

5. **Settings not saving**
   - Check browser console for errors
   - Verify localStorage is available
   - Try clearing browser cache

### Debugging Tips

- Check the browser console (F12) for error messages
- Verify service status (Ollama or OpenRouter)
- Check network requests in the browser's developer tools
- Monitor localStorage for settings persistence

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Ollama](https://ollama.ai/) for providing local AI models
- [OpenRouter](https://openrouter.ai/) for providing cloud AI models
- [Microsoft Office Add-ins](https://docs.microsoft.com/en-us/office/dev/add-ins/) for the development platform
- [Ant Design](https://ant.design/) for the UI components