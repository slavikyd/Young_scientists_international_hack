import pandas as pd
from typing import List, Tuple
import logging
from io import BytesIO

from app.schemas.participant import ParticipantRole, ParticipantPlace


logger = logging.getLogger(__name__)


class FileParseError(Exception):
    """Custom exception for file parsing errors."""
    pass


class CSVXLSXParser:
    """Parser for CSV and XLSX files."""
    
    REQUIRED_COLUMNS = ["full_name", "email", "role"]
    OPTIONAL_COLUMNS = ["place"]
    
    @staticmethod
    def parse_file(file_content: bytes, filename: str) -> Tuple[List[dict], List[str]]:
        """
        Parse CSV or XLSX file and return list of participant dictionaries.
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            
        Returns:
            Tuple of (participants_list, errors_list)
        """
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(BytesIO(file_content))
            elif filename.endswith('.xlsx'):
                df = pd.read_excel(BytesIO(file_content))
            else:
                raise FileParseError(f"Unsupported file format: {filename}")
            
            # Validate required columns
            missing_cols = set(CSVXLSXParser.REQUIRED_COLUMNS) - set(df.columns)
            if missing_cols:
                raise FileParseError(f"Missing required columns: {missing_cols}")
            
            # Normalize column names to lowercase
            df.columns = df.columns.str.lower().str.strip()
            
            participants = []
            errors = []
            
            for idx, row in df.iterrows():
                try:
                    participant = CSVXLSXParser._parse_row(row, idx)
                    participants.append(participant)
                except Exception as e:
                    error_msg = f"Row {idx + 1}: {str(e)}"
                    logger.warning(error_msg)
                    errors.append(error_msg)
            
            if not participants:
                raise FileParseError("No valid participants found in file")
            
            return participants, errors
        
        except FileParseError:
            raise
        except Exception as e:
            logger.error(f"Error parsing file {filename}: {e}")
            raise FileParseError(f"Failed to parse file: {str(e)}")
    
    @staticmethod
    def _parse_row(row: pd.Series, row_index: int) -> dict:
        """Parse a single row from the dataframe."""
        full_name = str(row.get('full_name', '')).strip()
        email = str(row.get('email', '')).strip()
        role = str(row.get('role', '')).strip().lower()
        place = row.get('place', None)
        
        # Validate full name
        if not full_name or len(full_name) < 2:
            raise ValueError("Full name must be at least 2 characters")
        
        # Validate email
        if not email or '@' not in email:
            raise ValueError(f"Invalid email: {email}")
        
        # Validate role
        valid_roles = [r.value for r in ParticipantRole]
        if role not in valid_roles:
            raise ValueError(f"Invalid role: {role}. Must be one of {valid_roles}")
        
        # Validate place if provided
        if pd.notna(place):
            try:
                place = int(place)
                valid_places = [p.value for p in ParticipantPlace]
                if place not in valid_places:
                    raise ValueError(f"Invalid place: {place}. Must be one of {valid_places}")
            except (ValueError, TypeError):
                raise ValueError(f"Invalid place value: {place}")
        else:
            place = None
        
        return {
            "full_name": full_name,
            "email": email,
            "role": role,
            "place": place
        }