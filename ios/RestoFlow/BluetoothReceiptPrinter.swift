import Foundation
import UIKit
import CoreBluetooth
import React

@objc(BluetoothReceiptPrinter)
class BluetoothReceiptPrinter: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
  private var central: CBCentralManager!
  private var peripherals: [UUID: CBPeripheral] = [:]
  private var active: CBPeripheral?
  private var writer: CBCharacteristic?
  private var resolve: RCTPromiseResolveBlock?
  private var reject: RCTPromiseRejectBlock?
  private var operation = ""
  private var timeout: DispatchWorkItem?
  private var statusTimeout: DispatchWorkItem?
  private var stateResolve: RCTPromiseResolveBlock?
  private var stateReject: RCTPromiseRejectBlock?
  private var statusCompletion: ((String?) -> Void)?
  private var statuses: [UInt8] = []
  private var payload = Data()
  private var offset = 0
  private var writing = false
  private var receiptStarted = false
  private var token = UUID()
  private let endpoints = ["FF00": "FF02", "FFF0": "FFF2", "FFE0": "FFE1",
    "49535343-FE7D-4AE5-8FA9-9FAFD205E455": "49535343-8841-43F4-A8D4-ECBE34729BB3"]

  @objc static func requiresMainQueueSetup() -> Bool { true }
  @objc var methodQueue: DispatchQueue { DispatchQueue.main }
  override init() {
    super.init()
    NotificationCenter.default.addObserver(self, selector: #selector(background), name: UIApplication.didEnterBackgroundNotification, object: nil)
  }
  deinit { NotificationCenter.default.removeObserver(self) }
  private func ensureCentral() {
    if central == nil { central = CBCentralManager(delegate: self, queue: .main) }
  }
  private func stateValue() -> [String: Bool] { ["supported": central.state != .unsupported, "enabled": central.state == .poweredOn] }
  private func stateError() -> String? {
    if central.state == .unauthorized { return "PERMISSION_BLOCKED" }
    if central.state == .unsupported { return "BLUETOOTH_UNSUPPORTED" }
    if central.state != .poweredOn { return "BLUETOOTH_OFF" }
    return nil
  }
  @objc(state:rejecter:)
  func state(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    ensureCentral()
    if central.state == .unknown || central.state == .resetting {
      stateReject?("PRINT_CANCELLED", "PRINT_CANCELLED", nil)
      stateResolve = resolver; stateReject = rejecter
      DispatchQueue.main.asyncAfter(deadline: .now() + 10) { [weak self] in
        guard let self = self, let failure = self.stateReject else { return }
        self.stateResolve = nil; self.stateReject = nil; failure("BLUETOOTH_OFF", "BLUETOOTH_OFF", nil)
      }
    } else if central.state == .unauthorized { rejecter("PERMISSION_BLOCKED", "PERMISSION_BLOCKED", nil) }
    else { resolver(stateValue()) }
  }
  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    if central.state == .unknown || central.state == .resetting { return }
    let success = stateResolve; let failure = stateReject; stateResolve = nil; stateReject = nil
    if central.state == .unauthorized { failure?("PERMISSION_BLOCKED", "PERMISSION_BLOCKED", nil) }
    else { success?(stateValue()) }
    if let code = stateError(), !operation.isEmpty { finish(receiptStarted ? "PRINT_UNCERTAIN" : code); disconnect() }
  }
  private func begin(_ kind: String, _ resolver: @escaping RCTPromiseResolveBlock, _ rejecter: @escaping RCTPromiseRejectBlock, seconds: Double) -> Bool {
    ensureCentral()
    if !operation.isEmpty { rejecter("PRINTER_BUSY", "PRINTER_BUSY", nil); return false }
    if let code = stateError() { rejecter(code, code, nil); return false }
    operation = kind; resolve = resolver; reject = rejecter; token = UUID()
    let deadline = DispatchWorkItem { [weak self] in
      guard let self = self else { return }
      self.finish(self.receiptStarted ? "PRINT_UNCERTAIN" : "CONNECT_TIMEOUT"); self.disconnect()
    }
    timeout = deadline; DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: deadline)
    return true
  }
  private func finish(_ code: String? = nil, value: Any? = nil) {
    timeout?.cancel(); timeout = nil; statusTimeout?.cancel(); statusTimeout = nil; statusCompletion = nil
    let success = resolve; let failure = reject
    resolve = nil; reject = nil; operation = ""; payload = Data(); offset = 0; writing = false; receiptStarted = false; token = UUID()
    if let code = code { failure?(code, code, nil) } else { success?(value) }
  }
  @objc(scan:rejecter:)
  func scan(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard begin("scan", resolver, rejecter, seconds: 15) else { return }
    peripherals.removeAll()
    central.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
    let requestToken = token
    DispatchQueue.main.asyncAfter(deadline: .now() + 12) { [weak self] in
      guard let self = self, self.token == requestToken else { return }
      self.central.stopScan()
      self.finish(value: self.peripherals.values.map { ["id": $0.identifier.uuidString, "name": $0.name ?? "", "paired": false, "transport": "ble"] as [String: Any] })
    }
  }
  func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
    peripherals[peripheral.identifier] = peripheral
  }
  @objc(connect:transport:resolver:rejecter:)
  func connect(_ id: String, transport: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard begin("connect", resolver, rejecter, seconds: 25) else { return }
    disconnect()
    guard let uuid = UUID(uuidString: id), let device = peripherals[uuid], transport == "ble" else { finish("PRINTER_UNSUPPORTED"); return }
    active = device; device.delegate = self; central.connect(device)
  }
  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    if active == peripheral && operation == "connect" { peripheral.discoverServices(endpoints.keys.map { CBUUID(string: $0) }) }
  }
  func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
    if active == peripheral { finish("CONNECT_FAILED"); disconnect() }
  }
  func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
    if active == peripheral { finish(receiptStarted ? "PRINT_UNCERTAIN" : "PRINTER_DISCONNECTED"); active = nil; writer = nil }
  }
  func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    guard active == peripheral && operation == "connect" else { return }
    guard error == nil, let services = peripheral.services, let service = services.first(where: { endpoints[$0.uuid.uuidString] != nil }) else { finish("PRINTER_UNSUPPORTED"); disconnect(); return }
    peripheral.discoverCharacteristics(nil, for: service)
  }
  func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
    guard active == peripheral && operation == "connect" else { return }
    guard error == nil, let characteristic = service.characteristics?.first(where: {
      $0.uuid.uuidString == endpoints[service.uuid.uuidString] && ($0.properties.contains(.write) || $0.properties.contains(.writeWithoutResponse))
    }) else { finish("PRINTER_UNSUPPORTED"); disconnect(); return }
    writer = characteristic
    if let notify = service.characteristics?.first(where: { $0.properties.contains(.notify) }) {
      peripheral.setNotifyValue(true, for: notify)
    } else { finish() }
  }
  func peripheral(_ peripheral: CBPeripheral, didUpdateNotificationStateFor characteristic: CBCharacteristic, error: Error?) {
    if active == peripheral && operation == "connect" {
      if error != nil { finish("CONNECT_FAILED"); disconnect() } else { finish() }
    }
  }
  private func disconnect() {
    if let peripheral = active { peripheral.delegate = nil; central?.cancelPeripheralConnection(peripheral) }
    active = nil; writer = nil
  }
  @objc(cancel:rejecter:)
  func cancel(_ resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    central?.stopScan(); finish(receiptStarted ? "PRINT_UNCERTAIN" : "PRINT_CANCELLED"); disconnect(); resolver(nil)
  }
  @objc private func background() {
    central?.stopScan(); finish(receiptStarted ? "PRINT_UNCERTAIN" : "PRINT_CANCELLED"); disconnect()
  }
  @objc(openSettings:rejecter:)
  func openSettings(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let url = URL(string: UIApplication.openSettingsURLString) else { rejecter("SETTINGS_FAILED", "SETTINGS_FAILED", nil); return }
    UIApplication.shared.open(url) { ok in if ok { resolver(nil) } else { rejecter("SETTINGS_FAILED", "SETTINGS_FAILED", nil) } }
  }
  @objc(printReceipt:paperWidth:resolver:rejecter:)
  func printReceipt(_ text: String, paperWidth: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard begin("print", resolver, rejecter, seconds: 90) else { return }
    guard active?.state == .connected, writer != nil else { finish("PRINTER_DISCONNECTED"); return }
    guard text.count <= 30000, [58, 80].contains(paperWidth) else { finish("RECEIPT_TOO_LARGE"); return }
    let requestToken = token
    checkStatus { [weak self] code in
      guard let self = self, self.token == requestToken else { return }
      if let code = code { self.finish(code); return }
      guard let data = EscPosRaster.receipt(text, paperWidth: paperWidth) else { self.finish("RECEIPT_TOO_LARGE"); return }
      self.payload = data; self.writing = true; self.receiptStarted = true; self.sendNext()
    }
  }
  private func sendNext() {
    guard operation == "print", writing, let peripheral = active, let characteristic = writer else { return }
    if offset >= payload.count {
      writing = false
      checkStatus { [weak self] code in self?.finish(code) }
      return
    }
    let response = characteristic.properties.contains(.write)
    if !response && !peripheral.canSendWriteWithoutResponse { return }
    let type: CBCharacteristicWriteType = response ? .withResponse : .withoutResponse
    let length = min(peripheral.maximumWriteValueLength(for: type), 180, payload.count - offset)
    peripheral.writeValue(payload.subdata(in: offset..<(offset + length)), for: characteristic, type: type)
    offset += length
    if !response { DispatchQueue.main.async { [weak self] in self?.sendNext() } }
  }
  func peripheralIsReady(toSendWriteWithoutResponse peripheral: CBPeripheral) { if active == peripheral { sendNext() } }
  func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
    guard active == peripheral else { return }
    if error != nil { finish(receiptStarted ? "PRINT_UNCERTAIN" : "PRINTER_DISCONNECTED"); disconnect() }
    else if writing { sendNext() }
  }
  private func checkStatus(_ completion: @escaping (String?) -> Void) {
    statuses = []; statusCompletion = completion; queryStatus()
  }
  private func queryStatus() {
    guard let peripheral = active, let characteristic = writer else { statusCompletion?("PRINTER_DISCONNECTED"); return }
    let type: CBCharacteristicWriteType = characteristic.properties.contains(.write) ? .withResponse : .withoutResponse
    peripheral.writeValue(Data([16, 4, UInt8(statuses.count + 1)]), for: characteristic, type: type)
    let timer = DispatchWorkItem { [weak self] in
      guard let self = self else { return }
      let done = self.statusCompletion; self.statusCompletion = nil; done?(nil)
    }
    statusTimeout = timer; DispatchQueue.main.asyncAfter(deadline: .now() + 0.7, execute: timer)
  }
  func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
    guard active == peripheral, error == nil, let data = characteristic.value, statusCompletion != nil else { return }
    for byte in data where byte & 0x93 == 0x12 {
      statusTimeout?.cancel(); statuses.append(byte)
      if statuses.count < 4 { queryStatus() }
      else {
        var code: String?
        if statuses[1] & 0x20 != 0 || statuses[3] & 0x60 != 0 { code = "PAPER_OUT" }
        else if statuses[1] & 0x04 != 0 { code = "COVER_OPEN" }
        else if statuses[2] & 0x6c != 0 || statuses[1] & 0x40 != 0 { code = "PRINTER_ERROR" }
        else if statuses[0] & 0x08 != 0 { code = "PRINTER_OFFLINE" }
        else if statuses[3] & 0x0c != 0 { code = "PAPER_LOW" }
        let done = statusCompletion; statusCompletion = nil; done?(code); break
      }
    }
  }
}
