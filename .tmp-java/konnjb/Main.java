public class Main {
    static String[] todos = new String[10];
    static int jumlah = 0;

    static void tambah(String isi) {
        todos[jumlah] = isi;
        jumlah++;
    }

    public static void main(String[] args) {
        tambah("Belajar Java");
        System.out.println(todos[0]);
        System.out.println("Jumlah todo: " + jumlah);
    }
}