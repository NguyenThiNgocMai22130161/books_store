#!/bin/bash

# Script để chạy cả Backend và Frontend cùng lúc
# Sử dụng: ./start-dev.sh

echo "🚀 Starting Books Store Development Environment..."
echo ""

# Màu sắc cho terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kiểm tra MySQL
echo -e "${BLUE}📊 Checking MySQL...${NC}"
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✅ MySQL is installed${NC}"
else
    echo -e "${RED}❌ MySQL is not installed. Please install MySQL first!${NC}"
    exit 1
fi

# Kiểm tra Java
echo -e "${BLUE}☕ Checking Java...${NC}"
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    echo -e "${GREEN}✅ Java is installed: $JAVA_VERSION${NC}"
else
    echo -e "${RED}❌ Java is not installed. Please install Java 17+!${NC}"
    exit 1
fi

# Kiểm tra Node.js
echo -e "${BLUE}📦 Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Hỏi người dùng muốn chạy gì
echo "Bạn muốn chạy:"
echo "1) Chỉ Backend (Spring Boot)"
echo "2) Chỉ Frontend (React)"
echo "3) Cả Backend và Frontend"
echo ""
read -p "Chọn (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🚀 Starting Backend only...${NC}"
        echo -e "${BLUE}Backend will run on: http://localhost:8080${NC}"
        echo ""
        ./mvnw spring-boot:run
        ;;
    2)
        echo ""
        echo -e "${GREEN}🚀 Starting Frontend only...${NC}"
        echo -e "${BLUE}Frontend will run on: http://localhost:5173${NC}"
        echo ""
        cd frontend && npm run dev
        ;;
    3)
        echo ""
        echo -e "${GREEN}🚀 Starting both Backend and Frontend...${NC}"
        echo -e "${BLUE}Backend: http://localhost:8080${NC}"
        echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  Opening 2 terminal windows...${NC}"
        echo ""
        
        # Chạy backend trong terminal mới
        osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && ./mvnw spring-boot:run"'
        
        # Đợi 3 giây
        sleep 3
        
        # Chạy frontend trong terminal mới
        osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'/frontend\" && npm run dev"'
        
        echo -e "${GREEN}✅ Both servers are starting in separate terminal windows!${NC}"
        echo ""
        echo -e "${YELLOW}📝 Note:${NC}"
        echo "  - Backend terminal: Running Spring Boot"
        echo "  - Frontend terminal: Running Vite dev server"
        echo ""
        echo -e "${BLUE}🌐 Open your browser:${NC}"
        echo "  - Frontend: http://localhost:5173"
        echo "  - Backend API: http://localhost:8080/api/books"
        echo ""
        ;;
    *)
        echo -e "${RED}❌ Invalid choice!${NC}"
        exit 1
        ;;
esac
