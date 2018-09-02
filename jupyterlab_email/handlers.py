import json
import os
import os.path
from notebook.base.handlers import IPythonHandler
from ._email import email as email_smtp


def get_template(type, code, template, handler):
    if 'email' in type:
        if code == 'code':
            return handler.templates['email']
        else:
            return handler.templates['email_nocode']
    elif 'html' in type:
        if code == 'code':
            return handler.templates['html']
        else:
            return handler.templates['html_nocode']

    elif 'pdf' in type:
        if code == 'code':
            return handler.templates['pdf']
        else:
            return handler.templates['pdf_nocode']
    else:
        if template in handler.templates:
            return handler.templates[template]
        else:
            return handler.templates['email']


class EmailHandler(IPythonHandler):
    def initialize(self, emails=None, templates=None):
        self.emails = emails
        self.templates = templates

    def post(self):
        body = json.loads(self.request.body)

        email = body.get('email', '')
        code = body.get('code', 'code').lower()
        to = body.get('to', '')
        subject = body.get('subject', '')
        type = body.get('type', 'email').lower()
        also_attach = body.get('also_attach', 'none').lower()
        template = body.get('type')

        template = get_template(type, code, template, self)
        attach_html_template = get_template('html', code, None, self)
        attach_pdf_template = get_template('pdf', code, None, self)

        if type == 'html attachment':
            if also_attach == 'html':
                also_attach = 'none'
            elif also_attach == 'both':
                also_attach = 'pdf'

        elif type == 'pdf attachment':
            if also_attach == 'pdf':
                also_attach = 'none'
            elif also_attach == 'both':
                also_attach = 'html'

        print('converting to <%s> with template <%s>' % (type, template))
        path = os.path.join(os.getcwd(), body.get('path'))
        model = body.get('model')

        for account in self.emails:
            if account['name'] == email:
                if not to:
                    to = account['username'] + '@' + account['domain']
                else:
                    to = to.split(',')

                if 'function' in account:
                    r = account['function'](path, model, type, template, code, to, subject,
                                            also_attach, attach_pdf_template, attach_html_template,
                                            account.get('username'), account.get('password'), account.get('domain'), account.get('smtp'), account.get('port'))
                else:
                    r = email_smtp(path, model, type, template, code, to, subject,
                                   also_attach, attach_pdf_template, attach_html_template,
                                   account['username'], account['password'], account['domain'], account['smtp'], account['port'])

                self.finish(str(r))
                return
        raise Exception('Email not found!')


class EmailsListHandler(IPythonHandler):
    def initialize(self, emails=None, templates=None):
        self.emails = emails
        self.templates = templates

    def get(self):
        ret = {}
        ret['emails'] = [x['name'] for x in self.emails]
        ret['templates'] = [x for x in self.templates]
        self.finish(json.dumps(ret))
