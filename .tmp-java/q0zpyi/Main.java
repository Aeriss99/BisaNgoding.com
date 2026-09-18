public class Main {
    public static void main(String[] args) {
        int angka = 7;
        String jenis = angka % 2 == 0 ? "Genap" : "Ganjil";
        System.out.println(angka + " adalah " + jenis);
    }
}