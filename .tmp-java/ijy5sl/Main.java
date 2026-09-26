public class Main {
    static int faktorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * faktorial(n - 1);
    }

    static void hitungMundur(int n) {
        if (n == 0) {
            System.out.println("Selesai!");
            return;
        }
        System.out.println(n);
        hitungMundur(n - 1);
    }

    public static void main(String[] args) {
        System.out.println(faktorial(5));
        hitungMundur(3);
    }
}