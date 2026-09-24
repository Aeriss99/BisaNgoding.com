public class Main {
    static String gabung(String a, String b) {
        return a + " " + b;
    }

    static String gabung(String teks, int jumlah) {
        String hasil = "";
        for (int i = 0; i < jumlah; i++) {
            hasil += teks;
        }
        return hasil;
    }

    public static void main(String[] args) {
        System.out.println(gabung("Halo", "Java"));
        System.out.println(gabung("Ha", 3));
    }
}