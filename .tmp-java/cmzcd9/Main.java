public class Main {
    static int kali(int a, int b) {
        return a * b;
    }

    static int kali(int a, int b, int c) {
        return a * b * c;
    }

    static double kali(double a, double b) {
        return a * b;
    }

    public static void main(String[] args) {
        System.out.println(kali(2, 3));
        System.out.println(kali(2, 3, 4));
        System.out.println(kali(1.5, 2.0));
    }
}