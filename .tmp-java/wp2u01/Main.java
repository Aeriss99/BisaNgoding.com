public class Main {
    public static void main(String[] args) {
        int[] data = {12, 45, 7, 33, 21};
        int terbesar = data[0];
        for (int n : data) {
            if (n > terbesar) {
                terbesar = n;
            }
        }
        System.out.println("Terbesar: " + terbesar);
    }
}