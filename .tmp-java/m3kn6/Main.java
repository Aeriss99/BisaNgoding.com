public class Main {
    static String[] todos = new String[2];
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
        jumlah++;
    }

    public static void main(String[] args) {
        tambah("");
        tambah("Belajar");
        tambah("Masak");
        tambah("Lari pagi");
        System.out.println("Jumlah todo: " + jumlah);
    }
}