//cp:
import java.nio.file.*;
import java.text.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        String cp = System.getProperty("java.class.path");
        System.out.println("cp=" + cp + " dir=" + System.getProperty("user.dir"));
        String dirCp = null;
        for (String p : cp.split(":")) if (p.startsWith("/files")) dirCp = p;
        if (dirCp == null) dirCp = cp.split(":")[0];
        System.out.println("dirCp=" + dirCp);
        Files.writeString(Path.of(dirCp, "pesan.properties"), "salam=Hello, {0}!\n");
        Files.writeString(Path.of(dirCp, "pesan_id.properties"), "salam=Halo, {0}!\nkota=Bandung é\n");
        Files.writeString(Path.of("cwd.properties"), "a=cwd\n");
        for (Locale l : List.of(Locale.forLanguageTag("id-ID"), Locale.US)) {
            try {
                ResourceBundle rb = ResourceBundle.getBundle("pesan", l);
                System.out.println(l + " -> [" + rb.getLocale() + "] " + MessageFormat.format(rb.getString("salam"), "Sari") + (rb.containsKey("kota") ? " " + rb.getString("kota") : ""));
            } catch (Exception e) { System.out.println(l + " GAGAL " + e); }
        }
        try { System.out.println("cwd " + ResourceBundle.getBundle("cwd").getString("a")); } catch (Exception e) { System.out.println("cwd GAGAL " + e); }
        try { System.out.println("res " + Main.class.getClassLoader().getResource("pesan_id.properties")); } catch (Exception e) { System.out.println("res GAGAL " + e); }
        for (Locale l : List.of(Locale.forLanguageTag("id-ID"), Locale.US, Locale.JAPAN)) {
            try {
                ResourceBundle rb = ResourceBundle.getBundle("Teks", l);
                System.out.println("kelas " + l + " -> [" + rb.getLocale() + "] " + rb.getString("salam"));
            } catch (Exception e) { System.out.println("kelas " + l + " GAGAL " + e); }
        }
        System.out.println(NumberFormat.getCompactNumberInstance(Locale.forLanguageTag("id-ID"), NumberFormat.Style.SHORT).format(1_250_000) + " | " + NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.SHORT).format(1_250_000) + " | " + NumberFormat.getCompactNumberInstance(Locale.forLanguageTag("id-ID"), NumberFormat.Style.LONG).format(1_250_000));
        System.out.println(Locale.of("id", "ID") + " " + Locale.forLanguageTag("id-ID").toLanguageTag() + " " + Locale.forLanguageTag("ja-JP").getDisplayLanguage(Locale.forLanguageTag("id")));
        System.out.println(java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.FULL).withLocale(Locale.JAPAN).format(java.time.LocalDate.of(2026,11,17)) + " | " + java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.LONG).withLocale(Locale.GERMANY).format(java.time.LocalDate.of(2026,11,17)));
        System.out.println(java.text.Normalizer.normalize("é", java.text.Normalizer.Form.NFC).length() + " " + "é".length() + " " + "Café".equals(java.text.Normalizer.normalize("Café", java.text.Normalizer.Form.NFC)));
        Collator c = Collator.getInstance(Locale.forLanguageTag("id-ID")); c.setStrength(Collator.PRIMARY);
        System.out.println(c.compare("Elan", "Élan") + " " + c.equals("kopi", "KOPI"));
        System.out.println(java.time.ZonedDateTime.of(2026,11,17,14,5,0,0,java.time.ZoneId.of("Asia/Jakarta")).withZoneSameInstant(java.time.ZoneId.of("Asia/Tokyo")) + " " + java.time.ZoneId.of("Asia/Jayapura").getRules().getOffset(java.time.Instant.EPOCH));
        System.out.println(String.format(Locale.forLanguageTag("id-ID"), "%,d | %.2f | %tA", 1234567, 3.5, new GregorianCalendar(2026,10,17)));
        System.out.println(DateFormatSymbols.getInstance(Locale.forLanguageTag("id-ID")).getMonths()[0] + " " + java.time.DayOfWeek.MONDAY.getDisplayName(java.time.format.TextStyle.FULL, Locale.forLanguageTag("id-ID")) + " " + java.time.Month.MARCH.getDisplayName(java.time.format.TextStyle.SHORT, Locale.forLanguageTag("id-ID")));
        NumberFormat rp = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("id-ID"));
        System.out.println(rp.format(-12500) + " | " + rp.parse("Rp12.500,00") + " | " + NumberFormat.getCurrencyInstance(Locale.forLanguageTag("en-US")).format(new java.math.BigDecimal("19.99")) + " | " + NumberFormat.getCurrencyInstance(Locale.forLanguageTag("ms-MY")).format(12500) + " | " + NumberFormat.getCurrencyInstance(Locale.forLanguageTag("en-SG")).format(12500));
        System.out.println(java.text.MessageFormat.format("{0,number,integer} todo, {1,number,percent}", 1234, 0.5) + " | " + new MessageFormat("{0,number,integer} todo, {1,number,percent}", Locale.forLanguageTag("id-ID")).format(new Object[]{1234, 0.5}));
        System.out.println(new MessageFormat("Dibuat {0,date,long} pukul {0,time,short}", Locale.forLanguageTag("id-ID")).format(new Object[]{new GregorianCalendar(2026,10,17,14,5).getTime()}));
    }
}

class Teks extends ListResourceBundle {
    protected Object[][] getContents() { return new Object[][]{{"salam", "Hello"}}; }
}

class Teks_id extends ListResourceBundle {
    protected Object[][] getContents() { return new Object[][]{{"salam", "Halo"}}; }
}
