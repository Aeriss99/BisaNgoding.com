#!/bin/bash
# Rekam keluaran asli Maven, Logback, Lombok, MySQL untuk modul Java 12-18 (terminal tiruan).
ASAL=$(cd "$(dirname "$0")" && pwd)
T=$ASAL/tambahan
P=src/main/java/com/bisangoding/todolist
mkdir -p /tmp/sari && rm -rf /tmp/sari/todolist && cp -r $ASAL/proyek /tmp/sari/todolist && cd /tmp/sari/todolist
J() { echo; echo "=================== $1"; }
dep() { python3 - "$1" <<'PY'
import sys
s = open('pom.xml').read()
s = s.replace('    <!--DEP-->', sys.argv[1] + '\n    <!--DEP-->')
open('pom.xml', 'w').write(s)
PY
}
plugin() { python3 - "$1" <<'PY'
import sys
s = open('pom.xml').read()
s = s.replace('      <!--PLUGIN-->', sys.argv[1] + '\n      <!--PLUGIN-->')
open('pom.xml', 'w').write(s)
PY
}
D() { echo "    <dependency>
      <groupId>$1</groupId>
      <artifactId>$2</artifactId>
      <version>$3</version>${4:+
      <scope>$4</scope>}
    </dependency>"; }
M="mvn -B -ntp"
J "versi"; java -version 2>&1; mvn -v
# unduh semua dulu (tidak direkam)
$M -q test-compile > /dev/null 2>&1; $M -q clean

# ---------------- UNIT TEST
J "U mvn test"; $M test 2>&1
J "U mvn test -Dtest=TodoServiceTest"; $M test -Dtest=TodoServiceTest 2>&1
J "U mvn test -Dtest=TodoServiceTest#tambahJudulKosongDitolak"; $M test -Dtest='TodoServiceTest#tambahJudulKosongDitolak' 2>&1
J "U mvn test -Dtest=TodoTes"; $M test -Dtest=TodoTes 2>&1
J "U ls target/surefire-reports"; ls target/surefire-reports
J "U cat txt"; cat target/surefire-reports/com.bisangoding.todolist.TodoServiceTest.txt
sed -i 's/"Judul tidak boleh kosong"/"Judul kosong"/' $P/TodoService.java
J "U mvn test gagal"; $M test 2>&1
J "U ls surefire gagal"; ls target/surefire-reports
J "U mvn package gagal"; $M package 2>&1 | tail -30
sed -i 's/"Judul kosong"/"Judul tidak boleh kosong"/' $P/TodoService.java
J "U mvn package"; $M package 2>&1
plugin '      <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
        <version>0.8.12</version>
        <executions>
          <execution>
            <goals>
              <goal>prepare-agent</goal>
            </goals>
          </execution>
          <execution>
            <id>report</id>
            <phase>verify</phase>
            <goals>
              <goal>report</goal>
            </goals>
          </execution>
        </executions>
      </plugin>'
$M -q verify > /dev/null 2>&1; $M -q clean
J "U mvn verify jacoco"; $M verify 2>&1
J "U ls jacoco"; ls target/site/jacoco
J "U jacoco csv"; cat target/site/jacoco/jacoco.csv
git checkout -q -- pom.xml 2>/dev/null || cp $ASAL/proyek/pom.xml pom.xml

# ---------------- LOGGING
cp $ASAL/proyek/pom.xml pom.xml
dep "$(D org.slf4j slf4j-api 2.0.16)"
dep "$(D ch.qos.logback logback-classic 1.5.12)"
cp $T/AppLog.java $P/App.java; cp $T/TodoServiceLog.java $P/TodoService.java; cp $T/Banyak.java $P/Banyak.java
$M -q compile > /dev/null 2>&1
J "L tanpa logback.xml"; $M -q compile exec:java 2>&1
J "L dependency tree"; $M dependency:tree 2>&1 | grep -E "INFO\] [+|\\\\ ]|todolist:jar"
mkdir -p src/main/resources
cat > src/main/resources/logback.xml <<'XML'
<configuration>
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="CONSOLE"/>
  </root>
</configuration>
XML
J "L logback info"; $M -q compile exec:java 2>&1
sed -i 's/<root level="INFO">/<root level="DEBUG">/' src/main/resources/logback.xml
J "L logback debug"; $M -q compile exec:java 2>&1
sed -i 's/<root level="DEBUG">/<root level="WARN">/' src/main/resources/logback.xml
J "L logback warn"; $M -q compile exec:java 2>&1
sed -i 's#<root level="WARN">#<logger name="com.bisangoding.todolist.TodoService" level="DEBUG"/>\n\n  <root level="INFO">#' src/main/resources/logback.xml
J "L cat logback per logger"; cat src/main/resources/logback.xml
J "L logback per logger"; $M -q compile exec:java 2>&1
sed -i 's#%d{HH:mm:ss.SSS} \[%thread\] %-5level %logger{36} - %msg%n#%d{yyyy-MM-dd HH:mm:ss} %-5level %logger{0} - %msg%n#' src/main/resources/logback.xml
J "L pola pendek"; $M -q compile exec:java 2>&1
cat > src/main/resources/logback.xml <<'XML'
<configuration>
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{HH:mm:ss.SSS} %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>

  <appender name="FILE" class="ch.qos.logback.core.FileAppender">
    <file>logs/todolist.log</file>
    <encoder>
      <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
  </root>
</configuration>
XML
J "L file run"; $M -q compile exec:java 2>&1
J "L ls logs"; ls logs
J "L cat log"; cat logs/todolist.log
$M -q exec:java > /dev/null 2>&1
J "L wc"; wc -l logs/todolist.log
J "L tail"; tail -n 3 logs/todolist.log
rm -rf logs
cat > src/main/resources/logback.xml <<'XML'
<configuration>
  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/todolist.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
      <fileNamePattern>logs/todolist-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
      <maxFileSize>1KB</maxFileSize>
      <maxHistory>30</maxHistory>
      <totalSizeCap>1GB</totalSizeCap>
    </rollingPolicy>
    <encoder>
      <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="FILE"/>
  </root>
</configuration>
XML
J "L rolling run"; $M -q compile exec:java -Dexec.mainClass=com.bisangoding.todolist.Banyak 2>&1
J "L rolling ls"; ls -l logs | awk '{print $5, $9}'
J "L rolling ls biasa"; ls logs
J "L rolling head"; head -n 2 logs/todolist.log
cat > src/main/resources/logback.xml <<'XML'
<configuration>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="ch.qos.logback.classic.encoder.JsonEncoder"/>
  </appender>

  <root level="INFO">
    <appender-ref ref="JSON"/>
  </root>
</configuration>
XML
J "L json"; $M -q compile exec:java 2>&1
rm -rf logs src/main/resources

# ---------------- LOMBOK
cp $ASAL/proyek/pom.xml pom.xml
cp $ASAL/proyek/$P/App.java $P/App.java; cp $ASAL/proyek/$P/TodoService.java $P/TodoService.java; rm -f $P/Banyak.java
$M -q clean
cp $T/TodoLombok.java $P/Todo.java
J "K tanpa lombok"; $M compile 2>&1 | tail -25
dep "$(D org.projectlombok lombok 1.18.36 provided)"
J "K compile"; $M compile 2>&1
J "K javap"; javap -cp target/classes com.bisangoding.todolist.Todo
J "K javap private"; javap -p -cp target/classes com.bisangoding.todolist.Todo
J "K exec"; $M -q exec:java 2>&1
J "K test"; $M test 2>&1 | grep -E "Tests run|BUILD"
J "K tree"; $M dependency:tree 2>&1 | grep -E "INFO\] [+|\\\\ ]|todolist:jar"
J "K package"; $M -q package -DskipTests; unzip -l target/todolist-1.0-SNAPSHOT.jar | grep -i -E "lombok|class" | head
python3 - <<'PY'
s = open('pom.xml').read()
s = s.replace('''        <artifactId>maven-surefire-plugin</artifactId>''', '''        <artifactId>maven-surefire-plugin</artifactId>''')
s = s.replace('''      <!--PLUGIN-->''', '''      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.13.0</version>
        <configuration>
          <annotationProcessorPaths>
            <path>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
              <version>1.18.36</version>
            </path>
          </annotationProcessorPaths>
        </configuration>
      </plugin>
      <!--PLUGIN-->''')
open('pom.xml', 'w').write(s)
PY
$M -q clean
J "K compile dengan processor path"; $M compile 2>&1
J "K pom akhir"; cat pom.xml

# ---------------- MYSQL
cd /tmp/sari
export MYSQL_PWD=rahasia
Q() { echo; echo "=================== SQL $1"; shift; mysql -h127.0.0.1 -uroot --table -vvv "$@" 2>&1 | grep -v "Using a password"; }
J "SQL versi klien"; mysql --version
Q "show databases" -e "SHOW DATABASES;"
Q "create database" -e "CREATE DATABASE todolist;"
Q "create database lagi" -e "CREATE DATABASE todolist;"
Q "create table" todolist -e "CREATE TABLE todo (id INT AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(100) NOT NULL, selesai BOOLEAN NOT NULL DEFAULT FALSE);"
Q "show tables" todolist -e "SHOW TABLES;"
Q "describe" todolist -e "DESCRIBE todo;"
Q "select kosong" todolist -e "SELECT * FROM todo;"
Q "insert satu" todolist -e "INSERT INTO todo (judul) VALUES ('Belajar MySQL');"
Q "insert banyak" todolist -e "INSERT INTO todo (judul) VALUES ('Beli kopi'), ('Olahraga pagi'), ('Baca buku');"
Q "select semua" todolist -e "SELECT * FROM todo;"
Q "select kolom" todolist -e "SELECT id, judul FROM todo;"
Q "update" todolist -e "UPDATE todo SET selesai = TRUE WHERE id = 2;"
Q "select setelah update" todolist -e "SELECT * FROM todo;"
Q "where false" todolist -e "SELECT * FROM todo WHERE selesai = FALSE;"
Q "where true" todolist -e "SELECT * FROM todo WHERE selesai = TRUE;"
Q "like" todolist -e "SELECT * FROM todo WHERE judul LIKE '%buku%';"
Q "order judul" todolist -e "SELECT * FROM todo ORDER BY judul;"
Q "order desc limit" todolist -e "SELECT * FROM todo ORDER BY id DESC LIMIT 2;"
Q "count" todolist -e "SELECT COUNT(*) FROM todo;"
Q "count selesai" todolist -e "SELECT COUNT(*) AS jumlah_selesai FROM todo WHERE selesai = TRUE;"
Q "delete" todolist -e "DELETE FROM todo WHERE id = 4;"
Q "select setelah delete" todolist -e "SELECT * FROM todo;"
Q "error tabel" todolist -e "SELECT * FROM todos;"
Q "error kolom" todolist -e "SELECT nama FROM todo;"
Q "error null" todolist -e "INSERT INTO todo (judul) VALUES (NULL);"
Q "error sintaks" todolist -e "SELEC * FROM todo;"
Q "error kutip" todolist -e "INSERT INTO todo (judul) VALUES (Belajar);"
Q "update tanpa where safe" --safe-updates todolist -e "UPDATE todo SET selesai = TRUE;"
Q "insert lagi" todolist -e "INSERT INTO todo (judul) VALUES ('Masak');"
Q "select id 5" todolist -e "SELECT * FROM todo;"
Q "user" -e "SELECT CURRENT_USER();"
J "SQL sesi interaktif"
printf 'USE todolist;\nSELECT * FROM todo WHERE id = 1;\nexit\n' > /tmp/sesi.sql
script -q -c "mysql -h127.0.0.1 -uroot" /dev/null < /tmp/sesi.sql 2>&1 | cat -v | head -60
J "SQL sesi interaktif 2"
(sleep 1; printf 'USE todolist;\n'; sleep 1; printf 'SELECT * FROM todo WHERE id = 1;\n'; sleep 1; printf 'exit\n'; sleep 1) | script -q -c "mysql -h127.0.0.1 -uroot -p" /dev/null 2>&1 | cat -v | head -60

# ---------------- JDBC MYSQL
cd /tmp/sari/todolist
cp $ASAL/proyek/pom.xml pom.xml; cp $ASAL/proyek/$P/Todo.java $P/Todo.java
cp $T/AppJdbc.java $P/App.java
$M -q clean
J "J tanpa driver"; DB_PASSWORD=rahasia $M -q compile exec:java 2>&1 | head -20
dep "$(D com.mysql mysql-connector-j 9.1.0)"
$M -q compile > /dev/null 2>&1
J "J jalan"; DB_PASSWORD=rahasia $M -q compile exec:java 2>&1
J "J sandi salah"; DB_PASSWORD=salah $M -q compile exec:java 2>&1 | head -20
J "J tanpa env"; $M -q compile exec:java 2>&1 | head -20
J "J tree"; $M dependency:tree 2>&1 | grep -E "INFO\] [+|\\\\ ]|todolist:jar"
dep "$(D com.zaxxer HikariCP 6.2.1)"
dep "$(D ch.qos.logback logback-classic 1.5.12)"
mkdir -p src/main/resources
cat > src/main/resources/logback.xml <<'XML'
<configuration>
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{HH:mm:ss.SSS} %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>
  <root level="INFO">
    <appender-ref ref="CONSOLE"/>
  </root>
</configuration>
XML
cp $T/AppHikari.java $P/App.java
$M -q compile > /dev/null 2>&1
J "J hikari"; DB_PASSWORD=rahasia $M -q compile exec:java 2>&1

# ---------------- TODOLIST DATABASE
cp $T/TodoDb.java $P/Todo.java; cp $T/TodoRepositoryJdbc.java $P/; cp $T/AppTodoDb.java $P/App.java
cp $T/schema.sql src/main/resources/schema.sql
mkdir -p src/test/java/com/bisangoding/todolist && cp $T/TodoRepositoryJdbcTest.java src/test/java/com/bisangoding/todolist/
dep "$(D com.h2database h2 2.3.232 test)"
mysql -h127.0.0.1 -uroot -e "DROP DATABASE todolist; CREATE DATABASE todolist;" 2>/dev/null
J "T schema"; mysql -h127.0.0.1 -uroot todolist < src/main/resources/schema.sql 2>&1 | grep -v "Using a password"; echo "exit $?"
Q "T describe" todolist -e "DESCRIBE todo;"
$M -q compile > /dev/null 2>&1
J "T kosong"; DB_PASSWORD=rahasia $M -q compile exec:java 2>&1
J "T tambah1"; DB_PASSWORD=rahasia $M -q exec:java -Dexec.args="Belajar JDBC" 2>&1
J "T tambah2"; DB_PASSWORD=rahasia $M -q exec:java -Dexec.args="Rapikan kode" 2>&1
Q "T select" todolist -e "SELECT * FROM todo;"
J "T test"; $M test 2>&1
J "T package"; $M -q package -DskipTests 2>&1; ls target/*.jar
Q "T update" todolist -e "UPDATE todo SET selesai = TRUE WHERE id = 1;"
J "T setelah update"; DB_PASSWORD=rahasia $M -q exec:java 2>&1
J "T matikan mysql"; docker stop $(docker ps -q --filter ancestor=mysql:8.4) > /dev/null; DB_PASSWORD=rahasia $M -q exec:java 2>&1 | head -30
J "J mati"; cp $T/AppJdbc.java $P/App.java; rm -f $P/TodoRepositoryJdbc.java; $M -q compile > /dev/null 2>&1; DB_PASSWORD=rahasia $M -q exec:java 2>&1 | head -20
J "SELESAI"
