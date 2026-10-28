package com.restoflow.ledger

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import com.facebook.react.bridge.ReadableMap
import java.io.File

/** A4 output uses native text shaping (including rupee and Devanagari glyphs). */
object ExpensePdf {
  private const val MARGIN = 40f
  private const val BOTTOM = 790f
  private val widths = listOf(62, 225, 108, 120)
  private val ink = Color.rgb(34, 53, 45)

  fun write(data: ReadableMap, destination: File) {
    val pdf = PdfDocument()
    val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { color = ink; textSize = 10f }
    var page: PdfDocument.Page? = null
    var canvas: Canvas? = null
    var y = 0f
    var pageNumber = 0
    fun text(value: String, x: Float, top: Float, width: Int, size: Float = 10f, right: Boolean = false): Int {
      paint.textSize = size
      val layout = StaticLayout.Builder.obtain(value, 0, value.length, paint, width)
        .setAlignment(if (right) Layout.Alignment.ALIGN_OPPOSITE else Layout.Alignment.ALIGN_NORMAL)
        .setIncludePad(false).build()
      canvas!!.save()
      canvas!!.translate(x, top)
      layout.draw(canvas!!)
      canvas!!.restore()
      return layout.height
    }
    fun finishPage() {
      if (page != null) {
        text("$pageNumber", MARGIN, 808f, 515, 9f, true)
        pdf.finishPage(page)
      }
    }
    fun beginPage() {
      finishPage()
      pageNumber++
      page = pdf.startPage(PdfDocument.PageInfo.Builder(595, 842, pageNumber).create())
      canvas = page!!.canvas
      y = MARGIN
      y += text("RestoFlow", MARGIN, y, 515, 22f) + 6
      y += text(data.getString("restaurant") ?: "", MARGIN, y, 515, 12f) + 12
      y += text(data.getString("title") ?: "", MARGIN, y, 515, 18f) + 6
      y += text(data.getString("period") ?: "", MARGIN, y, 515, 11f) + 6
      y += text(data.getString("generated") ?: "", MARGIN, y, 515, 9f) + 20
      val columns = data.getArray("columns")!!
      var x = MARGIN
      var height = 0
      for (index in 0..3) {
        height = maxOf(height, text(columns.getString(index).orEmpty(), x, y, widths[index] - 8, 10f, index == 3))
        x += widths[index]
      }
      y += height + 16
    }
    try {
      beginPage()
      val rows = data.getArray("rows")!!
      for (index in 0 until rows.size()) {
        val row = rows.getArray(index)!!
        paint.textSize = 10f
        val layouts = (0..3).map { column ->
          val value = row.getString(column).orEmpty()
          StaticLayout.Builder.obtain(value, 0, value.length, paint, widths[column] - 8).setIncludePad(false).build()
        }
        val height = layouts.maxOf { it.height } + 16
        if (y + height > BOTTOM) beginPage()
        var x = MARGIN
        for (column in 0..3) {
          text(row.getString(column).orEmpty(), x, y, widths[column] - 8, 10f, column == 3)
          x += widths[column]
        }
        y += height
      }
      if (y + 120 > BOTTOM) beginPage()
      y += 24
      val totals = data.getArray("totals")!!
      for (index in 0 until totals.size()) {
        val row = totals.getArray(index)!!
        val size = if (index == totals.size() - 1) 14f else 11f
        val height = maxOf(text(row.getString(0).orEmpty(), MARGIN, y, 340, size), text(row.getString(1).orEmpty(), MARGIN + 350, y, 165, size, true))
        y += height + 12
      }
      finishPage()
      destination.outputStream().use { pdf.writeTo(it) }
    } finally { pdf.close() }
  }
}
