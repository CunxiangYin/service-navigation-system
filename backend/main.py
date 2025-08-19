from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from datetime import datetime
import os

app = FastAPI(title="服务导航系统API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据存储文件路径
DATA_FILE = "data/services.json"
os.makedirs("data", exist_ok=True)

# 数据模型
class Service(BaseModel):
    id: str
    name: str
    url: str
    description: Optional[str] = None
    category: str
    status: Optional[str] = "online"
    tags: Optional[List[str]] = []
    order: Optional[int] = 0

class Category(BaseModel):
    id: str
    name: str
    icon: str
    count: int = 0

class DataStore(BaseModel):
    services: List[Service]
    categories: List[Category]
    lastUpdated: str

# 默认分类 - 保留分类结构
DEFAULT_CATEGORIES = [
    {"id": "1", "name": "开发环境", "icon": "code", "count": 0},
    {"id": "2", "name": "测试环境", "icon": "flask", "count": 0},
    {"id": "3", "name": "生产环境", "icon": "server", "count": 0},
    {"id": "4", "name": "监控系统", "icon": "activity", "count": 0},
    {"id": "5", "name": "数据库", "icon": "database", "count": 0},
    {"id": "6", "name": "文档工具", "icon": "book", "count": 0},
    {"id": "7", "name": "开发工具", "icon": "tool", "count": 0},
    {"id": "8", "name": "其他服务", "icon": "grid", "count": 0},
]

# 加载数据
def load_data() -> DataStore:
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return DataStore(**data)
        except Exception as e:
            print(f"加载数据失败: {e}")
    
    # 返回默认分类，但服务为空
    return DataStore(
        services=[],
        categories=[Category(**cat) for cat in DEFAULT_CATEGORIES],
        lastUpdated=datetime.now().isoformat()
    )

# 保存数据
def save_data(data: DataStore):
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data.dict(), f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存数据失败: {e}")
        return False

# 内存缓存
current_data = load_data()

@app.get("/")
async def root():
    return {"message": "服务导航系统API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# 获取所有服务
@app.get("/api/services")
async def get_services():
    return current_data.services

# 更新所有服务
@app.post("/api/services")
async def update_services(services: List[Service]):
    global current_data
    current_data.services = services
    current_data.lastUpdated = datetime.now().isoformat()
    
    # 更新分类计数
    for category in current_data.categories:
        category.count = len([s for s in services if s.category == category.id])
    
    if save_data(current_data):
        return {"message": "服务更新成功", "count": len(services)}
    else:
        raise HTTPException(status_code=500, detail="保存数据失败")

# 添加单个服务
@app.post("/api/services/add")
async def add_service(service: Service):
    global current_data
    
    # 检查是否已存在
    if any(s.id == service.id for s in current_data.services):
        raise HTTPException(status_code=400, detail="服务ID已存在")
    
    current_data.services.append(service)
    current_data.lastUpdated = datetime.now().isoformat()
    
    # 更新分类计数
    for category in current_data.categories:
        if category.id == service.category:
            category.count += 1
            break
    
    if save_data(current_data):
        return {"message": "服务添加成功", "service": service}
    else:
        raise HTTPException(status_code=500, detail="保存数据失败")

# 更新单个服务
@app.put("/api/services/{service_id}")
async def update_service(service_id: str, service: Service):
    global current_data
    
    for i, s in enumerate(current_data.services):
        if s.id == service_id:
            # 如果分类改变，更新计数
            if s.category != service.category:
                for cat in current_data.categories:
                    if cat.id == s.category:
                        cat.count -= 1
                    if cat.id == service.category:
                        cat.count += 1
            
            current_data.services[i] = service
            current_data.lastUpdated = datetime.now().isoformat()
            
            if save_data(current_data):
                return {"message": "服务更新成功", "service": service}
            else:
                raise HTTPException(status_code=500, detail="保存数据失败")
    
    raise HTTPException(status_code=404, detail="服务不存在")

# 删除服务
@app.delete("/api/services/{service_id}")
async def delete_service(service_id: str):
    global current_data
    
    for i, s in enumerate(current_data.services):
        if s.id == service_id:
            # 更新分类计数
            for cat in current_data.categories:
                if cat.id == s.category:
                    cat.count -= 1
                    break
            
            current_data.services.pop(i)
            current_data.lastUpdated = datetime.now().isoformat()
            
            if save_data(current_data):
                return {"message": "服务删除成功"}
            else:
                raise HTTPException(status_code=500, detail="保存数据失败")
    
    raise HTTPException(status_code=404, detail="服务不存在")

# 获取所有分类
@app.get("/api/categories")
async def get_categories():
    return current_data.categories

# 更新所有分类
@app.post("/api/categories")
async def update_categories(categories: List[Category]):
    global current_data
    current_data.categories = categories
    current_data.lastUpdated = datetime.now().isoformat()
    
    if save_data(current_data):
        return {"message": "分类更新成功", "count": len(categories)}
    else:
        raise HTTPException(status_code=500, detail="保存数据失败")

# 获取完整数据
@app.get("/api/data")
async def get_all_data():
    return current_data

# 导入数据
@app.post("/api/import")
async def import_data(data: Dict[Any, Any]):
    global current_data
    
    try:
        # 验证数据格式
        if "services" not in data or "categories" not in data:
            raise HTTPException(status_code=400, detail="无效的数据格式")
        
        services = [Service(**s) for s in data["services"]]
        categories = [Category(**c) for c in data["categories"]]
        
        current_data.services = services
        current_data.categories = categories
        current_data.lastUpdated = datetime.now().isoformat()
        
        if save_data(current_data):
            return {
                "message": "数据导入成功",
                "services_count": len(services),
                "categories_count": len(categories)
            }
        else:
            raise HTTPException(status_code=500, detail="保存数据失败")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"导入失败: {str(e)}")

# 导出数据
@app.get("/api/export")
async def export_data():
    return {
        "version": "1.0",
        "timestamp": datetime.now().isoformat(),
        "services": current_data.services,
        "categories": current_data.categories,
        "metadata": {
            "servicesCount": len(current_data.services),
            "categoriesCount": len(current_data.categories)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)