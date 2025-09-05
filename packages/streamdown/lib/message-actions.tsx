import { CheckIcon, CopyIcon, DownloadIcon, FileDownIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import { marked } from "marked";
import { save } from "./utils";

type MessageActionsProps = {
  content: string;
  className?: string;
};

export const MessageCopyButton = ({ content, className }: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground ${className}`}
      title="Copy message to clipboard"
    >
      {copied ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </button>
  );
};

export const MessageExportDropdown = ({ content, className }: MessageActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleMarkdownDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
    const filename = `message-${timestamp}.md`;
    save(filename, content, "text/markdown");
    setIsOpen(false);
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      // Import jsPDF and html2canvas dynamically to avoid bundle bloat
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf") as Promise<{ default: any }>,
        import("html2canvas") as Promise<{ default: any }>
      ]);

      // Create a temporary container with the markdown rendered as HTML
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText = `
        position: absolute;
        top: -10000px;
        left: -10000px;
        width: 800px;
        padding: 40px;
        background: white;
        color: black;
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.6;
      `;

      // Configure marked for better PDF rendering
      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      // Convert markdown to HTML using marked
      const htmlContent = marked.parse(content);

      // Add styles to the HTML content for better PDF rendering
      const styledHtmlContent = `
        <style>
          h1 { font-size: 24px; margin: 20px 0 10px 0; font-weight: bold; }
          h2 { font-size: 20px; margin: 18px 0 8px 0; font-weight: bold; }
          h3 { font-size: 16px; margin: 16px 0 6px 0; font-weight: bold; }
          h4 { font-size: 14px; margin: 14px 0 6px 0; font-weight: bold; }
          h5 { font-size: 12px; margin: 12px 0 6px 0; font-weight: bold; }
          h6 { font-size: 10px; margin: 10px 0 6px 0; font-weight: bold; }
          p { margin: 8px 0; line-height: 1.6; }
          ul, ol { margin: 8px 0; padding-left: 20px; }
          li { margin: 4px 0; }
          code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: 'Monaco', 'Consolas', monospace; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; overflow-x: auto; }
          pre code { background: none; padding: 0; }
          blockquote { border-left: 4px solid #ddd; padding-left: 10px; margin: 10px 0; font-style: italic; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          strong { font-weight: bold; }
          em { font-style: italic; }
        </style>
        ${htmlContent}
      `;

      tempDiv.innerHTML = styledHtmlContent;
      document.body.appendChild(tempDiv);

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add image to PDF, handling multiple pages if needed
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      // Save PDF
      const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
      const filename = `message-${timestamp}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground"
        title="Export message"
      >
        <DownloadIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 w-32 rounded-md border bg-popover p-1 shadow-md z-50">
          <button
            type="button"
            onClick={handleMarkdownDownload}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted transition-colors"
          >
            <FileTextIcon className="h-3 w-3" />
            Markdown
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            disabled={isExporting}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDownIcon className="h-3 w-3" />
            PDF
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export const MessageActions = ({ content, className }: MessageActionsProps) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <MessageCopyButton content={content} />
      <MessageExportDropdown content={content} />
    </div>
  );
};