# DocAssist Documentation

## Overview

DocAssist is a Microsoft Word add-in that leverages AI to enhance document creation and editing. It provides intelligent assistance through both local AI processing via Ollama and cloud-based processing via OpenRouter.

## Architecture

### Components

1. **TextProcessor Component**
   - Main interface for document assistance
   - Handles text selection and processing
   - Manages interactive chat interface
   - Implements streaming responses
   - Handles smart text formatting

2. **Settings Component**
   - Manages provider configuration
   - Handles API credentials
   - Controls model selection
   - Manages response styles
   - Persists settings across sessions

3. **Service Layer**
   - OllamaService: Handles local AI processing
   - OpenRouterService: Manages cloud AI processing
   - Implements streaming responses
   - Handles error management

### Data Flow

1. **Document Processing Flow**
   ```
   User Selection → DocAssist → Service Layer → AI Provider → Response → Document
   ```

2. **Chat Flow**
   ```
   User Input → DocAssist → Service Layer → AI Provider → Streaming Response → UI
   ```

3. **Settings Flow**
   ```
   User Configuration → Settings Component → localStorage → Service Layer
   ```

## Features

### Document Assistance

1. **Smart Operations**
   - Intelligent paraphrasing
   - Context-aware summarization
   - Smart text extension
   - Multi-language translation
   - Custom prompt processing

2. **Interactive Chat**
   - Real-time streaming
   - AI thinking process visualization
   - Message history
   - Smart document insertion

3. **Smart Formatting**
   - Bold text (`**text**`)
   - Newlines (`---`)
   - Thinking process (`<think>...</think>`)
   - Heading removal (`###`)

### AI Providers

1. **Ollama (Local)**
   - Local model deployment
   - Custom model support
   - Offline processing
   - Low latency

2. **OpenRouter (Cloud)**
   - Multiple model support
   - API key authentication
   - Cloud processing
   - High availability

### Response Styles

1. **Style Options**
   - Scientific/Academic
   - Formal
   - Informal
   - Friendly
   - Creative
   - Warm
   - Cold
   - Normal

2. **Style Implementation**
   - Temperature control
   - Custom prompts
   - Style persistence
   - Default settings

## Settings Management

### Configuration Options

1. **Provider Settings**
   - Provider selection
   - API configuration
   - Base URL management
   - API key storage

2. **Model Settings**
   - Model selection
   - Default model
   - Model availability
   - Model switching

3. **Response Settings**
   - Default language
   - Response style
   - Temperature
   - Format preferences

### Persistence

1. **Storage**
   - localStorage implementation
   - Settings structure
   - Cross-session persistence
   - Error handling

2. **Updates**
   - Real-time updates
   - Event handling
   - State management
   - UI synchronization

## Error Handling

1. **Service Errors**
   - Connection issues
   - API errors
   - Model availability
   - Rate limiting

2. **UI Errors**
   - Input validation
   - State management
   - Loading states
   - Error messages

3. **Settings Errors**
   - Storage issues
   - Configuration validation
   - Default fallbacks
   - Recovery procedures

## Best Practices

1. **Development**
   - TypeScript usage
   - React patterns
   - Error handling
   - State management

2. **User Experience**
   - Responsive design
   - Loading indicators
   - Error feedback
   - Intuitive interface

3. **Performance**
   - Streaming optimization
   - State updates
   - Memory management
   - Resource handling

## Future Enhancements

1. **Planned Features**
   - Additional AI providers
   - Enhanced formatting
   - Batch processing
   - Template support

2. **Technical Improvements**
   - Performance optimization
   - Error handling
   - Testing coverage
   - Documentation updates

## Project Structure
```
src/
├── taskpane/
│   ├── components/
│   │   ├── utility/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── Home.tsx
│   │   ├── Settings.tsx
│   │   └── TextProcessor.tsx
│   ├── context/
│   │   └── AppContext.tsx
│   ├── services/
│   │   └── api.ts
│   └── types/
│       └── errors.ts
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Microsoft Word (desktop or web version)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add your API keys and configuration:
     ```
     API_BASE_URL=your_api_base_url
     API_KEY=your_api_key
     ```

### Development
1. Start the development server:
   ```bash
   npm start
   ```
2. Open Word and load the add-in

### Building for Production
```bash
npm run build
```

## Component Documentation

### ErrorBoundary
Handles React component errors gracefully and provides a fallback UI.

### LoadingSpinner
A reusable loading indicator component with customizable size and color.

### Settings
Manages AI provider settings and API configurations.

### TextProcessor
Handles text generation and processing using the selected AI provider.

## API Documentation

### APIService
Singleton service for handling API requests with built-in error handling.

Methods:
- `get<T>(endpoint: string): Promise<APIResponse<T>>`
- `post<T>(endpoint: string, data: any): Promise<APIResponse<T>>`

### Error Types
- `APIError`: Represents API-related errors
- `ValidationError`: Represents form validation errors
- `ErrorState`: Global error state interface

## State Management
The application uses React Context for global state management through `AppContext`.

State includes:
- Loading state
- Error state
- Settings (provider, API key, model)

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License 