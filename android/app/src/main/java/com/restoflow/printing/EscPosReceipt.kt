package com.restoflow.printing

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint

class PrinterFailure(val code: String) : Exception(code)

interface PrinterTransport {
  fun write(bytes: ByteArray)
  fun readStatus(): Int?
  fun close()
}

/** Raster text preserves Unicode without relying on vendor code pages. */
object EscPosReceipt {
  fun print(text: String, paperWidth: Int, transport: PrinterTransport, checkCancelled: () -> Unit) {
    if (text.length > 30000 || paperWidth !in listOf(58, 80)) throw PrinterFailure("RECEIPT_TOO_LARGE")
    val width = if (paperWidth == 80) 576 else 384
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { color = Color.BLACK; textSize = if (paperWidth == 80) 28f else 24f }
    val layout = StaticLayout.Builder.obtain(text, 0, text.length, paint, width - 16)
      .setAlignment(Layout.Alignment.ALIGN_NORMAL).setIncludePad(true).build()
    if (layout.height > 50000) throw PrinterFailure("RECEIPT_TOO_LARGE")
    transport.write(byteArrayOf(27, 64))
    val rowBytes = width / 8
    for (top in 0 until layout.height step 64) {
      checkCancelled()
      val height = minOf(64, layout.height - top)
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)
      canvas.drawColor(Color.WHITE)
      canvas.translate(8f, -top.toFloat())
      layout.draw(canvas)
      val bytes = ByteArray(8 + rowBytes * height)
      byteArrayOf(29, 118, 48, 0, rowBytes.toByte(), 0, height.toByte(), 0).copyInto(bytes)
      for (y in 0 until height) for (x in 0 until width) {
        val pixel = bitmap.getPixel(x, y)
        if (Color.red(pixel) + Color.green(pixel) + Color.blue(pixel) < 384) {
          val index = 8 + y * rowBytes + x / 8
          bytes[index] = (bytes[index].toInt() or (128 shr (x % 8))).toByte()
        }
      }
      bitmap.recycle()
      transport.write(bytes)
    }
    transport.write(byteArrayOf(10, 10, 10))
  }

  fun checkStatus(transport: PrinterTransport) {
    // No reply means status is unavailable, never evidence that paper is loaded.
    val status = (1..4).map { query ->
      transport.write(byteArrayOf(16, 4, query.toByte()))
      val value = transport.readStatus()
      if (value == null || value and 0x93 != 0x12) return
      value
    }
    if (status[1] and 0x20 != 0 || status[3] and 0x60 != 0) throw PrinterFailure("PAPER_OUT")
    if (status[1] and 0x04 != 0) throw PrinterFailure("COVER_OPEN")
    if (status[2] and 0x6c != 0 || status[1] and 0x40 != 0) throw PrinterFailure("PRINTER_ERROR")
    if (status[0] and 0x08 != 0) throw PrinterFailure("PRINTER_OFFLINE")
    if (status[3] and 0x0c != 0) throw PrinterFailure("PAPER_LOW")
  }
}
