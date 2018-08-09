import json
import os
import os.path
from notebook.base.handlers import IPythonHandler
from .email import email as email_smtp


class EmailHandler(IPythonHandler):
    def initialize(self, emails=None, templates=None):
        self.emails = emails
        self.templates = templates

    def post(self):
        body = json.loads(self.request.body)

        email = body.get('email', '')
        code = body.get('code', 'Code')
        to = body.get('to', '')
        subject = body.get('subject', '')
        type = body.get('type', 'Email')
        template = body.get('type')

        if template in self.templates:
            template = self.templates[template]
        else:
            template = self.templates['email']

        path = os.path.join(os.getcwd(), body.get('path'))
        model = body.get('model')

        for account in self.emails:
            if account['name'] == email:
                if not to:
                    to = account['username'] + '@' + account['domain']
                else:
                    to = to.split(',')

                if 'function' in account:
                    r = account['function'](path, model, type, template, code, to, subject, account['username'], account['password'], account['domain'], account['smtp'], account['port'])
                else:
                    r = email_smtp(path, model, type, template, code, to, subject, account['username'], account['password'], account['domain'], account['smtp'], account['port'])

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
