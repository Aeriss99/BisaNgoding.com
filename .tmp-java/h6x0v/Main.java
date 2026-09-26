public class Main {
    static int tambah(int a, int b) {
        return a + b;
    }

    static boolean isGenap(int n) {
        return n % 2 == 0;
    }

    public static void main(String[] args) {
        int hasil = tambah(7, 5);
        System.out.println(hasil);
        System.out.println(isGenap(hasil));
        System.out.println(tambah(2, tambah(3, 4)));
    }
}