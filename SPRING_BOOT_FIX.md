# 🔧 Spring Boot Compilation Fix Guide

## ⚠️ Issue

```
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.11.0:compile
Fatal error compiling: java.lang.ExceptionInInitializerError: com.sun.tools.javac.code.TypeTag
```

---

## 🎯 Root Cause

Lombok compatibility issue với Java 17 và Maven compiler plugin version.

---

## ✅ Solutions (Try in order)

### Solution 1: Update Lombok Version (Recommended)

1. Open `pom.xml`
2. Find Lombok dependency:
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.XX</version>  <!-- Current version -->
    <scope>provided</scope>
</dependency>
```

3. Update to latest version:
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>  <!-- Latest stable -->
    <scope>provided</scope>
</dependency>
```

4. Clean and rebuild:
```bash
mvn clean install
mvn spring-boot:run
```

---

### Solution 2: Remove Lombok from AI Classes

AI classes (`AIController`, `AIService`, DTOs) don't use Lombok features. Remove `@Data` annotations:

**Before:**
```java
@Data
public class AIChatRequest {
    private String message;
    private Long bookId;
    // ...
}
```

**After:**
```java
public class AIChatRequest {
    private String message;
    private Long bookId;
    
    // Add getters/setters manually
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    // ...
}
```

---

### Solution 3: Update Maven Compiler Plugin

In `pom.xml`, update compiler plugin:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.12.1</version>  <!-- Update to latest -->
            <configuration>
                <source>17</source>
                <target>17</target>
            </configuration>
        </plugin>
    </plugins>
</build>
```

---

### Solution 4: Clean Maven Cache

```bash
# Remove Maven cache
rm -rf ~/.m2/repository

# Clean project
mvn clean

# Reinstall dependencies
mvn install

# Run
mvn spring-boot:run
```

---

### Solution 5: Check Java Version

```bash
# Check Java version
java -version

# Should be Java 17
# If not, install Java 17:
# Mac: brew install openjdk@17
# Or download from: https://adoptium.net/

# Set JAVA_HOME
export JAVA_HOME=/path/to/java17
```

---

## 🚀 Quick Test After Fix

```bash
# 1. Start Spring Boot
mvn spring-boot:run

# 2. Wait for startup (30-60 seconds)

# 3. Test health endpoint
curl http://localhost:8080/api/ai/health

# Expected:
{
  "status": "healthy",
  "service": "Books Store AI Chatbot",
  "version": "1.0.0"
}

# 4. Test chat endpoint
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Gợi ý sách về kinh doanh"
  }'

# Expected: JSON response with answer and sources
```

---

## 📋 Verification Checklist

After applying fix:

- [ ] `mvn clean install` completes successfully
- [ ] No compilation errors
- [ ] `mvn spring-boot:run` starts server
- [ ] Server starts on port 8080
- [ ] Health endpoint returns 200 OK
- [ ] Chat endpoint accepts POST requests
- [ ] Python AI service is still running (port 8000)
- [ ] Integration works (Spring Boot → Python AI)

---

## 🔍 Alternative: Skip Spring Boot for Now

**Option:** Test with Python AI service directly

Since Python AI service is **fully functional**, you can:

1. Keep Python AI running on port 8000
2. Frontend connects directly to Python AI (temporarily)
3. Fix Spring Boot compilation later
4. Add Spring Boot proxy when ready

**Frontend config (temporary):**
```javascript
// frontend/src/api/aiService.js
const API_URL = 'http://localhost:8000/api';  // Direct to Python

export const aiService = {
    chat: (message) => axios.post(`${API_URL}/chat`, { message }),
    search: (query) => axios.post(`${API_URL}/search`, { query }),
    // ...
};
```

**Later, switch to Spring Boot proxy:**
```javascript
const API_URL = 'http://localhost:8080/api/ai';  // Via Spring Boot
```

---

## 📞 Support

If issues persist:

1. Check logs: `mvn spring-boot:run -X` (debug mode)
2. Verify Java version: `java -version`
3. Check Maven version: `mvn -version`
4. Try creating new minimal Spring Boot project to test
5. Check if other Spring Boot endpoints work (without AI classes)

---

## ✅ Success Indicators

When fixed successfully:

```bash
mvn spring-boot:run

# Output should show:
...
[INFO] --- spring-boot:3.2.0:run (default-cli) @ NPSang_2714_J2EE ---
...
2026-06-08 15:00:00.000  INFO --- [main] Application : Started Application in 5.2 seconds
...
```

Then test:
```bash
curl http://localhost:8080/api/ai/health
# Should return JSON response
```

---

## 🎉 When Fixed

After Spring Boot is working:

1. ✅ Both services running (Python :8000, Spring :8080)
2. ✅ Test integration end-to-end
3. ✅ Move to Phase 6 - Frontend integration
4. ✅ Create chatbot widget
5. ✅ Deploy to production

---

**Note:** Python AI service is production-ready regardless of Spring Boot status. The compilation issue only affects the Java proxy layer, not the AI functionality.

