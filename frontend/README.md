# Certificate Generator

A web application to upload participants, manage certificate templates, and generate personalized certificates.

## Features

- **Upload Participants**: Support for CSV and XLSX files with participant data
- **Manage Templates**: Create, edit, and delete certificate templates in HTML or SVG format
- **Generate Certificates**: Generate personalized certificates for all participants
- **Download**: Download generated certificates as a ZIP file

## Project Structure

```
certificate-generator/
├── index.html                 # Main HTML file
├── css/
│   └── styles.css            # Application styles
├── js/
│   ├── api.js               # API communication class
│   ├── tabs.js              # Tab switching functionality
│   ├── upload.js            # File upload handler
│   ├── templates.js         # Template management
│   └── app.js               # Main application logic
├── styles/
│   └── styles.css           # Design styles
├── package.json             # Project metadata
└── README.md                # This file
```

## Getting Started

### Prerequisites

- Python 3.x (for local development server)
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd certificate-generator
```

2. Install dependencies (optional, if using build tools):
```bash
npm install
```

### Running Locally

#### Using Python's HTTP Server (Recommended)

```bash
npm start
# or
python -m http.server 8000
```

Then open your browser to `http://localhost:8000`

#### Using Python 3

```bash
python -m http.server 8000
```

#### Using Node.js (http-server)

```bash
npm install -g http-server
http-server .
```

## API Configuration

The application communicates with a backend API. Configure the API endpoint in `js/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Expected Backend Endpoints

#### Participants
- `POST /api/participants/upload` - Upload participant file
- `GET /api/participants` - Get all participants
- `DELETE /api/participants` - Delete all participants

#### Templates
- `POST /api/templates` - Create template
- `GET /api/templates` - Get all templates
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

#### Certificates
- `POST /api/certificates/generate` - Generate certificates
- `GET /api/certificates/download/:batchId` - Download certificates

## CSV/XLSX Format

Required columns for participant file:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full name | String | Yes | Participant name |
| email | String | Yes | Email address |
| role | String | Yes | Valid: `participant`, `speaker`, `winner`, `prize-winner` |
| place | Number | No | Optional placement: 1, 2, or 3 |

### Example CSV

```csv
Full name,email,role,place
John Doe,john@example.com,winner,1
Jane Smith,jane@example.com,speaker,
Alice Johnson,alice@example.com,participant,
```

## Template Format

Templates support handlebars-like syntax for variable substitution:

- `{{participant_name}}` - Participant's full name
- `{{role}}` - Participant's role
- `{{place}}` - Placement (if available)
- `{{date}}` - Current date

### Conditional Blocks

```handlebars
{{#if place}}
  <p>Place: {{place}}</p>
{{/if}}
```

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### File Organization

- **index.html**: Main application shell
- **css/styles.css**: UI component styles
- **styles/styles.css**: Design tokens and colors
- **js/api.js**: Backend API wrapper class
- **js/tabs.js**: Tab navigation logic
- **js/upload.js**: File upload and parsing
- **js/templates.js**: Template CRUD operations
- **js/app.js**: Main application state and logic

### Adding Features

1. Create new JavaScript file in `js/` directory
2. Define a class for the feature
3. Initialize in `DOMContentLoaded` event
4. Add styles to `css/styles.css` as needed

## Troubleshooting

### API Connection Issues

- Ensure backend server is running on the configured URL
- Check browser console for CORS errors
- Verify API endpoints match your backend implementation

### File Upload Issues

- Ensure file is valid CSV or XLSX format
- Check that all required columns are present
- Verify file encoding is UTF-8

### Template Generation Issues

- Ensure all template variables use correct syntax
- Check that participants are uploaded
- Verify template content is valid HTML/SVG

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss proposed changes.
