import { AIProvider } from './aiProvider.interface.js';
import { GeminiAIProvider } from './gemini.provider.js';
import { MockAIProvider } from './mockAi.provider.js';

let aiProviderInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!aiProviderInstance) {
    if (process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0) {
      aiProviderInstance = new GeminiAIProvider();
    } else {
      aiProviderInstance = new MockAIProvider();
    }
  }
  return aiProviderInstance;
}

export * from './aiProvider.interface.js';
export * from './mockAi.provider.js';
export * from './gemini.provider.js';
