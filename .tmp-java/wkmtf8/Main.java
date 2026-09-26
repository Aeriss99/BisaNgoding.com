public class Main {
    static String[] todos = new String[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        todos[jumlah] = isi;
        jumlah++;
    }

    static void hapus(int nomor) {
        if (nomor < 1 || nomor > jumlah) {
            System.out.println("Nomor tidak valid");
            return;
        }
        for (int i = nomor - 1; i < jumlah - 1; i++) {
            todos[i] = todos[i + 1];
        }
        jumlah--;
        System.out.println("Berhasil dihapus");
    }

    public static void main(String[] args) {
        tambah("Belajar");
        tambah("Olahraga");
        hapus(5);
        hapus(0);
        hapus(2);
        System.out.println("Sisa todo: " + jumlah);
    }
}