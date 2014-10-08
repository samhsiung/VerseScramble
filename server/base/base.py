from verserain.base.handler import BaseHandler
from verserain.login.auth import *
from verserain.verse.models import *

def get_handlers():
    return ((r"/?", FrontPageHandler),
            )

class FrontPageHandler(BaseHandler):
    def get(self, path=None):
        self.redirect("/versesets")
        
