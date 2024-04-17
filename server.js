const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
require('dotenv').config();

const app = express();

// MongoDB connection
mongoose.connect('mongodb+srv://vignesh:vigneshsinha25@cluster0.v2k6hnb.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// User model
const User = mongoose.model('User', {
    twitterId: String,
    username: String,
    displayName: String,
    profileImage: String
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Twitter strategy
passport.use(new TwitterStrategy({
    consumerKey: process.env.CLIENT_ID,
    consumerSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
},
(token, tokenSecret, profile, done) => {
    // Check if user already exists in database
    User.findOne({ twitterId: profile.id }, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
            // Create new user
            const newUser = new User({
                twitterId: profile.id,
                username: profile.username,
                displayName: profile.displayName,
                profileImage: profile.photos[0].value
            });
            newUser.save((err) => {
                if (err) { return done(err); }
                return done(null, newUser);
            });
        } else {
            // User already exists
            return done(null, user);
        }
    });
}
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// Routes
app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Start server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
