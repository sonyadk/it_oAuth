const express = require('express');
const app = express();
const port = 8080;
const path = require('path');
const session = require('express-session');

const passport = require('passport');
const YandexStrategy = require('passport-yandex').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;

app.use(session({ secret: "supersecret", resave: true, saveUninitialized: true }));

let Users = [{'login': 'admin', 'email':'echoofmydreams@gmail.com'},
            {'login': 'local_js_god', 'email':'sonyadk@yandex.ru'}];

const findUserByLogin = (login) => {
    return Users.find((element)=> {
        return element.login == login;
    })
}

const findUserByEmail = (email) => {
    return Users.find((element)=> {
        return element.email.toLowerCase() == email.toLowerCase();
    })
}

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    done(null, user.login);
  });
  //user - объект, который Passport создает в req.user
passport.deserializeUser((login, done) => {
    user = findUserByLogin(login);
        done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: 'GOOGLE_ID',
    clientSecret: 'GOOGLE_SECRET',
    callbackURL: "http://localhost:8080/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = profile;
    if (user) return done(null, user);

    done(true, null);
  }
));

passport.use(new YandexStrategy({
    clientID: 'YANDEX_ID',
    clientSecret: 'YANDEX_SECRET',
    callbackURL: "http://localhost:8080/auth/yandex/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = profile;
    if (user) return done(null, user);

    done(true, null);
  }
));

const isAuth = (req, res, next)=> {
    if (req.isAuthenticated()) return next();

    res.redirect('/sorry');
}

app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'main.html'));
});
app.get('/sorry', (req, res)=> {
    res.sendFile(path.join(__dirname, 'sorry.html'));
});
app.get('/auth/yandex', passport.authenticate('yandex'));

app.get(
'/auth/yandex/callback',
 passport.authenticate('yandex', {
  failureRedirect: '/sorry',
  successRedirect: '/private'
  })
);

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/sorry',
    successRedirect: '/private',
  })
);

app.get('/private', isAuth, (req, res)=>{
    res.send(req.user);
});

app.get('/logout', isAuth, (req, res) => {
  res.send(req.session.destroy());
});

app.listen(port, () => console.log(`App listening on port ${port}!`))
