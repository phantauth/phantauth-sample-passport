const express = require('express');
const session = require('express-session');
const passport = require('passport');
const PhantAuthStrategy = require('passport-phantauth').Strategy;
const nunjucks = require( 'nunjucks' ) ;

const port = process.env.PORT || 3000;

const clientID = process.env.CLIENT_ID || 'phantauth+phantauth.sample.passport@gmail.com';
const clientSecret = process.env.CLIENT_SECRET || 'I2pmWq4s';

passport.serializeUser(function(user, done) {
    done(null, user);
  });

passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });  

passport.use(
    new PhantAuthStrategy(
      {
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL: '/callback'
      },
      function(accessToken, refreshToken, expires_in, profile, done) {
        process.nextTick(function() {
          return done(null, profile);
        });
      }
    )
  );

const app = express();

nunjucks.configure( __dirname, {
    autoescape: true,
    express: app
} ) ;  

app.set('views', __dirname);
app.set('engine', 'njk');

app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname))

app.get('/', function(req, res) {
  res.render('index.njk', { user: req.user });
});

app.get('/profile', ensureAuthenticated, function(req, res) {
  res.render('profile.njk', { user: req.user });
});

// GET /auth/phantauth
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in PhantAuth authentication will involve redirecting
//   the user to phantauth.net. After authorization, PhantAuth will redirect the user
//   back to this application at /callback
app.get(
  '/login',
  passport.authenticate('phantauth', {
    scope: ['profile', 'email', 'phone', 'address']
  }),
  function(req, res) {
    // The request will be redirected to PhantAuth for authentication, so this
    // function will not be called.
  }
);

// GET /auth/phantauth/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/callback',
  passport.authenticate('phantauth', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


app.listen(port, () => console.log(`Listening on port ${port}!`))
