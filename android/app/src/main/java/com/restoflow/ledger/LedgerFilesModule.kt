package com.restoflow.ledger

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import androidx.core.content.FileProvider
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.io.File
import java.util.UUID
import java.util.concurrent.Executors

class LedgerFilesPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(LedgerFilesModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class LedgerFilesModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val worker = Executors.newSingleThreadExecutor()
  private var pickerPromise: Promise? = null
  private var exportFile: File? = null
  private val receiptDirectory get() = File(context.filesDir, "ledger/receipts").apply { mkdirs() }
  // Keep an export alive while the system picker or another app reads it.
  // Android can purge cache files even while the preview screen is open.
  private val reportDirectory get() = File(context.filesDir, "ledger/reports").apply { mkdirs() }
  private val types = mapOf("application/pdf" to "pdf", "image/jpeg" to "jpg", "image/png" to "png", "image/webp" to "webp")

  init {
    context.addActivityEventListener(object : BaseActivityEventListener() {
      override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != PICK_RECEIPT && requestCode != SAVE_PDF) return
        val promise = pickerPromise ?: return
        val file = exportFile
        pickerPromise = null
        exportFile = null
        val uri = data?.data
        if (resultCode != Activity.RESULT_OK || uri == null) {
          promise.resolve(if (requestCode == SAVE_PDF) false else null)
          return
        }
        worker.execute {
          try {
            if (requestCode == SAVE_PDF) {
              requireNotNull(file)
              context.contentResolver.openOutputStream(uri, "wt").use { output ->
                requireNotNull(output)
                file.inputStream().use { it.copyTo(output) }
              }
              promise.resolve(true)
            } else {
              val type = context.contentResolver.getType(uri) ?: ""
              var name = "receipt.${types[type] ?: "pdf"}"
              context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) name = cursor.getString(0) ?: name
              }
              promise.resolve(copyReceipt(uri, name, type))
            }
          } catch (error: Exception) {
            promise.reject("LEDGER_FILE", error.message ?: "ledger.actionFailed", error)
          }
        }
      }
    })
  }

  override fun getName() = "LedgerFiles"

  private fun safeFile(value: String): File {
    val uri = Uri.parse(value)
    require(uri.scheme == "file")
    val file = File(requireNotNull(uri.path)).canonicalFile
    require(listOf(receiptDirectory, reportDirectory).any { file.path.startsWith(it.canonicalPath + File.separator) })
    require(file.isFile)
    return file
  }

  private fun contentUri(file: File): Uri = FileProvider.getUriForFile(context, context.packageName + ".ledger.files", file)

  private fun copyReceipt(uri: Uri, name: String, type: String): WritableMap {
    val extension = types[type] ?: throw IllegalArgumentException("ledger.receiptType")
    require(uri.scheme == "content" || uri.scheme == "file")
    val destination = File(receiptDirectory, "${UUID.randomUUID()}.$extension")
    try {
      var bytes = 0L
      context.contentResolver.openInputStream(uri).use { input ->
        requireNotNull(input)
        destination.outputStream().use { output ->
          val buffer = ByteArray(8192)
          while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            bytes += read
            if (bytes > MAX_BYTES) throw IllegalArgumentException("ledger.receiptTooLarge")
            output.write(buffer, 0, read)
          }
        }
      }
      require(bytes > 0)
      return Arguments.createMap().apply {
        putString("uri", Uri.fromFile(destination).toString())
        putString("name", name.take(200))
        putString("type", type)
      }
    } catch (error: Exception) {
      destination.delete()
      throw error
    }
  }

  private fun launchPicker(intent: Intent, code: Int, promise: Promise, file: File? = null) {
    UiThreadUtil.runOnUiThread {
      val activity = reactApplicationContext.currentActivity
      if (activity == null || pickerPromise != null) {
        promise.reject("LEDGER_BUSY", "ledger.actionFailed")
        return@runOnUiThread
      }
      try {
        pickerPromise = promise
        exportFile = file
        activity.startActivityForResult(intent, code)
      } catch (error: Exception) {
        pickerPromise = null
        exportFile = null
        promise.reject("LEDGER_PICKER", "ledger.actionFailed", error)
      }
    }
  }

  @ReactMethod fun pickReceipt(promise: Promise) {
    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "*/*"
      putExtra(Intent.EXTRA_MIME_TYPES, types.keys.toTypedArray())
    }
    launchPicker(intent, PICK_RECEIPT, promise)
  }

  @ReactMethod fun importReceipt(uri: String, name: String, type: String, promise: Promise) {
    worker.execute {
      try { promise.resolve(copyReceipt(Uri.parse(uri), name, type)) }
      catch (error: Exception) { promise.reject("LEDGER_IMPORT", error.message ?: "ledger.receiptFailed", error) }
    }
  }

  @ReactMethod fun createPdf(document: ReadableMap, promise: Promise) {
    worker.execute {
      reportDirectory.listFiles()?.filter { System.currentTimeMillis() - it.lastModified() > REPORT_LIFETIME }?.forEach { it.delete() }
      val file = File(reportDirectory, "expense-report-${UUID.randomUUID()}.pdf")
      try {
        ExpensePdf.write(document, file)
        promise.resolve(Uri.fromFile(file).toString())
      } catch (error: Exception) {
        file.delete()
        promise.reject("LEDGER_PDF", "ledger.reportFailed", error)
      }
    }
  }

  @ReactMethod fun savePdf(uri: String, name: String, promise: Promise) {
    try {
      val file = safeFile(uri)
      val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "application/pdf"
        putExtra(Intent.EXTRA_TITLE, name.substringAfterLast('/'))
      }
      launchPicker(intent, SAVE_PDF, promise, file)
    } catch (error: Exception) { promise.reject("LEDGER_EXPORT", "ledger.actionFailed", error) }
  }

  @ReactMethod fun sharePdf(uri: String, name: String, channel: String, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val shared = contentUri(safeFile(uri))
        val intent = Intent(Intent.ACTION_SEND).apply {
          type = "application/pdf"
          putExtra(Intent.EXTRA_STREAM, shared)
          putExtra(Intent.EXTRA_SUBJECT, name)
          clipData = ClipData.newRawUri(name, shared)
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        if (channel == "whatsapp") {
          val packages = listOf("com.whatsapp", "com.whatsapp.w4b")
          val target = packages.firstOrNull { intent.setPackage(it).resolveActivity(context.packageManager) != null }
          intent.setPackage(target)
        }
        context.startActivity(Intent.createChooser(intent, name).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        promise.resolve(null)
      } catch (error: Exception) { promise.reject("LEDGER_SHARE", "ledger.actionFailed", error) }
    }
  }

  @ReactMethod fun preview(uri: String, type: String, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val shared = contentUri(safeFile(uri))
        val intent = Intent(Intent.ACTION_VIEW).apply {
          setDataAndType(shared, type)
          clipData = ClipData.newRawUri("Receipt", shared)
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
        promise.resolve(null)
      } catch (error: Exception) { promise.reject("LEDGER_PREVIEW", "ledger.previewFailed", error) }
    }
  }

  @ReactMethod fun renderReceipt(uri: String, promise: Promise) {
    worker.execute {
      try {
        ParcelFileDescriptor.open(safeFile(uri), ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
          PdfRenderer(descriptor).use { renderer ->
            renderer.openPage(0).use { page ->
              val scale = minOf(1200f / page.width, 1800f / page.height)
              val bitmap = Bitmap.createBitmap(maxOf(1, (page.width * scale).toInt()), maxOf(1, (page.height * scale).toInt()), Bitmap.Config.ARGB_8888)
              try {
                bitmap.eraseColor(Color.WHITE)
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                val directory = File(context.cacheDir, "ledger/previews").apply { mkdirs() }
                val image = File(directory, "${UUID.randomUUID()}.png")
                image.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
                promise.resolve(Arguments.createMap().apply {
                  putString("uri", Uri.fromFile(image).toString())
                  putDouble("aspectRatio", page.width.toDouble() / page.height)
                  putInt("pages", renderer.pageCount)
                })
              } finally { bitmap.recycle() }
            }
          }
        }
      } catch (error: Exception) { promise.reject("LEDGER_PREVIEW", "ledger.previewFailed", error) }
    }
  }

  @ReactMethod fun copyText(text: String, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Expense report", text))
        promise.resolve(null)
      } catch (error: Exception) { promise.reject("LEDGER_COPY", "ledger.actionFailed", error) }
    }
  }

  override fun invalidate() {
    pickerPromise?.reject("LEDGER_CLOSED", "ledger.actionFailed")
    pickerPromise = null
    worker.shutdown()
    super.invalidate()
  }

  companion object {
    const val PICK_RECEIPT = 9401
    const val SAVE_PDF = 9402
    const val MAX_BYTES = 10L * 1024 * 1024
    const val REPORT_LIFETIME = 7L * 24 * 60 * 60 * 1000
  }
}
