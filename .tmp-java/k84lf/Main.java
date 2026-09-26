public class Main {
    static String[] todos = new String[10];
    static boolean[] selesai = new boolean[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        todos[jumlah] = isi;
        jumlah++;
    }

    static void tandai(int nomor) {
        if (nomor < 1 || nomor > jumlah) {
            System.out.println("Nomor tidak valid");
            return;
        }
        selesai[nomor - 1] = true;
    }

    static void tampilkan() {
        for (int i = 0; i < jumlah; i++) {
            String tanda = selesai[i] ? "[v]" : "[ ]";
            System.out.println(tanda + " " + (i + 1) + ". " + todos[i]);
        }
    }

    public static void main(String[] args) {
        tambah("Belanja");
        tambah("Cuci baju");
        tandai(2);
        tampilkan();
    }
}