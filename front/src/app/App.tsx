import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage, Message, ResponseMode } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SessionHistory, HistoryEntry } from './components/SessionHistory';
import { Dashboard } from './components/Dashboard';
import { sendChatRequest, resetConversation } from './services/databricks-api';
import { useExportPDF } from './hooks/useExportPDF';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import SwellLogo from './components/figma/SwellLogo';

export default function App() {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [history, setHistory]         = useState<HistoryEntry[]>([]);
  const [darkMode, setDarkMode]       = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Título dinâmico na aba
  useEffect(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      const truncated = lastUser.content.length > 40
        ? lastUser.content.slice(0, 40) + '...'
        : lastUser.content;
      document.title = `${truncated} — SwellData`;
    } else {
      document.title = 'SwellData';
    }
  }, [messages]);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef   = useRef<HTMLElement>(null);
  const messageRefs     = useRef<Record<string, HTMLDivElement | null>>({});

  const { exportPDF } = useExportPDF(messages, messagesAreaRef);

  // Scroll inteligente: só rola se o usuário já estiver perto do fim
  const scrollToBottomIfNeeded = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Sempre rola ao enviar nova mensagem do usuário
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    if (lastMsg.role === 'user') {
      scrollToBottom();
    } else {
      scrollToBottomIfNeeded();
    }
  }, [messages, scrollToBottom, scrollToBottomIfNeeded]);

  const handleSendMessage = useCallback(async (content: string, mode: ResponseMode) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setHistory((prev) => [
      ...prev,
      { messageId: userMessage.id, question: content, timestamp: new Date() },
    ]);
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await sendChatRequest(apiMessages, mode);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        mode,
        sql_query:   response.sql_query,
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Verifique a configuracao da API.');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    setHistory([]);
    resetConversation();
    document.title = 'SwellData';
    toast.success('Nova conversa iniciada');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportPDF();
      toast.success('PDF exportado com sucesso');
    } catch (e) {
      console.error('Erro ao exportar PDF:', e);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleHistoryClick = (messageId: string) => {
    const el = messageRefs.current[messageId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-200">
      <Toaster />
      <ChatHeader
        onNewChat={handleNewChat}
        onExport={handleExport}
        hasMessages={hasMessages}
        isExporting={isExporting}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        {hasMessages && (
          <SessionHistory entries={history} onEntryClick={handleHistoryClick} />
        )}

        <div className="flex flex-col flex-1 overflow-hidden bg-white dark:bg-slate-900">
          <main className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
            {!hasMessages ? (
              <Dashboard onQuestionClick={(q) => handleSendMessage(q, 'normal')} />
            ) : (
              <div className="pb-4" ref={messagesAreaRef}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    ref={(el) => { messageRefs.current[message.id] = el; }}
                  >
                    <ChatMessage
                      message={message}
                      onSuggestionClick={(text) => handleSendMessage(text, 'normal')}
                    />
                  </div>
                ))}

                {isLoading && <ResponseSkeleton />}

                <div ref={messagesEndRef} />
              </div>
            )}
          </main>

          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

function ResponseSkeleton() {
  return (
    <div className="flex gap-3 px-6 py-5 bg-slate-50/70 dark:bg-slate-800/40">
      <div className="size-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 flex-shrink-0">
        <SwellLogo className="size-full object-contain" ariaLabel="SwellData" />
      </div>
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}
