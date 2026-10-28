import UIKit

/// Produces paginated A4 documents from the same immutable data as the RN preview.
enum ExpensePdf {
  static func write(_ data: NSDictionary, to url: URL) throws {
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
