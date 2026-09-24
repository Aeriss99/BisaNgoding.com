public class Main {
    public static void main(String[] args) {
        char grade = 'B';
        switch (grade) {
            case 'A':
                System.out.println("Sangat baik");
                break;
            case 'B':
                System.out.println("Baik");
                break;
            case 'C':
                System.out.println("Cukup");
                break;
            default:
                System.out.println("Perlu belajar lagi");
        }
    }
}