import json
import emails
import base64
from six import iteritems
import email.encoders as encoders
import nbformat
from bs4 import BeautifulSoup
from .nbconvert import run


def email(path, model, type, template, code, to, subject,
          also_attach, also_attach_pdf_template, also_attach_html_template,
          username, password, domain, host, port):
    '''
        path        : path to notebook
        model       : notebook itself (in case deployment strips outputs or
                      notebook not available except through ContentsManager)
        type        : type to convert notebook to
        template    : template to use when converting notebook
        code        : include input cells in notebook
        to          : who to send notebook to
        subject     : subject of email
        also_attach : also attach pdf/html/both

        username    : email account username
        password    : email account password
        domain      : email account provider
        host        : smtp host
        port        : smtp port
    '''
    name = path.rsplit('/', 1)[1].rsplit('.', 1)[0]
    model = nbformat.writes(nbformat.reads(json.dumps(model), 4))

    if type == 'email':
        type_to = 'html'
    elif type == 'html attachment':
        type_to = 'html'
    elif type == 'pdf attachment':
        type_to = 'pdf'
    else:
        raise Exception('Type not recognized')

    nb = run(type_to, name, model, template)

    if also_attach in ('pdf', 'both'):
        pdf_nb = run('pdf', name, model, also_attach_pdf_template)
    if also_attach in ('html', 'both'):
        html_nb = run('html', name, model, also_attach_html_template)

    if not nb:
        raise Exception('Something went wrong with NBConvert')

    if type == 'email':
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
        for img, data in iteritems(imgs_to_attach):
            message.attach(filename=img, content_disposition="inline", data=data)

        if also_attach in ('pdf', 'both'):
            message.attach(filename=name + '.pdf', data=pdf_nb)

        if also_attach in ('html', 'both'):
            message.attach(filename=name + '.html', data=html_nb)

    else:
        message = emails.html(subject=subject, html='<html>Attachmend: %s.%s</html>' % (name, type_to), mail_from=username + '@' + domain)
        message.attach(filename=name + '.' + type_to, data=nb)

        if also_attach in ('pdf', 'both'):
            message.attach(filename=name + '.pdf', data=pdf_nb)

        if also_attach in ('html', 'both'):
            message.attach(filename=name + '.html', data=html_nb)

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
