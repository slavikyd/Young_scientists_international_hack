import uuid
from typing import List, Optional
import logging

from app.storage.redis_storage import ParticipantRedisStorage, get_redis
from app.utils.file_parser import CSVXLSXParser


logger = logging.getLogger(__name__)


class ParticipantService:
    """Service for managing participants."""
    
    def __init__(self):
        self.storage = ParticipantRedisStorage(get_redis())
    
    async def parse_and_save_file(self, file_content: bytes, filename: str) -> tuple:
        """
        Parse file and save participants to Redis.
        
        Returns:
            Tuple of (participants_list, errors_list)
        """
        # Parse file
        parsed_participants, parse_errors = CSVXLSXParser.parse_file(
            file_content,
            filename
        )
        
        # Save each participant
        saved_participants = []
        for participant_data in parsed_participants:
            participant_id = str(uuid.uuid4())
            participant_data['id'] = participant_id
            
            await self.storage.save(participant_id, participant_data)
            saved_participants.append(participant_data)
        
        logger.info(f"Saved {len(saved_participants)} participants from file {filename}")
        
        return saved_participants, parse_errors
    
    async def get_all_participants(self) -> List[dict]:
        """Get all participants."""
        return await self.storage.get_all()
    
    async def get_participant(self, participant_id: str) -> Optional[dict]:
        """Get single participant by ID."""
        return await self.storage.get(participant_id)
    
    async def delete_participant(self, participant_id: str) -> bool:
        """Delete participant by ID."""
        result = await self.storage.delete(participant_id)
        if result:
            logger.info(f"Deleted participant {participant_id}")
        return result
    
    async def delete_all_participants(self):
        """Delete all participants."""
        await self.storage.clear_all()
        logger.info("Deleted all participants")
    
    async def count_participants(self) -> int:
        """Count total participants."""
        participants = await self.get_all_participants()
        return len(participants)