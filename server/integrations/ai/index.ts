import { AIProvider } from './aiProvider.interface.js';
import { GeminiAIProvider } from './gemini.provider.js';
import { MockAIProvider } from './mockAi.provider.js';

let aiProviderInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!aiProviderInstance) {
    const useMock = process.env.USE_MOCK_DATA === 'true' || !process.env.AI_API_KEY;
    if (useMock) {
      aiProviderInstance = new MockAIProvider();
    } else {
      aiProviderInstance = new GeminiAIProvider();
    }
  }
  return aiProviderInstance;
}

export * from './aiProvider.interface.js';
export * from './mockAi.provider.js';
export * from './gemini.provider.js';
