Hello Sir Terry, please read the following



// LIVE SERVER USING RENDER
You can view the fully deployed live build of our site here:
https://toy-yoda-overhaul2-mobile-test.onrender.com



// LOCAL SERVER SETUP INSTRUCTIONS
To run the system in a local development environment, please follow these steps:

1. Open your terminal or command prompt in the project's root directory.

2. Install the required dependencies by running:
npm install

3. Boot the server by running:
node app.js

4. Access the application in your browser at:
http://localhost:3000


// TEST CREDENTIALS
We have pre-configured the following accounts for grading purposes:

Admin Clearance Account:
Email: admin@gmail.com
Password: admin

Standard User Account:
Email: play@gmail.com
Password: bread



// KEY SYSTEM FEATURES
Before reviewing the limitations, we want to highlight a few advanced technical 
features successfully implemented in this build:

1. Custom CSS Framework: Built completely from scratch without Bootstrap or Tailwind, 
featuring complex keyframe animations, hardware-accelerated transforms, and a fully 
unified responsive mobile architecture.

2. MVC Architecture: A strictly organized backend separating routes, controllers, and 
models.

3. Dynamic Admin Command Center: A secure, role-based dashboard for managing inventory 
and tracking user orders.

4. Live Community Chat: A database-driven community page utilizing smart-scroll and 
automated polling.

5. Mobile Compatiblity: Screen adjusts depending on the size and admin panel has limitations
to prevent "butter fingers".



// SYSTEM WARNINGS & TECHNICAL LIMITATIONS

1. Render File System Limitation: Due to Render's ephemeral (temporary) file system, 
uploading new product images as an Admin will fail on the live deployed site. Render 
resets all local files to the original GitHub repository state upon deployment, 
meaning uploaded images will not be permanently saved.

2. Database Storage: We considered converting images to Base64 strings to store them 
directly inside MongoDB. However, we opted against this because Base64 strings are 
massive and would quickly consume our free-tier database storage limits, while also 
severely lagging the site's load times.

3. Environment Variables: Best practice dictates that the .env file should be hidden 
via .gitignore. However, we have intentionally included it in this submission strictly 
for your ease of installation and grading.

4. Database Seeding: Please DO NOT RUN seed.js. The product images are currently mapped 
to specific MongoDB Object IDs. Re-seeding the database will generate new IDs, which will 
break the image references for existing order histories.



// LACKING FEAUTURES
1. Paymongo Integration: Due to strict time constraints and dedicating our resources to 
rigorous bug fixing and system testing, we were unable to finalize the Paymongo API 
integration. However, because we successfully implemented a clean MVC architecture and 
a modular order controller, dropping in a payment gateway API would be a seamless next 
step for the codebase.



// DEVELOPMENT DISCLAIMER
We utilized AI assistance during the development of this project. AI was used as a 
learning tool to help us understand syntax, properly format data fetching/posting 
routes, and safely reorganize our codebase to maintain a clean MVC architecture. 
The core concepts, UI/UX design, database logic, and overall system structure are 
entirely our own original work.

