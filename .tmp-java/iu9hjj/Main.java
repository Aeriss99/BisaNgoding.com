public class Main {
    public static void main(String[] args) {
        int[][] kursi = {
            {1, 0, 1},
            {0, 1, 1}
        };
        int terisi = 0;
        for (int[] baris : kursi) {
            for (int k : baris) {
                if (k == 1) {
                    terisi++;
                }
            }
        }
        System.out.println("Kursi terisi: " + terisi);
    }
}