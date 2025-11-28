class ApplicationError(Exception):
    """Base application exception."""
    pass


class ValidationError(ApplicationError):
    """Validation error for invalid input."""
    pass


class NotFoundError(ApplicationError):
    """Resource not found error."""
    pass


class FileProcessingError(ApplicationError):
    """Error processing file."""
    pass


class PDFGenerationError(ApplicationError):
    """Error generating PDF."""
    pass


class StorageError(ApplicationError):
    """Error with storage operations."""
    pass

