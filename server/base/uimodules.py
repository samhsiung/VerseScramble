import tornado.web

class UserLink(tornado.web.UIModule):
    def render(self, user=None, username=None):
        if username is None:
            username = user['username']
        return "<a class='link' href='/u/%s'>%s</a>" % (username, username)

class VerseSetLink(tornado.web.UIModule):
    def render(self, verseset=None, verseset_id=None, verseset_name=None):
        if verseset_id is None:
            verseset_id = verseset._id
        if verseset_name is None:
            verseset_name = verseset['name']
        return "<a class='link' href='/verseset/show/%s'>%s</a>" % (verseset_id, verseset_name)

class VerseSetsTable(tornado.web.UIModule):
    def render(self, versesets=None, paginator=None, language_code=None,base_url=None):
        return self.render_string("verseset/table.html",
                                  versesets=versesets,
                                  paginator=paginator,
                                  language_code=language_code,
                                  base_url=base_url)
