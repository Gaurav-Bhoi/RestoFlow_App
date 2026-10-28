import { NativeModules } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { ExpenseReceipt } from './types';

export interface ExpensePdfDocument {
  restaurant: string;
  title: string;
  period: string;
  generated: string;
  columns: string[];
  rows: string[][];
  totals: string[][];
}
export interface ReceiptPreview {
  uri: string;
  aspectRatio: number;
  pages: number;
}
interface LedgerFilesModule {
  pickReceipt(): Promise<ExpenseReceipt | null>;
  importReceipt(
    uri: string,
    name: string,
    type: string,
  ): Promise<ExpenseReceipt>;
  createPdf(document: ExpensePdfDocument): Promise<string>;
  savePdf(uri: string, name: string): Promise<boolean>;
  sharePdf(uri: string, name: string, channel: string): Promise<void>;
  preview(uri: string, type: string): Promise<void>;
  renderReceipt(uri: string): Promise<ReceiptPreview>;
  copyText(text: string): Promise<void>;
}
function nativeFiles(): LedgerFilesModule {
  const module = NativeModules.LedgerFiles as LedgerFilesModule | undefined;
  if (!module) throw new Error('ledger.nativeUnavailable');
  return module;
}
export const ledgerFiles = {
  createPdf: (document: ExpensePdfDocument) =>
    nativeFiles().createPdf(document),
  savePdf: (uri: string, name: string) => nativeFiles().savePdf(uri, name),
  sharePdf: (uri: string, name: string, channel: string) =>
    nativeFiles().sharePdf(uri, name, channel),
  preview: (receipt: ExpenseReceipt) =>
    nativeFiles().preview(receipt.uri, receipt.type),
  renderReceipt: async (receipt: ExpenseReceipt) =>
    nativeFiles().renderReceipt(receipt.uri),
  copyText: (text: string) => nativeFiles().copyText(text),
};

export async function pickExpenseReceipt(
  source: 'camera' | 'gallery' | 'file',
) {
  if (source === 'file') return nativeFiles().pickReceipt();
  const response = await (source === 'camera'
    ? launchCamera
    : launchImageLibrary)({
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 0.9,
    maxWidth: 2400,
    maxHeight: 2400,
  });
  if (response.didCancel) return null;
  const asset = response.assets?.[0];
  if (response.errorCode || !asset?.uri)
    throw new Error('ledger.receiptFailed');
  if ((asset.fileSize ?? 0) > 10 * 1024 * 1024)
    throw new Error('ledger.receiptTooLarge');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(asset.type ?? ''))
    throw new Error('ledger.receiptType');
  return nativeFiles().importReceipt(
    asset.uri,
    asset.fileName ?? 'receipt.jpg',
    asset.type!,
  );
}

export function ledgerError(cause: unknown, fallback = 'ledger.actionFailed') {
  return cause instanceof Error && cause.message.startsWith('ledger.')
    ? cause.message
    : fallback;
}
