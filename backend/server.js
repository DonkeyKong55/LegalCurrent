// server.js

// 1. Import required libraries and models.
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For creating auth tokens
const db = require('./models'); // This imports our database models
const authenticateToken = require('./authMiddleware'); // Our new middleware

// 2. Create an instance of the express application.
const app = express();

// 3. Define the port and our JWT secret key.
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-very-strong-secret-key'; // CHANGE THIS IN A REAL APP!

// 4. Use middleware to handle incoming requests.
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(bodyParser.urlencoded({ extended: true }));

// 5. Create a simple route for the homepage.
app.get('/', (req, res) => {
    res.send('Welcome to LegalCurrent Backend!');
});

// 6. API endpoint to get all articles.
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await db.Article.findAll();
        res.status(200).json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Failed to retrieve articles' });
    }
});

// 7. API endpoint to create a new article.
app.post('/api/articles', async (req, res) => {
    try {
        const newArticle = await db.Article.create({
            title: req.body.title,
            summary: req.body.summary,
            full_content: req.body.full_content,
            category: req.body.category,
            publication_date: req.body.publication_date,
            source_url: req.body.source_url,
        });
        res.status(201).json(newArticle); // Respond with the newly created article and a 201 status.
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

// 8. API endpoint for user registration.
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user already exists.
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash the password with 10 salt rounds.
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in the database.
        const newUser = await db.User.create({
            email,
            password: hashedPassword,
            subscription_status: false, // Default to a free user.
        });

        // Respond with a success message.
        res.status(201).json({ email: newUser.email, message: 'User registered successfully!' });

    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// 9. API endpoint for user login.
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by their email.
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password in the database.
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // If the password is a match, create a JWT.
        const payload = {
            id: user.id,
            email: user.email,
            subscription_status: user.subscription_status
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // Send the token back to the user.
        res.status(200).json({ token });

    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

// 10. A protected API endpoint for paid content.
app.get('/api/paid-articles', authenticateToken, async (req, res) => {
    try {
        // Only subscribed users can access this.
        if (req.user.subscription_status) {
            // Logic to fetch protected articles
            const paidArticles = await db.Article.findAll({
                where: { category: 'Premium' } // Placeholder for protected content
            });
            res.status(200).json(paidArticles);
        } else {
            res.status(403).json({ error: 'Access denied. Please subscribe to view this content.' });
        }
    } catch (error) {
        console.error('Error fetching paid articles:', error);
        res.status(500).json({ error: 'Failed to retrieve paid articles' });
    }
});

// 11. A protected API endpoint for admins to update a user's subscription status.
app.put('/api/users/:email/subscribe', authenticateToken, async (req, res) => {
    try {
        const { email } = req.params;
        const { subscription_status } = req.body;

        const [updatedRows] = await db.User.update(
            { subscription_status: subscription_status },
            { where: { email: email } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User subscription status updated successfully' });
    } catch (error) {
        console.error('Error updating user subscription:', error);
        res.status(500).json({ error: 'Failed to update user subscription' });
    }
});


// 12. Start the server and listen for incoming requests.
// We use `db.sequelize.sync()` to ensure our database is connected before starting.
db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});