package com.restoflow.printing

import org.junit.Assert.*
import org.junit.Test

class EscPosStatusTest {
  private class Transport(private val replies: List<Int?>) : PrinterTransport {
    val writes = mutableListOf<List<Byte>>()
    private var index = 0
    override fun write(bytes: ByteArray) { writes.add(bytes.toList()) }
    override fun readStatus(): Int? = replies.getOrNull(index++)
    override fun close() = Unit
  }
  private fun check(code: String, vararg replies: Int) {
    try { EscPosReceipt.checkStatus(Transport(replies.toList())); fail("Expected $code") }
    catch (error: PrinterFailure) { assertEquals(code, error.code) }
  }
  @Test fun readyPrinterUsesFourRealtimeQueries() {
    val transport = Transport(listOf(0x12, 0x12, 0x12, 0x12))
    EscPosReceipt.checkStatus(transport)
    assertEquals((1..4).map { listOf<Byte>(16, 4, it.toByte()) }, transport.writes)
  }
  @Test fun paperEndSensorStopsPrinting() = check("PAPER_OUT", 0x12, 0x12, 0x12, 0x72)
  @Test fun paperEndStopStopsPrinting() = check("PAPER_OUT", 0x1a, 0x32, 0x12, 0x12)
  @Test fun openCoverStopsPrinting() = check("COVER_OPEN", 0x1a, 0x16, 0x12, 0x12)
  @Test fun cutterOrHeadFaultStopsPrinting() = check("PRINTER_ERROR", 0x1a, 0x52, 0x1a, 0x12)
  @Test fun offlinePrinterStopsPrinting() = check("PRINTER_OFFLINE", 0x1a, 0x12, 0x12, 0x12)
  @Test fun nearEndPaperSensorIsReported() = check("PAPER_LOW", 0x12, 0x12, 0x12, 0x1e)
  @Test fun unsupportedStatusDoesNotHangOrInventPaperState() {
    val transport = Transport(listOf(null))
    EscPosReceipt.checkStatus(transport)
    assertEquals(1, transport.writes.size)
  }
  @Test fun unrelatedBytesAreNotInterpretedAsHardwareFaults() {
    val transport = Transport(listOf(0xff))
    EscPosReceipt.checkStatus(transport)
    assertEquals(1, transport.writes.size)
  }
}
