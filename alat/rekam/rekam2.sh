#!/bin/bash
# Rekaman kedua: sesi mysql interaktif sungguhan (lewat script) dan rolling file Logback.
ASAL=$(cd "$(dirname "$0")" && pwd)
T=$ASAL/tambahan
P=src/main/java/com/bisangoding/todolist
J() { echo; echo "=================== $1"; }
sesi() {  # $1 nama, $2 argumen mysql, sisanya baris yang diketik (baris pertama = sandi)
  local nama=$1 arg=$2; shift 2
  J "SESI $nama"
  ( sleep 2; for b in "$@"; do printf '%s\n' "$b"; sleep 1.5; done; sleep 1 ) | script -q -c "mysql -h127.0.0.1 -uroot -p $arg" /dev/null 2>&1 | tr -d '\r'
}
sesi satu "" rahasia "SHOW DATABASES;" "CREATE DATABASE todolist;" "CREATE DATABASE todolist;" "USE todolist;" "SELECT DATABASE();" "exit"
sesi dua "todolist" rahasia "SHOW TABLES;" "CREATE TABLE todo (id INT AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(100) NOT NULL, selesai BOOLEAN NOT NULL DEFAULT FALSE);" "SHOW TABLES;" "DESCRIBE todo;" "SELECT * FROM todo;" "INSERT INTO todo (judul) VALUES ('Belajar MySQL');" "INSERT INTO todo (judul) VALUES ('Beli kopi'), ('Olahraga pagi'), ('Baca buku');" "SELECT * FROM todo;" "SELECT id, judul FROM todo;" "INSERT INTO todo (judul) VALUES (NULL);" "INSERT INTO todo (judul) VALUES (Belajar);" "SELECT * FROM todos;" "exit"
sesi tiga "todolist" rahasia "SELECT * FROM todo WHERE selesai = FALSE;" "UPDATE todo SET selesai = TRUE WHERE id = 2;" "SELECT * FROM todo;" "SELECT * FROM todo WHERE selesai = TRUE;" "SELECT * FROM todo WHERE judul LIKE '%buku%';" "SELECT * FROM todo ORDER BY judul;" "SELECT * FROM todo ORDER BY id DESC LIMIT 2;" "SELECT COUNT(*) FROM todo;" "SELECT COUNT(*) AS jumlah_selesai FROM todo WHERE selesai = TRUE;" "DELETE FROM todo WHERE id = 4;" "SELECT * FROM todo;" "SELEC * FROM todo;" "SELECT nama FROM todo;" "exit"
sesi empat "--safe-updates todolist" rahasia "UPDATE todo SET selesai = TRUE;" "DELETE FROM todo;" "exit"
sesi lima "todolist" salah
sesi enam "todolist" rahasia "START TRANSACTION;" "UPDATE todo SET selesai = TRUE WHERE id = 1;" "SELECT * FROM todo;" "ROLLBACK;" "SELECT * FROM todo;" "exit"

# Logback rolling
mkdir -p /tmp/sari && rm -rf /tmp/sari/todolist && cp -r $ASAL/proyek /tmp/sari/todolist && cd /tmp/sari/todolist
python3 - <<'PY'
s = open('pom.xml').read()
s = s.replace('    <!--DEP-->', '''    <dependency>
      <groupId>ch.qos.logback</groupId>
      <artifactId>logback-classic</artifactId>
      <version>1.5.12</version>
    </dependency>''')
s = s.replace('<mainClass>com.bisangoding.todolist.App</mainClass>', '<mainClass>com.bisangoding.todolist.Banyak</mainClass>')
open('pom.xml', 'w').write(s)
PY
cp $T/Banyak.java $P/Banyak.java
mkdir -p src/main/resources
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
mvn -B -ntp -q compile > /dev/null 2>&1
J "L rolling run"; mvn -B -ntp -q exec:java 2>&1 | head
J "L rolling ls"; ls logs
J "L rolling ls -l"; ls -l logs | awk 'NR>1 {print $5, $9}'
J "L rolling tail"; tail -n 3 logs/todolist.log
J "L rolling head lama"; head -n 2 logs/$(ls logs | grep -- '-' | sort | head -1)
J "SELESAI"
