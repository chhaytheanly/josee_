from datetime import datetime, timezone
from typing import Dict, Any, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from src.app.model.invoice import Invoice
from src.app.model.room import Room
from src.app.model.tenant import Tenant
from src.app.schema.query import QueryParameters
from src.app.schema.tenant import TenantCreate


class TenantService:
    
    @staticmethod
    def create_tenant(db: Session, data: TenantCreate) -> Tenant:
        """Create a new tenant"""
        if data.email:
            existing_tenant = db.query(Tenant).filter(Tenant.email == data.email).first()
            if existing_tenant:
                raise ValueError("Tenant with this email already exists")
        
        tenant = Tenant(
            name=data.name,
            email=data.email,
            phone=data.phone,
            id_card=data.id_card
        )
        
        db.add(tenant)
        db.flush()
        return tenant
    
    @staticmethod
    def get_tenant_by_id(db: Session, tenant_id: int) -> Tenant:
        """Get tenant by ID with related data"""
        tenant = db.query(Tenant).options(
            selectinload(Tenant.room),
            selectinload(Tenant.invoices).selectinload(Invoice.payments)
        ).filter(Tenant.id == tenant_id).first()
        
        if not tenant:
            raise ValueError("Tenant not found")
        return tenant
    
    @staticmethod
    def get_all_tenants(db: Session, query_params: QueryParameters) -> Dict[str, Any]:
        """Get all tenants with pagination and search"""
        query = db.query(Tenant).options(
            selectinload(Tenant.room),
            selectinload(Tenant.invoices).selectinload(Invoice.payments)
        )
        
        if query_params.search:
            search_filter = or_(
                Tenant.name.ilike(f"%{query_params.search}%"), 
                Tenant.email.ilike(f"%{query_params.search}%")
            )
            query = query.filter(search_filter)
        
        total = query.count()
        query = query.order_by(Tenant.id)
        
        offset = (query_params.page - 1) * query_params.limit
        tenants = query.offset(offset).limit(query_params.limit).all()
        
        return {
            "data": tenants,
            "total": total,
            "page": query_params.page,
            "limit": query_params.limit
        }
    
    @staticmethod
    def update_tenant(db: Session, tenant_id: int, data: TenantCreate) -> Tenant:
        """Update tenant details"""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError("Tenant not found")
        
        if data.email and data.email != tenant.email:
            existing = db.query(Tenant).filter(Tenant.email == data.email).first()
            if existing:
                raise ValueError("Tenant with this email already exists")
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(tenant, key, value)
        
        tenant.updated_at = datetime.now(timezone.utc)
        db.flush()
        return tenant
    
    @staticmethod
    def assign_tenant(db: Session, room_id: int, tenant_data: dict) -> Tenant:
        """Create and assign tenant to room"""
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise ValueError("Room not found")
        
        if not room.is_available:
            raise ValueError("Room is already occupied")
        
        if not tenant_data.get("name"):
            raise ValueError("Tenant name is required")
        
        if tenant_data.get("email"):
            existing = db.query(Tenant).filter(Tenant.email == tenant_data["email"]).first()
            if existing:
                raise ValueError("Tenant with this email already exists")
        
        tenant = Tenant(
            room_id=room_id,
            name=tenant_data["name"],
            email=tenant_data.get("email"),
            phone=tenant_data.get("phone"),
            id_card=tenant_data.get("id_card"),
            is_active=True,
            check_in_date=datetime.now(timezone.utc)
        )
        
        room.is_available = False
        room.updated_at = datetime.now(timezone.utc)
        
        db.add(tenant)
        db.flush()
        return tenant
    
    @staticmethod
    def remove_tenant(db: Session, tenant_id: int) -> Tenant:
        """Remove tenant from room"""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError("Tenant not found")
        
        room_id = tenant.room_id
        
        tenant.room_id = None
        tenant.is_active = False
        tenant.check_out_date = datetime.now(timezone.utc)
        tenant.updated_at = datetime.now(timezone.utc)
        
        if room_id:
            room = db.query(Room).filter(Room.id == room_id).first()
            if room:
                room.is_available = True
                room.updated_at = datetime.now(timezone.utc)

        db.flush()
        return tenant