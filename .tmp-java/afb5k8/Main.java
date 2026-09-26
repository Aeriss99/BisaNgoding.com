public class Main {
    public static void main(String[] args) {
        int[] nilai = {70, 85, 90, 60};
        int total = 0;

        for (int n : nilai) {
            total += n;
        }

        System.out.println("Total: " + total);
        System.out.println("Rata-rata: " + (total / nilai.length));

        for (int i = 0; i < nilai.length; i++) {
            System.out.println("Index " + i + ": " + nilai[i]);
        }
    }
}