//cp:
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Gudang g = new Gudang(5);
        boolean[] hasil = new boolean[4];
        List<Thread> kasir = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            int ke = i;
            kasir.add(new Thread(() -> hasil[ke] = g.ambil(2), "kasir-" + (i + 1)));
        }
        for (Thread t : kasir) {
            t.start();
        }
        for (Thread t : kasir) {
            t.join();
        }
        int berhasil = 0;
        for (boolean h : hasil) {
            if (h) {
                berhasil++;
            }
        }
        System.out.println("Berhasil: " + berhasil + ", gagal: " + (4 - berhasil));
        System.out.println("Sisa stok: " + g.stok());
    }
}

class Gudang {
    private final Object kunci = new Object();
    private int stok;

    Gudang(int stok) {
        this.stok = stok;
    }

    boolean ambil(int n) {
        synchronized (kunci) {
            if (stok >= n) {
                Jeda.ms(100);
                stok -= n;
                return true;
            }
            return false;
        }
    }

    void isiUlang(int n) {
        synchronized (kunci) {
            stok += n;
        }
    }

    int stok() {
        synchronized (kunci) {
            return stok;
        }
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
