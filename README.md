# Namaste Hotels

Namaste Hotels is a Node.js-based web application for managing hotel listings, user reviews, and user authentication. The platform allows users to browse, review, and manage hotel listings with a modern UI and robust backend.

## Features
- User authentication and authorization
- Add, edit, and delete hotel listings
- Post and manage reviews for hotels
- Responsive and modern user interface
- Error handling and async utilities

## Technologies Used
- Node.js
- Express.js
- MongoDB (with Mongoose)
- EJS templating
- CSS for styling

## Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running

### Installation
1. Clone the repository:
	```sh
	git clone https://github.com/chandanvirayash/Namaste_Hotels.git
	```
2. Navigate to the project directory:
	```sh
	cd Namaste_Hotels
	```
3. Install dependencies:
	```sh
	npm install
	```
4. Set up your environment variables as needed (e.g., database URI, Cloudinary, Mapbox, session secret).
5. Start the application:
	```sh
	node app.js
	```

## Usage
- Visit `http://localhost:3000` in your browser to access the application.
- Sign up or log in to manage listings and reviews.

## Folder Structure
- `controllers/` - Route controllers for listings, reviews, and users
- `models/` - Mongoose models for database schemas
- `router/` - Express route definitions
- `views/` - EJS templates for UI
- `public/` - Static assets (CSS, JS)
- `utils/` - Utility functions and error handling

## License
This project is licensed under the MIT License.

---

Feel free to contribute or raise issues to help improve the project!
