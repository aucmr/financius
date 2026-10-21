declare module "xlsx-populate/browser/xlsx-populate.min.js" {
  export type XlsxCellValue =
    | string
    | number
    | boolean
    | Date
    | null
    | undefined;

  export interface XlsxCell {
    rowNumber(): number;
    value(): XlsxCellValue;
    value(value: XlsxCellValue): XlsxCell;
  }

  export interface XlsxRange {
    startCell(): XlsxCell;
    value(): XlsxCellValue[][];
  }

  export interface XlsxSheet {
    cell(row: number, column: number): XlsxCell;
    name(): string;
    usedRange(): XlsxRange | undefined;
  }

  export interface XlsxWorkbook {
    outputAsync(options?: {
      type?: "blob";
      password?: string;
    }): Promise<Blob>;
    sheet(index: number): XlsxSheet;
    sheets(): XlsxSheet[];
  }

  export interface XlsxPopulateApi {
    dateToNumber(date: Date): number;
    fromBlankAsync(): Promise<XlsxWorkbook>;
    fromDataAsync(
      data: Blob,
      options?: { password?: string },
    ): Promise<XlsxWorkbook>;
    numberToDate(serial: number): Date;
  }

  const XlsxPopulate: XlsxPopulateApi;

  export default XlsxPopulate;
}
