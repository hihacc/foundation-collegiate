export interface AiModelSpec {
  id: string;
  name: string;
  provider: 'openrouter' | 'huggingface' | 'google' | 'groq' | 'local';
  size: string;
  level: 'Light' | 'Medium' | 'High' | 'Very High' | 'Client Engine';
  accuracy: number; // 1-5 stars
  speed: number; // 1-5 stars
  cost: number; // 1-5 dollar signs
  suitability: string;
  isRecommended?: boolean;
  description: string;
}

export const AI_MODELS_REGISTRY: AiModelSpec[] = [
  // OpenRouter Free & High Performance Vision Models
  {
    id: 'openrouter/free',
    name: 'OpenRouter Universal Vision (Free)',
    provider: 'openrouter',
    size: 'Cloud Vision',
    level: 'High',
    accuracy: 5,
    speed: 5,
    cost: 1,
    suitability: '⭐ 100% Free Forever via OpenRouter',
    isRecommended: true,
    description: 'Universal free router that automatically routes to the best available free multimodal vision model.'
  },
  {
    id: 'qwen/qwen2.5-vl-72b-instruct',
    name: 'Qwen 2.5 VL 72B (OpenRouter)',
    provider: 'openrouter',
    size: '72B',
    level: 'Very High',
    accuracy: 5,
    speed: 4,
    cost: 1,
    suitability: '⭐ Premier Handwriting & Form OCR',
    isRecommended: true,
    description: 'Premier vision-language model with top handwriting recognition on OpenRouter.'
  },
  {
    id: 'qwen/qwen3-vl-8b-instruct',
    name: 'Qwen 3 VL 8B (OpenRouter)',
    provider: 'openrouter',
    size: '8B',
    level: 'Medium',
    accuracy: 4,
    speed: 5,
    cost: 1,
    suitability: 'Fast Document Perception',
    description: 'Next-generation fast vision-language model on OpenRouter.'
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (OpenRouter)',
    provider: 'openrouter',
    size: 'Cloud Vision',
    level: 'High',
    accuracy: 5,
    speed: 5,
    cost: 1,
    suitability: 'Google Vision on OpenRouter',
    description: 'Ultra fast and reliable vision intelligence from Google hosted on OpenRouter.'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini (OpenRouter)',
    provider: 'openrouter',
    size: 'Cloud Vision',
    level: 'Medium',
    accuracy: 5,
    speed: 5,
    cost: 2,
    suitability: 'OpenAI Vision via OpenRouter',
    description: 'Cost-effective, highly accurate OpenAI document reading model.'
  },

  // Hugging Face Models
  {
    id: 'Qwen/Qwen2.5-VL-72B-Instruct',
    name: 'Qwen2.5-VL-72B-Instruct',
    provider: 'huggingface',
    size: '72B',
    level: 'Very High',
    accuracy: 5,
    speed: 4,
    cost: 2,
    suitability: 'Hugging Face Serverless',
    description: 'Direct Hugging Face Inference API endpoint for Qwen vision.'
  },
  {
    id: 'Qwen/Qwen2.5-VL-7B-Instruct',
    name: 'Qwen2.5-VL-7B-Instruct',
    provider: 'huggingface',
    size: '7B',
    level: 'Medium',
    accuracy: 4,
    speed: 5,
    cost: 1,
    suitability: 'Lightweight Vision Model',
    description: 'Fast vision-language model for document layout understanding.'
  },

  // Google AI Studio Direct
  {
    id: 'gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash',
    provider: 'google',
    size: 'Cloud Vision',
    level: 'Light',
    accuracy: 5,
    speed: 5,
    cost: 1,
    suitability: 'Google AI Studio API Key',
    description: 'Direct Google AI Studio API with 15 RPM free tier.'
  },

  // Local Unlimited WebAssembly
  {
    id: 'local-wasm-tesseract',
    name: 'Unlimited Local WebAssembly Engine',
    provider: 'local',
    size: 'Client-Side',
    level: 'Client Engine',
    accuracy: 4,
    speed: 5,
    cost: 1,
    suitability: 'Zero Credits / Always Free Forever',
    description: 'Runs 100% in-browser via Tesseract.js with anti-glare canvas normalization. Zero API calls.'
  }
];

export interface AiConnectionConfig {
  id: string;
  name: string;
  provider: 'openrouter' | 'huggingface' | 'google' | 'groq' | 'local';
  encrypted_key: string;
  masked_key: string;
  model_id: string;
  is_active: boolean;
  is_default: boolean;
  status: 'working' | 'credits_depleted' | 'invalid_key' | 'not_tested';
  last_tested_at?: string;
  latency_ms?: number;
  created_at: string;
  updated_at: string;
}
