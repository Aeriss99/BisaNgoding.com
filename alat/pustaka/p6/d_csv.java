//cp:commons-csv,jackson-
import java.io.*;
import java.nio.file.*;
import java.util.*;
import org.apache.commons.csv.*;
import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.dataformat.csv.*;

public class Main {
    public static void main(String[] args) throws Exception {
        String data = "id,judul,selesai\n1,Belajar CSV,false\n2,\"Beli kopi, gula\",true\n3,\"Kata \"\"halo\"\"\",false\n";
        CSVFormat f = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build();
        try (CSVParser p = CSVParser.parse(data, f)) {
            System.out.println(p.getHeaderNames());
            for (CSVRecord r : p) System.out.println(r.getRecordNumber() + " " + r.get("judul") + " | " + Boolean.parseBoolean(r.get("selesai")) + " | " + r.size());
        }
        StringWriter sw = new StringWriter();
        try (CSVPrinter pr = new CSVPrinter(sw, CSVFormat.DEFAULT.builder().setHeader("id", "judul").build())) {
            pr.printRecord(1, "Biasa"); pr.printRecord(2, "Pakai, koma"); pr.printRecord(3, "Ada \"kutip\""); pr.printRecord(4, "Baris\nbaru");
        }
        System.out.print(sw.toString().replace("\r\n", "<CRLF>\n"));
        StringWriter sw2 = new StringWriter();
        try (CSVPrinter pr = new CSVPrinter(sw2, CSVFormat.EXCEL.builder().setDelimiter(';').build())) { pr.printRecord("Kopi", 18000.5); }
        System.out.print(sw2.toString().replace("\r\n", "<CRLF>\n"));
        try (CSVParser p = CSVParser.parse("nama;harga\nKopi;18000\n", CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader().setSkipHeaderRecord(true).build())) { for (CSVRecord r : p) System.out.println(r.toMap()); }
        try (CSVParser p = CSVParser.parse("a,b\n1,\"tidak ditutup\n", CSVFormat.DEFAULT)) { for (CSVRecord r : p) System.out.println(r); } catch (Exception e) { System.out.println("rusak " + e.getClass().getSimpleName() + ": " + e.getMessage()); }
        try (CSVParser p = CSVParser.parse("id,judul\n1\n", CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) { for (CSVRecord r : p) { System.out.println(r.isConsistent() + " " + r.isSet("judul")); r.get("judul"); } } catch (Exception e) { System.out.println("kurang " + e.getClass().getSimpleName() + ": " + e.getMessage()); }
        Files.write(Paths.get("todo.csv"), "id,judul\n1,A\n2,B\n".getBytes("UTF-8"));
        try (Reader in = Files.newBufferedReader(Paths.get("todo.csv")); CSVParser p = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(in)) { System.out.println(p.getRecords().size()); }
        try (Writer w = Files.newBufferedWriter(Paths.get("keluar.csv")); CSVPrinter pr = new CSVPrinter(w, CSVFormat.DEFAULT)) { pr.printRecord("x", "y"); }
        System.out.println(new String(Files.readAllBytes(Paths.get("keluar.csv")), "UTF-8").replace("\r\n", "<CRLF>"));
        CsvMapper m = new CsvMapper();
        CsvSchema s = m.schemaFor(Todo.class).withHeader();
        List<Todo> l = new ArrayList<>();
        try (MappingIterator<Todo> it = m.readerFor(Todo.class).with(s).readValues(data)) { l = it.readAll(); }
        for (Todo t : l) System.out.println(t.id + " " + t.judul + " " + t.selesai);
        System.out.print(m.writer(s).writeValueAsString(l).replace("\r\n", "<CRLF>\n"));
        CsvSchema bebas = CsvSchema.emptySchema().withHeader();
        try (MappingIterator<Map<String, String>> it = m.readerFor(Map.class).with(bebas).readValues(data)) { System.out.println(it.next()); }
    }
}
@JsonPropertyOrder({"id", "judul", "selesai"})
class Todo { public int id; public String judul; public boolean selesai; }
