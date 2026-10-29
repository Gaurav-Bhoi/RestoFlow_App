package com.restoflow.ledger

import android.content.Context
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintJob
import android.print.PrintJobInfo
import android.print.PrintManager
import android.webkit.WebView
import android.webkit.WebViewClient
import com.facebook.react.bridge.*

/** Distinguishes accepted print jobs from cancelled system dialogs. */
class BillPrinterModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val handler = Handler(Looper.getMainLooper())
  private var pending: Promise? = null
  private var webView: WebView? = null
  private var manager: PrintManager? = null
  private var job: PrintJob? = null
  private var adapterFinished = false
  private var attempts = 0
  override fun getName() = "BillPrinter"

  private fun finish(code: String? = null, message: String = "Unable to confirm the print job.") {
    val promise = pending ?: return
    pending = null
    webView?.destroy()
    webView = null
    job = null
    manager = null
    if (code == null) promise.resolve(null) else promise.reject(code, message)
  }

  private fun checkResult() {
    if (pending == null || !adapterFinished) return
    when (job?.info?.state) {
      PrintJobInfo.STATE_QUEUED, PrintJobInfo.STATE_STARTED,
      PrintJobInfo.STATE_BLOCKED, PrintJobInfo.STATE_COMPLETED -> finish()
      PrintJobInfo.STATE_CANCELED -> finish("PRINT_CANCELLED", "Printing was cancelled. Your bill is saved.")
      PrintJobInfo.STATE_FAILED -> finish("PRINT_FAILED", "Android could not print this bill. Please try again.")
      else -> if (attempts++ < 20) handler.postDelayed({ checkResult() }, 250)
        else finish("PRINT_UNCONFIRMED")
    }
  }

  @ReactMethod fun print(html: String, jobName: String, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      val activity = reactApplicationContext.currentActivity
      if (activity == null || pending != null) {
        promise.reject("PRINT_BUSY", "The print dialog is not available.")
        return@runOnUiThread
      }
      pending = promise
      adapterFinished = false
      attempts = 0
      try {
        manager = activity.getSystemService(Context.PRINT_SERVICE) as PrintManager
        val view = WebView(activity)
        webView = view
        view.settings.javaScriptEnabled = false
        view.settings.allowFileAccess = false
        view.settings.blockNetworkLoads = true
        view.webViewClient = object : WebViewClient() {
          private var opened = false
          override fun onPageFinished(view: WebView, url: String) {
            if (opened || pending == null) return
            opened = true
            try {
              val delegate = view.createPrintDocumentAdapter(jobName)
              val adapter = object : PrintDocumentAdapter() {
                override fun onStart() = delegate.onStart()
                override fun onLayout(oldAttributes: PrintAttributes?, newAttributes: PrintAttributes?, signal: CancellationSignal?, callback: LayoutResultCallback?, extras: Bundle?) =
                  delegate.onLayout(oldAttributes, newAttributes, signal, callback, extras)
                override fun onWrite(pages: Array<out PageRange>?, destination: ParcelFileDescriptor?, signal: CancellationSignal?, callback: WriteResultCallback?) =
                  delegate.onWrite(pages, destination, signal, callback)
                override fun onFinish() {
                  delegate.onFinish()
                  adapterFinished = true
                  checkResult()
                }
              }
              job = manager!!.print(jobName, adapter, PrintAttributes.Builder().build())
            } catch (error: Exception) { finish("PRINT_FAILED", error.message ?: "Unable to open printing.") }
          }
        }
        view.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
      } catch (error: Exception) { finish("PRINT_FAILED", error.message ?: "Unable to open printing.") }
    }
  }

  override fun invalidate() {
    UiThreadUtil.runOnUiThread { finish("PRINT_CLOSED", "The print screen was closed.") }
    super.invalidate()
  }
}
