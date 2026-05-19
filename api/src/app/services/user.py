from typing import Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from src.app.model.role import Role
from src.app.model.user import User
from src.app.schema.user import LoginRequest, UserCreate, UserResponse, UserUpdate
from src.app.utils.argon2 import hash_password, verify_password
from src.app.utils.get_image import get_image


class UserService: 
    
    @staticmethod
    def login(db: Session, data: LoginRequest) -> UserResponse:

        user = db.query(User).options(
            selectinload(User.role)
        ).filter(User.email == data.email).first()
        
        if not user:
            raise ValueError("Invalid email or password")
        
        if not verify_password(user.password, data.password):
            raise ValueError("Invalid email or password")
        
        return UserResponse.model_validate(user)
    
    @staticmethod
    def get_setup_form(db: Session) -> dict:
        roles = db.query(Role).all()
        role_options = [{"value": role.id, "label": role.name} for role in roles]
        
        return {
            "roles": role_options,
            "fields": {
                "email": {"type": "string", "required": True},
                "password": {"type": "password", "required": True},
                "role_id": {"type": "select", "options": role_options, "required": True},
                "image": {"type": "file", "required": False}
            }
        }
    
    @staticmethod
    def create_user(db: Session, data: UserCreate, image: Optional[UploadFile] = None) -> UserResponse:
        existing_user = db.query(User).filter(User.email == data.email).first()
        if existing_user:
            raise ValueError("Email already exists")

        role = db.query(Role).filter(Role.id == data.role_id).first()
        if not role:
            raise ValueError("Role not found")
        
        if not data.password:
            raise ValueError("Password is required")
        
        password_hash = hash_password(data.password)
        
        image_path = None
        if image:
            image_path = get_image(image)

        user = User(
            name=data.name,
            email=data.email,
            password=password_hash,
            role_id=data.role_id,
            image=image_path
        )
        
        db.add(user)
        db.commit()
        db.flush()
        db.refresh(user)
        
        return UserResponse.model_validate(user)
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> UserResponse:
        """Get user by ID"""
        user = db.query(User).options(
            selectinload(User.role)
        ).filter(User.id == user_id).first()
        
        if not user:
            raise ValueError("User not found")
        return UserResponse.model_validate(user)
    
    @staticmethod
    def get_all_users(db: Session, page: int = 1, limit: int = 100) -> dict:
        total = db.query(func.count(User.id)).scalar()
        
        users = db.query(User).options(
            selectinload(User.role)
        ).offset(
            (page - 1) * limit
        ).limit(limit).all()
        
        return {
            "data": [UserResponse.model_validate(user) for user in users],
            "meta": {
                "page": page,
                "limit": limit,
                "total": total
            }
        }
    
    @staticmethod
    def update_user(db: Session, user_id: int, data: UserUpdate, image: Optional[UploadFile] = None) -> UserResponse:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if data.email and data.email != user.email:
            existing = db.query(User).filter(User.email == data.email).first()
            if existing:
                raise ValueError("Email already exists")
        
        if data.role_id and data.role_id != user.role_id:
            role = db.query(Role).filter(Role.id == data.role_id).first()
            if not role:
                raise ValueError("Role not found")
        
        if data.password:
            data.password = hash_password(data.password)
        else:
            data.password = None
        
        if image:
            user.image = get_image(image)

        update_data = data.model_dump(exclude_unset=True, exclude_none=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        
        db.flush()
        db.refresh(user)
        
        return UserResponse.model_validate(user)
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        db.delete(user)
        db.flush()
        return {"message": "User deleted successfully"}