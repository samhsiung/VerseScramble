from verserain.base.handler import BaseHandler
from verserain.login.auth import *
from verserain.page.models import *

def get_handlers():
    return ((r"/about/?", AboutPageHandler),
            (r"/page/edit/?", EditPageHandler),
            (r"/page/about/?", AboutPageHandler),
            (r"/page/update/?", UpdatePageHandler),
            )

class EditPageHandler(BaseHandler):
    def get(self):
        selected_nav = "about"
        page = Page.collection.find_one({"name":"about"})
        name = self.get_argument("name", "about")
        return self.render("page/edit.html", selected_nav=selected_nav, page=page, name=name)

class UpdatePageHandler(BaseHandler):
    def get(self):
        name = self.get_argument("name")
        content = self.get_argument("content")
        page = Page.collection.find_one({"name":name})
        if page is None:
            page = Page(name="about",content=content)
        else:
            page["content"] = content
        page.save()
        return self.redirect("/page/%s" % name)

class AboutPageHandler(BaseHandler):
    def get(self):
        selected_nav = "about"
        page = Page.collection.find_one({"name":"about"})
        return self.render("page/about.html", selected_nav=selected_nav, page=page)

