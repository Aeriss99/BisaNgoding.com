//cp:
import java.util.*;

public class Main {
    static void proses(String id, long ms) {
        Jeda.ms(ms);
        System.out.println("[" + Thread.currentThread().getName() + "] " + id + " selesai");
    }

    public static void main(String[] args) throws Exception {
        List<Thread> kasir = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            String id = "PSN-" + i;
            long lama = i * 200L;
            kasir.add(new Thread(() -> proses(id, lama), "kasir-" + i));
        }
        for (Thread t : kasir) {
            t.start();
        }
        System.out.println("Menunggu " + kasir.size() + " kasir...");
        for (Thread t : kasir) {
            t.join();
        }
        System.out.println("Semua pesanan selesai");
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
