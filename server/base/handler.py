import logging
import tornado.escape
import tornado.httpclient
import tornado.web

from verserain.user.models import User

class BaseHandler(tornado.web.RequestHandler):
    cookieless_okay = False

    def authenticate_session_key(self, session_key):
        from verserain.login.auth import authenticate_session_key
        user_key = authenticate_session_key(session_key)
        return user_key

    def authenticate_login(self, fb_uid, email=None, password=None):
        from verserain.login.auth import authenticate_login
        current_user = authenticate_login(fb_uid=fb_uid, email=None, password=None)
        return current_user

    def get_current_user(self, cookieless_okay=False):
        session_key = self.get_argument('session_key', None)
        if session_key:
            self.set_secure_cookie('session_key', session_key)
        else:
            session_key = self.get_secure_cookie('session_key')

        if (not cookieless_okay) and self.cookieless_okay:
            cookieless_okay = True

        user_key = self.authenticate_session_key(session_key)

        if not user_key:
            if cookieless_okay:
                return self.get_current_user_cookieless()
            else:
                return None

        user = User.collection.find_one(key=user_key)

        if not user:
            if cookieless_okay:
                return self.get_current_user_cookieless()
            else:
                return None

        return user


    def get_current_user_cookieless(self):
        fb_uid = self.get_argument("fb_uid", "unknown_fb_uid")
        return self.authenticate_login(fb_uid=fb_uid, email=None, password=None)
