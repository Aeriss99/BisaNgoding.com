public class Main {
    public static void main(String[] args) {
        Buku b = new Buku();
        b.judul = "Laskar Pelangi";
        b.penulis = "Andrea Hirata";
        System.out.println("Judul: " + b.judul);
        System.out.println("Penulis: " + b.penulis);
    }
}

class Buku {
    String judul;
    String penulis;
}