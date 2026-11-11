package com.bisangoding.log;

import ch.qos.logback.classic.pattern.ThrowableHandlingConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;

/**
 * Menampilkan exception di log hanya dengan nama dan pesannya (tanpa baris "at ...").
 * Baris stack trace berisi nomor baris yang berbeda di setiap JVM, jadi disingkat di praktik BisaNgoding.
 */
public class PengecualianSingkat extends ThrowableHandlingConverter {
    @Override
    public String convert(ILoggingEvent event) {
        IThrowableProxy t = event.getThrowableProxy();
        StringBuilder b = new StringBuilder();
        boolean pertama = true;
        while (t != null) {
            b.append(pertama ? "" : "Caused by: ").append(t.getClassName());
            if (t.getMessage() != null) {
                b.append(": ").append(t.getMessage());
            }
            b.append('\n');
            pertama = false;
            t = t.getCause();
        }
        return b.toString();
    }
}
