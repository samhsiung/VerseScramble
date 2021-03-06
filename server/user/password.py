from verserain.utils.encoding import smart_text
from verserain.utils.text import *

class PasswordMixin:
    def check_password(self, raw_password):
        if not self.has_key("password"):
            return (not raw_password)

        enc_password = self["password"]
        lower_password = uncapitalize(raw_password)

        algo, salt, hsh = enc_password.split('$')

        def check(pw):
            return (hsh == get_hexdigest(algo, salt, pw))

        if check(raw_password):
            return True
        elif check(lower_password):
            return True

        return False

    def set_password(self, raw_password):
        import random
        algo = 'sha1'
        salt = get_hexdigest(algo, str(random.random()), str(random.random()))[:5]
        hsh = get_hexdigest(algo, salt, raw_password)
        self["password"] = '%s$%s$%s' % (algo, salt, hsh)

def get_hexdigest(algorithm, salt, raw_password):
    """                                                                                                                                                              
    Returns a string of the hexdigest of the given plaintext password and salt                                                                                       
    using the given algorithm ('md5', 'sha1' or 'crypt').                                                                                                            
    """
    import hashlib

    enc_password = smart_text(raw_password).encode('utf-8')
    salt = smart_text(salt).encode('utf-8')

    if algorithm == 'crypt':
        try:
            import crypt
        except ImportError:
            raise ValueError('"crypt" password algorithm not supported in this environment')
        return crypt.crypt(enc_password, salt)

    if algorithm == 'md5':
        return hashlib.md5("%s%s" % (salt, enc_password)).hexdigest()
    elif algorithm == 'sha1':
        return hashlib.sha1("%s%s" % (salt, enc_password)).hexdigest()
    raise ValueError("Got unknown password algorithm type in password.")



