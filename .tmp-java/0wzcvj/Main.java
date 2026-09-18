public class Main {
    static String[] todos = new String[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        todos[jumlah] = isi;
        jumlah++;
    }

    static void tampilkan() {
        if (jumlah == 0) {
            System.out.println("Belum ada todo.");
            return;
        }
        for (int i = 0; i < jumlah; i++) {
            System.out.println((i + 1) + ". " + todos[i]);
        }
    }

    public static void main(String[] args) {
        tampilkan();
        tambah("Belajar Java");
        tambah("Olahraga");
        tampilkan();
    }
}