const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("../../models/User");
const { NotFoundError } = require("../../errors");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/v1/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        if (req.body.isLogin) {
          const logUser = await User.findOne({ googleId: profile.id });
          if (!logUser) {
            throw new NotFoundError("User couldn't found.");
          }
          const user = {
            name: logUser.name,
            email: logUser.email,
            role: logUser.role,
            userId: logUser._id,
          };
          return done(null, user);
        }
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        });
        const user = {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          userId: newUser._id,
          signGoogle: true,
        };
        return done(null, user);
      } catch (err) {
        console.log(err);
        return done(err, null);
      }
    }
  )
);
