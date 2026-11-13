import logging
import os
import tempfile
import traceback
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from omnimrz import OmniMRZ
from pydantic import BaseModel

import models
from database import SessionLocal, engine
from mrz_rules import get_rule_set

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="IDOC MRZ Backend")

logger.info("Загрузка OmniMRZ...")
try:
    omni = OmniMRZ()
    logger.info("OmniMRZ загружен")
except Exception as e:
    logger.error(f"ОШИБКА ЗАГРУЗКИ OmniMRZ: {e}")
    omni = None

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError("SECRET_KEY must be set in production")
    SECRET_KEY = "dev-only-insecure-key-do-not-use-in-prod"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="admin/login")

RESERVED_USERNAMES = ["admin", "root", "administrator", "superadmin"]

class UserResponse(BaseModel):
    id: int
    username: str
    is_superuser: bool

    class Config:
        orm_mode = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить токен",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_superuser(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Недостаточно прав.")
    return current_user

# ==========================================
# РОУТЕРЫ
# ==========================================

mobile_router = APIRouter(prefix="/auth/mobile", tags=["Mobile App"])
admin_router = APIRouter(prefix="/admin", tags=["Admin Panel"])

# ---------- Мобильные пользователи ----------

@mobile_router.post("/register")
def register_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if len(form_data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен содержать минимум 6 символов")

    if form_data.username.lower() in RESERVED_USERNAMES:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    new_user = models.User(
        username=form_data.username,
        hashed_password=get_password_hash(form_data.password),
        is_superuser=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": f"Пользователь {form_data.username} успешно создан"}

@mobile_router.post("/login")
def mobile_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    if user.is_superuser:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

# ---------- Админы ----------

@admin_router.post("/register")
def admin_register(
    form_data: OAuth2PasswordRequestForm = Depends(),
    current_admin: models.User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    if len(form_data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен содержать минимум 6 символов")

    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    new_admin = models.User(
        username=form_data.username,
        hashed_password=get_password_hash(form_data.password),
        is_superuser=True,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {"message": f"Админ {form_data.username} успешно создан"}

@admin_router.post("/login")
def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Доступ запрещен. Требуются права администратора.")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@admin_router.get("/users", response_model=List[UserResponse])
def get_all_users(current_admin: models.User = Depends(get_current_superuser), db: Session = Depends(get_db)):
    return db.query(models.User).all()

@admin_router.delete("/users/{user_id}")
def delete_user_by_id(user_id: int, current_admin: models.User = Depends(get_current_superuser), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Вы не можете удалить самого себя")

    db.delete(user)
    db.commit()
    return {"message": f"Пользователь {user.username} удален"}

# ==========================================
# СКАНИРОВАНИЕ
# ==========================================

@app.post("/scan", tags=["General"])
async def scan_passport(
    file: UploadFile = File(...),
    document_type: str = "ru_internal",
    current_user: models.User = Depends(get_current_user),
):
    if not omni:
        raise HTTPException(status_code=500, detail="Сервис не готов")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")

    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            # OCR и валидация MRZ через OmniMRZ
            omni_result = omni.process(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

        extraction = omni_result.get("extraction", {})
        line1 = extraction.get("line1")
        line2 = extraction.get("line2")

        # Парсим MRZ по правилам для выбранного типа документа
        if line1 and line2:
            rule_set = get_rule_set(document_type)
            parsed_data = rule_set.parse(line1, line2)

            return {
                "status": "success",
                "document_type": document_type,
                "raw_omni": omni_result,  # Оставляем для отладки
                "parsed_data": parsed_data,
            }
        else:
            return {
                "status": "error",
                "message": "Не удалось извлечь строки MRZ",
                "raw_omni": omni_result,
            }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

# Подключаем роутеры
app.include_router(mobile_router)
app.include_router(admin_router)

# ==========================================
# BOOTSTRAP ПЕРВОГО АДМИНА
# ==========================================

def _ensure_bootstrap_admin():
    """
    Создаёт первого админа из ADMIN_USERNAME / ADMIN_PASSWORD при старте сервера,
    если админа ещё нет. Идемпотентно: при повторном запуске ничего не делает.
    """
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_username or not admin_password:
        logger.info("ADMIN_USERNAME/ADMIN_PASSWORD не заданы, bootstrap пропущен")
        return

    if len(admin_password) < 6:
        logger.error("ADMIN_PASSWORD должен содержать минимум 6 символов, bootstrap пропущен")
        return

    db = SessionLocal()
    try:
        existing_admin = db.query(models.User).filter(models.User.is_superuser == True).first()
        if existing_admin:
            logger.info("Админ уже существует, bootstrap пропущен")
            return

        if db.query(models.User).filter(models.User.username == admin_username).first():
            logger.error(f"Пользователь {admin_username} уже существует, bootstrap пропущен")
            return

        admin = models.User(
            username=admin_username,
            hashed_password=get_password_hash(admin_password),
            is_superuser=True,
        )
        db.add(admin)
        db.commit()
        logger.info(f"Bootstrap-админ '{admin_username}' создан")
    except Exception as e:
        logger.error(f"Ошибка bootstrap-админа: {e}")
        db.rollback()
    finally:
        db.close()


_ensure_bootstrap_admin()