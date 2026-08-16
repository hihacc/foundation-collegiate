export interface AiModelSpec {
  id: string;
  name: string;
  provider: 'huggingface' | 'google' | 'groq' | 'local';
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
  {
    id: 'Qwen/Qwen2.5-VL-72B-Instruct',
    name: 'Qwen2.5-VL-72B-Instruct',
    provider: 'huggingface',
    size: '72B',
    level: 'Very High',
    accuracy: 5,
    speed: 4,
    cost: 2,
    suitability: '⭐ Ideal for TFC Admission Forms',
    isRecommended: true,
    description: 'Premier vision-language model on Hugging Face. High accuracy handwritten admission form parsing.'
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
  {
    id: 'Qwen/Qwen2.5-VL-3B-Instruct',
    name: 'Qwen2.5-VL-3B-Instruct',
    provider: 'huggingface',
    size: '3B',
    level: 'Light',
    accuracy: 4,
    speed: 5,
    cost: 1,
    suitability: 'Fast & Lightweight',
    description: 'Ultra-fast inference with low latency. Good for clean scans and printed text.'
  },
  {
    id: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
    name: 'Llama-3.2-11B-Vision-Instruct',
    provider: 'huggingface',
    size: '11B',
    level: 'Medium',
    accuracy: 4,
    speed: 4,
    cost: 2,
    suitability: 'Reliable Meta Vision Model',
    description: 'Strong general document perception and OCR extraction capabilities.'
  },
  {
    id: 'meta-llama/Llama-3.2-90B-Vision-Instruct',
    name: 'Llama-3.2-90B-Vision-Instruct',
    provider: 'huggingface',
    size: '90B',
    level: 'Very High',
    accuracy: 5,
    speed: 2,
    cost: 4,
    suitability: 'Complex Document Layouts',
    description: 'High capacity model for dense multi-column tabular forms.'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash',
    provider: 'google',
    size: 'Cloud Vision',
    level: 'Light',
    accuracy: 5,
    speed: 5,
    cost: 1,
    suitability: 'Unlimited Free Tier via AI Studio',
    description: 'Fast multimodal vision from Google AI Studio. 100% free with AIzaSy... API key.'
  },
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
  provider: 'huggingface' | 'google' | 'groq' | 'local';
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
