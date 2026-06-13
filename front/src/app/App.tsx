import { useState, useRef, useEffect } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage, Message, ResponseMode } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { sendChatRequest, resetConversation } from './services/databricks-api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import logo from '../assets/logo.png';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, mode: ResponseMode) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Passa o mode para o backend — lógica de formatação fica no servidor
      const response = await sendChatRequest(apiMessages, mode);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        mode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Verifique a configuracao da API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    resetConversation();
    toast.success('Nova conversa iniciada');
  };

  const SUGGESTED = [
    'Qual é o faturamento médio dos meus clientes?',
    'Quantos clientes ativos eu possuo?',
    'Qual é o CNAE mais comum entre meus clientes?',
  ];

  return (
    <div className="h-screen flex flex-col bg-white">
      <Toaster />
      <ChatHeader onNewChat={handleNewChat} />

      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6 gap-8">
            <div className="text-center space-y-3">
              <div className="size-14 rounded-2xl bg-[#003366] flex items-center justify-center p-2.5 mx-auto">
                <img src={logo} alt="Contabilizei" className="size-full object-contain" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Copilot Contabilizei</h2>
              <p className="text-sm text-slate-500 max-w-xs">
                Faça perguntas sobre seus dados contábeis. Escolha como quer receber a resposta antes de enviar.
              </p>
            </div>

            <div className="w-full max-w-xl space-y-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q, 'normal')}
                  className="
                    w-full text-left text-sm px-4 py-3
                    border border-slate-200 rounded-xl
                    hover:border-slate-400 hover:bg-slate-50
                    text-slate-700 transition-all duration-150
                  "
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
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
  );
}
