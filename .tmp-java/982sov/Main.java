public class Main {
    public static void main(String[] args) {
        int bulan = 2;
        String musim;

        switch (bulan) {
            case 12:
            case 1:
            case 2:
                musim = "Hujan";
                break;
            case 6:
            case 7:
            case 8:
                musim = "Kemarau";
                break;
            default:
                musim = "Peralihan";
        }

        System.out.println(musim);
    }
}