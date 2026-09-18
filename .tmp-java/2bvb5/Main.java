public class Main {
    static String[] todos = new String[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        todos[jumlah] = isi;
        jumlah++;
    }

    public static void main(String[] args) {
        tambah("Belajar Java");
        tambah("Olahraga");
        System.out.println("Jumlah todo: " + jumlah);
    }
}