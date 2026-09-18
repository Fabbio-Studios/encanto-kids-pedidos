import * as XLSX from 'xlsx';
import type { OrderDraft } from '../types';

export function exportOrderToExcel(order: OrderDraft): string {
  const totalPieces = order.products.reduce((sum, product) => sum + product.quantity, 0);
  const dateLabel = new Date(order.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const rows: Array<Array<string | number>> = [
    ['Código', 'Cor', 'Quantidade', 'Tamanho'],
    ...order.products.map((product) => [product.code, product.color, product.quantity, product.size]),
    [],
    ['Data do pedido', dateLabel],
    ['Total de produtos', order.products.length],
    ['Total de peças', totalPieces]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 }
  ];
  worksheet['!freeze'] = { ySplit: 1 };

  const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:F1');
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: column })];
    if (headerCell) {
      headerCell.s = {
        fill: { fgColor: { rgb: 'D9F0FF' } },
        font: { bold: true, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedido');

  const filename = `pedido-roupas-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return filename;
}
