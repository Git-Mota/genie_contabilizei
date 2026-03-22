import { useState, useRef, useEffect } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage, Message } from './components/ChatMessage';
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

  const handleSendMessage = async (content: string) => {
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

      const response = await sendChatRequest(apiMessages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Verifique sua configuracao da API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    resetConversation();
    toast.success('Nova conversa iniciada');
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <Toaster />
      <ChatHeader onNewChat={handleNewChat} />

      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 px-4">
              <img
                src={logo}
                alt="Contabilizei"
                className="size-20 mx-auto"
              />
              <h2 className="text-2xl font-semibold text-[#003366]">
                Copilot Contabilizei
              </h2>
              <p className="text-zinc-600 max-w-md">
                Ola! Sou seu assistente inteligente contabil.
                Como posso ajuda-lo hoje?
              </p>
              <div className="grid gap-3 max-w-2xl mx-auto mt-8">
                <button
                  onClick={() => handleSendMessage('Qual e o faturamento medio dos meus clientes?')}
                  className="p-4 border border-zinc-200 rounded-lg hover:bg-cyan-50 text-left transition-colors"
                >
                  <p className="text-sm text-zinc-900">
                    Qual e o faturamento medio dos meus clientes?
                  </p>
                </button>
                <button
                  onClick={() => handleSendMessage('Quantos clientes ativos eu possuo?')}
                  className="p-4 border border-zinc-200 rounded-lg hover:bg-cyan-50 text-left transition-colors"
                >
                  <p className="text-sm text-zinc-900">
                    Quantos clientes ativos eu possuo?
                  </p>
                </button>
                <button
                  onClick={() => handleSendMessage('Qual e o CNAE mais comum entre meus clientes?')}
                  className="p-4 border border-zinc-200 rounded-lg hover:bg-cyan-50 text-left transition-colors"
                >
                  <p className="text-sm text-zinc-900">
                    Qual e o CNAE mais comum entre meus clientes?
                  </p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-4 px-4 py-6 bg-cyan-50">
                <div className="flex-shrink-0">
                  <img src={logo} alt="Copilot" className="size-8 rounded-sm" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
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
