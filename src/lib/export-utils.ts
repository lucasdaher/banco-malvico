import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Tipagem genérica para os dados da tabela
type TableData = { [key: string]: any }[];

/**
 * Exporta dados para um arquivo CSV.
 * @param data - Array de objetos a serem exportados.
 * @param filename - Nome do arquivo (ex: 'relatorio.csv').
 */
export const exportToCsv = (data: TableData, filename: string): void => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header])).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta dados para uma planilha Excel (.xlsx).
 * @param data - Array de objetos a serem exportados.
 * @param filename - Nome do arquivo (ex: 'relatorio.xlsx').
 */
export const exportToXlsx = (data: TableData, filename: string): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  XLSX.writeFile(workbook, filename);
};

/**
 * Exporta dados para um arquivo PDF com uma tabela.
 * @param headers - Array de strings com os nomes das colunas.
 * @param data - Array de objetos a serem exportados.
 * @param title - Título do relatório.
 * @param filename - Nome do arquivo (ex: 'relatorio.pdf').
 */
export const exportToPdf = (
  headers: string[],
  data: TableData,
  title: string,
  filename: string
): void => {
  const doc = new jsPDF();
  doc.text(title, 14, 20);
  autoTable(doc, {
    head: [headers],
    body: data.map((row) => headers.map((header) => row[header])),
    startY: 25,
  });
  doc.save(filename);
};

/**
 * Exporta um conteúdo HTML para um arquivo .docx (compatível com Word).
 * @param htmlContent - String HTML do conteúdo a ser exportado.
 * @param filename - Nome do arquivo (ex: 'relatorio.docx').
 */
export const exportToDocx = (htmlContent: string, filename: string): void => {
  const header =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
    "xmlns:w='urn:schemas-microsoft-com:office:word' " +
    "xmlns='http://www.w3.org/TR/REC-html40'>" +
    "<head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + htmlContent + footer;

  const source =
    "data:application/vnd.ms-word;charset=utf-8," +
    encodeURIComponent(sourceHTML);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = filename;
  fileDownload.click();
  document.body.removeChild(fileDownload);
};
