//cp:
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.text.*;
import java.time.*;
import java.time.format.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        System.out.println("dir=" + System.getProperty("user.dir") + " abs=" + new File(".").getAbsolutePath());
        System.out.println("cp=" + System.getProperty("java.class.path"));
        System.out.println("default=" + Locale.getDefault() + " ver=" + System.getProperty("java.version") + " prov=" + System.getProperty("java.locale.providers"));
        Locale id = new Locale("id", "ID");
        Locale tag = Locale.forLanguageTag("id-ID");
        System.out.println(id + " " + tag + " " + id.equals(tag) + " " + id.getDisplayName() + " | " + id.getDisplayName(id) + " | " + id.getDisplayCountry(id) + " | " + Locale.JAPAN.getDisplayName(id));
        System.out.println("[" + NumberFormat.getCurrencyInstance(id).format(12500) + "] [" + NumberFormat.getCurrencyInstance(id).format(1234567.5) + "]");
        System.out.println("[" + NumberFormat.getCurrencyInstance(Locale.US).format(12500) + "] [" + NumberFormat.getCurrencyInstance(Locale.JAPAN).format(12500) + "] [" + NumberFormat.getCurrencyInstance(Locale.GERMANY).format(12500) + "]");
        System.out.println("[" + NumberFormat.getInstance(id).format(1234567.891) + "] [" + NumberFormat.getInstance(Locale.US).format(1234567.891) + "] [" + NumberFormat.getInstance(Locale.GERMANY).format(1234567.891) + "] [" + NumberFormat.getPercentInstance(id).format(0.256) + "] [" + NumberFormat.getIntegerInstance(id).format(1234567) + "]");
        NumberFormat rp = NumberFormat.getCurrencyInstance(id); rp.setMaximumFractionDigits(0);
        System.out.println("[" + rp.format(12500) + "] parse=" + NumberFormat.getInstance(id).parse("1.234,5"));
        LocalDate d = LocalDate.of(2026, 11, 17);
        LocalDateTime dt = LocalDateTime.of(2026, 11, 17, 14, 5);
        System.out.println("[" + DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy", id).format(d) + "] [" + DateTimeFormatter.ofPattern("EEE, d MMM yyyy", id).format(d) + "] [" + DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy", Locale.US).format(d) + "]");
        for (FormatStyle s : FormatStyle.values()) {
            String a = "-", b = "-", c = "-";
            try { a = DateTimeFormatter.ofLocalizedDate(s).withLocale(id).format(d); } catch (Exception e) { a = e.getClass().getSimpleName(); }
            try { b = DateTimeFormatter.ofLocalizedDate(s).withLocale(Locale.US).format(d); } catch (Exception e) { b = e.getClass().getSimpleName(); }
            try { c = DateTimeFormatter.ofLocalizedDateTime(s, FormatStyle.SHORT).withLocale(id).format(dt); } catch (Exception e) { c = e.getClass().getSimpleName(); }
            System.out.println(s + " [" + a + "] [" + b + "] [" + c + "]");
        }
        System.out.println("[" + MessageFormat.format("Halo {0}, kamu punya {1} todo", "Sari", 1234) + "] [" + new MessageFormat("Total {0,number,#,##0} todo pada {1,date,long}", id).format(new Object[]{1234567, new GregorianCalendar(2026, 10, 17).getTime()}) + "]");
        System.out.println("[" + new MessageFormat("{0,choice,0#tidak ada todo|1#satu todo|1<{0} todo}", id).format(new Object[]{0}) + "|" + new MessageFormat("{0,choice,0#tidak ada todo|1#satu todo|1<{0,number,integer} todo}", id).format(new Object[]{5}) + "]");
        System.out.println("[" + String.format(id, "%,.2f", 1234567.891) + "] [" + String.format(Locale.US, "%,.2f", 1234567.891) + "] [" + "TITLE".toLowerCase(new Locale("tr")) + "] [" + "i".toUpperCase(new Locale("tr")) + "]");
        System.out.println(Currency.getInstance(id) + " " + Currency.getInstance(id).getSymbol(id) + " " + Currency.getInstance(id).getDisplayName(id) + " " + Currency.getInstance(id).getDefaultFractionDigits());
        Files.write(Paths.get("pesan.properties"), "salam=Hello, {0}!\njumlah=You have {0} tasks\n".getBytes(StandardCharsets.UTF_8));
        Files.write(Paths.get("pesan_id.properties"), "salam=Halo, {0}!\njumlah=Kamu punya {0} tugas\n".getBytes(StandardCharsets.UTF_8));
        for (Locale l : new Locale[]{id, Locale.US, Locale.JAPAN}) {
            try {
                ResourceBundle rb = ResourceBundle.getBundle("pesan", l);
                System.out.println(l + " -> " + rb.getLocale() + " " + MessageFormat.format(rb.getString("salam"), "Sari") + " / " + rb.getString("jumlah"));
            } catch (Exception e) { System.out.println(l + " GAGAL " + e); }
        }
        System.out.println(ZonedDateTime.of(dt, ZoneId.of("Asia/Jakarta")).format(DateTimeFormatter.ofPattern("d MMMM yyyy HH:mm zzz", id)) + " | " + ZonedDateTime.of(dt, ZoneId.of("Asia/Makassar")).format(DateTimeFormatter.ofPattern("HH:mm z", id)));
        Collator col = Collator.getInstance(id);
        List<String> nama = new ArrayList<>(Arrays.asList("budi", "Ani", "Élan", "andi", "Zahra"));
        Collections.sort(nama); System.out.print(nama + " ");
        nama.sort(col); System.out.println(nama);
    }
}
