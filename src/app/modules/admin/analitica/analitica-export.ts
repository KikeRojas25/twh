import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

/**
 * Exportadores compartidos por los 4 reportes analíticos.
 * Reciben filas ya "aplanadas" (claves = encabezados de columna).
 */

export function exportarExcel(filas: Record<string, unknown>[], nombreArchivo: string, hoja = 'Reporte'): void {
    if (!filas.length) { return; }

    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = { Sheets: { [hoja]: worksheet }, SheetNames: [hoja] };
    const buffer: ArrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    FileSaver.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${nombreArchivo}.xlsx`);
}

export function exportarCsv(filas: Record<string, unknown>[], nombreArchivo: string): void {
    if (!filas.length) { return; }

    const columnas = Object.keys(filas[0]);
    const escapar = (v: unknown): string => {
        const s = v === null || v === undefined ? '' : String(v);
        // Comillas dobles y separadores obligan a entrecomillar el campo (RFC 4180)
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lineas = [
        columnas.join(';'),
        ...filas.map(f => columnas.map(c => escapar(f[c])).join(';')),
    ];

    // BOM para que Excel en español abra el UTF-8 sin romper las tildes
    const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    FileSaver.saveAs(blob, `${nombreArchivo}.csv`);
}
