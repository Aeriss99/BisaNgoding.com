public class Main {
    static int jumlah(int n) {
        if (n <= 1) {
            return n;
        }
        return n + jumlah(n - 1);
    }

    public static void main(String[] args) {
        System.out.println(jumlah(5));
        System.out.println(jumlah(10));
    }
}