from verserain import settings

def send_mail(from_address, to_address, subject, message, reply_to=None):
    import smtplib
    if reply_to is None:
        reply_to = from_address

    if isinstance(to_address, basestring):
        to_field = to_address
    else:
        to_field = ", ".join(to_address)

    full_message = """From: %s\nTo: %s\nSubject: %s\nReply-To: %s\n%s\n""" % (from_address, to_field, subject, reply_to, message)

    # Send the mail
    connection = smtplib.SMTP(settings.SITE_DOMAIN,port=25)

    connection.sendmail(from_address, to_address, full_message)
    connection.quit()