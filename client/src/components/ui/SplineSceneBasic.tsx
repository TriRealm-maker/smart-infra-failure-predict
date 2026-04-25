'use client';

import { FormEvent, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { Card } from './Card';

const Spline = lazy(() => import('@splinetool/react-spline'));

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const SYSTEM_PROMPT = `You are ARIA, an AI field assistant for CrisisGuard, a crisis management platform for field engineers managing mesh radio networks. You help engineers with: finding repair crews, interpreting failure analytics, explaining SOPs for mesh node failures, reading structural maps, and triaging medical or equipment emergencies. Keep answers short, practical, and field-ready. Use bullet points when listing steps.`;

const ROBOT_SCENE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

export function SplineSceneBasic() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'ARIA online. Ask for field-ready help with mesh failures, crews, or SOP steps.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setErrorText('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('Missing VITE_GROQ_API_KEY in frontend environment.');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...nextMessages.map((message) => ({ role: message.role, content: message.content })),
          ],
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Groq request failed (${response.status}): ${details}`);
      }

      const data = await response.json();
      const assistantText = data?.choices?.[0]?.message?.content?.trim();

      if (!assistantText) {
        throw new Error('Groq returned an empty response.');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get response.';
      setErrorText(message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I could not reach ARIA right now. Please retry in a moment.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="w-full h-[520px] bg-black/[0.96] relative overflow-hidden border-white/10">
      <div className="flex h-full flex-col md:flex-row">
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Interactive 3D
          </h2>
          <p className="mt-4 text-neutral-300 max-w-lg">
            Tap the robot to open ARIA and get fast field guidance for failures, SOPs, and triage.
          </p>
        </div>

        <div className="flex-1 relative min-h-[260px] md:min-h-0">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <span className="loader" />
              </div>
            }
          >
            <Spline scene={ROBOT_SCENE_URL} className="w-full h-full" />
          </Suspense>

          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="absolute right-4 bottom-4 z-20 inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-white transition-colors"
            aria-label="Open ARIA chat"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Ask ARIA</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.aside
            initial={{ x: '100%', opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.7 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="absolute top-0 right-0 h-full w-full md:w-1/2 bg-black/90 text-white z-30 border-l border-white/15 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
              <div>
                <p className="font-semibold">ARIA Assistant</p>
                <p className="text-xs text-white/60">Field-ready support for mesh operations</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'ml-auto bg-indigo-500/30 border border-indigo-400/40'
                      : 'bg-white/10 border border-white/15'
                  }`}
                >
                  {message.content}
                </div>
              ))}

              {isTyping && (
                <div className="inline-flex items-center gap-1 rounded-xl px-3 py-2 bg-white/10 border border-white/15">
                  <span className="h-2 w-2 rounded-full bg-white/80 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-white/80 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 rounded-full bg-white/80 animate-bounce" />
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-white/15">
              {errorText ? <p className="text-xs text-red-300 mb-2 truncate">{errorText}</p> : null}
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask ARIA..."
                  className="flex-1 rounded-lg bg-black/70 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                />
                <button
                  type="submit"
                  disabled={isTyping || input.trim().length === 0}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-2.5"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </Card>
  );
}

