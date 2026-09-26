public class Main {
    static boolean lulus(int n) {
        return n >= 70;
    }

    public static void main(String[] args) {
        int[] nilai = {55, 90, 72, 40, 81};
        int jumlah = 0;
        for (int n : nilai) {
            if (lulus(n)) {
                jumlah++;
            }
        }
        System.out.println("Jumlah lulus: " + jumlah);
    }
}