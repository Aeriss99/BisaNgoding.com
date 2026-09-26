public class Main {
    public static void main(String[] args) {
        int[][] matriks = {
            {1, 2, 3},
            {4, 5, 6}
        };

        System.out.println(matriks[1][2]);
        System.out.println(matriks.length);
        System.out.println(matriks[0].length);

        for (int[] baris : matriks) {
            String teks = "";
            for (int n : baris) {
                teks += n + " ";
            }
            System.out.println(teks.trim());
        }
    }
}