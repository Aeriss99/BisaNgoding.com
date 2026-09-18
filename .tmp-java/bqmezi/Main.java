public class Main {
    static String[] todos = new String[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        todos[jumlah] = isi;
        jumlah++;
    }

    static void cari(String kata) {
        int ketemu = 0;
        for (int i = 0; i < jumlah; i++) {
            if (todos[i].toLowerCase().contains(kata.toLowerCase())) {
                System.out.println((i + 1) + ". " + todos[i]);
                ketemu++;
            }
        }
        if (ketemu == 0) {
            System.out.println("Tidak ditemukan");
        }
    }

    public static void main(String[] args) {
        tambah("Bayar listrik");
        tambah("Bayar air");
        tambah("Olahraga");
        cari("bayar");
    }
}