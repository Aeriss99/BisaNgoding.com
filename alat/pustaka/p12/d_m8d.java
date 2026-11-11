//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Gudang gudang = new Gudang(Map.of("kopi", 10, "teh", 4));
        List<Pesanan> daftar = List.of(
                new Pesanan("PSN-1", "kopi", 2, "Jakarta"),
                new Pesanan("PSN-2", "teh", 3, "Bandung"),
                new Pesanan("PSN-3", "kopi", 20, "Jakarta"),
                new Pesanan("PSN-4", "kopi", 3, "Surabaya"),
                new Pesanan("PSN-5", "teh", 1, "Ternate"));
        try (ExecutorService pool = Executors.newFixedThreadPool(5)) {
            Pemroses pemroses = new Pemroses(gudang, pool);
            for (String s : pemroses.prosesSemua(daftar)) {
                System.out.println(s);
            }
            System.out.println(pemroses.ringkasan());
        }
        System.out.println("Sisa stok: " + gudang.sisa());
    }
}

record Pesanan(String id, String produk, int jumlah, String kota) {}

class Gudang {
    private final Map<String, Integer> stok = new ConcurrentHashMap<>();

    Gudang(Map<String, Integer> awal) {
        stok.putAll(awal);
    }

    boolean ambil(String produk, int n) {
        boolean[] berhasil = {false};
        stok.computeIfPresent(produk, (k, ada) -> {
            if (ada >= n) {
                berhasil[0] = true;
                return ada - n;
            }
            return ada;
        });
        return berhasil[0];
    }

    Map<String, Integer> sisa() {
        return new TreeMap<>(stok);
    }
}

class Pemroses {
    private final Gudang gudang;
    private final ExecutorService pool;
    private final AtomicInteger berhasil = new AtomicInteger();
    private final AtomicInteger gagal = new AtomicInteger();

    Pemroses(Gudang gudang, ExecutorService pool) {
        this.gudang = gudang;
        this.pool = pool;
    }

    List<String> prosesSemua(List<Pesanan> daftar) {
        List<CompletableFuture<String>> hasil = new ArrayList<>();
        for (Pesanan p : daftar) {
            hasil.add(CompletableFuture.supplyAsync(() -> proses(p), pool)
                    .exceptionally(e -> {
                        gagal.incrementAndGet();
                        return p.id() + ": gagal (" + e.getCause().getMessage() + ")";
                    }));
        }
        CompletableFuture.allOf(hasil.toArray(new CompletableFuture[0])).join();
        List<String> teks = new ArrayList<>();
        for (CompletableFuture<String> f : hasil) {
            teks.add(f.join());
        }
        return teks;
    }

    String ringkasan() {
        return "Berhasil " + berhasil.get() + ", gagal " + gagal.get();
    }

    private String proses(Pesanan p) {
        Jeda.ms(100);
        if (!gudang.ambil(p.produk(), p.jumlah())) {
            gagal.incrementAndGet();
            return p.id() + ": stok " + p.produk() + " kurang";
        }
        String hasil = p.id() + ": dikirim ke " + p.kota() + ", ongkir " + Ongkir.hitung(p.kota());
        berhasil.incrementAndGet();
        return hasil;
    }
}

class Ongkir {
    static int hitung(String kota) {
        Jeda.ms(100);
        return switch (kota) {
            case "Jakarta" -> 10000;
            case "Bandung", "Surabaya" -> 25000;
            default -> throw new IllegalArgumentException("kota " + kota + " belum dilayani");
        };
    }
}

class Jeda {
    static void ms(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
