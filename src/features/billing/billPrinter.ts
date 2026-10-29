import { NativeModules, Platform } from 'react-native';
import RNPrint from 'react-native-print';

export async function printCustomerBill(html: string, jobName: string) {
  if (Platform.OS === 'android') {
    // RNPrint's Android onFinish also resolves after cancellation. Read the
    // actual PrintJob state before acknowledging a receipt as sent.
    if (!NativeModules.BillPrinter)
      throw new Error('The bill printer is unavailable. Rebuild the app.');
    await NativeModules.BillPrinter.print(html, jobName);
  } else {
    const result = await RNPrint.print({ html, jobName });
    // iOS returns null when UIPrintInteractionController reports completed=false.
    if (result === null)
      throw Object.assign(
        new Error('Printing was cancelled. Your bill is saved.'),
        {
          code: 'PRINT_CANCELLED',
        },
      );
  }
}
