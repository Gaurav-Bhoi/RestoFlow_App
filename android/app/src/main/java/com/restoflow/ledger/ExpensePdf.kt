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
    if (data.hasKey("layout") && data.getString("layout") == "receipt") {
      ReceiptPdf.write(data, destination)
      return
    }
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

/** Matches the stacked receipt preview, with native shaping and page breaks. */
private object ReceiptPdf {
  private val ink = Color.rgb(34, 53, 45)
  private val forest = Color.rgb(24, 65, 55)
  private val muted = Color.rgb(103, 116, 108)
  private const val LEFT = 26f
  private const val WIDTH = 368
  private const val BOTTOM = 700f

  fun write(data: ReadableMap, destination: File) {
    val pdf = PdfDocument()
    var page: PdfDocument.Page? = null
    var pageNumber = 0
    var y = 0f
    fun block(value: String, width: Int, size: Float, color: Int = ink, alignment: Layout.Alignment = Layout.Alignment.ALIGN_NORMAL): StaticLayout {
      val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color; textSize = size }
      return StaticLayout.Builder.obtain(value, 0, value.length, paint, width)
        .setAlignment(alignment).setIncludePad(false).build()
    }
    fun draw(layout: StaticLayout, x: Float, top: Float) {
      val canvas = page!!.canvas
      canvas.save()
      canvas.translate(x, top)
      layout.draw(canvas)
      canvas.restore()
    }
    fun rule() {
      page!!.canvas.drawLine(LEFT, y, LEFT + WIDTH, y, Paint().apply { color = Color.rgb(226, 230, 222); strokeWidth = 1f })
    }
    fun beginPage() {
      page?.let { pdf.finishPage(it) }
      page = pdf.startPage(PdfDocument.PageInfo.Builder(420, 740, ++pageNumber).create())
      y = 32f
      for ((key, size) in listOf("restaurant" to 14f, "period" to 14f, "generated" to 12f)) {
        val layout = block(data.getString(key).orEmpty(), WIDTH, size, if (key == "restaurant") forest else muted, Layout.Alignment.ALIGN_CENTER)
        draw(layout, LEFT, y)
        y += layout.height + 18f
      }
      y += 16f
      rule()
      y += 30f
    }
    // Clip at native line boundaries so even a long note continues on a new page.
    fun flow(layout: StaticLayout, x: Float) {
      var line = 0
      while (line < layout.lineCount) {
        if (y + layout.getLineBottom(line) - layout.getLineTop(line) > BOTTOM) beginPage()
        val top = layout.getLineTop(line)
        var end = line
        while (end + 1 < layout.lineCount && y + layout.getLineBottom(end + 1) - top <= BOTTOM) end++
        val height = layout.getLineBottom(end) - top
        val canvas = page!!.canvas
        canvas.save()
        canvas.clipRect(x, y, x + layout.width, y + height)
        draw(layout, x, y - top)
        canvas.restore()
        y += height
        line = end + 1
      }
    }
    try {
      beginPage()
      val rows = data.getArray("rows")!!
      val notes = if (data.hasKey("notes")) data.getArray("notes") else null
      for (index in 0 until rows.size()) {
        val row = rows.getArray(index)!!
        val name = block(row.getString(0).orEmpty(), 246, 16f)
        val amount = block(row.getString(3).orEmpty(), 110, 16f, forest, Layout.Alignment.ALIGN_OPPOSITE)
        val quantity = block("${row.getString(1)} × ${row.getString(2)}", WIDTH, 12f, muted)
        val note = notes?.getString(index).orEmpty()
        val noteLayout = if (note.isNotEmpty()) block(note, WIDTH, 12f, muted) else null
        val height = maxOf(name.height, amount.height) + 8 + quantity.height + (noteLayout?.let { it.height + 8 } ?: 0) + 26
        if (y + height > BOTTOM && y > 200f) beginPage()
        val top = y
        flow(name, LEFT)
        val nameBottom = y
        // Amounts use their own column and never overlap the dish name.
        if (nameBottom - top == name.height.toFloat()) {
          draw(amount, LEFT + 258, top)
          y = maxOf(nameBottom, top + amount.height)
        } else flow(amount, LEFT + 258)
        y += 8
        flow(quantity, LEFT)
        if (noteLayout != null) { y += 8; flow(noteLayout, LEFT) }
        y += 26
      }
      val totals = data.getArray("totals")!!
      val totalLayouts = (0 until totals.size()).map { index ->
        val row = totals.getArray(index)!!
        val grand = index == totals.size() - 1
        block(row.getString(0).orEmpty(), 205, if (grand) 19f else 13f, if (grand) ink else muted) to
          block(row.getString(1).orEmpty(), 151, if (grand) 30f else 13f, forest, Layout.Alignment.ALIGN_OPPOSITE)
      }
      val totalsHeight = totalLayouts.sumOf { maxOf(it.first.height, it.second.height) + 30 } + 28
      if (y + totalsHeight > BOTTOM) beginPage()
      y = maxOf(y, minOf(538f, BOTTOM - totalsHeight))
      rule()
      y += 28
      for ((label, amount) in totalLayouts) {
        draw(label, LEFT, y)
        draw(amount, LEFT + 217, y)
        y += maxOf(label.height, amount.height) + 30
      }
      page?.let { pdf.finishPage(it) }
      destination.outputStream().use { pdf.writeTo(it) }
    } finally { pdf.close() }
  }
}
