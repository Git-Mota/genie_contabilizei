// Databricks API Configuration
// IMPORTANT: Replace these placeholders with your actual Databricks credentials
const DATABRICKS_CONFIG = {
  // Your Databricks workspace URL (e.g., 'https://your-workspace.cloud.databricks.com')
  workspaceUrl: 'YOUR_DATABRICKS_WORKSPACE_URL',
  
  // Your Databricks API token (from User Settings > Access Tokens)
  apiToken: 'YOUR_DATABRICKS_API_TOKEN',
  
  // Your model serving endpoint name
  endpointName: 'YOUR_MODEL_ENDPOINT_NAME',
};

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

/**
 * Sends a chat request to Databricks Model Serving endpoint
 * 
 * To use this function:
 * 1. Create a model serving endpoint in Databricks
 * 2. Get your workspace URL and API token
 * 3. Replace the placeholders in DATABRICKS_CONFIG above
 * 
 * API Documentation:
 * https://docs.databricks.com/api/workspace/servingendpoints
 */
export async function sendChatRequest(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  // Check if configuration is set
  if (
    DATABRICKS_CONFIG.workspaceUrl === 'YOUR_DATABRICKS_WORKSPACE_URL' ||
    DATABRICKS_CONFIG.apiToken === 'YOUR_DATABRICKS_API_TOKEN' ||
    DATABRICKS_CONFIG.endpointName === 'YOUR_MODEL_ENDPOINT_NAME'
  ) {
    // Return mock response when credentials are not configured
    return getMockResponse(messages[messages.length - 1].content);
  }

  try {
    const url = `${DATABRICKS_CONFIG.workspaceUrl}/serving-endpoints/${DATABRICKS_CONFIG.endpointName}/invocations`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DATABRICKS_CONFIG.apiToken}`,
      },
      body: JSON.stringify({
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      } as ChatRequest),
    });

    if (!response.ok) {
      throw new Error(`Databricks API error: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Databricks API:', error);
    throw error;
  }
}

/**
 * Mock response function for demonstration purposes
 * This will be used when API credentials are not configured
 */
function getMockResponse(userMessage: string): string {
  const messageLower = userMessage.toLowerCase();
  
  // Respostas específicas baseadas em palavras-chave
  if (messageLower.includes('faturamento') && messageLower.includes('médio')) {
    return `📊 **Análise de Faturamento dos Clientes**

Com base nos dados atualizados até fevereiro de 2026, aqui está o panorama do faturamento:

**Faturamento Médio Mensal:** R$ 45.750,00

**Distribuição por Faixa:**
• Até R$ 20.000: 412 clientes (35%)
• R$ 20.001 - R$ 50.000: 385 clientes (33%)
• R$ 50.001 - R$ 100.000: 245 clientes (21%)
• Acima de R$ 100.000: 128 clientes (11%)

**Insights:**
✓ O faturamento médio cresceu 8,3% em relação ao trimestre anterior
✓ 54% dos clientes estão no Simples Nacional
✓ O setor de serviços apresenta o maior ticket médio: R$ 62.400

Posso detalhar alguma faixa específica ou analisar por segmento?`;
  }
  
  if (messageLower.includes('quantos') && (messageLower.includes('cliente') || messageLower.includes('clientes'))) {
    return `👥 **Base de Clientes Ativos**

Atualmente você possui **1.170 clientes ativos** na base.

**Detalhamento:**
• Ativos: 1.170 clientes (92%)
• Inativos: 98 clientes (8%)
• **Total na base:** 1.268 empresas

**Crescimento:**
• Novos clientes em fev/2026: +47
• Churn no último mês: 12 clientes
• Taxa de retenção: 94,5%

**Distribuição Regional:**
• Sudeste: 687 clientes (58,7%)
• Sul: 289 clientes (24,7%)
• Centro-Oeste: 112 clientes (9,6%)
• Nordeste: 58 clientes (5,0%)
• Norte: 24 clientes (2,0%)

**Por Porte:**
• MEI: 234 empresas
• Microempresa: 758 empresas
• Empresa de Pequeno Porte: 178 empresas

Gostaria de ver mais detalhes sobre algum segmento específico?`;
  }
  
  if (messageLower.includes('cnae')) {
    return `🏢 **Análise de CNAEs - Top 10 Mais Comuns**

Aqui estão os CNAEs mais frequentes na sua base de clientes:

**1. CNAE 4781-4/00 - Comércio varejista de artigos do vestuário e acessórios**
   → 156 clientes (13,3%)

**2. CNAE 6201-5/00 - Desenvolvimento de programas de computador sob encomenda**
   → 143 clientes (12,2%)

**3. CNAE 7020-4/00 - Atividades de consultoria em gestão empresarial**
   → 128 clientes (10,9%)

**4. CNAE 4923-0/02 - Serviço de transporte de passageiros - locação de automóveis com motorista**
   → 97 clientes (8,3%)

**5. CNAE 4744-0/05 - Comércio varejista de medicamentos e artigos de perfumaria**
   → 89 clientes (7,6%)

**6. CNAE 5611-2/01 - Restaurantes e similares**
   → 76 clientes (6,5%)

**7. CNAE 8630-5/04 - Atividade médica ambulatorial restrita a consultas**
   → 68 clientes (5,8%)

**8. CNAE 4120-4/00 - Construção de edifícios**
   → 61 clientes (5,2%)

**9. CNAE 6311-9/00 - Tratamento de dados, provedores de serviços de aplicação**
   → 54 clientes (4,6%)

**10. CNAE 8599-6/03 - Treinamento em desenvolvimento profissional**
    → 48 clientes (4,1%)

**Outros CNAEs:** 250 clientes (21,5%)

**Observações:**
• Forte presença de comércio e serviços (67% da base)
• Crescimento de 23% em tech/TI nos últimos 12 meses
• Setores tradicionais mantêm estabilidade

Quer análise fiscal específica para algum destes CNAEs?`;
  }
  
  if (messageLower.includes('regime') && messageLower.includes('tributário')) {
    return `💼 **Distribuição por Regime Tributário**

**Simples Nacional:** 632 clientes (54,0%)
• Anexo I (Comércio): 198 clientes
• Anexo III (Serviços): 287 clientes
• Anexo V (Serviços): 147 clientes

**Lucro Presumido:** 421 clientes (36,0%)
• Faturamento médio: R$ 78.300/mês

**Lucro Real:** 117 clientes (10,0%)
• Faturamento médio: R$ 245.000/mês

**Recomendações Pendentes:**
⚠️ 34 clientes podem se beneficiar de mudança de regime
💡 Economia potencial estimada: R$ 287.400/ano

Quer que eu liste os clientes com oportunidades de otimização tributária?`;
  }
  
  if (messageLower.includes('obrigação') || messageLower.includes('obrigações')) {
    return `📅 **Obrigações Fiscais - Próximos Vencimentos**

**Esta Semana:**
• 14/02 - DCTF: 23 clientes pendentes
• 15/02 - INSS: 156 empresas

**Este Mês (Fevereiro/2026):**
• 20/02 - DAS Simples Nacional: 632 empresas
• 20/02 - GPS/DARF Lucro Presumido: 421 empresas
• 25/02 - DEFIS: 89 clientes (MEI)
• 28/02 - EFD-Contribuições: 538 empresas

**Status Atual:**
✅ Em dia: 1.098 clientes (93,8%)
⚠️ Próximo ao vencimento: 52 clientes
🔴 Atrasadas: 20 clientes

**Alertas:**
• 12 clientes com risco de multa alta (>R$ 5.000)
• 8 empresas precisam regularizar certidões

Deseja ver a lista de clientes com pendências críticas?`;
  }
  
  if (messageLower.includes('inadimplên') || messageLower.includes('atraso')) {
    return `💳 **Análise de Inadimplência**

**Status Financeiro dos Clientes:**

**Adimplentes:** 1.089 clientes (93,1%)
**Inadimplentes:** 81 clientes (6,9%)

**Tempo de Atraso:**
• Até 30 dias: 47 clientes
• 31-60 dias: 21 clientes
• 61-90 dias: 9 clientes
• Acima de 90 dias: 4 clientes

**Valor Total em Atraso:** R$ 143.250,00

**Por Segmento:**
• Comércio: 38 clientes (47%)
• Serviços: 31 clientes (38%)
• Indústria: 12 clientes (15%)

**Ações em Andamento:**
📧 Notificações enviadas: 81
☎️ Contatos telefônicos: 34
⚖️ Em processo de cobrança judicial: 2

Posso gerar um relatório detalhado dos clientes em atraso?`;
  }
  
  // Resposta padrão para outras perguntas
  return `Olá! Analisei sua pergunta: "${userMessage}"

Como Copilot Contabilizei, posso ajudar você com:

📊 **Análises de Dados:**
• Faturamento médio e distribuição de clientes
• Quantidade de clientes ativos e inativos
• CNAEs mais comuns e análise setorial
• Regimes tributários e oportunidades de economia

📅 **Gestão Fiscal:**
• Próximos vencimentos e obrigações
• Status de pendências e alertas
• Análise de inadimplência

💡 **Insights Estratégicos:**
• Tendências de crescimento por setor
• Oportunidades de otimização tributária
• Benchmarking com mercado

Posso detalhar algum desses tópicos para você? Basta perguntar!`;
}