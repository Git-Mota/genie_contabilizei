import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage, Message, ResponseMode } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SessionHistory, HistoryEntry } from './components/SessionHistory';
import { Dashboard } from './components/Dashboard';
import { sendChatRequest, resetConversation } from './services/databricks-api';
import { useExportPDF } from './hooks/useExportPDF';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import logo from '../assets/logo.png';

export default function App() {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [history, setHistory]         = useState<HistoryEntry[]>([]);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null); // ref para captura do PDF
  const messageRefs     = useRef<Record<string, HTMLDivElement | null>>({});

  const { exportPDF } = useExportPDF(messages, messagesAreaRef);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    toast.success('Nova conversa iniciada');
  };

const handleExport = async () => {
  setIsExporting(true);
  try {
    await exportPDF();
    toast.success('PDF exportado com sucesso');
  } catch (e) {
    console.error('Erro ao exportar PDF:', e); // adicione esse log
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
    <div className="h-screen flex flex-col bg-white">
      <Toaster />
      <ChatHeader
        onNewChat={handleNewChat}
        onExport={handleExport}
        hasMessages={hasMessages}
        isExporting={isExporting}
      />

      <div className="flex flex-1 overflow-hidden">
        {hasMessages && (
          <SessionHistory entries={history} onEntryClick={handleHistoryClick} />
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {!hasMessages ? (
              <Dashboard onQuestionClick={(q) => handleSendMessage(q, 'normal')} />
            ) : (
              // ref aqui para o html2canvas capturar
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

                {isLoading && (
                  <div className="flex gap-3 px-6 py-5 bg-slate-50/70">
                    <div className="size-7 rounded-full bg-white border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
                      <img src={logo} alt="Copilot" className="size-full object-contain" />
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-0.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      Consultando Genie...
                    </div>
                  </div>
                )}
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
