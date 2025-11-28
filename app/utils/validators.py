from email_validator import validate_email as validate_email_lib
from email_validator import EmailNotValidError


def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        validate_email_lib(email)
        return True
    except EmailNotValidError:
        return False


def validate_csv_format(headers: list) -> bool:
    """
    Validate CSV format has required columns.
    
    Args:
        headers: List of column headers
        
    Returns:
        True if has required columns
    """
    required_columns = {'full_name', 'email', 'role'}
    return required_columns.issubset(set(headers))


def validate_role(role: str) -> bool:
    """
    Validate participant role.
    
    Args:
        role: Role to validate
        
    Returns:
        True if valid role
    """
    valid_roles = {'participant', 'speaker', 'winner', 'prize_winner'}
    return role.lower() in valid_roles


def validate_place(place) -> bool:
    """
    Validate prize place.
    
    Args:
        place: Place value (1, 2, 3)
        
    Returns:
        True if valid or None
    """
    if place is None:
        return True
    try:
        place_int = int(place)
        return place_int in {1, 2, 3}
    except (ValueError, TypeError):
        return False
