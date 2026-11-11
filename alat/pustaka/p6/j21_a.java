//cp:
import java.util.*;
import java.util.concurrent.*;
import java.time.*;

public class Main {
    sealed interface Bentuk permits Lingkaran, Persegi {}
    record Lingkaran(double r) implements Bentuk {}
    record Persegi(double s) implements Bentuk {}
    record Titik(int x, int y) {}
    record Garis(Titik a, Titik b) {}

    static String jelaskan(Object o) {
        return switch (o) {
            case null -> "null";
            case Integer i when i > 10 -> "angka besar " + i;
            case Integer i -> "angka " + i;
            case String s -> "teks " + s.length();
            case Garis(Titik(var x1, var y1), Titik(int x2, int y2)) -> "garis " + (x2 - x1) + "," + (y2 - y1);
            default -> "lain " + o.getClass().getSimpleName();
        };
    }
    static double luas(Bentuk b) {
        return switch (b) { case Lingkaran l -> Math.PI * l.r() * l.r(); case Persegi p -> p.s() * p.s(); };
    }

    public static void main(String[] args) throws Exception {
        System.out.println(Runtime.version() + " " + System.getProperty("java.version"));
        for (Object o : new Object[]{5, 42, "halo", new Garis(new Titik(1, 2), new Titik(4, 6)), 2.5, null}) System.out.println(jelaskan(o));
        System.out.printf("%.2f %.2f%n", luas(new Lingkaran(1)), luas(new Persegi(3)));
        if (new Titik(3, 4) instanceof Titik(int x, int y)) System.out.println("x+y=" + (x + y));
        List<String> l = new ArrayList<>(List.of("a", "b", "c"));
        l.addFirst("awal"); l.addLast("akhir");
        System.out.println(l + " " + l.getFirst() + " " + l.getLast() + " " + l.reversed());
        SequencedMap<String, Integer> m = new LinkedHashMap<>(); m.put("satu", 1); m.put("dua", 2); m.putFirst("nol", 0);
        System.out.println(m + " " + m.firstEntry() + " " + m.lastEntry() + " " + m.reversed() + " " + m.pollFirstEntry() + " " + m);
        SequencedSet<Integer> s = new LinkedHashSet<>(List.of(3, 1, 2)); System.out.println(s.reversed() + " " + s.removeLast());
        String tb = """
            {
              "nama": "Sari"
            }
            """;
        System.out.print(tb);
        var daftar = List.of(1, 2, 3); System.out.println(daftar.stream().map(x -> x * 2).toList());
        long t0 = System.currentTimeMillis();
        Thread vt = Thread.ofVirtual().name("virtual-1").start(() -> System.out.println("virtual? " + Thread.currentThread().isVirtual() + " " + Thread.currentThread().getName()));
        vt.join();
        try (ExecutorService ex = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<Integer>> fs = new ArrayList<>();
            for (int i = 0; i < 1000; i++) { int n = i; fs.add(ex.submit(() -> { Thread.sleep(Duration.ofMillis(50)); return n; })); }
            long sum = 0; for (Future<Integer> f : fs) sum += f.get();
            System.out.println("sum " + sum);
        }
        System.out.println("vt ms " + (System.currentTimeMillis() - t0));
        System.out.println(Thread.ofPlatform().unstarted(() -> {}).isVirtual() + " " + "Halo".repeat(2) + " " + "  ".isBlank() + " " + Math.clamp(15, 0, 10));
        StringBuilder sb = new StringBuilder("abc"); sb.repeat("x", 3); System.out.println(sb + " " + "a,b,,c".splitWithDelimiters(",", 0).length + " " + Character.isEmoji(0x1F600));
    }
}
