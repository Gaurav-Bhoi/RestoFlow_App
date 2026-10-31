import UIKit

/** Rasterize in strips so a long receipt never allocates a full page bitmap. */
enum EscPosRaster {
  static func receipt(_ text: String, paperWidth: Int) -> Data? {
    let width = paperWidth == 80 ? 576 : 384
    let attributes: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: paperWidth == 80 ? 28 : 24), .foregroundColor: UIColor.black]
    let string = text as NSString
    let bounds = string.boundingRect(with: CGSize(width: CGFloat(width - 16), height: 50001), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil)
    let height = Int(ceil(bounds.height))
    guard height > 0 && height <= 50000 else { return nil }
    var output = Data([27, 64])
    let rowBytes = width / 8
    for top in stride(from: 0, to: height, by: 64) {
      let rows = min(64, height - top)
      var pixels = [UInt8](repeating: 255, count: width * rows * 4)
      let rendered = pixels.withUnsafeMutableBytes { bytes -> Bool in
        guard let context = CGContext(data: bytes.baseAddress, width: width, height: rows, bitsPerComponent: 8, bytesPerRow: width * 4,
          space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
        context.setFillColor(UIColor.white.cgColor); context.fill(CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(rows)))
        context.translateBy(x: 0, y: CGFloat(rows)); context.scaleBy(x: 1, y: -1)
        UIGraphicsPushContext(context)
        string.draw(with: CGRect(x: 8, y: -CGFloat(top), width: CGFloat(width - 16), height: CGFloat(height)), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil)
        UIGraphicsPopContext(); return true
      }
      guard rendered else { return nil }
      var raster = [UInt8](repeating: 0, count: rowBytes * rows)
      for y in 0..<rows { for x in 0..<width {
        let index = (y * width + x) * 4
        if Int(pixels[index]) + Int(pixels[index + 1]) + Int(pixels[index + 2]) < 384 { raster[y * rowBytes + x / 8] |= UInt8(128 >> (x % 8)) }
      } }
      output.append(contentsOf: [29, 118, 48, 0, UInt8(rowBytes), 0, UInt8(rows), 0]); output.append(contentsOf: raster)
    }
    output.append(contentsOf: [10, 10, 10]); return output
  }
}
