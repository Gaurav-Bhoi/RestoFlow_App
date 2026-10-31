package com.restoflow.printing

import android.annotation.SuppressLint
import android.bluetooth.*
import android.content.Context
import android.os.Build
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit

@SuppressLint("MissingPermission")
class BlePrinterTransport(context: Context, device: BluetoothDevice) : PrinterTransport {
  private var gatt: BluetoothGatt? = null
  private var characteristic: BluetoothGattCharacteristic? = null
  private val connected = CountDownLatch(1)
  private var writeDone = CountDownLatch(0)
  private var descriptorDone = CountDownLatch(0)
  @Volatile private var failed = false
  @Volatile private var closed = false
  @Volatile private var writeStatus = 0
  private val replies = LinkedBlockingQueue<Int>()
  // Known serial printer endpoints. A random writable characteristic is unsafe.
  private val endpoints = mapOf("ff00" to "ff02", "fff0" to "fff2", "ffe0" to "ffe1",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455" to "49535343-8841-43f4-a8d4-ecbe34729bb3")
  private fun short(uuid: UUID): String {
    val value = uuid.toString()
    return if (value.startsWith("0000") && value.endsWith("-0000-1000-8000-00805f9b34fb")) value.substring(4, 8) else value
  }
  private val callback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(value: BluetoothGatt, status: Int, newState: Int) {
      if (status == BluetoothGatt.GATT_SUCCESS && newState == BluetoothProfile.STATE_CONNECTED && !closed) {
        if (!value.discoverServices()) { failed = true; connected.countDown() }
      } else if (newState == BluetoothProfile.STATE_DISCONNECTED || status != BluetoothGatt.GATT_SUCCESS) {
        failed = true; connected.countDown(); writeDone.countDown(); descriptorDone.countDown()
      }
    }
    override fun onServicesDiscovered(value: BluetoothGatt, status: Int) {
      if (status == BluetoothGatt.GATT_SUCCESS) {
        characteristic = value.services.firstNotNullOfOrNull { service ->
          val endpoint = endpoints[short(service.uuid)] ?: return@firstNotNullOfOrNull null
          service.characteristics.firstOrNull { short(it.uuid) == endpoint && it.properties and
            (BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) != 0 }
        }
      }
      connected.countDown()
    }
    override fun onCharacteristicWrite(value: BluetoothGatt, target: BluetoothGattCharacteristic, status: Int) {
      writeStatus = status; writeDone.countDown()
    }
    @Deprecated("Compatibility callback for Android 12 and earlier")
    override fun onCharacteristicChanged(value: BluetoothGatt, target: BluetoothGattCharacteristic) {
      if (Build.VERSION.SDK_INT < 33) target.value?.forEach { replies.offer(it.toInt() and 255) }
    }
    override fun onCharacteristicChanged(value: BluetoothGatt, target: BluetoothGattCharacteristic, bytes: ByteArray) {
      bytes.forEach { replies.offer(it.toInt() and 255) }
    }
    override fun onDescriptorWrite(value: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) { descriptorDone.countDown() }
  }
  init { gatt = device.connectGatt(context, false, callback, BluetoothDevice.TRANSPORT_LE) }
  fun awaitConnection() {
    if (!connected.await(20, TimeUnit.SECONDS)) throw PrinterFailure("CONNECT_TIMEOUT")
    if (failed || closed) throw PrinterFailure("CONNECT_FAILED")
    val target = characteristic ?: throw PrinterFailure("PRINTER_UNSUPPORTED")
    val connection = gatt ?: throw PrinterFailure("CONNECT_FAILED")
    val notify = target.service.characteristics.firstOrNull { it.properties and BluetoothGattCharacteristic.PROPERTY_NOTIFY != 0 }
    val descriptor = notify?.getDescriptor(UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"))
    if (notify != null && descriptor != null && connection.setCharacteristicNotification(notify, true)) {
      descriptorDone = CountDownLatch(1)
      if (Build.VERSION.SDK_INT >= 33) connection.writeDescriptor(descriptor, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
      else { descriptor.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE; connection.writeDescriptor(descriptor) }
      if (!descriptorDone.await(3, TimeUnit.SECONDS)) throw PrinterFailure("CONNECT_FAILED")
    }
  }
  override fun write(bytes: ByteArray) {
    val connection = gatt ?: throw PrinterFailure("PRINTER_DISCONNECTED")
    val target = characteristic ?: throw PrinterFailure("PRINTER_DISCONNECTED")
    val response = target.properties and BluetoothGattCharacteristic.PROPERTY_WRITE != 0
    val type = if (response) BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT else BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
    // Keep the default 20-byte ATT payload; no vendor MTU assumptions.
    for (chunk in bytes.toList().chunked(20)) {
      if (failed || closed) throw PrinterFailure("PRINTER_DISCONNECTED")
      writeDone = CountDownLatch(1); writeStatus = 0
      val payload = chunk.toByteArray()
      val accepted = if (Build.VERSION.SDK_INT >= 33) connection.writeCharacteristic(target, payload, type) == BluetoothStatusCodes.SUCCESS
        else { target.writeType = type; target.value = payload; connection.writeCharacteristic(target) }
      if (!accepted) throw PrinterFailure("PRINTER_DISCONNECTED")
      // Android also serializes NO_RESPONSE writes; wait for its local callback.
      if (!writeDone.await(3, TimeUnit.SECONDS) || writeStatus != BluetoothGatt.GATT_SUCCESS || failed)
        throw PrinterFailure("PRINTER_DISCONNECTED")
    }
  }
  override fun readStatus(): Int? = replies.poll(700, TimeUnit.MILLISECONDS)
  override fun close() {
    closed = true; connected.countDown(); writeDone.countDown(); descriptorDone.countDown()
    gatt?.disconnect(); gatt?.close(); gatt = null
  }
}
