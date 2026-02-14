# SHREST MAHOTSAV

A comprehensive event management and registration system built with Node.js, featuring QR code generation, Excel data export, UPI payment integration, and real-time data management.

## Features

- **Event Registration**: User-friendly registration forms for festival participants
- **QR Code Generation**: Automatic QR code creation for registrations and payments
- **Excel Export**: Download registration data in Excel format
- **UPI Integration**: Secure UPI payment processing and validation
- **Real-time Data**: Live Excel updates and data synchronization
- **Responsive Web Interface**: Modern HTML/CSS interface for all devices
- **Database Integration**: PostgreSQL database for data storage

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **QR Code**: qrcode library
- **Excel Processing**: xlsx library
- **Payment**: UPI integration
- **Deployment**: Vercel (configured via vercel.json)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Saiprasanth-167/SHREST-MAHOTSAV.git
   cd SHREST-MAHOTSAV
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   BACKEND_BASE_URL=your_deployment_url
   UPI_VPA=your_upi_vpa
   UPI_NAME=your_upi_name
   # PORT is optional, defaults to 3000 locally, set by Vercel in production
   ```

4. **Set up the database:**
   Run the database initialization script:
   ```bash
   node api/db-init.js
   ```

5. **Start the server:**
   ```bash
   npm start
   # or for development
   node index.js
   ```

The application will be running at `http://localhost:3000`

## Usage

1. **Home Page**: Access the main festival page at `/`
2. **Registration**: Navigate to `/shrestregistration.html` to register participants
3. **Events**: View available events at `/events.html`
4. **QR Scanner**: Use the QR scanner at `/qrscanner.html` for validation
5. **Admin Features**: Access data export and management through API endpoints

## API Endpoints

- `POST /api/register` - Register a new participant
- `GET /api/download-excel` - Download registration data as Excel
- `GET /api/live-excel` - Get live Excel data
- `POST /api/validate-utr` - Validate UPI transaction
- `POST /api/upi-qr` - Generate UPI QR code

## Deployment

This application is configured for deployment on Vercel.

1. **Connect to Vercel:**
   - Push your code to a GitHub repository
   - Connect the repository to Vercel
   - Vercel will automatically detect the Node.js application and use the configuration in `vercel.json`

2. **Environment Variables:**
   Set the following environment variables in your Vercel project settings:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `BACKEND_BASE_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - `UPI_VPA`: Your UPI VPA
   - `UPI_NAME`: Your UPI name
   - `NODE_ENV`: `production`

3. **Database Migration:**
   If migrating from Render, ensure your PostgreSQL database is accessible from Vercel. You may need to update your database URL and whitelist Vercel's IP ranges if using a managed database.

## Project Structure

```
SHREST-MAHOTSAV/
├── backend.js              # Main backend server
├── index.js               # Application entry point
├── package.json           # Dependencies and scripts
├── vercel.json            # Vercel deployment configuration
├── TODO.md                # Development tasks
├── .gitignore             # Git ignore rules
├── api/                   # API endpoints
│   ├── db-init.js         # Database initialization
│   ├── download-excel.js  # Excel download functionality
│   ├── live-excel.js      # Live data updates
│   ├── register.js        # Registration logic
│   ├── upi-config.js      # UPI configuration
│   ├── upi-qr.js          # QR code generation
│   ├── validate-utr.js    # UTR validation
│   └── registrations/     # Registration data storage
├── public/                # Static web files
│   ├── celebration.html   # Celebration page
│   ├── events.html        # Events listing
│   ├── qrscanner.html     # QR scanner interface
│   └── shrestregistration.html # Registration form
├── qrcodes/               # Generated QR codes
└── routes/                # Route handlers
    └── dataStorage.js     # Data storage utilities
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue on GitHub or contact the development team.