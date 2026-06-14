import { useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import type { Message } from '../components/ChatMessage';

function formatDate(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Converte SVG element para PNG dataURL sem html2canvas
async function svgToDataURL(svgEl: SVGElement): Promise<string | null> {
  try {
    const clone = svgEl.cloneNode(true) as SVGElement;

    // Força background branco no clone
    clone.setAttribute('style', 'background: white;');

    // Serializa o SVG
    const serializer = new XMLSerializer();
    const svgStr     = serializer.serializeToString(clone);
    const svgBlob    = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url        = URL.createObjectURL(svgBlob);

    return await new Promise((resolve) => {
      const img    = new Image();
      img.onload   = () => {
        const canvas  = document.createElement('canvas');
        canvas.width  = svgEl.clientWidth  * 2 || 600;
        canvas.height = svgEl.clientHeight * 2 || 300;
        const ctx     = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  } catch {
    return null;
  }
}

// Remove sintaxe markdown do texto
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}

// Detecta se o conteúdo é JSON de gráfico
function isChartContent(content: string): boolean {
  try {
    const parsed = JSON.parse(content.trim());
    return !!(parsed.chartType && Array.isArray(parsed.data));
  } catch { return false; }
}

export function useExportPDF(
  messages: Message[],
  containerRef: React.RefObject<HTMLDivElement>
) {
  const isExporting = useRef(false);

  const exportPDF = useCallback(async () => {
    if (isExporting.current || messages.length === 0) return;
    isExporting.current = true;

    try {
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW    = pdf.internal.pageSize.getWidth();
      const pageH    = pdf.internal.pageSize.getHeight();
      const margin   = 14;
      const contentW = pageW - margin * 2;
      let y          = margin;

      const checkPage = (needed: number) => {
        if (y + needed > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // ── Cabeçalho ────────────────────────
      pdf.setFillColor(0, 51, 102);
      pdf.rect(0, 0, pageW, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Copilot Contabilizei', margin, 11);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Exportado em ${formatDate(new Date())}`, pageW - margin, 11, { align: 'right' });
      y = 26;

      // ── Mensagens ────────────────────────
      for (const msg of messages) {
        const isUser  = msg.role === 'user';
        const isChart = !isUser && msg.mode === 'chart' && isChartContent(msg.content);

        checkPage(12);

        // Label
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(isUser ? 80 : 0, isUser ? 80 : 87, isUser ? 80 : 184);
        pdf.text(isUser ? 'Você' : 'Copilot', margin, y);
        y += 5;

        // Texto da resposta (exceto quando é gráfico puro)
        if (!isChart) {
          const clean = stripMarkdown(msg.content);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(40, 40, 40);
          const lines = pdf.splitTextToSize(clean, contentW);
          checkPage(lines.length * 4.5);
          pdf.text(lines, margin, y);
          y += lines.length * 4.5 + 2;
        }

        // Gráfico — captura SVG do DOM pelo data-message-id
        if (isChart && containerRef.current) {
          const msgEl  = containerRef.current.querySelector(`[data-message-id="${msg.id}"]`);
          const svgEl  = msgEl?.querySelector('.recharts-surface') as SVGElement | null;

          if (svgEl) {
            const imgData = await svgToDataURL(svgEl);
            if (imgData) {
              const imgW = contentW;
              const imgH = Math.min((svgEl.clientHeight / svgEl.clientWidth) * imgW, 80);
              checkPage(imgH + 4);
              pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH);
              y += imgH + 4;
            }
          }
        }

        // SQL gerada
        if (msg.sql_query) {
          const sqlLines = pdf.splitTextToSize(msg.sql_query, contentW - 6);
          const boxH     = sqlLines.length * 4 + 6;
          checkPage(boxH + 4);

          pdf.setFillColor(245, 247, 250);
          pdf.rect(margin, y, contentW, boxH, 'F');
          pdf.setFontSize(7.5);
          pdf.setFont('courier', 'normal');
          pdf.setTextColor(30, 100, 50);
          pdf.text(sqlLines, margin + 3, y + 4);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(40, 40, 40);
          y += boxH + 4;
        }

        // Separador
        checkPage(6);
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, y, pageW - margin, y);
        y += 6;
      }

      pdf.save(`conversa-copilot-${Date.now()}.pdf`);
    } finally {
      isExporting.current = false;
    }
  }, [messages, containerRef]);

  return { exportPDF };
}