//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    static int cekStok(String produk) {
        Jeda.ms(150);
        return produk.equals("kopi") ? 12 : 0;
    }

    static int hitungOngkir(String kota) {
        Jeda.ms(100);
        return kota.equals("Jakarta") ? 10000 : 25000;
    }

    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(4);
        CompletableFuture<Integer> stok = CompletableFuture.supplyAsync(() -> cekStok("kopi"), pool);
        CompletableFuture<Integer> ongkir = CompletableFuture.supplyAsync(() -> hitungOngkir("Bandung"), pool);
        CompletableFuture<String> ringkasan = stok.thenCombine(ongkir, (s, o) -> "Stok " + s + ", ongkir " + o);
        System.out.println(ringkasan.join());
        List<CompletableFuture<Integer>> semua = new ArrayList<>();
        for (String kota : List.of("Jakarta", "Bandung", "Medan")) {
            semua.add(CompletableFuture.supplyAsync(() -> hitungOngkir(kota), pool));
        }
        CompletableFuture.allOf(semua.toArray(new CompletableFuture[0])).join();
        int total = 0;
        for (CompletableFuture<Integer> f : semua) {
            total += f.join();
        }
        System.out.println("Total ongkir 3 kota: " + total);
        pool.shutdown();
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
