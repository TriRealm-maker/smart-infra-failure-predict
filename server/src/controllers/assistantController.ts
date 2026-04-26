import { Request, Response } from 'express';
import { AssistantMessage, getAssistantResponse } from '../services/aiService';

const isAssistantMessage = (value: unknown): value is AssistantMessage => {
  if (!value || typeof value !== 'object') return false;
  const msg = value as { role?: unknown; content?: unknown };
  return (
    (msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string'
  );
};

export const chatWithAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body as { messages?: unknown };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ message: 'messages array is required' });
      return;
    }

    const validMessages = messages.filter(isAssistantMessage);
    if (validMessages.length === 0) {
      res.status(400).json({ message: 'No valid chat messages provided' });
      return;
    }

    const reply = await getAssistantResponse(validMessages);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({
      message: 'Error generating assistant response',
      error: (error as Error).message,
    });
  }
};
