public class Main {
    static String[] todos = new String[10];
    static boolean[] selesai = new boolean[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        if (isi == null || isi.isEmpty()) {
            System.out.println("Todo tidak boleh kosong");
            return;
        }
        if (jumlah >= todos.length) {
            System.out.println("Todolist penuh");
            return;
        }
        todos[jumlah] = isi;
        selesai[jumlah] = false;
        jumlah++;
    }

    static void tandai(int nomor) {
        if (nomor < 1 || nomor > jumlah) {
            System.out.println("Nomor tidak valid");
            return;
        }
        selesai[nomor - 1] = true;
    }

    static void hapus(int nomor) {
        if (nomor < 1 || nomor > jumlah) {
            System.out.println("Nomor tidak valid");
            return;
        }
        for (int i = nomor - 1; i < jumlah - 1; i++) {
            todos[i] = todos[i + 1];
            selesai[i] = selesai[i + 1];
        }
        jumlah--;
    }

    static void tampilkan() {
        System.out.println("=== TODOLIST ===");
        if (jumlah == 0) {
            System.out.println("Belum ada todo.");
            return;
        }
        for (int i = 0; i < jumlah; i++) {
            String tanda = selesai[i] ? "[v]" : "[ ]";
            System.out.println(tanda + " " + (i + 1) + ". " + todos[i]);
        }
    }

    public static void main(String[] args) {
        tambah("Belajar Java");
        tambah("Olahraga");
        tambah("Belanja bulanan");
        tandai(1);
        hapus(2);
        tampilkan();
    }
}