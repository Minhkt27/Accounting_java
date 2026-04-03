// @ts-ignore
import * as XLSX from 'xlsx/xlsx.mjs';

/**
 * Utility service for exporting data to various formats and handling printing.
 */
export const ExportService = {
  /**
   * Exports an array of objects to an Excel file (.xlsx)
   * 
   * @param data Array of objects to export
   * @param fileName The name of the file (without extension)
   * @param sheetName The name of the worksheet
   * @param headers Optional custom column headers. Map of { dataKey: "Header Label" }
   */
  exportToExcel: (data: any[], fileName: string, sheetName: string = 'Sheet1', headers?: Record<string, string>) => {
    try {
      // 1. Prepare data (apply custom headers if provided)
      let formattedData = data;
      if (headers) {
        formattedData = data.map(item => {
          const newItem: any = {};
          Object.keys(headers).forEach(key => {
            if (item.hasOwnProperty(key)) {
              newItem[headers[key]] = item[key];
            }
          });
          return newItem;
        });
      }

      // 2. Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // 3. Create workbook and append worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // 4. Trigger download
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel Export Error:', error);
      alert('Đã xảy ra lỗi khi xuất file Excel');
    }
  }
};
