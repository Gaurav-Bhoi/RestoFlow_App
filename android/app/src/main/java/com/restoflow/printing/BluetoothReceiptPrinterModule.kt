package com.restoflow.printing

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.*
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.core.location.LocationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

@SuppressLint("MissingPermission")
class BluetoothReceiptPrinterModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), LifecycleEventListener {
  private val handler = Handler(Looper.getMainLooper())
  private val worker = Executors.newSingleThreadExecutor()
  private val generation = AtomicInteger(0)
  private val busy = AtomicBoolean(false)
  private val printingOperation = AtomicBoolean(false)
  @Volatile private var transport: PrinterTransport? = null
  private val adapter get() = (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
  private var scanPromise: Promise? = null
  private val found = linkedMapOf<String, Pair<BluetoothDevice, String>>()
  private var receiverRegistered = false
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(value: Context, intent: Intent) {
      if (intent.action == BluetoothDevice.ACTION_FOUND) {
        @Suppress("DEPRECATION") val device = intent.getParcelableExtra<BluetoothDevice>(BluetoothDevice.EXTRA_DEVICE) ?: return
        addDevice(device, if (device.type == BluetoothDevice.DEVICE_TYPE_LE) "ble" else "classic")
      } else if (intent.action == BluetoothAdapter.ACTION_STATE_CHANGED &&
        intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, -1) != BluetoothAdapter.STATE_ON) {
        stopScan("BLUETOOTH_OFF"); closeTransport()
      }
    }
  }
  private var bleCallback: ScanCallback? = null
  init { context.addLifecycleEventListener(this) }
  override fun getName() = "BluetoothReceiptPrinter"
  private fun addDevice(device: BluetoothDevice, type: String) {
    try {
      if (scanPromise != null) found["${device.address}:$type"] = device to type
    } catch (_: SecurityException) { stopScan("PERMISSION_DENIED") }
  }
  private fun requireReady(): BluetoothAdapter {
    val value = adapter ?: throw PrinterFailure("BLUETOOTH_UNSUPPORTED")
    if (Build.VERSION.SDK_INT >= 31 && listOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT)
        .any { ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED }) throw PrinterFailure("PERMISSION_DENIED")
    if (!value.isEnabled) throw PrinterFailure("BLUETOOTH_OFF")
    return value
  }
  @ReactMethod fun state(promise: Promise) {
    try {
      promise.resolve(Arguments.createMap().apply { putBoolean("supported", adapter != null); putBoolean("enabled", adapter?.isEnabled == true) })
    } catch (_: SecurityException) { promise.reject("PERMISSION_DENIED", "PERMISSION_DENIED") }
  }
  @ReactMethod fun scan(promise: Promise) { handler.post {
    if (scanPromise != null || busy.get()) { promise.reject("PRINTER_BUSY", "PRINTER_BUSY"); return@post }
    try {
      val value = requireReady()
      if (Build.VERSION.SDK_INT <= 30 && !LocationManagerCompat.isLocationEnabled(context.getSystemService(Context.LOCATION_SERVICE) as LocationManager))
        throw PrinterFailure("LOCATION_OFF")
      scanPromise = promise; found.clear()
      ContextCompat.registerReceiver(context, receiver, IntentFilter().apply {
        addAction(BluetoothDevice.ACTION_FOUND); addAction(BluetoothAdapter.ACTION_STATE_CHANGED)
      }, ContextCompat.RECEIVER_EXPORTED)
      receiverRegistered = true
      value.bondedDevices.forEach { addDevice(it, if (it.type == BluetoothDevice.DEVICE_TYPE_LE) "ble" else "classic") }
      val callback = object : ScanCallback() {
        override fun onScanResult(type: Int, result: ScanResult) {
          handler.post { if (scanPromise === promise) addDevice(result.device, "ble") }
        }
        override fun onScanFailed(code: Int) {
          handler.post { if (scanPromise === promise) stopScan("SCAN_FAILED") }
        }
      }
      bleCallback = callback
      value.bluetoothLeScanner?.startScan(callback)
      if (!value.startDiscovery()) throw PrinterFailure("SCAN_FAILED")
      handler.postDelayed({ if (scanPromise === promise) stopScan() }, 12000)
    } catch (error: Exception) {
      if (scanPromise == null) promise.reject((error as? PrinterFailure)?.code ?: "SCAN_FAILED", "SCAN_FAILED")
      else stopScan((error as? PrinterFailure)?.code ?: "SCAN_FAILED")
    }
  } }
  private fun stopScan(code: String? = null) {
    val promise = scanPromise ?: return
    scanPromise = null
    try { adapter?.cancelDiscovery(); bleCallback?.let { adapter?.bluetoothLeScanner?.stopScan(it) } } catch (_: Exception) { }
    bleCallback = null
    if (receiverRegistered) {
      try { context.unregisterReceiver(receiver) } catch (_: Exception) { }
      receiverRegistered = false
    }
    if (code != null) { promise.reject(code, code); return }
    try {
      promise.resolve(Arguments.createArray().apply {
        found.values.forEach { (device, type) -> pushMap(Arguments.createMap().apply {
          putString("id", device.address); putString("name", device.name ?: "")
          putString("transport", type); putBoolean("paired", device.bondState == BluetoothDevice.BOND_BONDED)
        }) }
      })
    } catch (_: SecurityException) { promise.reject("PERMISSION_DENIED", "PERMISSION_DENIED") }
  }

  private fun closeTransport() { try { transport?.close() } catch (_: Exception) { }; transport = null }
  private fun operation(promise: Promise, printing: Boolean, action: (Int) -> Unit) {
    if (!busy.compareAndSet(false, true)) { promise.reject("PRINTER_BUSY", "PRINTER_BUSY"); return }
    printingOperation.set(printing)
    val token = generation.get()
    val timeout = Runnable { if (generation.get() == token) { generation.incrementAndGet(); closeTransport() } }
    handler.postDelayed(timeout, if (printing) 90000 else 25000)
    worker.execute {
      try { if (token != generation.get()) throw PrinterFailure("PRINT_CANCELLED"); action(token); if (token != generation.get()) throw PrinterFailure(if (printing) "PRINT_UNCERTAIN" else "CONNECT_TIMEOUT"); promise.resolve(null) }
      catch (error: Exception) {
        closeTransport()
        val code = if (token != generation.get()) {
          if (printing) "PRINT_UNCERTAIN" else "CONNECT_TIMEOUT"
        } else (error as? PrinterFailure)?.code ?: if (printing) "PRINT_UNCERTAIN" else "CONNECT_FAILED"
        promise.reject(code, code)
      } finally { handler.removeCallbacks(timeout); printingOperation.set(false); busy.set(false) }
    }
  }
  @ReactMethod fun connect(id: String, type: String, promise: Promise) {
    operation(promise, false) { token ->
      val value = requireReady(); value.cancelDiscovery(); closeTransport()
      if (!BluetoothAdapter.checkBluetoothAddress(id)) throw PrinterFailure("CONNECT_FAILED")
      val device = value.getRemoteDevice(id)
      if (type == "ble") {
        val connection = BlePrinterTransport(context, device); transport = connection; if (token != generation.get()) throw PrinterFailure("PRINT_CANCELLED"); connection.awaitConnection()
      } else {
        val socket = device.createRfcommSocketToServiceRecord(UUID.fromString("00001101-0000-1000-8000-00805f9b34fb"))
        transport = object : PrinterTransport {
          override fun write(bytes: ByteArray) { socket.outputStream.write(bytes); socket.outputStream.flush() }
          override fun readStatus(): Int? {
            val until = android.os.SystemClock.elapsedRealtime() + 700
            while (android.os.SystemClock.elapsedRealtime() < until) {
              if (socket.inputStream.available() > 0) return socket.inputStream.read()
              if (generation.get() != token) throw PrinterFailure("PRINT_CANCELLED")
              Thread.sleep(20)
            }
            return null
          }
          override fun close() { socket.close() }
        }
        if (token != generation.get()) throw PrinterFailure("PRINT_CANCELLED")
        socket.connect()
      }
    }
  }
  @ReactMethod fun printReceipt(text: String, paperWidth: Int, promise: Promise) {
    operation(promise, true) { token ->
      requireReady()
      val connection = transport ?: throw PrinterFailure("PRINTER_DISCONNECTED")
      EscPosReceipt.checkStatus(connection)
      var started = false
      try {
        started = true
        EscPosReceipt.print(text, paperWidth, connection) {
          if (generation.get() != token) throw PrinterFailure("PRINT_UNCERTAIN")
        }
        EscPosReceipt.checkStatus(connection)
      } catch (error: Exception) {
        // Once raster data may have left the phone, retries must be explicit.
        if (started && (error !is PrinterFailure || error.code in listOf("PRINTER_DISCONNECTED", "PRINT_CANCELLED")))
          throw PrinterFailure("PRINT_UNCERTAIN")
        throw error
      }
    }
  }
  @ReactMethod fun cancel(promise: Promise) { generation.incrementAndGet(); closeTransport(); handler.post { stopScan("PRINT_CANCELLED"); promise.resolve(null) } }
  @ReactMethod fun openSettings(promise: Promise) {
    try { context.startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); promise.resolve(null) }
    catch (error: Exception) { promise.reject("SETTINGS_FAILED", error) }
  }
  override fun onHostResume() = Unit
  // Android pairing may pause the activity; let the bounded connection finish.
  override fun onHostPause() {
    if (!busy.get() || printingOperation.get()) { generation.incrementAndGet(); closeTransport() }
    handler.post { stopScan("PRINT_CANCELLED") }
  }
  override fun onHostDestroy() { generation.incrementAndGet(); closeTransport(); handler.post { stopScan("PRINT_CANCELLED") } }
  override fun invalidate() { onHostDestroy(); context.removeLifecycleEventListener(this); worker.shutdownNow(); super.invalidate() }
}

class BluetoothReceiptPrinterPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(BluetoothReceiptPrinterModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
