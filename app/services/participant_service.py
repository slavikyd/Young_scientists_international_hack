import os
import uuid
from typing import Optional, List
from datetime import datetime
import logging

from app.schemas.participant import ParticipantCreate, ParticipantResponse
from app.storage.redis_storage import RedisStorage
from app.utils.exceptions import NotFoundError, ValidationError
from app.utils.validators import validate_email
from app.utils.file_parser import parse_csv, parse_xlsx

logger = logging.getLogger(__name__)

UPLOADS_DIR = os.getenv('UPLOADS_DIR', './temp/uploads')


class ParticipantService:
    """Service for participant management."""

    def __init__(self):
        self.storage = RedisStorage()

    async def upload_participants(self, file_content: bytes, filename: str) -> dict:
        """
        Upload participants from CSV or XLSX file.
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            
        Returns:
            Dict with upload result
        """
        try:
            # ✅ CLEAR old participants before uploading new ones
            await self.delete_all_participants()
            logger.info("Cleared previous participants")

            # Parse file based on extension
            if filename.endswith('.csv'):
                participants = parse_csv(file_content)
            elif filename.endswith('.xlsx'):
                participants = parse_xlsx(file_content)
            else:
                raise ValidationError("File must be CSV or XLSX")

            logger.info(f"Parsed {len(participants)} participants from {filename}")

            # Save each participant
            saved_ids = []
            for participant in participants:
                # Validate email if present
                if participant.get('email') and not validate_email(participant['email']):
                    logger.warning(f"Invalid email skipped: {participant.get('email')}")
                    continue

                # Generate ID
                participant_id = str(uuid.uuid4())

                # Add metadata
                participant['id'] = participant_id
                participant['uploaded_at'] = datetime.utcnow().isoformat()

                # Save to Redis with 1 hour TTL
                await self.storage.save_participant(participant_id, participant, ttl=3600)
                saved_ids.append(participant_id)

            logger.info(f"Saved {len(saved_ids)} participants to Redis")

            return {
                "status": "success",
                "count": len(saved_ids),
                "participant_ids": saved_ids
            }

        except Exception as e:
            logger.error(f"Error uploading participants: {e}")
            raise

    async def get_participants(self) -> List[ParticipantResponse]:
        """Get all participants."""
        try:
            participants = await self.storage.get_all_participants()
            
            result = []
            for p in participants:
                try:
                    result.append(ParticipantResponse(
                        id=p.get('id'),
                        full_name=p.get('full_name', ''),
                        email=p.get('email', ''),
                        role=p.get('role', 'participant'),
                        place=p.get('place')
                    ))
                except Exception as e:
                    logger.warning(f"Error converting participant {p.get('id')}: {e}")
                    continue

            return result
        except Exception as e:
            logger.error(f"Error getting participants: {e}")
            raise

    async def get_participant(self, participant_id: str) -> Optional[dict]:
        """Get a specific participant."""
        try:
            participant = await self.storage.get_participant(participant_id)
            if not participant:
                raise NotFoundError(f"Participant {participant_id} not found")
            return participant
        except Exception as e:
            logger.error(f"Error getting participant: {e}")
            raise

    async def delete_participant(self, participant_id: str) -> bool:
        """Delete a participant."""
        try:
            # Check exists
            participant = await self.storage.get_participant(participant_id)
            if not participant:
                raise NotFoundError(f"Participant {participant_id} not found")

            # Delete
            await self.storage.delete_participant(participant_id)
            logger.info(f"Deleted participant: {participant_id}")

            return True
        except Exception as e:
            logger.error(f"Error deleting participant: {e}")
            raise

    async def delete_all_participants(self) -> int:
        """Delete all participants (use with caution)."""
        try:
            participants = await self.storage.get_all_participants()
            count = 0

            for p in participants:
                await self.storage.delete_participant(p['id'])
                count += 1

            logger.info(f"Deleted {count} participants")
            return count
        except Exception as e:
            logger.error(f"Error deleting all participants: {e}")
            raise