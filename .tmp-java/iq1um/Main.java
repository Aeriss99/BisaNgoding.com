public class Main {
    static String[] todos = new String[10];
    static boolean[] selesai = new boolean[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        todos[jumlah] = isi;
        jumlah++;
    }

    static void tandai(int nomor) {
        selesai[nomor - 1] = true;
    }

    static void statistik() {
        int sudah = 0;
        for (int i = 0; i < jumlah; i++) {
            if (selesai[i]) {
                sudah++;
            }
        }
        System.out.println("Total: " + jumlah);
        System.out.println("Selesai: " + sudah);
        System.out.println("Belum: " + (jumlah - sudah));
    }

    public static void main(String[] args) {
        tambah("Belajar");
        tambah("Olahraga");
        tambah("Belanja");
        tandai(1);
        tandai(3);
        statistik();
    }
}