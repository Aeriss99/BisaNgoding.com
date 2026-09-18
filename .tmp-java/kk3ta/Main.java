public class Main {
    public static void main(String[] args) {
        Produk p = new Produk();
        p.setHarga(-5);
        p.setHarga(15000);
        System.out.println(p.getHarga());
    }
}

class Produk {
    private int harga;

    void setHarga(int harga) {
        if (harga >= 0) {
            this.harga = harga;
        }
    }

    int getHarga() {
        return harga;
    }
}