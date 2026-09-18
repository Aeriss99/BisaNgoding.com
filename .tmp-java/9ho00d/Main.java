public class Main {
    public static void main(String[] args) {
        Buku b1 = new Buku("Java Dasar");
        Buku b2 = new Buku("Algoritma", 2019);
        b1.info();
        b2.info();
    }
}

class Buku {
    String judul;
    int tahun;

    Buku(String judul) {
        this(judul, 2024);
    }

    Buku(String judul, int tahun) {
        this.judul = judul;
        this.tahun = tahun;
    }

    void info() {
        System.out.println(judul + " (" + tahun + ")");
    }
}