#!/bin/bash
# Rekam keluaran Maven asli untuk materi modul Maven.
set -x
cd /tmp
echo "=== mvn -v"; mvn -v
echo "=== archetype"; mvn -B archetype:generate -DgroupId=com.bisangoding -DartifactId=todolist -DarchetypeArtifactId=maven-archetype-quickstart -DarchetypeVersion=1.4 -DinteractiveMode=false 2>&1 | tail -25
cd todolist
echo "=== tree"; find . -type f | sort
echo "=== pom"; cat pom.xml
sed -i 's#<maven.compiler.source>1.7</maven.compiler.source>#<maven.compiler.source>17</maven.compiler.source>#; s#<maven.compiler.target>1.7</maven.compiler.target>#<maven.compiler.target>17</maven.compiler.target>#' pom.xml
echo "=== compile"; mvn -B compile 2>&1 | tail -25
echo "=== test"; mvn -B test 2>&1 | tail -40
echo "=== package"; mvn -B package 2>&1 | tail -30
echo "=== ls target"; ls target
echo "=== run"; java -cp target/todolist-1.0-SNAPSHOT.jar com.bisangoding.App
echo "=== clean"; mvn -B clean 2>&1 | tail -12; ls
# dependency
python3 - <<'PY'
s=open('pom.xml').read()
s=s.replace('</dependencies>','''    <dependency>
      <groupId>com.google.code.gson</groupId>
      <artifactId>gson</artifactId>
      <version>2.11.0</version>
    </dependency>
  </dependencies>''')
open('pom.xml','w').write(s)
PY
echo "=== dependency tree"; mvn -B dependency:tree 2>&1 | tail -20
echo "=== salah ketik dependency"; sed -i 's#<version>2.11.0</version>#<version>9.9.9</version>#' pom.xml; mvn -B compile 2>&1 | tail -15; sed -i 's#<version>9.9.9</version>#<version>2.11.0</version>#' pom.xml
# compile error
cp src/main/java/com/bisangoding/App.java /tmp/App.bak
sed -i 's#System.out.println( "Hello World!" );#System.out.println( "Hello World!" )#' src/main/java/com/bisangoding/App.java
echo "=== compile error"; mvn -B -q compile 2>&1 | tail -20; mvn -B compile 2>&1 | grep -E "ERROR|BUILD" | head -12
cp /tmp/App.bak src/main/java/com/bisangoding/App.java
# failing test
sed -i 's#assertTrue( true );#assertTrue( false );#' src/test/java/com/bisangoding/AppTest.java
echo "=== test gagal"; mvn -B test 2>&1 | tail -30
sed -i 's#assertTrue( false );#assertTrue( true );#' src/test/java/com/bisangoding/AppTest.java
echo "=== skip tests"; mvn -B package -DskipTests 2>&1 | grep -E "Tests are skipped|BUILD|jar" | head
echo "=== install"; mvn -B install 2>&1 | grep -E "Installing|BUILD" | head
echo "=== unknown phase"; mvn -B compil 2>&1 | grep -E "ERROR|BUILD" | head -6
echo "=== no pom"; cd /tmp && mvn -B compile 2>&1 | grep -E "ERROR|BUILD" | head -6
