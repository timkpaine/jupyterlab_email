import json
import emails
import base64
from six import iteritems
import email.encoders as encoders
import nbformat
from bs4 import BeautifulSoup
from .nbconvert import run


def email(path, model, type, template, code, to, subject, username, password, domain, host, port):
    name = path.rsplit('/', 1)[1].rsplit('.', 1)[0]
    model = nbformat.writes(nbformat.reads(json.dumps(model), 4))

    if type == 'Email':
        type_to = 'html'
    elif type == 'HTML Attachment':
        type_to = 'html'
    elif type == 'PDF Attachment':
        type_to = 'pdf'
    else:
        raise Exception('Type not recognized')

    nb = run(type_to, name, model, template)
    if not nb:
        raise Exception('Something went wrong with NBConvert')

    if type == 'Email':
        soup = BeautifulSoup(nb, 'html.parser')

        # strip markdown links
        for item in soup.findAll('a', {'class': 'anchor-link'}):
            item.decompose()

        # remove dataframe table borders
        for item in soup.findAll('table', {'border': 1}):
            item['border'] = 0
            item['cellspacing'] = 0
            item['cellpadding'] = 0

        # extract imgs for outlook
        imgs = soup.find_all('img')
        imgs_to_attach = {}

        # attach main part
        for i, img in enumerate(imgs):
            if not img.get('localdata'):
                continue

            imgs_to_attach[img.get('cell_id') + '_' + str(i) + '.png'] = base64.b64decode(img.get('localdata'))
            img['src'] = 'cid:' + img.get('cell_id') + '_' + str(i) + '.png'
            # encoders.encode_base64(part)
            del img['localdata']

        soup = str(soup)
        message = emails.html(charset='utf-8', subject=subject, html=soup, mail_from=username + '@' + domain)
        # message = emails.html(subject=subject, html=soup.encode('utf-8'), mail_from=username + '@' + domain)
        for name, data in iteritems(imgs_to_attach):
            message.attach(filename=name, content_disposition="inline", data=data)

    else:
        message = emails.html(subject=subject, html='<html>Attachmend: %s.%s</html>' % (name, type_to), mail_from=username + '@' + domain)
        message.attach(filename=name + '.' + type_to, data=nb)
        print(nb)

    r = message.send(to=to,
                     smtp={'host': host,
                           'port': port,
                           'ssl': True,
                           'user': username,
                           'password': password})
    if r.status_code != 250:
        print(r)
        raise Exception('Email exception! Check username and password')
    return r
