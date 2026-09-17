import { initCheerpJ, runJavaCode } from './src/lib/javaRunner.ts';

async function run() {
  const result = await runJavaCode('public class Main { public static void main(String[] args) { System.out.println(5 + 3); } }');
  console.log(result);
}
run();
