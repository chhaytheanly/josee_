from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from src.app.database.seed.base import BaseSeeder
from src.app.model.tenant import Tenant
from src.app.model.room import Room

class TenantSeeder(BaseSeeder):
    PROFILES = [
        {"name": "Sok Dara", "email": "sok.dara@gmail.com", "phone": "012345678", "id_card": "010203040"},
        {"name": "Chantha Vann", "email": "chantha.vann@gmail.com", "phone": "015234567", "id_card": "020304051"},
        {"name": "Kimly Heng", "email": "kimly.heng@gmail.com", "phone": "017456789", "id_card": "030405062"},
        {"name": "Piseth Chea", "email": "piseth.chea@gmail.com", "phone": "088123456", "id_card": "040506073"},
        {"name": "Sreynich Lim", "email": "sreynich.lim@gmail.com", "phone": "097234567", "id_card": "050607084"},
        {"name": "Vuthy Sok", "email": "vuthy.sok@gmail.com", "phone": "096345678", "id_card": "060708095"},
        {"name": "Rithy Oun", "email": "rithy.oun@gmail.com", "phone": "093456789", "id_card": "070809106"},
        {"name": "Dalin Chhouk", "email": "dalin.chhouk@gmail.com", "phone": "092567890", "id_card": "080910117"},
        {"name": "Sophy Meas", "email": "sophy.meas@gmail.com", "phone": "098678901", "id_card": "091011128"},
        {"name": "Makara Tep", "email": "makara.tep@gmail.com", "phone": "089789012", "id_card": "101112139"},
        {"name": "Bopha Ngin", "email": "bopha.ngin@gmail.com", "phone": "086890123", "id_card": "111213140"},
        {"name": "Kosal Yin", "email": "kosal.yin@gmail.com", "phone": "085901234", "id_card": "121314151"},
        {"name": "Sokunthea Phan", "email": "sokunthea.phan@gmail.com", "phone": "081012345", "id_card": "131415162"},
        {"name": "Narith Keo", "email": "narith.keo@gmail.com", "phone": "077123456", "id_card": "141516173"},
        {"name": "Monyka Hor", "email": "monyka.hor@gmail.com", "phone": "078234567", "id_card": "151617184"},
        {"name": "Ravy Touch", "email": "ravy.touch@gmail.com", "phone": "076345678", "id_card": "161718195"},
        {"name": "Chenda Prak", "email": "chenda.prak@gmail.com", "phone": "071456789", "id_card": "171819206"},
        {"name": "Virak Chhim", "email": "virak.chhim@gmail.com", "phone": "031567890", "id_card": "181920217"},
        {"name": "Pich Seyha", "email": "pich.seyha@gmail.com", "phone": "060678901", "id_card": "192021228"},
        {"name": "Thida Koun", "email": "thida.koun@gmail.com", "phone": "066789012", "id_card": "202122239"}
    ]

    def __init__(self, db: Session, count: int = 20):
        super().__init__(db, Tenant, count)

    def seed(self, occupied_rooms: list[Room]) -> list[Tenant]:
        """Seed tenants assigned to occupied rooms"""
        tenants = []
        
        for i in range(min(self.count, len(self.PROFILES), len(occupied_rooms))):
            profile = self.PROFILES[i]
            room = occupied_rooms[i]
            
            # Skip if room already has active tenant
            if self.db.query(Tenant).filter(
                Tenant.room_id == room.id,
                Tenant.is_active == True
            ).first():
                continue
            
            # Random check-in within last 6 months
            days_ago = random.randint(30, 180)
            check_in = datetime.utcnow() - timedelta(days=days_ago)
            
            tenant = self.create_one(
                lambda: {
                    "room_id": room.id,
                    "name": profile["name"],
                    "email": profile["email"],
                    "phone": profile["phone"],
                    "id_card": profile["id_card"],
                    "is_active": True,
                    "check_in_date": check_in,
                    "check_out_date": None
                },
                skip_if_exists=False  # We already checked above
            )
            if tenant:
                tenants.append(tenant)
        
        self.log_created("active tenants")
        return tenants