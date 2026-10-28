import Foundation
import UIKit
import UniformTypeIdentifiers
import QuickLook
import PDFKit
import MessageUI
import React

@objc(LedgerFiles)
class LedgerFiles: NSObject, UIDocumentPickerDelegate, QLPreviewControllerDataSource, MFMailComposeViewControllerDelegate {
  private var pickerResolve: RCTPromiseResolveBlock?
  private var pickerReject: RCTPromiseRejectBlock?
  private var exporting = false
  private var mailResolve: RCTPromiseResolveBlock?
  private var mailReject: RCTPromiseRejectBlock?
  private var previewURL: URL?
  private let fileManager = FileManager.default
  private let types: [String: String] = ["application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"]

  @objc static func requiresMainQueueSetup() -> Bool { false }

  private func directory(_ reports: Bool) throws -> URL {
    let root = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    var url = root.appendingPathComponent(reports ? "ledger/reports" : "ledger/receipts", isDirectory: true)
    try fileManager.createDirectory(at: url, withIntermediateDirectories: true)
    if reports {
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try url.setResourceValues(values)
    }
    return url
  }

  private func safeFile(_ value: String) throws -> URL {
    guard let url = URL(string: value), url.isFileURL else { throw failure("ledger.actionFailed") }
    let canonical = url.resolvingSymlinksInPath().standardizedFileURL
    let roots = try [directory(false), directory(true)]
    guard roots.contains(where: { canonical.path.hasPrefix($0.resolvingSymlinksInPath().path + "/") }),
          fileManager.fileExists(atPath: canonical.path) else { throw failure("ledger.previewFailed") }
    return canonical
  }

  private func failure(_ message: String) -> NSError { NSError(domain: "LedgerFiles", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }

  // Present from the active controller, including an existing RN sheet. Waiting
  // for its transition avoids presenting a picker while a sheet is dismissing.
  private func present(_ controller: UIViewController, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [self] in
      guard let root = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene })
        .flatMap({ $0.windows }).first(where: { $0.isKeyWindow })?.rootViewController else {
        reject("LEDGER_PRESENT", "ledger.actionFailed", nil); return
      }
      var top = root
      while let child = top.presentedViewController { top = child }
      if let transition = top.transitionCoordinator {
        transition.animate(alongsideTransition: nil) { _ in self.present(controller, reject: reject) }
        return
      }
      if let popover = controller.popoverPresentationController {
        popover.sourceView = top.view
        popover.sourceRect = CGRect(x: top.view.bounds.midX, y: top.view.bounds.midY, width: 1, height: 1)
        popover.permittedArrowDirections = []
      }
      top.present(controller, animated: true)
    }
  }

  private func copyReceipt(_ source: URL, name: String, type: String) throws -> [String: String] {
    guard let ext = types[type] else { throw failure("ledger.receiptType") }
    let access = source.startAccessingSecurityScopedResource()
    defer { if access { source.stopAccessingSecurityScopedResource() } }
    let size = try source.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
    guard size > 0, size <= 10 * 1024 * 1024 else { throw failure("ledger.receiptTooLarge") }
    let destination = try directory(false).appendingPathComponent(UUID().uuidString + "." + ext)
    try fileManager.copyItem(at: source, to: destination)
    return ["uri": destination.absoluteString, "name": String(name.prefix(200)), "type": type]
  }

  @objc func pickReceipt(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard self.pickerResolve == nil else { reject("LEDGER_BUSY", "ledger.actionFailed", nil); return }
      self.pickerResolve = resolve; self.pickerReject = reject; self.exporting = false
      let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf, .jpeg, .png, .webP], asCopy: true)
      picker.delegate = self
      self.present(picker, reject: { code, message, error in self.clearPicker(); reject(code, message, error) })
    }
  }

  @objc func importReceipt(_ uri: String, name: String, type: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        guard let url = URL(string: uri), url.isFileURL else { throw self.failure("ledger.receiptFailed") }
        resolve(try self.copyReceipt(url, name: name, type: type))
      } catch { reject("LEDGER_IMPORT", error.localizedDescription, error) }
    }
  }

  @objc func createPdf(_ document: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let directory = try self.directory(true)
        for old in try self.fileManager.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.contentModificationDateKey]) {
          if let modified = try old.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate,
             Date().timeIntervalSince(modified) > 7 * 24 * 60 * 60 {
            try? self.fileManager.removeItem(at: old)
          }
        }
        let url = directory.appendingPathComponent("expense-report-\(UUID().uuidString).pdf")
        try ExpensePdf.write(document, to: url)
        resolve(url.absoluteString)
      } catch { reject("LEDGER_PDF", "ledger.reportFailed", error) }
    }
  }

  @objc func savePdf(_ uri: String, name: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      do {
        guard self.pickerResolve == nil else { throw self.failure("ledger.actionFailed") }
        let url = try self.safeFile(uri)
        self.pickerResolve = resolve; self.pickerReject = reject; self.exporting = true
        let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
        picker.delegate = self
        self.present(picker, reject: { code, message, error in self.clearPicker(); reject(code, message, error) })
      } catch { reject("LEDGER_EXPORT", "ledger.actionFailed", error) }
    }
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    let resolve = pickerResolve
    let reject = pickerReject
    let isExport = exporting
    clearPicker()
    guard let url = urls.first else { resolve?(isExport ? false : nil); return }
    if isExport { resolve?(true); return }
    do {
      let type = try url.resourceValues(forKeys: [.contentTypeKey]).contentType?.preferredMIMEType ?? ""
      resolve?(try copyReceipt(url, name: url.lastPathComponent, type: type))
    } catch { reject?("LEDGER_IMPORT", error.localizedDescription, error) }
  }
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    let resolve = pickerResolve
    let isExport = exporting
    clearPicker()
    resolve?(isExport ? false : nil)
  }
  private func clearPicker() { pickerResolve = nil; pickerReject = nil; exporting = false }

  @objc func sharePdf(_ uri: String, name: String, channel: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      do {
        let url = try self.safeFile(uri)
        if channel == "email", MFMailComposeViewController.canSendMail() {
          let mail = MFMailComposeViewController()
          mail.mailComposeDelegate = self
          mail.setSubject(name)
          mail.addAttachmentData(try Data(contentsOf: url), mimeType: "application/pdf", fileName: name)
          self.mailResolve = resolve; self.mailReject = reject
          self.present(mail, reject: reject)
        } else {
          let share = UIActivityViewController(activityItems: [url], applicationActivities: nil)
          share.completionWithItemsHandler = { _, _, _, error in
            if let error = error { reject("LEDGER_SHARE", "ledger.actionFailed", error) } else { resolve(nil) }
          }
          self.present(share, reject: reject)
        }
      } catch { reject("LEDGER_SHARE", "ledger.actionFailed", error) }
    }
  }
  func mailComposeController(_ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?) {
    let resolve = mailResolve; let reject = mailReject
    mailResolve = nil; mailReject = nil
    controller.dismiss(animated: true) {
      if let error = error { reject?("LEDGER_MAIL", "ledger.actionFailed", error) } else { resolve?(nil) }
    }
  }

  @objc func preview(_ uri: String, type: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      do {
        self.previewURL = try self.safeFile(uri)
        let preview = QLPreviewController()
        preview.dataSource = self
        self.present(preview, reject: reject)
        resolve(nil)
      } catch { reject("LEDGER_PREVIEW", "ledger.previewFailed", error) }
    }
  }
  func numberOfPreviewItems(in controller: QLPreviewController) -> Int { previewURL == nil ? 0 : 1 }
  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { previewURL! as NSURL }

  @objc func renderReceipt(_ uri: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let url = try self.safeFile(uri)
        guard let document = PDFDocument(url: url), let page = document.page(at: 0) else { throw self.failure("ledger.previewFailed") }
        let bounds = page.bounds(for: .mediaBox)
        guard bounds.width > 0, bounds.height > 0 else { throw self.failure("ledger.previewFailed") }
        let scale = min(1200 / bounds.width, 1800 / bounds.height)
        let image = page.thumbnail(of: CGSize(width: bounds.width * scale, height: bounds.height * scale), for: .mediaBox)
        let directory = self.fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("ledger/previews", isDirectory: true)
        try self.fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        let destination = directory.appendingPathComponent(UUID().uuidString + ".png")
        guard let png = image.pngData() else { throw self.failure("ledger.previewFailed") }
        try png.write(to: destination, options: .atomic)
        resolve(["uri": destination.absoluteString, "aspectRatio": bounds.width / bounds.height, "pages": document.pageCount])
      } catch { reject("LEDGER_PREVIEW", "ledger.previewFailed", error) }
    }
  }

  @objc func copyText(_ text: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { UIPasteboard.general.string = text; resolve(nil) }
  }
}
