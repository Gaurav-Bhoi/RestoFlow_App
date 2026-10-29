import UIKit

/// Produces paginated A4 documents from the same immutable data as the RN preview.
enum ExpensePdf {
  static func write(_ data: NSDictionary, to url: URL) throws {
    if data["layout"] as? String == "receipt" {
      try ReceiptPdf.write(data, to: url)
      return
    }
    guard let columns = data["columns"] as? [String], columns.count == 4,
          let rows = data["rows"] as? [[String]], rows.allSatisfy({ $0.count == 4 }),
          let totals = data["totals"] as? [[String]], totals.allSatisfy({ $0.count == 2 }) else {
      throw NSError(domain: "LedgerFiles", code: 1)
    }
    let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 595, height: 842))
    let widths: [CGFloat] = [62, 225, 108, 120]
    let ink = UIColor(red: 34/255, green: 53/255, blue: 45/255, alpha: 1)
    try renderer.writePDF(to: url) { context in
      var y: CGFloat = 40
      var page = 0
      @discardableResult func text(_ value: String, x: CGFloat, top: CGFloat, width: CGFloat, size: CGFloat = 10, right: Bool = false) -> CGFloat {
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = right ? .right : .left
        let attributes: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: size), .foregroundColor: ink, .paragraphStyle: paragraph]
        let height = ceil((value as NSString).boundingRect(with: CGSize(width: width, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil).height)
        (value as NSString).draw(in: CGRect(x: x, y: top, width: width, height: height + 2), withAttributes: attributes)
        return height
      }
      func footer() { if page > 0 { text(String(page), x: 40, top: 808, width: 515, size: 9, right: true) } }
      func beginPage() {
        footer()
        context.beginPage()
        page += 1
        y = 40
        y += text("RestoFlow", x: 40, top: y, width: 515, size: 22) + 6
        y += text(data["restaurant"] as? String ?? "", x: 40, top: y, width: 515, size: 12) + 12
        y += text(data["title"] as? String ?? "", x: 40, top: y, width: 515, size: 18) + 6
        y += text(data["period"] as? String ?? "", x: 40, top: y, width: 515, size: 11) + 6
        y += text(data["generated"] as? String ?? "", x: 40, top: y, width: 515, size: 9) + 20
        var x: CGFloat = 40
        var height: CGFloat = 0
        for index in 0..<4 {
          height = max(height, text(columns[index], x: x, top: y, width: widths[index] - 8, right: index == 3))
          x += widths[index]
        }
        y += height + 16
      }
      beginPage()
      for row in rows {
        let font = UIFont.systemFont(ofSize: 10)
        let height = row.enumerated().map { index, value in
          ceil((value as NSString).boundingRect(with: CGSize(width: widths[index] - 8, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: [.font: font], context: nil).height)
        }.max()! + 16
        if y + height > 790 { beginPage() }
        var x: CGFloat = 40
        for index in 0..<4 {
          text(row[index], x: x, top: y, width: widths[index] - 8, right: index == 3)
          x += widths[index]
        }
        y += height
      }
      if y + 120 > 790 { beginPage() }
      y += 24
      for (index, row) in totals.enumerated() {
        let size: CGFloat = index == totals.count - 1 ? 14 : 11
        let height = max(text(row[0], x: 40, top: y, width: 340, size: size), text(row[1], x: 390, top: y, width: 165, size: size, right: true))
        y += height + 12
      }
      footer()
    }
  }
}

private final class ReceiptPdfText {
  let storage: NSTextStorage
  let manager = NSLayoutManager()
  let container: NSTextContainer
  var height: CGFloat { ceil(manager.usedRect(for: container).height) }
  let width: CGFloat

  init(_ value: String, width: CGFloat, size: CGFloat, color: UIColor, alignment: NSTextAlignment = .left) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = alignment
    storage = NSTextStorage(string: value, attributes: [.font: UIFont.systemFont(ofSize: size), .foregroundColor: color, .paragraphStyle: paragraph])
    container = NSTextContainer(size: CGSize(width: width, height: .greatestFiniteMagnitude))
    self.width = width
    container.lineFragmentPadding = 0
    storage.addLayoutManager(manager)
    manager.addTextContainer(container)
    manager.ensureLayout(for: container)
  }

  func draw(x: CGFloat, y: CGFloat) {
    manager.drawGlyphs(forGlyphRange: manager.glyphRange(for: container), at: CGPoint(x: x, y: y))
  }
}

/// Uses the same receipt layout as the phone preview, preserving wrapped text.
private enum ReceiptPdf {
  static func write(_ data: NSDictionary, to url: URL) throws {
    guard let rows = data["rows"] as? [[String]], rows.allSatisfy({ $0.count == 4 }),
          let totals = data["totals"] as? [[String]], totals.allSatisfy({ $0.count == 2 }) else {
      throw NSError(domain: "LedgerFiles", code: 1)
    }
    let ink = UIColor(red: 34/255, green: 53/255, blue: 45/255, alpha: 1)
    let forest = UIColor(red: 24/255, green: 65/255, blue: 55/255, alpha: 1)
    let muted = UIColor(red: 103/255, green: 116/255, blue: 108/255, alpha: 1)
    let notes = data["notes"] as? [String] ?? []
    let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 420, height: 740))
    try renderer.writePDF(to: url) { context in
      var y: CGFloat = 0
      let bottom: CGFloat = 700
      func block(_ value: String, width: CGFloat = 368, size: CGFloat, color: UIColor, alignment: NSTextAlignment = .left) -> ReceiptPdfText {
        ReceiptPdfText(value, width: width, size: size, color: color, alignment: alignment)
      }
      func rule() {
        let canvas = context.cgContext
        canvas.setStrokeColor(UIColor(red: 226/255, green: 230/255, blue: 222/255, alpha: 1).cgColor)
        canvas.setLineWidth(1)
        canvas.move(to: CGPoint(x: 26, y: y))
        canvas.addLine(to: CGPoint(x: 394, y: y))
        canvas.strokePath()
      }
      func beginPage() {
        context.beginPage()
        y = 32
        for (key, size) in [("restaurant", CGFloat(14)), ("period", CGFloat(14)), ("generated", CGFloat(12))] {
          let text = block(data[key] as? String ?? "", size: size, color: key == "restaurant" ? forest : muted, alignment: .center)
          text.draw(x: 26, y: y)
          y += text.height + 18
        }
        y += 16
        rule()
        y += 30
      }
      // Slice at native line boundaries when an unusually long item spans pages.
      func flow(_ text: ReceiptPdfText, x: CGFloat = 26) {
        let count = text.manager.numberOfGlyphs
        var glyph = 0
        while glyph < count {
          var range = NSRange()
          let first = text.manager.lineFragmentRect(forGlyphAt: glyph, effectiveRange: &range)
          if y + first.height > bottom { beginPage() }
          var end = NSMaxRange(range)
          var height = first.height
          while end < count {
            var nextRange = NSRange()
            let next = text.manager.lineFragmentRect(forGlyphAt: end, effectiveRange: &nextRange)
            if y + next.maxY - first.minY > bottom { break }
            height = next.maxY - first.minY
            end = NSMaxRange(nextRange)
          }
          let canvas = context.cgContext
          canvas.saveGState()
          canvas.clip(to: CGRect(x: x, y: y, width: text.width, height: height))
          text.draw(x: x, y: y - first.minY)
          canvas.restoreGState()
          y += height
          glyph = end
        }
      }
      beginPage()
      for (index, row) in rows.enumerated() {
        let name = block(row[0], width: 246, size: 16, color: ink)
        let amount = block(row[3], width: 110, size: 16, color: forest, alignment: .right)
        let quantity = block("\(row[1]) × \(row[2])", size: 12, color: muted)
        let note = index < notes.count && !notes[index].isEmpty ? block(notes[index], size: 12, color: muted) : nil
        let height = max(name.height, amount.height) + 8 + quantity.height + (note.map { $0.height + 8 } ?? 0) + 26
        if y + height > bottom && y > 200 { beginPage() }
        let top = y
        flow(name)
        if abs(y - top - name.height) < 1 {
          amount.draw(x: 284, y: top)
          y = max(y, top + amount.height)
        } else { flow(amount, x: 284) }
        y += 8
        flow(quantity)
        if let note = note { y += 8; flow(note) }
        y += 26
      }
      let totalBlocks = totals.enumerated().map { index, row -> (ReceiptPdfText, ReceiptPdfText) in
        let grand = index == totals.count - 1
        return (block(row[0], width: 205, size: grand ? 19 : 13, color: grand ? ink : muted),
                block(row[1], width: 151, size: grand ? 30 : 13, color: forest, alignment: .right))
      }
      let totalsHeight = totalBlocks.reduce(CGFloat(28)) { $0 + max($1.0.height, $1.1.height) + 30 }
      if y + totalsHeight > bottom { beginPage() }
      y = max(y, min(538, bottom - totalsHeight))
      rule()
      y += 28
      for (label, amount) in totalBlocks {
        label.draw(x: 26, y: y)
        amount.draw(x: 243, y: y)
        y += max(label.height, amount.height) + 30
      }
    }
  }
}
