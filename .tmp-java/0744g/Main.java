public class Main {
    static String[] todos = new String[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        todos[jumlah] = isi;
        jumlah++;
    }

    static void tampilkan() {
        for (int i = 0; i < jumlah; i++) {
            System.out.println((i + 1) + ". " + todos[i]);
        }
    }

    static void hapus(int nomor) {
        for (int i = nomor - 1; i < jumlah - 1; i++) {
            todos[i] = todos[i + 1];
        }
        jumlah--;
        System.out.println("Todo nomor " + nomor + " dihapus");
    }

    public static void main(String[] args) {
        tambah("Belajar");
        tambah("Olahraga");
        tambah("Belanja");
        hapus(2);
        tampilkan();
    }
}