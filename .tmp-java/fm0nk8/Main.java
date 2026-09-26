public class Main {
    public static void main(String[] args) {
        Produk p = new Produk("Kopi", 25000);
        p.tampil();
    }
}

class Produk {
    String nama;
    int harga;

    Produk(String nama, int harga) {
        this.nama = nama;
        this.harga = harga;
    }

    void tampil() {
        System.out.println(nama + " - " + harga);
    }
}